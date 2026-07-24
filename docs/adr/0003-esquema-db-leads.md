# 0003 — Esquema de la DB central de leads

**Estado:** Propuesta (ratificar en el kickoff) · **Fecha:** 2026-07-23 · **Track:** D

## Contexto

El [ADR 0002](0002-stack-mvp.md) eligió Supabase para **lo que muta** (leads, conversaciones, citas) y dejó el esquema formal explícitamente abierto. El [spec §7](../spec.md) lo lista como supuesto por validar: _"Esquema de la DB central. Los campos que este spec implica están claros; el esquema formal se cierra en `/plan` y va como ADR"_. El [plan §2](../plan.md) propuso un modelo de datos y dijo de sí mismo que es **el insumo, no la decisión**: _"El ADR 0003 del Track D es el que la cierra"_. Este ADR la cierra.

La DB es el punto donde converge todo el equipo: A escribe la conversación, B y C escriben el veredicto y el match, D lee para pintar la cola del asesor. Por eso el esquema **no inventa campos**: sale campo por campo de los contratos de [`lib/types.ts`](../../lib/types.ts). Si un campo no lo produce un contrato, no existe en la tabla.

Tres presiones lo gobiernan:

1. **Cero caja negra** (restricción no-negociable de [`AGENTS.md`](../../AGENTS.md)). El [criterio de aceptación 2](../spec.md) es verificable: _"el conteo de factores que el motor evaluó debe ser igual al conteo de factores visibles en la ficha"_ ([ticket 012](../tasks/012-test-criterio-2.md)). La DB no puede perder ni un factor por el camino.
2. **Nadie se descarta** ([criterio 3](../spec.md)). _"Todo lead en nutrición tiene razón y trigger no vacíos."_
3. **El repo es público y `/asesor` no tiene login** ([ADR 0002](0002-stack-mvp.md)). La seguridad no puede depender de que nadie adivine la URL.

## Decisión

**Tres tablas** (`leads`, `conversaciones`, `citas`), **RLS activado sin policies**, y **los criterios de aceptación enforceados como CHECK constraints**.

El SQL vive en [`db/schema.sql`](../../db/schema.sql) (tablas, constraints, índices, RLS y la vista `cola_asesor`) y [`db/seed.sql`](../../db/seed.sql) (los 3 personajes del demo). Se pegan en el SQL Editor de Supabase en ese orden. Se versionan porque son **derivados y sintéticos** — ninguna data real de Colsubsidio.

### 1. `leads` — una fila por lead, de la ingesta al curado

La fila **se crea en la ingesta** (spec §4 paso 1: _"llega a la ingesta y queda registrado con su fuente"_) y se **actualiza** cuando el motor y el matcher terminan. Por eso `estado` es nullable: **`NULL` = todavía en conversación, aún sin calificar**. La cola del asesor filtra `WHERE estado IS NOT NULL`.

| Columna | Origen en los contratos |
|---|---|
| `lead_id`, `nombre`, `celular`, `cedula`, `proyecto_interes`, `fuente` | `LeadEvento` |
| `perfil` (jsonb) | `PerfilConocido` completo |
| `respuestas` (jsonb) | `Lead.respuestas` |
| `consentimiento_otorgado`, `consentimiento_ts` | `Lead.respuestas.consentimiento` |
| `estado` | `Score.salida` |
| `factores` (jsonb) | `Score.factores` — el array de `FactorScore` |
| `regla_fallida`, `trigger_nutricion` | `Score` |
| `proyectos` (jsonb) | `LeadCurado.proyectos` |
| `explicacion` | `LeadCurado.explicacion` |
| `re_enganchado_en` | **Nuevo (Track D)** — marca del "simular trigger" |

Tres decisiones dentro de la tabla:

