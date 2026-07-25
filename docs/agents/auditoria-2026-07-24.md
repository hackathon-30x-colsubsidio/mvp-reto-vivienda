# Auditoría externa — docs vs. código (2026-07-24, noche)

> ## ✅ ESTADO: corregida el 2026-07-24 21:00
>
> Todos los hallazgos de código están arreglados. **190 tests verdes** (6 nuevos), typecheck y lint limpios, chain verificada contra la Supabase real.
>
> **Queda UNA acción humana, y es la más importante de todas:** correr [`db/seed.sql`](../../db/seed.sql) en el SQL Editor de Supabase. El 🔴-1 es dato en producción, no código — sin re-sembrar, el jurado sigue viendo a Carlos con 0 proyectos.
>
> Lo que sigue abierto son **decisiones del equipo**, no defectos: están en la §3 y ninguna bloquea el demo.
>
> El detalle de cada arreglo va marcado abajo, hallazgo por hallazgo.


> Sesión fresca, sin memoria del build. Única fuente de verdad: lo que está escrito en disco + lo que responde la URL pública. Objetivo: la brecha entre lo documentado y lo implementado, priorizada por riesgo para el demo del **domingo 26 jul, 11:30 a.m.**
>
> **Verificaciones corridas:** `npx vitest run` → **182/182 verdes** · `npx tsc --noEmit` limpio · `npm run lint` limpio · `git ls-files` sin data real ni `.env` · sin imports `.js` en `lib/` · `curl` a `https://mvp-reto-vivienda.vercel.app` (`/`, `/asesor`, `/api/leads` → **200**, `origen: supabase`).
>
> **Nota importante:** el estado del repo es sólido. Casi todos los hallazgos graves NO son de código roto — son **de dato en producción** y de **costuras que la documentación ya identificó y nadie cerró**. El código está mejor que el demo.

---

## 1. Resumen ejecutivo

1. 🔴 **La base de producción está contaminada con corridas de prueba, y es lo que ve el jurado hoy.** `GET /api/leads` en la URL pública devuelve a **Carlos (lead-002) con puntaje 0/100, 0 proyectos y una cita en "Sala Medellín Poblado"** (ciudad que el catálogo real no tiene), y a **Diana (lead-001) con situación crediticia "mala" y 70/100** en vez de la ficha curada de 84. Las filas sembradas fueron pisadas por conversaciones de prueba corridas contra deploys anteriores. Es el hallazgo #1: no hay que arreglar código, hay que **re-sembrar y no volver a probar sobre `lead-001..003`**.

2. 🔴 **El criterio de aceptación 4 no se cumple en el flujo vivo: no existe la cita.** `lib/curar.ts` no agenda nada, el chat nunca ofrece franjas, y `data/sintetica/slots.json` cuelga de IDs (`p-03`, `p-07`…) que el catálogo real de 18 proyectos no tiene. Un lead que entre por "soy yo" y pase el corte llega al asesor **sin cita**. Está documentado en tres lugares (spec 04 D4/D6, ticket 005, spec 00 tramo ④) y sigue abierto.

3. 🔴 **El criterio 3 tampoco se verifica de punta a punta, y el demo no es autogestionado.** El botón "simular trigger" redirige a `/?lead_id=X&reenganche=1` y `app/page.tsx` **no lee la URL** (ticket 007). Y en sentido inverso: desde la landing **no hay ningún enlace a `/asesor`** — el único está dentro del chat y solo aparece si el lead se guardó. Un jurado que no complete una conversación no llega nunca al clímax sin escribir la URL a mano.

4. 🟡 **Dos factores del motor son decorativos y se ven en pantalla.** El subsidio siempre aporta **0 puntos** aunque el lead declare uno (nadie pregunta el monto — brecha 2 del spec 02, ticket 017), y la similitud está **fija en 0,5** pero se muestra con una cifra de aspecto real ("~370 compradores históricos") que sale de multiplicar el cupo por 10. Las dos son las únicas grietas serias en "cero caja negra": el asesor ve un factor que dice *"Aplica: Subsidio caja de compensación"* con aporte 0.

