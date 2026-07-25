# Continuar la rama `feat/026-sara-agente-y-ficha` — desde la Fase 3

> **Para quién es esto:** la sesión (o la persona) que retoma esta rama. Se puede
> ejecutar con un modelo más barato: todo lo que falta viene con anclas exactas,
> firmas y snippets. Lee primero "Reglas duras" y no improvises fuera de ellas.
>
> **Estado al escribir esto (2026-07-25, 15:00 hora Colombia):** fases 1 y 2
> hechas, commiteadas y verificadas. **252 tests verdes, typecheck y lint
> limpios.** Falta la Fase 3 (el desvío en el chat) y la Fase 4 (docs).
>
> El plan completo, con su contexto y las decisiones de Mani, está en
> `~/.claude/plans/quiero-continuar-con-la-vivid-quasar.md`. Este documento es su
> estado de avance, no su reemplazo.

---

## Qué se construyó ya (no rehacer)

### Fase 1 · La ficha del asesor — commit `d8ec155`

La ficha **se complementó, no se rediseñó** (pedido explícito de Mani: el
template que existía gusta). Todo lo nuevo se añadió alrededor.

| Qué | Dónde |
|---|---|
| El hilo completo de la conversación, al final de la ficha | `app/asesor/_components/HiloConversacion.tsx` (nuevo) + `obtenerConversacion()` en `lib/leads-repo.ts` + una línea en `app/asesor/[leadId]/page.tsx` |
| Conteo de factores coherente entre ficha y bandeja | `conteoFactores()` en `lib/types-asesor.ts`, usado por `FichaLead.tsx` y `FilaLead.tsx` |
| El ingreso exacto que decide el gate del 40% | Un `<Dato>` nuevo en `FichaLead.tsx` + `pesos()` en `lib/formato.ts` |
| Brochure y recorrido 360 de cada proyecto | `BloqueProyectos.tsx`, con lookup del catálogo por `proyecto_id` |

**Verificado en el navegador** (`/asesor/lead-001`, modo oscuro): el hilo se
pinta con los tres roles, la bandeja y la ficha dicen los dos "4/4", los enlaces
salen. El diseño quedó idéntico.

### Fase 2 · El prompt maestro — commit `e19dec0`

| Qué | Dónde |
|---|---|
| Los 3 prompts del repo, inventariados con su estado | `lib/conversacion/prompt-maestro.ts` (nuevo). Tono = ACTIVO (movido verbatim desde la ruta), Duda = NUEVO, Experto (`lib/matching/prompt-experto.ts`) = DORMIDO y declarado como tal, sin editarlo (es frontera de P2) |
| Tabla de subsidios como grounding, con fuentes | `lib/conversacion/subsidios.ts` (nuevo), derivada de `docs/credito-y-subsidios.md`. El subsidio de caja va **sin monto** (las fuentes se contradicen); Mi Casa Ya se declara apagado; solo el Decreto 583 lleva cifras |
| Modo `duda` en el endpoint, retro-compatible | `app/api/chat/route.ts`. Sin `modo` se comporta byte a byte como antes |

**Verificado con curl** contra el dev server: los cuatro caminos responden bien
(400 sin `mensaje_a_redactar`, 400 sin `pregunta`, 503 en los dos modos cuando
no hay credencial).

---

## Lo que falta: FASE 3 · el desvío en el chat

**El problema que resuelve:** hoy TODO lo que el lead teclea se consume como
respuesta al paso actual. Si escribe *"¿cuánto vale?"*, eso entra a
`interpretarTexto` y se parsea como si fuera el dato que se le pidió. Y si
escribe *"quiero hablar con un asesor"* —trigger 3 del mentor, spec 02 D6— no
pasa absolutamente nada.

### ⚠️ Antes de escribir una línea de la Fase 3

**Rebasar sobre `main` con el ticket 024 (P3) ya mergeado.** El 024 toca
`components/chat/ChatWhatsApp.tsx` y `lib/conversacion/preguntas.ts`, que es
donde la Fase 3 se ancla. Orden acordado: 023 → 024 → esta rama.

```bash
git fetch origin && git rebase origin/main
npm test && npx tsc --noEmit && npm run lint
```

Si el rebase toca `ChatWhatsApp.tsx`, mirar con lupa: un merge "limpio" de git ya
dejó ese archivo roto una vez (viernes 24) y lo delató `tsc`, no el marcador de
conflicto.

### 3a · `lib/conversacion/desvio.ts` (archivo NUEVO, sin dueño previo)

TS puro, sin LLM en el camino de decisión, importable desde el cliente. Es
**agnóstico al set de preguntas**: no conoce ninguna pregunta concreta, así que
lo que P3 construya en `preguntas.ts` no lo afecta.

