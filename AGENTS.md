# mvp-reto-vivienda

MVP del reto **Vivienda** (perfilamiento inteligente de leads) para la hackathon Colsubsidio × 30X. Este repo es el **código** y el entregable público en GitHub; el cerebro (investigación, decisiones de reto, datos crudos) vive en el repo hermano **`plan-research`**.

Si algo no está resuelto, NO lo inventes: márcalo como supuesto por validar. Toda decisión dura es fundamentada.

## La apuesta

Un workflow que hace que los leads pagos se parezcan a los orgánicos: el lead entra por pauta, conversa con un perfilador estilo WhatsApp que pregunta solo lo que falta, un motor transparente lo califica y matchea con hasta 3 proyectos, y al asesor le llega un lead curado con cita agendada y el porqué. Los que aún no pueden comprar no se botan: quedan en nutrición con el trigger que los volvería listos. Detalle en [`docs/mvp-layout.md`](docs/mvp-layout.md).

## Empieza aquí (estado del proyecto, 2026-07-25)

El flujo corre de punta a punta y los 4 criterios de aceptación están construidos. **Antes de tocar nada, en este orden:**

1. **[`docs/agents/plan-arquitectura-conversador.md`](docs/agents/plan-arquitectura-conversador.md)** — **el plan de trabajo vigente y el canal de sincronización de los 5 computadores.** 8 ramas con **propiedad de archivos asignada** (tocar un archivo que no es tuyo hace que se rechace el merge), la bitácora de hallazgos, y los 15 puntos marcados `🔴 CONSULTAR` que nadie escribe sin aprobación — todos son personalidad o comportamiento del agente. **Su regla de oro: no asumas, consulta.**
2. **[`docs/agents/plan-sabado-25.md`](docs/agents/plan-sabado-25.md)** — qué se hace HOY: el reparto por 5 personas, las 10 decisiones, los 3 checkpoints, las reglas del día y el **recetario para probar sin pisar a los 3 personajes** del demo. Su **addendum de las 12:00** trae los 3 tickets que salieron de la discusión de workflow.
3. **[`docs/agents/discusion-workflow-2026-07-25.md`](docs/agents/discusion-workflow-2026-07-25.md)** — el delta del plan: los dos motores, el layout contra el reto, y el **único defecto abierto que el jurado puede reproducir solo** (ticket 023). Trae también los seis supuestos que la sala dio por ciertos y el código desmiente, con su medición.
4. **[`docs/agents/handoff.md`](docs/agents/handoff.md)** — la memoria del build (lo nuevo arriba) y el roadmap de lo que queda.
5. **[`docs/URGENTE-Y-NOTICIAS.md`](docs/URGENTE-Y-NOTICIAS.md)** — lo que cambia el rumbo del equipo.

> **Cómo leer los docs de este repo:** todo documento superado lleva un banner `🔁 HISTÓRICO` en su primera línea que dice cuál es el vigente. Si un doc no lo tiene, está vivo y su contenido cuenta. Si encuentras un doc vivo que el código desmiente, **arréglalo o pon el banner** — no lo dejes derivar.

## Agent skills

Este repo está preparado para ingeniería agéntica. Leer antes de trabajar:

- **Spec** ([`docs/spec.md`](docs/spec.md)) — qué hace y qué NO hace el MVP, en 7 bloques (lo construye `/spec`). El contrato de producto; leerlo antes de planear o construir. Lo incierto vive en su bloque de *supuestos por validar*, nunca inventado como hecho. Puesto al día el 2026-07-25 con las decisiones de la sala del sábado; los supuestos que siguen en `[ ]` **están abiertos de verdad** (los pesos del motor y el 0,6% de la cuota, a propósito).
- **Specs por componente** ([`docs/specs/`](docs/specs/README.md)) — el detalle de cada parte del MVP: ingesta, conversador, scoring, match+agenda, nutrición y dashboard, **cada uno con su diagrama mermaid**, más el [unificado](docs/specs/00-mvp-unificado.md) que supersede el strawman de `mvp-layout.md §3`. Detallan el spec, no lo contradicen. **Es un borrador vivo para el equipo:** separan el *QUÉ* (contrato con fuente citada) del *CÓMO* (propuesta discutible) y marcan cada decisión como `[CERRADA — fuente]`, `[HOY — así está construido]` o `[PROPUESTA — TEAM decide]`. Antes de tocar un componente se lee su spec; si algo está marcado `[PROPUESTA]`, **no está decidido** y no se implementa sin ratificarlo.
- **Tickets** ([`docs/tasks/`](docs/tasks/README.md)) — la unidad de trabajo del build: cada uno cabe en una ventana de contexto limpia y cita el criterio de aceptación que sirve. Nunca saltar del spec directo al código. Los abiertos hoy son 014-020; el reparto vigente de quién los toma es el de `plan-sabado-25.md`, no la columna Dueño A/B/C/D.
- **Handoff** ([`docs/agents/handoff.md`](docs/agents/handoff.md)) — memoria de sesión + roadmap. Leer al inicio de cada sesión, actualizar al final. Así el siguiente agente (o tu yo futuro) no arranca de cero.
- **Auditoría** ([`docs/agents/auditoria-2026-07-24.md`](docs/agents/auditoria-2026-07-24.md)) — la revisión externa de docs vs código que destapó los 4 bloqueantes del demo, con su estado de corrección hallazgo por hallazgo.
- **Context** ([`docs/agents/context.md`](docs/agents/context.md)) — glosario del dominio (afiliado, 90/10, curado, holgura de capacidad, nutrición…). Leerlo antes de nombrar variables, funciones o archivos. Afinar con `/grill-with-docs`.
- **ADRs** ([`docs/adr/`](docs/adr/)) — decisiones y su porqué. La elección del reto es el [ADR 0001](docs/adr/0001-eleccion-reto-vivienda.md); no se re-litiga. El [0005](docs/adr/0005-afiliacion-cupo-y-explicacion.md) trae las tres decisiones que gobiernan hoy el motor y la ficha.
- **Pitch** ([`docs/pitch/`](docs/pitch/)) — el guion del video de 2 min (el entregable con pre-filtro) y las preguntas a mentores. Si tocas el flujo del demo, el guion se desactualiza: avísalo.

Históricos del arranque (llevan banner y **no se usan para arrancar una sesión**): [`docs/plan.md`](docs/plan.md) (las 9 costuras, todas cerradas), [`docs/reparto-inicial.md`](docs/reparto-inicial.md) + [`docs/prompts/`](docs/prompts/README.md) (los 4 tracks A/B/C/D) y [`docs/agents/roles-recta-final.md`](docs/agents/roles-recta-final.md) (los 4 roles del viernes).

Propios de este repo, leer también:

- **[`PRODUCT.md`](PRODUCT.md) + [`DESIGN.md`](DESIGN.md)** — la verdad de producto y el sistema visual. **Antes de tocar cualquier UI se lee `DESIGN.md`**: describe el **design system de Colsubsidio** (kit de Claude Design, portado por superficie: `ui_kits/lead-chat/` → [`app/chat.css`](app/chat.css), `ui_kits/advisor-panel/` → `app/asesor/` + [`components/ui/`](components/ui/)) y las reglas nombradas que ningún linter chequea: un solo trazo de resaltador por pantalla, la Regla del Rojo Escaso, la Regla del Rol Único para el modo oscuro, la Regla de los Dos Colores, y que **el dato duro y su explicación nunca comparten tratamiento tipográfico**. Los estados del score usan una paleta **separada** de la de marca: un chip amarillo nunca es un estado. Reemplazó al mundo propio "El formato sellado" ([ADR 0004](docs/adr/0004-design-system-colsubsidio.md)) — si encuentras código o docs que hablen de "cero sombra", "esquinas de 3px" o "el azul tiñe regiones", están desactualizados. Los colores viven en [`app/globals.css`](app/globals.css) en tres capas: **solo se edita la primera** (los tokens del kit); las otras dos son alias y publicación a Tailwind. Si hay que cambiar un color, se cambia el token, nunca el componente.

