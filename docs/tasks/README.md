# Tickets del build

Cada ticket es **una unidad de trabajo que cabe en una ventana de contexto limpia** y cita el criterio del [`spec.md`](../spec.md) al que sirve. Salen de [`plan.md`](../plan.md), no del spec directo.

**Qué cubren y qué no:** los tickets 001-015 son las **costuras entre tracks** y los **tests de los criterios de aceptación** — lo que no le tocaba a nadie. El trabajo dentro de cada track (el chat, el motor, el matcher, la vista del asesor) vive en [`reparto-inicial.md`](../reparto-inicial.md) y en los [prompts de arranque](../prompts/). Un track no espera estos tickets para arrancar.

**Tickets 016-021 (recta final, grilling 2026-07-24):** nueva scope decidida en el grilling de scope. El reparto A/B/C/D se reencuadra en **4 roles de cierre** (Integrador · Datos&Motor · Calidad IA&Demo · Pitch&Video); el mapeo ticket→rol está en la columna "Dueño". Contexto en [`agents/handoff.md`](../agents/handoff.md) (Memory 2026-07-24 10:52) y [`URGENTE-Y-NOTICIAS.md`](../URGENTE-Y-NOTICIAS.md).

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
| 015 | [Guion y video del pitch de 2 min](015-guion-y-video.md) | Rol 4 | 014 | Sáb p.m. |
| 016 | [Distribuciones por proyecto + buyer_personas.json](016-distribuciones-por-proyecto.md) | Rol 2 | — | Vie |
| 017 | [Tabla de subsidios fundamentada](017-tabla-subsidios.md) | Rol 2 | — | Vie |
| 018 | [Similitud-distribución en la explicación](018-similitud-en-explicacion.md) | Rol 3 | 016 | Vie/Sáb |
| 019 | [Franja de impacto en /asesor](019-franja-impacto.md) | Rol 2 | — | Sáb (timebox) |
| 020 | [Tramo de implementabilidad en el video](020-tramo-implementabilidad.md) | Rol 4 | — | Sáb |
| 021 | [🔴 Poner plan-research en privado](021-plan-research-privado.md) | Rol 4 | — | **Ya** |
| 022 | [🔴 Sanear buyer-personas.md del repo público](022-sanear-buyer-personas-md.md) | Rol 4 | — | **Ya** |

El **estado** de cada ticket vive en su propio frontmatter (`status: todo | doing | done`). El estado vivo del proyecto (qué se hizo, qué sigue) vive en [`handoff.md`](../agents/handoff.md) — no se duplica aquí.

## Cobertura de los criterios de aceptación

| Criterio ([spec §5](../spec.md)) | Tickets |
|---|---|
| 1 — No repreguntar lo conocido | 003, 011 |
| 2 — Cero caja negra | 012 (+ motor de B y ficha de D) |
| 3 — Nadie se descarta | 007, 013 |
| 4 — El lead listo llega cerrable | 004, 005, 006, 014 |