**El consentimiento sube a columna propia.** `Lead.respuestas.consentimiento` es un objeto anidado en el contrato, pero la Ley 1581 de 2012 (habeas data) lo convierte en **evidencia auditable**, no en una respuesta más. Enterrado en el JSON de `respuestas` no se puede consultar ni auditar; como columna con su `timestamptz`, sí. El contrato no cambia — el mapeo lo hace [`lib/leads-repo.ts`](../../lib/leads-repo.ts), que lo guarda en los dos lados.

**El re-enganche NO es un cuarto estado.** La tentación era `estado = 're_enganchado'`, pero el spec define **exactamente 3 salidas** y `Score.salida` es un tipo cerrado en `lib/types.ts`. Un cuarto valor obligaría a tocar el contrato compartido y a que A, B y C manejaran un estado que su código no produce. En su lugar: `re_enganchado_en timestamptz`. `NULL` = no re-enganchado. El lead sigue siendo de nutrición, solo que ya lo tocamos ([ticket 007](../tasks/007-reenganche-nutricion.md)).

**`lead_id` es `text`, no `uuid`.** El [plan §2](../plan.md) lo dibujó como uuid, pero el contrato lo produce como string y las fixtures canónicas usan `"lead-001"`. Manda el contrato.

### 2. `conversaciones` — una fila **por mensaje**

No un JSON por hilo. Dos razones: A escribe con streaming y necesita hacer *append* mensaje a mensaje, y el rol `sistema` deja el re-enganche **auditable** en el mismo hilo. Cuando el asesor pulsa "simular trigger", se inserta una fila `rol='sistema'` con el trigger que se disparó — y de ahí puede leerlo A para redactar la reentrada sin inventarse el motivo ([ticket 007](../tasks/007-reenganche-nutricion.md)).

Los roles `lead` y `asistente` salen del [plan §2](../plan.md); `sistema` se agrega para los eventos (consentimiento, trigger), que no son mensajes de nadie.

### 3. `citas` — **solo la franja elegida**

El [ticket 005](../tasks/005-agendador.md) cierra el "D o A" que había dejado el reparto, y con él la forma de esta tabla: el **catálogo** de franjas es [`data/sintetica/slots.json`](../../data/sintetica/slots.json) y **solo la franja elegida** va a Supabase. Es la regla del ADR 0002 al pie de la letra: a la DB va únicamente lo que **muta**, y un horario simulado no muta.

Por eso la tabla no tiene columna `disponible` ni función de reserva: el propio ticket pone fuera de alcance la disponibilidad real, los conflictos y la cancelación — _"un slot elegido no se bloquea para otros"_. `unique (lead_id)`: un lead, una cita; reagendar pisa la fila.

### 4. Seguridad: RLS activado, cero policies

`/asesor` no tiene login (ADR 0002) y el repo es público. La protección real: **RLS activado en las 3 tablas sin ninguna policy**, de modo que la clave publicable no puede leer ni escribir nada. Solo la **clave secreta** (`sb_secret_...`, server-side en las API routes) pasa RLS. **El navegador nunca habla con Supabase directamente** — todo va por `/api/leads` y `/api/citas`.

La vista `cola_asesor` lleva `security_invoker = on`: por defecto una vista corre con los privilegios de su dueño y **se saltaría el RLS**, dejando leer por la vista lo que la tabla niega.

Esto es lo que hace que "sin login" sea decisión de producto y no un hueco de seguridad: la pantalla es pública, la base de datos no.

### Los criterios de aceptación, enforceados por Postgres

Lo *verificable* del spec no se queda en la revisión de código; lo garantiza la DB:

| Constraint | Qué defiende |
|---|---|
| `estado IS NOT NULL ⇒ jsonb_array_length(factores) > 0` | **Criterio 2** — ningún lead calificado sin factores visibles |
| `estado='nutricion' ⇒ regla_fallida y trigger_nutricion no vacíos` | **Criterio 3** — nadie cae a nutrición sin razón ni trigger |
| `estado IN ('listo','listo_restriccion_cupo') ⇒ proyectos tiene 0 ó 2-3` | **Criterio 4** — 2-3 proyectos, nunca 1 ni 5 |
| `estado IN` las 3 salidas | Las 3 salidas del spec; **no existe "descartado"** |