5. 🟢 **Las restricciones no-negociables de seguridad y arquitectura están respetadas.** Cero data real en git, `.gitignore` blindado, `buyer-personas-vivienda.md` saneado, keys solo server-side (`lib/gemini.ts`, `SUPABASE_KEY` sin `NEXT_PUBLIC_`), scoring en TS puro sin LLM, streaming en las dos rutas de IA, sin imports `.js`. Además, la decisión más urgente que los docs siguen listando para la reunión (**"cuál de las dos escalas de puntaje"**, spec 03 D6) **ya está resuelta en el código**: `lib/scoring/puntaje.ts` no existe.

---

## 2. Hallazgos

### 🔴 Bloqueante para el demo

---

#### 🔴-1 · Producción sirve filas de prueba: Carlos aparece roto y Diana desfigurada

> **⚠️ ÚNICO PENDIENTE HUMANO — correr `db/seed.sql`.** El código ya está listo: los personajes se rehicieron contra el catálogo real y sus números los calcula el motor, y el seed **se genera** desde las fixtures (`npx tsx scripts/generar-seed.ts`), así que sembrar ahora deja en la base exactamente lo que la app calcula. Falta ejecutarlo.

**Evidencia (medida, no inferida)** — `GET https://mvp-reto-vivienda.vercel.app/api/leads`, `origen: supabase`:

| Lead | Lo que debería mostrar | Lo que muestra hoy en la URL pública |
|---|---|---|
| lead-001 Diana | `listo`, 84/100, crediticia buena, cita 10:00 Sala Bogotá Centro (`lib/fixtures/scores.ts:10`, `db/seed.sql`) | `listo`, **70/100**, `situacion_crediticia: "mala"`, subsidio con **aporte 0** |
| lead-002 Carlos | `listo_restriccion_cupo` con **3 proyectos** y su advertencia de cupo ([spec 04 D3, CERRADA — Mani](../specs/04-match-agenda.md), URGENTE 18:40) | `listo_restriccion_cupo`, **puntaje 0/100**, **0 proyectos**, cita en **"Sala Medellín Poblado"** |
| lead-003 Yuliana | `nutricion` con trigger | OK — es la única fila que sigue siendo la sembrada (6 factores, sin `aporte`) |

**Diagnóstico.** La fila de Carlos suma ~34,7 puntos en sus propios `aporte` y está guardada con `puntaje: 0` → la escribió el camino de compatibilidad de `lib/leads-repo.ts:273-288` (el que borra la columna `puntaje` cuando no existe), o sea **antes de que se corriera la migración**. Sus 0 proyectos corresponden al matcher **anterior** al cambio de las 19:00 (cuando el cupo todavía descartaba). Es decir: son artefactos de dos deploys distintos, ya superados por el código de `main`, que quedaron congelados en la DB.

**El doc ya avisaba:** [`docs/URGENTE-Y-NOTICIAS.md:31`](../URGENTE-Y-NOTICIAS.md) — *"⚠️ Correr una conversación PISA la fila sembrada de ese personaje (upsert por `lead_id`)"*. Pasó exactamente eso, y nadie re-sembró.

**Recomendación (30 min, antes que cualquier otra cosa):**
1. Alinear `lib/fixtures/scores.ts` y `db/seed.sql` con lo que **hoy** produce `curar()` (ver 🟡-3), o aceptar los números escritos a mano.
2. Correr `db/seed.sql` completo en el SQL Editor (borra y resiembra las 3 tablas).
3. **Regla de operación hasta el domingo:** las pruebas de "soy yo" se hacen con cédulas y `lead_id` nuevos, **nunca** con `lead-001/002/003`. Si alguien prueba a Diana en vivo, hay que re-sembrar antes de grabar.
4. Verificar con `curl .../api/leads | grep puntaje` que Carlos vuelva a tener 3 proyectos y puntaje > 0.

---

#### 🔴-2 · Criterio 4 sin cita: el lead listo no llega "cerrable" en el flujo vivo · ✅ CORREGIDO

