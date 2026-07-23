# mvp-reto-vivienda

MVP del reto **Vivienda** (perfilamiento inteligente de leads) para la hackathon Colsubsidio × 30X. Este repo es el **código** y el entregable público en GitHub; el cerebro (investigación, decisiones de reto, datos crudos) vive en el repo hermano **`plan-research`**.

Si algo no está resuelto, NO lo inventes: márcalo como supuesto por validar. Toda decisión dura es fundamentada.

## La apuesta (borrador — cerrar en kickoff)

Un workflow que hace que los leads pagos se parezcan a los orgánicos: el lead entra por pauta, conversa con un perfilador estilo WhatsApp que pregunta solo lo que falta, un motor transparente lo califica y matchea con 2-3 proyectos, y al asesor le llega un lead curado con cita agendada y el porqué. Los que aún no pueden comprar no se botan: quedan en nutrición con el trigger que los volvería listos. Detalle en [`docs/mvp-layout.md`](docs/mvp-layout.md).

## Agent skills

Este repo está preparado para ingeniería agéntica. Leer antes de trabajar:

- **Spec** ([`docs/spec.md`](docs/spec.md)) — qué hace y qué NO hace el MVP, en 7 bloques (lo construye `/spec`). El contrato de producto; leerlo antes de planear o construir. Lo incierto vive en su bloque de *supuestos por validar*, nunca inventado como hecho. Escrito el 2026-07-23; la frase de apuesta y varios supuestos se ratifican en el kickoff.
- **Plan + tickets** (`docs/plan.md`, `docs/tasks/`) — el build ordenado derivado del spec (lo construye `/plan`). Cada ticket cabe en una ventana de contexto limpia y cita el criterio de aceptación que sirve. Nunca saltar del spec directo al código. **Aún no existen.**
- **Handoff** ([`docs/agents/handoff.md`](docs/agents/handoff.md)) — memoria de sesión + roadmap. Leer al inicio de cada sesión, actualizar al final. Así el siguiente agente (o tu yo futuro) no arranca de cero.
- **Context** ([`docs/agents/context.md`](docs/agents/context.md)) — glosario del dominio (afiliado, 90/10, CPL, nutrición…). Leerlo antes de nombrar variables, funciones o archivos. Afinar con `/grill-with-docs`.
- **ADRs** ([`docs/adr/`](docs/adr/)) — decisiones y su porqué. La elección del reto es el [ADR 0001](docs/adr/0001-eleccion-reto-vivienda.md); no se re-litiga.

Propios de este repo, leer también:

- **[`docs/mvp-layout.md`](docs/mvp-layout.md)** — el layout macro de la solución: 8 decisiones cerradas, las abiertas, el workflow en mermaid (strawman a curar) y el mapeo del demo de 2 min.
- **[`docs/reto/`](docs/reto/)** — el brief oficial de Colsubsidio y el doc de los insumos. La fuente de verdad de qué se pide.

**Este repo es el canon de los docs vivos.** [`docs/agents/handoff.md`](docs/agents/handoff.md) (memoria del build) y [`docs/URGENTE-Y-NOTICIAS.md`](docs/URGENTE-Y-NOTICIAS.md) (lo que cambia el rumbo del equipo) se mantienen **aquí**, no en `plan-research`: ese repo queda como archivo histórico de investigación y datos crudos. Ambos docs deben estar siempre al día. `docs/plan-hackathon.md` es la semilla del brainstorm inicial (día a día del evento).

Skills disponibles (el pipeline es **spec → plan → build**): `/spec`, `/plan`, `/grill-me`, `/grill-with-docs`, `/tdd`, `/diagnose`, `/improve-codebase`, `/handoff`.

Mantén este archivo al día tú mismo: si un comando de feedback loop resulta equivocado o falta, o emerge una convención durable que ningún linter enforcea, actualiza la sección correspondiente aquí en vez de dejarlo derivar.

## Restricciones no-negociables

Reglas duras que gobiernan todo el proyecto y que ningún linter puede chequear. Es la constitución: se define una vez con cabeza y rara vez cambia.

- **Cero caja negra:** toda decisión del sistema (score, corte, match, trigger de nutrición) debe ser explicable en lenguaje natural. La explicación pesa tanto como la recomendación. _Señal para replantear:_ si una recomendación no se puede justificar con factores visibles, el componente no entra al demo.
- **Demo autogestionado:** el jurado recorre el flujo **solo**, con un clic y sin narración del equipo. _Señal para replantear:_ si una pantalla necesita que alguien la explique, está mal diseñada.
- **La data real de Colsubsidio nunca entra al repo público.** Los insumos (`docs/recursos-reto/`) son locales y están en `.gitignore`. Lo que se versiona es data **sintética/derivada** (`data/sintetica/`). _Señal para replantear:_ ninguna — esta no se negocia.
- **Deadline duro: domingo 26 jul 2026, 11:30 a.m. hora Colombia.** Nada posterior se evalúa. _Consecuencia:_ "feo pero funciona" > "bonito pero falso"; se congela toda feature que no se vea en el demo.

Pendientes de definir por el equipo (no inventar):

- **Performance:** `{TODO — p.ej. la respuesta del perfilador < 2s}`
- **Escala:** `{TODO}`
- **Arquitectura:** `{TODO — se decide con el stack en el kickoff; va como ADR}`

## Contratos

Estándares transversales que todo output debe cumplir. El *estándar* es sustrato portable (todos lo leen); la *skill que lo enforcea* es automatización de cada quien.

| Contract | Standard / where it lives | How it's enforced |
|---|---|---|
| Datos / privacidad | Data real solo local en `docs/recursos-reto/`; sintética en `data/sintetica/` | `.gitignore` (verificado con `git add --dry-run`) |

<!-- candidatos: UI → impeccable · code-quality → ponytail · seguridad → agente validador -->

## Feedback loops

El agente debe correr esto para saber rápido si el código sirve. **Stack sin decidir** (se define en el kickoff al repartir roles): llenar estas tres líneas es lo primero que hace quien lo elija.

- **Test:** `{TODO}`
- **Typecheck / lint:** `{TODO}`
- **Run:** `{TODO}`

## Datos del reto (crítico)

Trampas ya halladas en el Excel real. Quien construya el motor de scoring limpia esto primero:

- **`VLR_VIVIENDA` trae 4 ceros de más** → ÷10.000 para el precio real.
- **No hay columna "afiliado"**: se infiere de `PERIODO_AFILIADO` vacío/lleno.
- `SEGMENTO_POBLACIONAL` / `CATEGORIA` / `PIRAMIDE_NUEVA` vienen anonimizados con **letras griegas**, no las categorías del brief. Decisión abierta: clusters anónimos vs. inferir el mapeo.
- `RANGO_EDAD` y `ETAPA` traen dos formatos para el mismo valor.

Munición de impacto ya validada para el pitch: **27,1% de los compradores históricos NO son afiliados** (vs. el 10% que permite la regla 90/10), y los **16 proyectos** con ubicación conocida incumplen el límite.

## Conventions

- **Idioma:** español (el dominio, el pitch y el jurado son en español).
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