```ts
import type { FichaProyecto } from "@/lib/matching/tipos";
import type { PasoPregunta } from "./preguntas";

export type Desvio =
  | { tipo: "asesor" }
  | { tipo: "duda"; clase: "precio" | "ubicacion" | "subsidio" | "general"; proyecto?: FichaProyecto };

export function detectarDesvio(texto: string): Desvio | null;
export function respuestaDeterministaDuda(d: Extract<Desvio, { tipo: "duda" }>, proyectoInteres?: string): string;
export function mensajeHandoffAsesor(nombre: string): string;
export function notaSistemaHandoff(): string;
export function repreguntar(paso: PasoPregunta): string;
```

**`detectarDesvio`, en orden y conservador** (solo desvía con señal fuerte —
ante la duda, `null`, que deja el comportamiento actual intacto):

1. **Asesor:** `/\basesor(a|es)?\b|\bhumano\b|persona real|hablar con alguien|con una persona|me llamen|ll[aá]menme|n[uú]mero de tel/i`
2. **Duda:** contiene `?` o `¿`, **o** (interrogativo inicial
   `cu[aá]nto|cu[aá]ndo|d[oó]nde|cu[aá]l|qu[eé]` **+** palabra de dominio
   `precio|vale|cuesta|entrega|ubicad|subsidio|cuota|financia`).
   Sub-clasificar con regex de precio/ubicación/subsidio, y buscar el proyecto
   mencionado contra los 18 nombres del catálogo (sin tildes, `catalogo` de
   `@/lib/matching/catalogo`), con fallback al `proyecto_interes` del evento.
3. Nada → `null`.

**`respuestaDeterministaDuda`** — es el fallback del LLM **y** una respuesta
correcta por sí sola (usar `pesos()` de `@/lib/formato`, que ya existe):

- precio + proyecto → `"{NOMBRE} está desde {pesos(precio_desde)} en {ciudad}. Ojo: es 'desde' y depende de la tipología; el valor exacto te lo confirma el asesor."`
- ubicación + proyecto → ciudad y zona del catálogo.
- subsidio → texto honesto derivado de `SUBSIDIOS_GROUNDING` (`./subsidios`), **sin cifras de montos**.
- general → `"Esa no te la puedo confirmar por aquí sin inventarte nada, y prefiero no hacerlo. Queda anotada para que el asesor te la resuelva en la visita."`

### 3b · Integración en `components/chat/ChatWhatsApp.tsx` (~25 líneas, diff mínimo)

La máquina de fases **no cambia**. El desvío solo existe en fase `"pregunta"`
(que es donde ya corre `enviarTexto`) y **nunca avanza `indicePaso`**.

1. En `enviarTexto`, **antes** de llamar a `responderPregunta`:
```ts
const desvio = detectarDesvio(texto);
if (desvio) { setTextoInput(""); void manejarDesvio(texto, desvio); return; }
```
2. `manejarDesvio`, función nueva **añadida al final del componente** (no
   reordenar nada de lo que ya está):
```ts
agregarUsuario(texto);
if (desvio.tipo === "asesor") {
  anotar("sistema", notaSistemaHandoff());   // usar el mecanismo existente de transcripcionRef
  await agregarBotInstantaneo(mensajeHandoffAsesor(evento.nombre));
} else {
  const base = respuestaDeterministaDuda(desvio, evento.proyecto_interes);
  await agregarBot(base, { modo: "duda", pregunta: texto });
}
await agregarBot(repreguntar(pasos[indicePaso]));   // se retoma el paso pendiente
```
3. `agregarBot` gana un segundo parámetro opcional
   `duda?: { modo: "duda"; pregunta: string }` que **solo** cambia el body del
   fetch:
```ts
body: JSON.stringify({
  mensajes: historialRef.current,
  mensaje_a_redactar: textoBase,
  ...(duda ?? {}),
  proyecto_interes: evento.proyecto_interes,
})
```
   Todo su blindaje actual (abort a 3s, fallback al `textoBase`, el indicador de
   "escribiendo" que siempre se apaga) se reutiliza **sin tocarlo**. El endpoint
   ya acepta `modo`, `pregunta` y `proyecto_interes`: la Fase 2 lo dejó listo.

**Por qué no se rompe la paridad con los personajes:** `replayGuion` llama
`interpretarTexto` directo, sin pasar por `ChatWhatsApp`, así que los 3 guiones
producen exactamente el mismo `Lead` de hoy. Y `preguntas.ts` no se toca.

### 3c · Tests de la Fase 3

**`lib/conversacion/desvio.test.ts`** (nuevo):
- `it.each` de frases que SÍ desvían: "¿cuánto vale?", "cuanto cuesta la
  arboleda", "quiero hablar con un asesor", "me pueden llamar".