- **[`docs/mvp-layout.md`](docs/mvp-layout.md)** — el layout macro de la solución: 8 decisiones cerradas, las abiertas, el workflow en mermaid (strawman a curar) y el mapeo del demo de 2 min.
- **[`docs/reto/`](docs/reto/)** — el brief oficial de Colsubsidio, el doc de los insumos y el digest de la [charla con el mentor](docs/reto/charla-mentor.md) (cómo funciona hoy la operación). La fuente de verdad de qué se pide. El transcript crudo de la charla **no se versiona**: este repo es público.
- **[`docs/explicaciones-referencia.md`](docs/explicaciones-referencia.md)** — las 3 explicaciones "perfectas" sobre los personajes canónicos: es la **vara de medir** de la calidad del texto que ve el asesor, y el fallback del [ticket 010](docs/tasks/010-fallback-conversador.md).
- **[`docs/proyectos/`](docs/proyectos/)** — el material extraído de los 18 brochures públicos. Respaldo documental para preguntas del jurado sobre el catálogo; **hoy ningún código lo consume** (el catálogo que sí corre es `data/sintetica/proyectos.json`).

**Este repo es el canon de los docs vivos.** [`docs/agents/handoff.md`](docs/agents/handoff.md) (memoria del build) y [`docs/URGENTE-Y-NOTICIAS.md`](docs/URGENTE-Y-NOTICIAS.md) (lo que cambia el rumbo del equipo) se mantienen **aquí**, no en `plan-research`: ese repo queda como archivo histórico de investigación y datos crudos. Ambos docs deben estar siempre al día. `docs/agenda-evento.md` es la semilla del brainstorm inicial (día a día del evento).

Skills disponibles (el pipeline es **spec → plan → build**): `/spec`, `/plan`, `/grill-me`, `/grill-with-docs`, `/tdd`, `/diagnose`, `/improve-codebase`, `/handoff`.

Mantén este archivo al día tú mismo: si un comando de feedback loop resulta equivocado o falta, o emerge una convención durable que ningún linter enforcea, actualiza la sección correspondiente aquí en vez de dejarlo derivar.

## Restricciones no-negociables

Reglas duras que gobiernan todo el proyecto y que ningún linter puede chequear. Es la constitución: se define una vez con cabeza y rara vez cambia.

- **Cero caja negra:** toda decisión del sistema (score, corte, match, trigger de nutrición) debe ser explicable en lenguaje natural. La explicación pesa tanto como la recomendación. _Señal para replantear:_ si una recomendación no se puede justificar con factores visibles, el componente no entra al demo.
- **Demo autogestionado:** el jurado recorre el flujo **solo**, con un clic y sin narración del equipo. _Señal para replantear:_ si una pantalla necesita que alguien la explique, está mal diseñada.
- **La data real de Colsubsidio nunca entra al repo público.** Los insumos (`docs/recursos-reto/`) son locales y están en `.gitignore`. Lo que se versiona es data **sintética/derivada** (`data/sintetica/`). _Señal para replantear:_ ninguna — esta no se negocia.
- **Deadline duro: domingo 26 jul 2026, 11:30 a.m. hora Colombia.** Nada posterior se evalúa. _Consecuencia:_ "feo pero funciona" > "bonito pero falso"; se congela toda feature que no se vea en el demo.

- **Performance:** **todo lo que el lead LEE va en streaming**, con primer token del conversador < 2s. El streaming no es opcional ahí: evita el límite de tiempo de funciones en Vercel free y hace el chat creíble en el video. _Excepción única y medida (rama 4, 2026-07-26):_ `generarJSON()` de [`lib/gemini.ts`](lib/gemini.ts) **no** streamea, porque clasifica en una palabra que nadie ve llegar (487–725 ms medidos contra Vertex) y streamearla obligaría a acumular el texto completo antes de poder validarlo con zod. Si aparece otra llamada que no sea texto para el lead, va por ahí; **cualquier cosa que se pinte en el chat sigue en streaming, sin excepción**.
- **Escala:** la del demo — jurado + equipo, decenas de sesiones concurrentes máximo. No optimizar para más.
- **Arquitectura:** **Next.js (monolito) + Vercel + Supabase + LLM en streaming**, registrada en [ADR 0002](docs/adr/0002-stack-mvp.md). Proveedor de IA: **Google Gemini** (`gemini-2.5-flash`, aislado en [`lib/gemini.ts`](lib/gemini.ts)) — el ADR decidió Claude pero se cambió por disponibilidad de key (ver la nota del ADR). Reglas duras derivadas: el scoring es TS puro sin LLM (la IA solo vive en conversador y explicación); Python solo offline en `scripts/`; la API key solo server-side; `main` siempre desplegable (es el link del demo). No re-litigar sin razón nueva.

## Contratos

Estándares transversales que todo output debe cumplir. El *estándar* es sustrato portable (todos lo leen); la *skill que lo enforcea* es automatización de cada quien.

