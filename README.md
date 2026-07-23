# mvp-reto-vivienda

MVP del reto **Vivienda** de la hackathon **Colsubsidio × 30X** (2026): un perfilador inteligente de leads que hace que los leads de pauta lleguen al asesor tan calificados como los orgánicos.

> **Estado:** scaffold listo, pre-kickoff. El stack se decide con el equipo al repartir roles. Este repo es el entregable público de código; la investigación y las decisiones viven en el repo hermano `plan-research`.

## El problema

Colsubsidio vende vivienda con un mandato regulatorio: **90% de las ventas deben ser a afiliados** (regla 90/10). Invierte en pauta digital y llegan muchos leads, pero al fondo del embudo pocos tienen capacidad real de compra y buena parte son no afiliados. El costo es doble: el CPL pagado + las horas del equipo comercial persiguiendo leads que no van a cerrar. Los leads orgánicos, en cambio, convierten bien porque llegan mejor calificados.

## La apuesta

Un workflow que hace que los leads pagos se parezcan a los orgánicos: entran por pauta, conversan con un perfilador estilo WhatsApp que **pregunta solo lo que falta**, un motor **transparente** los califica y los matchea con 2-3 proyectos, y al asesor le llega un **lead curado con cita agendada y el porqué en lenguaje natural** — listo para cerrar. Quien aún no puede comprar no se descarta: entra a **nutrición** con el trigger que lo volvería listo.

Cero caja negra: cada decisión es explicable, y el jurado recorre el demo solo.

## Estructura del repo

| Ruta | Qué es |
|---|---|
| [`docs/mvp-layout.md`](docs/mvp-layout.md) | Layout macro de la solución: 8 decisiones cerradas + abiertas, workflow (mermaid), componentes, mapeo del demo. |
| [`docs/reto/`](docs/reto/) | Brief oficial del reto + doc de cómo usar los insumos. |
| [`docs/agents/handoff.md`](docs/agents/handoff.md) | Memoria viva + roadmap del build. |
| [`docs/agents/context.md`](docs/agents/context.md) | Glosario del dominio (afiliado, 90/10, CPL, nutrición…). |
| [`docs/adr/`](docs/adr/) | Decisiones de arquitectura y su porqué. |
| [`docs/plan-hackathon.md`](docs/plan-hackathon.md) | Plan de acción día a día del evento (semilla del brainstorm). |
| `docs/recursos-reto/` | Insumos reales (Excel, PPT, brochures). **Local, no versionado** — data de Colsubsidio. |

## Cómo correr

Por definir: se documenta aquí cuando el equipo elija el stack en el kickoff.

## Entregables de la hackathon

1. Link a demo funcional (recorrible por el jurado, sin el equipo).
2. Video pitch + demo de 2 min (problema → solución → demo → impacto).
3. Este repo público. **Cierre: domingo 26 jul 2026, 11:30 a.m. hora Colombia.**