- **Contraejemplos que deben devolver `null`** (son respuestas válidas de hoy, y
  este es el test que impide romper la conversación): `"sería la primera"`,
  `"4.500.000"`, `"2 millones y medio"`, `"Bogotá, por el norte"`,
  `"no sé si aplico"`, `"no sé"`, `"espero que tenga excelentes zonas comunes"`.
- Fallback de precio contiene el `precio_desde` formateado; el de subsidio no
  contiene `$`.

**`components/chat/ChatWhatsApp.desvio.test.tsx`** (archivo **nuevo** — no tocar
`ChatWhatsApp.test.tsx`, que es de P3; copiar su patrón de stub de fetch que
lanza en `/api/chat`):
- Teclear una duda de precio a mitad de un paso → aparece la respuesta
  determinista **y la misma pregunta se repite**; al terminar, el `Lead` que
  recibe `onTerminar` trae el campo de ese paso lleno (no se saltó).
- Teclear "quiero hablar con un asesor" → mensaje de handoff visible, y la
  `transcripcion` de `onTerminar` contiene una fila `rol: "sistema"` con el
  handoff (que además se verá en la ficha, gracias a la Fase 1).

---

## Lo que falta: FASE 4 · docs (~30 min, no se recorta)

1. **`docs/specs/02-conversador.md`**
   - D2 (`[PROPUESTA]` hoy) → `[CERRADA — Mani, 2026-07-25]` con los recursos
     que entran (proyecto de entrada, subsidios, catálogo) y **la conciliación**:
     el catálogo entra como grounding de *consulta*, con la regla dura de que
     Sara nunca recomienda ni compara. El spec hoy dice lo contrario ("lo que NO
     entra: el catálogo completo"), así que hay que reescribir ese párrafo, no
     solo agregarle una nota.
   - Pregunta 13 (política de "no sé") → cerrada, apuntando al bloque del prompt.
   - D6 → el trigger "pide asesor" queda construido; decir con qué heurística y
     que deja rastro en la transcripción.
2. **`docs/adr/0006-prompt-maestro-y-desvio.md`** (nuevo, formato de los ADR
   existentes): catálogo como consulta, modo `duda` dentro de `/api/chat` (y por
   qué no una ruta nueva: ADR 0002), detección determinista con respuesta LLM y
   fallback, el perfil que no viaja en modo duda, y el prompt experto declarado
   dormido. Anotar las extensiones para después del domingo.
3. **`docs/agents/handoff.md`**: la entrada ya está escrita para las fases 1-2;
   ampliarla cuando entre la 3.
4. **Avisar en el grupo**: `ChatWhatsApp.tsx` (roce con P3) y `FilaLead.tsx`
   (roce con el recorrido de P1), más el orden de merge.

---

## Reglas duras (las mismas del plan; no negociar)

- **NO tocar:** `lib/conversacion/preguntas.ts` (P3), `lib/fixtures/` (P2, solo
  lectura), `lib/scoring/`, `lib/matching/` (solo import), `app/asesor/page.tsx`
  (P2/019), `db/`.
- Imports relativos en `lib/` **sin** extensión (`from "./subsidios"`).
- Nunca `npm run build` con `npm run dev` encendido.
- Español en todo. Antes de cada commit: `npm test && npx tsc --noEmit && npm run lint`.
- Si algo parece exigir tocar un archivo prohibido: **parar y preguntar**.

## Hallazgos de esta sesión que NO son de esta rama (para el equipo)

1. **🔴 La ficha de Diana se contradice a sí misma en la base de datos.** En
   `/asesor/lead-001` la explicación dice *"cuota $1.164.138 … del ingreso
   ($5.694.000)"* y el factor de al lado dice *"$1.739.943 = 24.8% del ingreso
   ($7.003.620)"*. **Son dos ingresos distintos en la misma pantalla.**
   - Causa: la fila de Supabase fue pisada hoy a las 2:18 p.m. (el seed la pone
     el 23 de julio) por código que ya usa el **SMMLV de 2026** ($1.750.905),
     mientras la explicación que quedó guardada es la vieja. Las fixtures
     locales son coherentes entre sí ($5.694.000 en los dos lados), o sea que el
     problema es **la fila de la DB, no el código de esta rama**.
   - Además, la explicación de los 3 personajes está **escrita a mano** en
     `lib/fixtures/leads-curados.ts` y sobrescribe la del pipeline, así que un
     lead conversado en vivo ve un texto distinto (más seco) que el sembrado.
   - **Acción:** volver a correr `db/seed.sql` antes de grabar, con el seed
     regenerado por quien haya movido el SMMLV. Es de P1/P2, no de esta rama.
2. **No hay `GEMINI_API_KEY` en el `.env` local**, así que el modo duda no se
   pudo cronometrar (< 2s de primer token, ADR 0002). El endpoint responde 503 y
   el cliente cae al texto determinista, que es el comportamiento correcto —
   pero **queda pendiente medirlo con key** antes de darlo por bueno.