| Contract | Standard / where it lives | How it's enforced |
|---|---|---|
| Datos / privacidad | Data real solo local en `docs/recursos-reto/`; sintética en `data/sintetica/` | `.gitignore` (verificado con `git add --dry-run`) |
| Secretos | API keys solo en `.env` local + env vars de Vercel; el repo es **público**. `.env.example` sin valores | `.gitignore` (`.env*`) + revisión antes de cada push |
| Contratos entre tracks | Los tipos `Lead`, `Score`, `LeadCurado` viven en `lib/types.ts`; cada track construye contra fixtures de esos tipos, no contra el código de los demás ([ADR 0002](docs/adr/0002-stack-mvp.md)) | Typecheck — cambiar un tipo rompe el build de quien lo consume |

<!-- candidatos: UI → impeccable · code-quality → ponytail · seguridad → agente validador -->

## Feedback loops

El agente debe correr esto para saber rápido si el código sirve. Stack decidido ([ADR 0002](docs/adr/0002-stack-mvp.md)); estos comandos aplican apenas exista el scaffold de Next.js — quien lo cree verifica que los tres corran y ajusta aquí si difieren.

- **Test:** `npm test` (vitest; prioridad: `lib/scoring/` — el motor de reglas se testea sin red)
- **Typecheck / lint:** `npx tsc --noEmit && npm run lint`
- **Run:** `npm run dev` (requiere `.env.local` con `GEMINI_API_KEY` y credenciales de Supabase — ver `.env.example`; sin la key de Gemini, el conversador cae a su fallback determinístico)

⚠️ **Nada de extensiones `.js` en los imports relativos de `lib/`.** Turbopack no resuelve `from "./config.js"` → el módulo "no existe" y **la ruta entera responde 500**. Se coló en `lib/scoring/` y no se notó por meses porque solo lo consumían los tests (vitest sí lo resuelve); apenas entró a un Server Component tumbó las 4 rutas. La convención del repo es **sin extensión** (`from "./config"`), como en `lib/matching/`.

⚠️ **Nunca correr `npm run build` con `npm run dev` encendido.** Ambos escriben en `.next`: el dev server queda colgado **reteniendo el puerto 3000 sin responder**, y un `npm run dev` nuevo se niega a arrancar. El síntoma engaña —pantalla en blanco en el navegador, que se lee como "la app se rompió"— y costó ~20 min el 2026-07-24. Antes de sospechar del código, probar el puerto: `curl -o /dev/null -w "%{http_code}" http://localhost:3000/` → `000` significa server caído, no bug. Se arregla con `taskkill //PID <pid> //F` (el PID lo imprime el intento fallido) y relanzar.

⚠️ **Si `tsc` se queja de identificadores duplicados en `.next/types/…`, no es el código.** El repo vive dentro de `~/Documents`, que en macOS sincroniza iCloud, y el sincronizador **duplica archivos generados** dejando copias con un número al final (`routes.d 2.ts`, `cache-life.d 3.ts`). Como `tsconfig.json` incluye `.next/types/**/*.ts`, esas copias entran al typecheck y chocan con el original: `TS2300: Duplicate identifier 'LayoutProps'`. Pasó dos veces el 2026-07-25. Se limpia sin tocar nada del repo (`.next` es generado y está en `.gitignore`):

```bash
find .next -name "* [0-9].*" -delete
```

## Datos del reto (crítico)

Trampas ya halladas en el Excel real. Quien construya el motor de scoring limpia esto primero:

- **`VLR_VIVIENDA` trae 4 ceros de más** → ÷10.000 para el precio real.
- **No hay columna "afiliado"**: se infiere de `PERIODO_AFILIADO` vacío/lleno.
- `SEGMENTO_POBLACIONAL` / `CATEGORIA` / `PIRAMIDE_NUEVA` vienen anonimizados con **letras griegas**, no las categorías del brief. **Decidido (grilling 2026-07-24): se tratan como clusters anónimos ante el jurado**; el mapeo descifrado viaja solo como etiqueta `[inferido]`, nunca presentado como oficial.
- `RANGO_EDAD` y `ETAPA` traen dos formatos para el mismo valor.

Munición de impacto ya validada para el pitch: **27,1% de los compradores históricos NO son afiliados** (vs. el 10% que permite la regla 90/10), y los **16 proyectos** con ubicación conocida incumplen el límite.

