# mvp-reto-vivienda

MVP del reto **Vivienda** de la hackathon **Colsubsidio × 30X** (2026): un perfilador inteligente de leads que hace que los leads de pauta lleguen al asesor tan calificados como los orgánicos.

> **Estado:** stack decidido ([ADR 0002](docs/adr/0002-stack-mvp.md)), spec y plan escritos, 4 tracks arrancando en paralelo. Este repo es el entregable público de código; la investigación y los datos crudos viven en el repo hermano `plan-research`.
>
> **¿Eres un agente y no tienes las skills de este repo?** El orden es: [`AGENTS.md`](AGENTS.md) → [`docs/spec.md`](docs/spec.md) → [`docs/plan.md`](docs/plan.md) → tu ticket en [`docs/tasks/`](docs/tasks/) o tu track en [`docs/prompts/`](docs/prompts/). Todo lo que necesitas está en esos archivos; nada del build depende de tener una skill instalada.

## El problema

Colsubsidio vende vivienda con un mandato regulatorio: **90% de las ventas deben ser a afiliados** (regla 90/10). Invierte en pauta digital y llegan muchos leads, pero al fondo del embudo pocos tienen capacidad real de compra y buena parte son no afiliados. El costo es doble: el CPL pagado + las horas del equipo comercial persiguiendo leads que no van a cerrar. Los leads orgánicos, en cambio, convierten bien porque llegan mejor calificados.

## La apuesta

Un workflow que hace que los leads pagos se parezcan a los orgánicos: entran por pauta, conversan con un perfilador estilo WhatsApp que **pregunta solo lo que falta**, un motor **transparente** los califica y los matchea con 2-3 proyectos, y al asesor le llega un **lead curado con cita agendada y el porqué en lenguaje natural** — listo para cerrar. Quien aún no puede comprar no se descarta: entra a **nutrición** con el trigger que lo volvería listo.

Cero caja negra: cada decisión es explicable, y el jurado recorre el demo solo.

## Estructura del repo

| Ruta | Qué es |
|---|---|
| [`AGENTS.md`](AGENTS.md) | **Empieza aquí.** El contrato de ingeniería agéntica: orden de lectura, restricciones no-negociables, contratos y feedback loops. Tool-neutral: lo lee cualquier herramienta de IA. `CLAUDE.md` es solo un puntero que lo importa. |
| [`docs/spec.md`](docs/spec.md) | **El contrato de producto**: qué hace y qué NO hace el MVP, en 7 bloques, con 4 criterios de aceptación. |
| [`docs/plan.md`](docs/plan.md) | **El plan del build**: la app en un diagrama, el modelo de datos, las costuras entre tracks, la secuencia hasta el freeze. |
| [`docs/tasks/`](docs/tasks/) | Los tickets que salen del plan (uno por costura y por criterio de aceptación). [Índice](docs/tasks/README.md). |
| [`docs/reparto-inicial.md`](docs/reparto-inicial.md) | Qué construye cada track (A/B/C/D) y los contratos de `lib/types.ts`. |
| [`docs/prompts/`](docs/prompts/) | El prompt de arranque de cada track. |
| [`docs/URGENTE-Y-NOTICIAS.md`](docs/URGENTE-Y-NOTICIAS.md) | Lo que cambia el rumbo del equipo. Si solo vas a leer un archivo hoy, es este. |
| [`docs/mvp-layout.md`](docs/mvp-layout.md) | Layout macro de la solución: 8 decisiones cerradas + abiertas, workflow (mermaid), componentes, mapeo del demo. |
| [`docs/reto/`](docs/reto/) | Brief oficial del reto + doc de cómo usar los insumos. |
| [`docs/agents/handoff.md`](docs/agents/handoff.md) | Memoria viva + roadmap del build. |
| [`docs/agents/context.md`](docs/agents/context.md) | Glosario del dominio (afiliado, 90/10, CPL, nutrición…). |
| [`docs/adr/`](docs/adr/) | Decisiones de arquitectura y su porqué. |
| [`docs/agenda-evento.md`](docs/agenda-evento.md) | Día a día del evento (semilla del brainstorm). No confundir con `docs/plan.md`, que es el plan del build. |
| `docs/recursos-reto/` | Insumos reales (Excel, PPT, brochures). **Local, no versionado** — data de Colsubsidio. |

## Cómo correr

Stack: Next.js (App Router, TypeScript) + Vercel + Supabase + API de Claude ([ADR 0002](docs/adr/0002-stack-mvp.md)). Requiere un `.env` local a partir de `.env.example`.

```bash
npm install && npm run dev
```

Feedback loops (los mismos que corre cualquier agente antes de commitear):

```bash
npm test && npx tsc --noEmit && npm run lint
```

> Los comandos aplican desde que exista el scaffold de Next.js (ticket [001](docs/tasks/001-personajes-canonicos.md) y paso 0 de [`docs/reparto-inicial.md`](docs/reparto-inicial.md)).

## Entregables de la hackathon

1. Link a demo funcional (recorrible por el jurado, sin el equipo).
2. Video pitch + demo de 2 min (problema → solución → demo → impacto).
3. Este repo público. **Cierre: domingo 26 jul 2026, 11:30 a.m. hora Colombia.**