El `0` permitido en la regla de proyectos es deliberado: deja escribir el lead calificado **antes** de que el matcher corra (el orquestador del [ticket 006](../tasks/006-orquestador.md) escribe en dos pasos), sin que la DB rechace el insert a mitad del demo.

## Alternativas consideradas

**Tabla `score_factores` normalizada en vez de `factores jsonb`.** Más "correcto" relacionalmente y permitiría consultas del tipo "cuántos leads fallan el 40%". Descartada: obliga a un join y a un insert en dos pasos en el camino crítico del demo, y `FactorScore[]` ya viaja como array en el contrato — guardarlo como array preserva **exactamente** lo que el motor evaluó, que es justo lo que el criterio 2 exige. La consulta analítica no está en el alcance (el spec §2 descarta el dashboard).

**Un cuarto estado `re_enganchado`.** Descartada arriba: rompería `Score.salida` y el contrato compartido.

**Un JSON por conversación en vez de fila por mensaje.** Menos filas, pero obliga a leer-modificar-escribir el hilo entero en cada mensaje del streaming, y hace invisible el evento de re-enganche.

**El catálogo de franjas como tabla, con `disponible` y reserva atómica.** Fue el primer diseño de este ADR. Descartada al aterrizar el [ticket 005](../tasks/005-agendador.md): el catálogo no muta, así que por el ADR 0002 no es de la DB, y bloquear slots está explícitamente fuera de alcance. Menos código y menos que explicarle al jurado.

**Guardar el catálogo de proyectos en Supabase.** Igual: el ADR 0002 ya decidió que los datos estáticos son JSON en `data/sintetica/`.

**RLS abierto (policies `USING (true)`) con la clave publicable en el navegador.** Más simple y es el patrón por defecto de los tutoriales de Supabase, pero con el repo público y sin login, cualquiera podría escribir en la DB del demo. El costo de cerrarlo es una capa de API routes que igual necesitábamos.

## Consecuencias

- **Cierra el supuesto abierto** del [spec §7](../spec.md) y el modelo propuesto en el [plan §2](../plan.md). El kickoff lo ratifica.
- **Contrato para el resto del equipo:** nadie escribe a Supabase directo. `POST /api/leads` recibe un `LeadCurado`; `POST /api/citas` persiste la franja elegida. Un solo lugar valida y mapea.
- **`lib/types.ts` no se toca.** El mapeo contrato ↔ fila vive en `lib/leads-repo.ts`; los tipos internos de D, en `lib/types-asesor.ts`.
- **Si un track viola un criterio de aceptación, el insert falla en desarrollo**, no en el demo frente al jurado. Es el efecto buscado; el precio es que un `POST` mal formado devuelve error en vez de guardar basura.
- **`db/seed.sql` es un espejo de `lib/fixtures/`, no la fuente.** Los personajes canónicos viven en el código ([ticket 001](../tasks/001-personajes-canonicos.md) / costura S6). Si un número cambia allá, cambia aquí — nunca al revés. Si los dos se contradicen, el demo se contradice a sí mismo en pantalla.
- **Fallback a fixtures.** `lib/leads-repo.ts` cae a `lib/fixtures/` si Supabase no responde o está vacío, y la UI lo **avisa en pantalla**. La pantalla del clímax se ve aunque la DB se caiga el sábado; el jurado nunca ve datos falsos presentados como reales.
- **Las credenciales nunca entran al repo:** `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_KEY` van en `.env` local (ya en `.gitignore`) y en las env vars de Vercel. `SUPABASE_KEY` no lleva prefijo `NEXT_PUBLIC_` **a propósito** — es la clave secreta y nunca debe llegar al navegador.
