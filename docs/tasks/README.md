# Tickets del build

Cada ticket es **una unidad de trabajo que cabe en una ventana de contexto limpia** y cita el criterio del [`spec.md`](../spec.md) al que sirve. Salen de [`plan.md`](../plan.md), no del spec directo.

**Qué cubren y qué no:** los tickets de aquí son las **costuras entre tracks** y los **tests de los criterios de aceptación** — lo que no le tocaba a nadie. El trabajo dentro de cada track (el chat, el motor, el matcher, la vista del asesor) vive en [`reparto-inicial.md`](../reparto-inicial.md) y en los [prompts de arranque](../prompts/). Un track no espera estos tickets para arrancar.

## Índice

| # | Ticket | Dueño | Depende de | Cuándo |
|---|---|---|---|---|
| 001 | [Personajes canónicos del demo](001-personajes-canonicos.md) | A | — | Hoy, en el scaffold |
| 002 | [Cerrar los dos huecos de `lib/types.ts`](002-contratos-capacidad-en-score.md) | A | 001 | Tras el kickoff |
| 003 | [Enriquecimiento real: cédula → `PerfilConocido`](003-enriquecimiento-por-cedula.md) | B | 001 | Vie a.m. |
| 004 | [La regla del 40% como función compartida](004-capacidad-compartida.md) | B → C | 002 | Vie a.m. |
| 005 | [Agendador: ofrecer y registrar la franja](005-agendador.md) | A + D | 001 | Vie p.m. |
| 006 | [Orquestador `/api/curar`](006-orquestador.md) | A | 001, 002 | **Vie, no sáb** |
| 007 | [Re-enganche del lead en nutrición](007-reenganche-nutricion.md) | D + A | 001 | Sáb a.m. |
| 008 | [Shell de navegación del demo](008-shell-navegacion.md) | A | — | Vie p.m. |
| 009 | [El demo corre en la URL pública](009-deploy-verificado.md) | A | — | Diario |
| 010 | [Fallback del conversador si Claude falla](010-fallback-conversador.md) | A | 001 | Sáb |
| 011 | [Test del criterio 1](011-test-criterio-1.md) | A | 001, 003 | Con la pieza |
| 012 | [Test del criterio 2](012-test-criterio-2.md) | B + D | 001 | Con la pieza |
| 013 | [Test del criterio 3](013-test-criterio-3.md) | B | 001 | Con la pieza |
| 014 | [Recorrido de aceptación en la URL pública](014-recorrido-criterio-4.md) | Todos | 006, 003, 005, 007 | Sáb a.m. |
| 015 | [Guion y video del pitch de 2 min](015-guion-y-video.md) | **sin asignar** | 014 | Sáb p.m. |

El **estado** de cada ticket vive en su propio frontmatter (`status: todo | doing | done`). El estado vivo del proyecto (qué se hizo, qué sigue) vive en [`handoff.md`](../agents/handoff.md) — no se duplica aquí.

## Cobertura de los criterios de aceptación

| Criterio ([spec §5](../spec.md)) | Tickets |
|---|---|
| 1 — No repreguntar lo conocido | 003, 011 |
| 2 — Cero caja negra | 012 (+ motor de B y ficha de D) |
| 3 — Nadie se descarta | 007, 013 |
| 4 — El lead listo llega cerrable | 004, 005, 006, 014 |
