# Handoff — mvp-reto-vivienda (Hackathon Colsubsidio × 30X)

> Memoria de sesión + roadmap del **build**. Leer al inicio, actualizar al final.
> El roadmap es un DAG: una tarea está **ready** solo cuando sus dependencias están done.
> **Este repo es el canon de los docs vivos** (este handoff + `docs/URGENTE-Y-NOTICIAS.md`).
> Repo hermano `plan-research` = archivo histórico de investigación y datos crudos.

## Memory

_Estado actual del trabajo. Lo nuevo arriba. Mantener corto; enlazar a ADRs/commits en vez de duplicar._

- 2026-07-23 — **Contrato migrado a [`AGENTS.md`](../../AGENTS.md)** (re-corrida de `/scaffold` tras su refactor). `AGENTS.md` es ahora el contrato canónico **tool-neutral** — quien use Codex/Cursor/Gemini lee la misma fuente de verdad — y `CLAUDE.md` quedó como puntero delgado con `@AGENTS.md`. Nuevo ahí: la **constitución** de 4 restricciones no-negociables (cero caja negra · demo autogestionado · data de Colsubsidio nunca al repo público · deadline 26 jul 11:30 a.m.), la tabla de **Contratos** (fila datos/privacidad, enforced por `.gitignore`) y los 3 **feedback loops en `TODO`**. Añadido `.claude/settings.json` con permission floor (deny `rm -rf`, `push --force`, `reset --hard`, `clean -fd`); `settings.local.json` sigue ignorado. **Acción para quien elija el stack: llenar los 3 feedback loops de `AGENTS.md` de una vez.**
- 2026-07-23 — **Scaffold de este repo de código.** Estructura canónica montada: `CLAUDE.md`, `README.md`, `.gitignore`, `docs/agents/{context,handoff}.md`, `docs/adr/{0000,0001}`, `docs/reto/` (brief + doc de insumos), `docs/mvp-layout.md`, `docs/plan-hackathon.md`, `docs/URGENTE-Y-NOTICIAS.md`. Los 6 archivos del brainstorm inicial se reorganizaron desde la raíz y se les arreglaron las rutas. **Data real** (`hackathon_VIVIENDAv2.xlsx`, `Buyer Person.pptx`, `Links brochures .xlsx`) movida a `docs/recursos-reto/` y **excluida de git** (repo público, data de Colsubsidio). Sin código de app todavía: el stack se decide en el kickoff. **Siguiente:** kickoff → `/spec`.
- 2026-07-23 — **Scope macro del MVP definido** (grill de Mani + Claude). 8 decisiones cerradas (demo = viaje completo con clímax en asesor, WhatsApp simulado + disclaimer, nutrición con triggers condicionales, scoring de reglas transparentes + similitud + LLM explica, conversación adaptativa, bot agenda visita, no-afiliado sigue el flujo hacia DB central, workflow orquestado con IA puntual) y las abiertas marcadas. Todo en [`docs/mvp-layout.md`](../mvp-layout.md) — incluye mermaid strawman a curar en kickoff.
- 2026-07-23 — **Datos reales del reto analizados** (viven en `docs/recursos-reto/` local y en `plan-research`). **Munición de impacto:** 27,1% de los compradores históricos NO son afiliados (vs. 10% de la regla 90/10); los 16 proyectos con ubicación conocida incumplen el límite (15,9%–63,1%). **Realidades del Excel:** no hay columna "afiliado" (se infiere de `PERIODO_AFILIADO`), `VLR_VIVIENDA` trae 4 ceros de más (÷10.000), y `SEGMENTO_POBLACIONAL`/`CATEGORIA`/`PIRAMIDE_NUEVA` vienen con letras griegas. Detalle en el dashboard del equipo (artifact en `plan-research`, no versionado). Canal medido (`MEDIO`): 43,4% de compras vienen de señalización física, solo 8,3% de canales digitales.
- 2026-07-23 — **RETO ELEGIDO: Vivienda** (perfilamiento inteligente de leads). [`ADR 0001`](../adr/0001-eleccion-reto-vivienda.md). No se re-litiga.
- Contexto de la hackathon, retos, reglas y criterios: ver [`CLAUDE.md`](../../CLAUDE.md) y el repo `plan-research`.

## Roadmap

### Now (ready — sin dependencias pendientes)

- [ ] **Kickoff con todo el equipo** — cerrar la frase de apuesta, curar el mermaid de [`docs/mvp-layout.md`](../mvp-layout.md), y resolver las abiertas (esquema de la DB central de leads, vista del asesor, entrada del demo, métricas de scoring). Es el Día 1 del [`docs/plan-hackathon.md`](../plan-hackathon.md). No arranca de cero: arranca del mvp-layout.
- [ ] Limpiar el Excel real antes del motor de scoring: `VLR_VIVIENDA` ÷10.000, normalizar `RANGO_EDAD`/`ETAPA` (dos formatos por valor), decidir qué hacer con los códigos griegos.

### Next (bloqueado hasta que caiga un item de "Now")

- [ ] `/spec` — bajar `docs/mvp-layout.md` a `docs/spec.md` (7 bloques). Depende de: kickoff.
- [ ] **Decidir stack** y registrarlo como ADR — depende de: spec + reparto de roles.
- [ ] `/plan` — descomponer el spec en `docs/plan.md` + tickets en `docs/tasks/`. Depende de: spec.
- [ ] Guion del pitch de 2 min — depende de: definir MVP. Munición lista: 27,1% no afiliados / 16 de 16 proyectos incumpliendo 90/10.

### Later (someday / sin scope aún)

- [ ] Decidir si se infiere el mapeo real de los códigos griegos cruzando contra los % del PPT, o si el motor los trata como clusters anónimos.
- [ ] Estrategia de "implementabilidad" (por qué Colsubsidio lo llevaría a producción: CRM Salesforce, canal WhatsApp, cruces inferidos).

### Done

- [x] 2026-07-23 — Contrato migrado a `AGENTS.md` + `CLAUDE.md` como puntero + permission floor en `.claude/settings.json`.
- [x] 2026-07-23 — Scaffold del repo de código (este repo): estructura canónica + reorg de los 6 archivos + data fuera de git.
- [x] 2026-07-23 — Scope macro del MVP cerrado ([`docs/mvp-layout.md`](../mvp-layout.md)).
- [x] 2026-07-23 — Reto elegido: Vivienda ([ADR 0001](../adr/0001-eleccion-reto-vivienda.md)).
- [x] 2026-07-23 — Datos reales analizados (Excel 4.142 compradores, PPT buyer personas, brochures).