> **Hecho:** `/api/curar` devuelve `proyecto_cita` (el #1 del match), el chat ofrece sus 3 franjas y `POST /api/citas` las persiste; si fallan, lo dice y pasa a asesor humano en vez de fingir una cita. `slots.json` **se genera** desde el catálogo real (`scripts/generar-slots.ts`): una sala por proyecto, con su slug y su ciudad — se acabaron los `p-03` y las salas de Medellín. Verificado en vivo (`POST /api/citas` → 201) y cubierto por `ChatWhatsApp.test.tsx`.

**Contrato:** [`docs/spec.md:86`](../spec.md) criterio 4 — *"tiene entre 2 y 3 proyectos del catálogo con su porqué, **una franja de cita registrada**, y aparece en la cola del asesor con esos tres elementos visibles"*.

**Código:**
- `lib/curar.ts:123-151` — `curar()` devuelve `{ lead, score, proyectos, explicacion }`. **Nunca crea una cita.**
- `components/chat/ChatWhatsApp.tsx:474-547` — el pie del chat solo tiene consentimiento, chips y campo de texto. No hay paso de franjas; `terminar()` (`:304-340`) cierra y sale.
- `data/sintetica/slots.json` — las 4 salas cuelgan de `p-07`, `p-12`, `p-03`, `p-09`; el catálogo real usa slugs (`la-macarena`, `mongui`…). `GET /api/citas?proyecto_id=la-macarena` devuelve **lista vacía sin error** (`app/api/citas/route.ts:47-60`). Además dos de las cuatro salas son de **Medellín**, ciudad que no existe en los 18 proyectos.

**Doc que lo dice:** [spec 04 D4](../specs/04-match-agenda.md) (*"las franjas están colgadas de IDs que el catálogo real no tiene"*, sin ticket), [spec 04 D6](../specs/04-match-agenda.md) (*"el chat nunca las ofrece"*), [spec 00, tramo ④](../specs/00-mvp-unificado.md) marcado 🔴, [ticket 005](../tasks/005-agendador.md).

**Recomendación (camino más corto, ~2h):**
1. Regenerar `data/sintetica/slots.json` con **una sala por ciudad real** del catálogo (Bogotá, Tocancipá, Chía, Ricaurte, Girardot, Ubaté) y `proyecto_id` = el slug de cada proyecto; el test `data/sintetica/slots.test.ts` ya existe, extenderlo para que **falle si un `proyecto_id` de slots no está en `proyectos.json`** (así no vuelve a desincronizarse).
2. En `ChatWhatsApp.tsx`, después de `onTerminar`: si `veredicto.salida !== "nutricion"` y hay proyectos, pedir `GET /api/citas?proyecto_id=<primer proyecto>&limite=3`, pintar las 3 franjas como chips y en el clic hacer `POST /api/citas`. Es la mitad de A del ticket 005; la de D ya funciona.
3. Si no alcanza el tiempo: **agendar automáticamente la primera franja de la sala de la ciudad del proyecto recomendado** dentro de `/api/curar` y decirlo en el mensaje de cierre ("te aparto la visita del sábado 10 a.m., el asesor confirma"). Feo pero cumple el criterio y es honesto.

---

#### 🔴-3 · Criterio 3 sin cerrar: el re-enganche aterriza en el landing · ✅ CORREGIDO

> **Hecho:** `app/page.tsx` lee `?lead_id=&reenganche=1`, trae el lead con `GET /api/leads/:id` y abre la conversación en modo re-enganche — nombra la razón original, no vuelve a pedir el consentimiento y pregunta solo el ingreso (`preguntasDeReenganche`). Cubierto por `ChatWhatsApp.test.tsx`.

**Contrato:** [`docs/spec.md:85`](../spec.md) criterio 3 — *"al pulsar 'simular trigger' vuelve a la conversación"*.

**Código:** `app/asesor/_components/BotonSimularTrigger.tsx:37,55` → `window.location.href = "/?lead_id=<id>&reenganche=1"`. `app/page.tsx:46-65` es un `useState` sin `useSearchParams`: **los dos parámetros se ignoran** y el jurado cae en la portada de los 3 personajes, como si fuera un lead nuevo.

**Doc:** [spec 05 D4](../specs/05-nutricion-reenganche.md) (*"el criterio 3 NO está verificado end-to-end"*), [ticket 007](../tasks/007-reenganche-nutricion.md), handoff 2026-07-23 22:50.

**Recomendación (~1h):** en `app/page.tsx`, leer `useSearchParams()`; si viene `lead_id`, hacer `GET /api/leads/<id>`, reconstruir `{evento, perfil}` desde la fila y abrir `ChatWhatsApp` con un primer mensaje que **nombre la razón original** (`trigger_nutricion` viene en la respuesta) y pregunte **solo lo que cambió** (el ingreso). Envolver en `<Suspense>` — Next lo exige para `useSearchParams` en una página cliente.

---

#### 🔴-4 · El demo no es autogestionado: no se puede llegar a `/asesor` sin escribir la URL · ✅ CORREGIDO

> **Hecho:** enlace permanente *"Ver la bandeja del asesor →"* en el riel de la portada.

**Restricción:** `AGENTS.md` — *"el jurado recorre el flujo **solo**, con un clic y sin narración"*. Costura **S7** del [plan §3](../plan.md), [ticket 008](../tasks/008-shell-navegacion.md).

**Código:** `components/landing/LandingJurado.tsx` (archivo completo) no tiene ni un `Link` a `/asesor`. El único acceso es `components/chat/ChatWhatsApp.tsx:554-561`, y está condicionado a `resultado?.guardado && resultado.lead_id` — si Supabase falla o el jurado no termina la conversación, el botón **no existe**. Las tres superficies del asesor sí se enlazan entre sí (`app/asesor/page.tsx:48`, `app/asesor/tablero/page.tsx:54`, `FichaLead.tsx:34-45`), pero la puerta de entrada no.

**Recomendación (15 min):** agregar un enlace permanente en el riel de la portada (`LandingJurado.tsx:74-81`, junto a "Curado de leads · MVP"): **"Ver la bandeja del asesor →"** a `/asesor`. Es una línea y cierra la restricción no-negociable.

---

### 🟡 Importante pero no bloqueante

---

#### 🟡-1 · El subsidio nunca baja la cuota, pero la pantalla dice "Aplica" · ✅ CORREGIDO (la mitad honesta)

> **Hecho:** el factor ya no anuncia "Aplica" aportando 0 en silencio — dice *"Declarado: … sin monto verificado todavía, así que NO baja la cuota estimada ni suma puntos. El asesor lo valida y postula"*. **La tabla de subsidios con montos reales sigue pendiente** ([ticket 017](../tasks/017-tabla-subsidios.md)): es data que no se puede inventar.

`lib/scoring/index.ts:93-115` — `cobertura = monto / cuotaBruta`, y `subsidio_monto_mensual` **nadie lo llena** (`lib/conversacion/preguntas.ts:268-284` pregunta *cuál* subsidio, nunca *cuánto*). Verificado en producción: Diana tiene `"Aplica: Subsidio caja de compensación"` con **aporte 0**. Un asesor que lea eso ve un bug, no una decisión.

**Doc:** [spec 02, brecha 2](../specs/02-conversador.md) 🔴 abierta · [spec.md §7](../spec.md) lo cerró como *"tabla simple de 2-3 subsidios reales con montos y fuente citada"* → [ticket 017](../tasks/017-tabla-subsidios.md), sin hacer.

**Recomendación:** ticket 017 en su versión mínima — un `lib/scoring/subsidios.ts` con 2 subsidios reales de Colsubsidio, su monto y su fuente citada; `curar()` lo resuelve desde `respuestas.subsidios` y llena `subsidio_monto_mensual`. **Si no hay tiempo (30 min de alternativa):** cambiar el `valor` del factor a *"Declarado, sin monto verificado: todavía no baja la cuota estimada"*. Decir la verdad cuesta una línea; dejar el 0 sin explicación es caja negra.

---

#### 🟡-2 · La similitud es constante 0,5 y se presenta con una cifra que parece real · ✅ CORREGIDO

> **Hecho:** el valor declara que el "~N compradores" es una derivación (cupo 90/10 ×10) y que la señal 0,5 es neutra para todos, así que hoy no diferencia leads.

`lib/scoring/index.ts:148-169`: `valor_norm` está **fijo en 0.5** (declarado como provisional, ticket 016) pero el texto que ve el asesor dice *"~370 compradores históricos en LA MACARENA"*, y ese 370 sale de `nAproximado = total * 10` (`:151`) — el cupo del 10% multiplicado por diez. Es un proxy razonable, pero **se lee como dato del Excel**. Con 0,20 de peso, es el 20% del puntaje que no distingue a nadie (spec 03 D5 lo dice: techo real 90).

**Recomendación:** o se cita la derivación en el propio `valor` (*"~370 compradores estimados a partir del cupo 90/10 del proyecto"*), o se quita el número. Cambiar el string es 1 línea y protege la restricción de cero caja negra ante la pregunta obvia del jurado: *"¿de dónde sacaron 370?"*.

---

#### 🟡-3 · Las fixtures de los personajes ya no son lo que produce el motor · ✅ CORREGIDO (de raíz)

> **Hecho:** `scores.ts` y `proyectos-recomendados.ts` **derivan** de `curar()`, y el personaje se declara por **lo que teclea** (`guion-demo.ts` lo replaya contra el conversador real). `db/seed.sql` se genera y un test compara el archivo en disco contra el generador: ya no hay dos fuentes que puedan divergir.

| | Fixtures / seed | Motor (`calcularScore`) |
|---|---|---|
| Factores | **6** (`lib/fixtures/scores.ts`) | **7** (incluye `cupo_90_10`) |
| Nombre del factor | `similitud_compradores` | `similitud_compradores_reales` |
| Puntaje Diana | 84 (`scores.ts:10`) | ~70-75 según lo que responda |
| `peso`/`aporte` | ausentes → la tabla de puntaje imprime "No puntúa" en todas las filas | presentes |

El parche vive en `app/asesor/_components/TablaFactores.tsx:38-42` (alias heredado, comentado como tal). La tensión está reconocida en el handoff (18:25): *"el seed dice 84/61/0 pero el motor calcula ~75 para la misma Diana… son dos fuentes"*.

**Recomendación:** correr `curar()` sobre los 3 leads canónicos, volcar el `Score` resultante a `lib/fixtures/scores.ts`, actualizar `db/seed.sql` (`lib/fixtures/seed-espejo.test.ts` ya obliga a que coincidan) y ajustar las aserciones de `FichaLead.test.tsx`. Con eso, 🔴-1 se cierra de verdad: la ficha sembrada y la calculada dejan de contradecirse.

---

#### 🟡-4 · La bandeja re-separa los dos grupos que la decisión CERRADA fundió · ✅ CORREGIDO

> **Hecho:** dos secciones — "Pueden comprar hoy" (con el badge de cupo por fila) y "Todavía no pueden comprar".

[spec 06 D7](../specs/06-dashboard-asesor.md) — **[CERRADA — Mani, 2026-07-24]**: *"Los dos grupos de 'puede comprar' se fundieron en uno… ahora comparten grupo y dentro manda el puntaje"*, y `lib/types-asesor.ts:51-55` lo implementa (`PRIORIDAD.listo = PRIORIDAD.listo_restriccion_cupo = 1`).

Pero `app/asesor/page.tsx:32-35` **vuelve a partir la lista por `estado`** y pinta tres secciones en el orden de las claves, así que en pantalla un no afiliado con 71 sigue apareciendo **debajo** de un afiliado con 42 — exactamente lo que la decisión quería eliminar. `ordenarCola` solo ordena dentro de cada sección.

**Recomendación:** fundir las dos primeras secciones en una — título *"Pueden comprar hoy"*, con el badge `Listo · cupo 90/10` (que ya existe, `ETIQUETA_ESTADO`) distinguiendo cada fila. Nutrición queda como segunda sección. Son ~15 líneas en `app/asesor/page.tsx` y hace visible la decisión que hoy solo vive en un test.

---

#### 🟡-5 · Al asesor se le muestra el nombre técnico de la regla que falló · ✅ CORREGIDO

> **Hecho:** `regla_fallida` se guarda redactada y con la norma citada. De paso, el trigger ahora trae **el monto exacto** que la destraba.

`lib/scoring/index.ts:238` guarda `regla_fallida: factorCuota.nombre` → literalmente `"cuota_ingreso_40"`, y `app/asesor/_components/BloqueNutricion.tsx:38` lo pinta crudo bajo el título "La regla que no pasó". La fixture de Yuliana trae una frase completa, así que **hoy no se nota** — pero cualquier lead de nutrición generado en vivo mostrará la jerga.

**Recomendación:** en `calcularScore`, poner `regla_fallida: factorCuota.valor` (que ya trae la cuota, el %, el ingreso y el Decreto citado) o una frase compuesta. 1 línea, y protege el criterio 3 en el flujo vivo.

---

#### 🟡-6 · El "experto" LLM no aparece en ninguna pantalla, y reimplementa el 40% por su cuenta · ✅ CORREGIDO (la mitad de código)

> **Hecho:** `/api/match` y `/api/explicacion` usan `precioMaximoDe(lead)` — se acabó la fixture por personaje (costura S2). **Que la ficha llame o no al experto sigue siendo decisión del equipo** (§3).

- Ninguna vista consume `/api/explicacion` (grep sobre `app/` + `components/`: cero llamadas). `FichaLead.tsx:114` pinta `curado.explicacion`, que para leads vivos la redacta `explicacionDeterminista()` (`lib/curar.ts:66-116`). **El streaming del experto es hoy código sin consumidor** — lo cual es defendible (más robusto, cero caja negra), pero contradice el estado que declara [spec 04](../specs/04-match-agenda.md) (*"`/api/explicacion` en streaming"* como pieza viva) y hay que saberlo antes de decir en el pitch que "la IA redacta el porqué".
- `app/api/explicacion/route.ts:60,90-94` calcula el `precio_maximo` con `preciosMaximos` de `lib/matching/fixtures.ts` en vez de `precioMaximoDe(lead)` (`lib/scoring/capacidad.ts:28`). Es justo la duplicación que la **costura S2 / [ticket 004](../tasks/004-capacidad-compartida.md)** quería evitar: dos fuentes de la misma norma.

**Recomendación:** (a) decidir si la ficha llama al experto (es el pulido que se ve bonito en el video) o si se declara que la explicación es determinista — y en ese caso decirlo en el pitch como **ventaja** ("el porqué no depende de que un modelo esté vivo"); (b) en cualquier caso, cambiar `precioMaximoDeFixture` por `precioMaximoDe(lead)` — 2 líneas.

---

#### 🟡-7 · El tablero es una superficie propia, y el spec dice que no debe haberla · ⏸️ DECISIÓN DEL EQUIPO

> No se tocó a propósito: quitarlo o dejarlo fuera del video es una decisión de alcance, no un arreglo. Está en la §3.

[`docs/spec.md:33`](../spec.md), bloque "Qué NO hace": *"**No hay dashboard analítico** (funnel, CPL, cohortes). El panel de impacto, si entra, es una franja de 3 cifras dentro de la vista del asesor, **no una superficie propia**"*. `spec.md §7` lo cerró igual: *"franja de 3 cifras (% leads curados, horas comerciales ahorradas, alerta 90/10)"* → [ticket 019](../tasks/019-franja-impacto.md), **dueño Rol 2, sin hacer**.

Lo construido es `/asesor/tablero`: 6 métricas + serie de 14 días + agrupadores (`app/asesor/tablero/page.tsx`). Es bueno y está bien hecho, pero es exactamente la superficie propia que el spec excluyó, y **`/asesor` no tiene la franja**. [spec 06, pregunta 8](../specs/06-dashboard-asesor.md) ya lo nombra como *"vacío del canon"*.

**Recomendación:** no borrar nada (el tablero es material de respaldo excelente para preguntas del jurado). Decidir explícitamente: **el video muestra `/asesor` y la ficha, el tablero queda como respaldo**; y si sobra media hora, portar 3 cifras del registry de `lib/tablero/metricas.ts` a una franja en `/asesor` — el registry lo hace trivial.

---

### 🟢 Deuda aceptable / higiene

| # | Hallazgo | Dónde | Recomendación |
|---|---|---|---|
| 🟢-1 | El comentario que gobierna el matcher dice que descarta por cupo; el código ya no lo hace desde las 19:00 | `lib/matching/index.ts:36-42` vs. `:70` | Borrar la regla 2 del docstring. Un comentario que miente es peor que ninguno |
| 🟢-2 | La ficha muestra `situacion_crediticia` cruda (`sin_info`, `mala`); `SelloPerfil` ya la mapea a etiquetas humanas | `app/asesor/_components/FichaLead.tsx:204` | Reusar el mapeo de `SelloPerfil.tsx` |
| 🟢-3 | Los docs siguen listando como **decisión #1 de la reunión** las "dos escalas de puntaje", que **ya está resuelta** (`lib/scoring/puntaje.ts` no existe; todo lee `Score.puntaje`) | [spec 03 D6](../specs/03-scoring.md), [handoff Roadmap](handoff.md), [URGENTE §6.1](../URGENTE-Y-NOTICIAS.md) | Marcar D6 como `[CERRADA — 15:20, una sola escala]`. No gastar reunión en algo hecho |
| 🟢-4 | PNG de los diagramas 03, 04 y 06 desactualizados respecto a su mermaid | `docs/specs/diagramas/*.png` | Reexportar, o no usarlos en el pitch |
| 🟢-5 | `afiliado_autoreportado` nunca se pregunta; todo lead "soy yo" sin match se asume **no afiliado** y va contra el cupo del 10% sin haberlo dicho | `lib/conversacion/preguntas.ts:242-311` vs. `lib/scoring/index.ts:30-37`; [spec 01 D8](../specs/01-ingesta-enriquecimiento.md) | Decisión abierta del TEAM (ver §3). Está documentada, no es un descuido |
| 🟢-6 | El enriquecimiento resuelve **3 cédulas**, no las 303 de `identidades.json` → el "soy yo" del jurado nunca ve el momento "ya te conocemos" (criterio 1) | `lib/conversacion/enriquecimiento-simulado.ts:10-18`; [ticket 003](../tasks/003-enriquecimiento-por-cedula.md) | Barato (leer el JSON y indexar por cédula) y compra un momento wow para el "soy yo". Si no entra, los 3 personajes lo cubren |
| 🟢-7 | `LeadEvento.fuente` sigue en `meta / google / web`, que no son los 4 canales reales del mentor | `lib/types.ts:11`, `db/schema.sql:88-89`; [spec 01 D3](../specs/01-ingesta-enriquecimiento.md) `[PROPUESTA]` | **Correcto: es propuesta y no se implementó.** A 48h del deadline, no tocarlo — toca tipos, fixtures, CHECK de Postgres y tablero |
| 🟢-8 | El matcher puede devolver **1** proyecto y el criterio 4 dice "entre 2 y 3"; el CHECK de Postgres ya se relajó a `≤ 3` | `db/migracion-001-puntaje.sql:40-46`; [spec 04, pregunta 8](../specs/04-match-agenda.md) | Ratificar el cambio (ver §3). La justificación escrita —"nadie se descarta" pesa más que la redacción— es sólida |
| 🟢-9 | Único `as unknown as` del repo, y es el mapeo contrato→jsonb (justificado) | `lib/leads-repo.ts:89` | Dejarlo. Los contratos de `lib/types.ts` los protege el typecheck de verdad |

---

### Estado de las restricciones no-negociables

| Restricción | Estado | Evidencia |
|---|---|---|
| **Data real nunca al repo público** | ✅ | `git ls-files` no lista `docs/recursos-reto/`, ni `.xlsx/.pptx`, ni `.env` (solo `.env.example`). `data/buyer-personas-vivienda.md` saneado: solo agregados `%`, cero nombres de empresa |
| **API key solo server-side** | ✅ | `lib/gemini.ts` es el único que lee credenciales, en rutas `runtime = "nodejs"`; `SUPABASE_KEY` sin prefijo `NEXT_PUBLIC_`; `diagnosticoCredenciales()` reporta presencia, nunca valores (con test que lo blinda) |
| **Scoring sin LLM (TS puro)** | ✅ | `lib/scoring/` y `lib/curar.ts` sin red ni modelo; el LLM solo redacta |
| **Sin imports `.js` en `lib/`** | ✅ | grep limpio |
| **Streaming, primer token < 2s** | ⚠️ | Ambas rutas hacen streaming real. El <2s **solo se cumple con lambda caliente** (medido 1-2s; frío ~7s). Mitigado con el corte de 3s (`ChatWhatsApp.tsx:198-200`) y el truco de calentamiento antes de grabar. `/api/explicacion` no tiene consumidor, así que su cold start es irrelevante hoy |
| **Cero caja negra** | ⚠️ | Los 7 factores se emiten y la ficha los recorre sin filtrar (`TablaFactores`, con test-canario). Grietas: 🟡-1 (subsidio "aplica" con aporte 0), 🟡-2 (cifra derivada que parece dato) y 🟡-5 (`cuota_ingreso_40` crudo) |
| **Demo autogestionado** | ❌ | Ver 🔴-3 y 🔴-4 |

---

## 3. Decisiones a ratificar YA (o aceptar el riesgo por escrito)

Quedan menos de 48h. Estas siguen marcadas `[PROPUESTA]` o como supuesto abierto **y el código ya construyó una respuesta**. No decidirlas es decidirlas por omisión.

| # | Decisión | Quién la respondió de facto | Costo de dejarla así |
|---|---|---|---|
| 1 | **El 0,6% que estima la cuota** ([spec 03 D2](../specs/03-scoring.md), `lib/scoring/config.ts:23`) | El código, como heurística declarada | **Es el número del que cuelga el gate entero.** Si un jurado con banca pregunta, hay que responder "heurística de 20 años sobre el 70% del valor, no fórmula certificada". Ratificarlo con esa frase exacta basta |
| 2 | **Los pesos** 0,45/0,20/0,15/0,10/0,05/0,05 ([spec 03 D4](../specs/03-scoring.md)) | Mani cerró la afiliación a 0,05; los otros cinco siguen "PROPUESTOS" en el comentario del código | Bajo. La frase que los defiende está escrita en D4; solo hay que decir "sí" |
| 3 | **El punto medio del rango como ingreso** de quien ya venía perfilado (`ChatWhatsApp.tsx:310-313`) | Track A, provisionalmente | Medio: es lo que evita que Diana caiga a nutrición. Se revierte en una línea |
| 4 | **El orden nuevo de las preguntas** (vivienda → ingreso → subsidios → crédito → zona) | Track A, provisionalmente | Bajo, y está bien fundamentado ("enamora primero") |
| 5 | **CHECK de proyectos relajado a `≤ 3`** (`db/migracion-001-puntaje.sql:40-46`) | La migración, ya corrida en producción | **Es un cambio a un criterio de aceptación.** Ratificarlo explícitamente o volver a `between 2 and 3` — y si se ratifica, corregir la redacción del criterio 4 en `spec.md:86` |
| 6 | **¿Se le pregunta la afiliación al lead sin match?** ([spec 01 D8](../specs/01-ingesta-enriquecimiento.md)) | El motor: asume **no afiliado** (`lib/scoring/index.ts:36`) | Medio: manda al cupo del 10% a alguien que nunca dijo que no era afiliado. Agregar la pregunta son ~20 líneas en `preguntas.ts` |
| 7 | **¿El LLM conduce la conversación (D1-B)?** ([spec 02 D1](../specs/02-conversador.md)) | Nadie: sigue el determinista (D1-A) | **Recomendación del auditor: cerrarla en NO.** A 48h, con 182 tests encima del flujo determinista y el tono ya reescrito, el salto es riesgo puro sin ganancia visible en un video de 2 min |
| 8 | **¿"Propenso / no propenso"?** ([spec 03 D8](../specs/03-scoring.md), [spec 06 D1](../specs/06-dashboard-asesor.md)) | Nadie: la bandeja usa las 3 salidas | Bajo. Si se adopta, encaja con el arreglo de 🟡-4 (una sola sección "Pueden comprar hoy") |
| 9 | **¿El tablero entra al video?** (🟡-7, contradice `spec.md:33`) | Se construyó y está enlazado desde `/asesor` | Medio: si aparece en el video sin decidirlo, el jurado ve algo que el propio spec declara fuera de alcance |
| 10 | **¿Se le ofrece la afiliación como camino al no afiliado?** ([spec 04 D3](../specs/04-match-agenda.md), propuesta abierta) | Nadie: nunca se escribió ese mensaje | Bajo para el demo, **alto para el pitch**: es la salida más útil para el 27,1% y es producto real de Colsubsidio. Una frase en la explicación de `listo_restriccion_cupo` |

---

## 4. Orden sugerido de trabajo (mañana)

1. **🔴-1 re-sembrar producción** (30 min) — sin esto, todo lo demás se graba sobre datos rotos. Idealmente después de 🟡-3.
2. **🔴-4 enlace a `/asesor` desde la portada** (15 min) — la restricción no-negociable más barata de cerrar del repo.
3. **🟡-5 + 🟡-1 + 🟡-2** (45 min juntos) — tres cambios de string que tapan las tres grietas de "cero caja negra".
4. **🔴-2 la cita** (2h) — es el criterio 4 y el único hueco grande de producto.
5. **🔴-3 el re-enganche** (1h) — es el criterio 3.
6. **🟡-4 fundir los grupos de la bandeja** (15 min) — hace visible una decisión que ya se tomó.
7. Lo demás: 🟢, y solo si sobra tiempo antes del freeze.

Los puntos 2, 3 y 6 suman ~1h 15min y cierran una restricción no-negociable, tres grietas de explicabilidad y una decisión ya ratificada. Es el mejor retorno por hora que queda en el proyecto.