## Conventions

- **Idioma:** español (el dominio, el pitch y el jurado son en español).
- **La conversación del chat no es un formulario, y es fácil volverla uno sin querer.** Antes de tocar una pregunta se lee el encabezado de [`lib/conversacion/preguntas.ts`](lib/conversacion/preguntas.ts), que trae las reglas de redacción, y [spec 02 D4](docs/specs/02-conversador.md). Las tres que más se rompen: cada pregunta **dice para qué sirve** antes de preguntar, cada respuesta **recibe un acuse** antes de la siguiente, y el **campo de texto nunca desaparece** — los chips son atajos, no la única salida, y en ingreso y zona no van chips porque la lista sesga. La razón no es estética: se está vendiendo la compra que alguien hace una vez en la vida, y el mentor rechazó explícitamente *"ese prototipo de chatbot donde la gente se enreda"*. Parte está cubierta por `preguntas.test.ts`; el tono, no — eso lo cuida quien escribe.
- **Hay cuatro archivos GENERADOS: no se editan a mano.** `db/seed.sql` (`npx tsx scripts/generar-seed.ts`), `data/sintetica/slots.json` (`npx tsx scripts/generar-slots.ts`) y `data/sintetica/buyer_personas.json` (`npx tsx scripts/generar-buyer-personas.ts`, desde `data/buyer-personas-vivienda.md` — alimenta la similitud con compradores reales), más las fixtures derivadas de `lib/fixtures/` (`scores.ts` y `proyectos-recomendados.ts` salen de `curar()`, no de números escritos a mano). La razón es histórica y cara: el seed se declaraba "espejo de las fixtures" y se copiaba a mano, y **se rompió dos veces sin que nadie lo notara** — primero le faltó el ingreso (todo lead caía a nutrición), después el puntaje (la ficha mostraba 0/100). Igual `slots.json`, que colgaba de ids que el catálogo real no tiene: pedir franjas devolvía lista vacía **sin fallar**. Un espejo que se copia a mano es una segunda fuente. Si cambias una fixture, **regenera** — `lib/fixtures/seed-espejo.test.ts` compara el archivo en disco contra el generador y falla si quedó viejo.
- **Los personajes del demo se declaran por lo que TECLEAN, no por sus respuestas.** `lib/fixtures/leads.ts` trae el guion y `replayGuion` lo corre contra el conversador real, así que el personaje sembrado y ese mismo personaje conversado en vivo por el jurado producen el mismo `Lead` y el mismo puntaje. Si agregas o quitas una pregunta en `preguntas.ts`, el replay falla en voz alta diciendo cuál quedó sin respuesta.
- Toda decisión dura (stack, esquema de la DB de leads, alcance) se registra como ADR en `docs/adr/`.
- **Commits frecuentes** (los modelos pueden borrar cosas por accidente).
- Mantén `docs/agents/handoff.md` **siempre** al día. Si algo cambia el rumbo del equipo, va también a `docs/URGENTE-Y-NOTICIAS.md`.

## Permissions

El agente corre con un permission floor para trabajar autónomo sin borrar cosas. Los comandos destructivos están denegados en `.claude/settings.json` (Claude Code); otras herramientas usan su propia config. Amplía el allow-list según el proyecto; conserva el deny-list destructivo.

## Agents & local skills

Este repo puede hacer crecer su propia automatización cuando una necesidad se repite. No es obligatorio y no hay archivos ni carpetas placeholder. Cuando se lo gane:

- **Local skills** → `.claude/skills/<name>/` — un procedimiento repetible que quieres determinista (se construye con skill-creator).
- **Local agents** → `.claude/agents/<name>/` — un rol con su forma de trabajar embebida: `AGENT.md` (qué hace) + `MEMORY.md` (lo que aprendió de este codebase) + opcionalmente `templates/`, `scripts/` y referencias a skills. Se escribe a mano una vez que la necesidad está probada; un agente construido antes de que la necesidad sea real es peor que ninguno.

**Principio de revisión (portable, toda herramienta):** la revisión la hace un *modelo/sesión distinto del que escribió el código* — valida el output contra el spec y la arquitectura antes del commit. Es el "cadenero". No está atado a un modelo fijo: cualquier buen razonador en sesión fresca sirve.
