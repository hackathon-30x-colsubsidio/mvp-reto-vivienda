# Handoff — mvp-reto-vivienda (Hackathon Colsubsidio × 30X)

> Memoria de sesión + roadmap del **build**. Leer al inicio, actualizar al final.
> El roadmap es un DAG: una tarea está **ready** solo cuando sus dependencias están done.
> **Este repo es el canon de los docs vivos** (este handoff + `docs/URGENTE-Y-NOTICIAS.md`).
> Repo hermano `plan-research` = archivo histórico de investigación y datos crudos.

## Memory

_Estado actual del trabajo. Lo nuevo arriba. Mantener corto; enlazar a ADRs/commits en vez de duplicar._

- 2026-07-23 — **STACK DECIDIDO: Next.js + Vercel + Supabase + API de Claude** — [ADR 0002](../adr/0002-stack-mvp.md). Reglas duras: monolito Next.js con API routes (un solo deploy, auto-deploy al pushear a `main`); datos estáticos como JSON en `data/sintetica/` generados por Python **offline** en `scripts/` (Python nunca en producción); Supabase solo para lo que muta (leads/conversaciones/citas); IA solo en `/api/chat` y `/api/explicacion` con `claude-opus-4-8` en **streaming obligatorio** (primer token < 2s); el scoring es TS puro sin LLM; API key solo server-side (el repo es público); contratos entre tracks (`Lead`/`Score`/`LeadCurado`) en `lib/types.ts`. Con esto quedaron llenados los 3 feedback loops y los TODOs de arquitectura/performance/escala en [`AGENTS.md`](../../AGENTS.md), y cerrados los supuestos "Stack" y "Performance" del [spec §7](../spec.md). **Siguiente:** scaffold de Next.js + `/plan`.
- 2026-07-23 — **[`docs/spec.md`](../spec.md) escrito** (entrevista `/spec`, 7 bloques). Cierra las abiertas del layout: **3 salidas del corte** (listo / listo-con-restricción-de-cupo / nutrición, con el 90/10 como marca), **entrada del demo** = 3 personajes pre-sembrados + "soy yo", **vista del asesor** = cola + detalle (panel de impacto opcional si sobra tiempo), **ingesta simulada** con lead-evento de esquema estándar, **cédula** como llave del enriquecimiento, **consentimiento habeas data** registrado en el primer mensaje, **agendador** con slots simulados, **triggers de nutrición** = inversa de la regla que falló. **4 criterios de aceptación** (uno por tramo del demo). Hallazgo duro: el **40% cuota/ingreso es normativa vigente**, no heurística ([Decreto 583 de 2025](https://minvivienda.gov.co/normativa/decreto-0583-2025), que subió el techo desde el 30% del Decreto 145 de 2000) — se cita textual en la explicación al asesor. Catálogo confirmado: **18 proyectos** (unión de las 2 hojas de `Links brochures .xlsx`; 16 con brochure, 17 con 360), y `VIBO ONCE`/`KARAKALI` traen ubicación contradictoria entre hojas.
- 2026-07-23 — **Contrato migrado a [`AGENTS.md`](../../AGENTS.md)** (re-corrida de `/scaffold` tras su refactor). `AGENTS.md` es ahora el contrato canónico **tool-neutral** — quien use Codex/Cursor/Gemini lee la misma fuente de verdad — y `CLAUDE.md` quedó como puntero delgado con `@AGENTS.md`. Nuevo ahí: la **constitución** de 4 restricciones no-negociables (cero caja negra · demo autogestionado · data de Colsubsidio nunca al repo público · deadline 26 jul 11:30 a.m.), la tabla de **Contratos** (fila datos/privacidad, enforced por `.gitignore`) y los 3 **feedback loops en `TODO`**. Añadido `.claude/settings.json` con permission floor (deny `rm -rf`, `push --force`, `reset --hard`, `clean -fd`); `settings.local.json` sigue ignorado. **Acción para quien elija el stack: llenar los 3 feedback loops de `AGENTS.md` de una vez.**
- 2026-07-23 — **Scaffold de este repo de código.** Estructura canónica montada: `CLAUDE.md`, `README.md`, `.gitignore`, `docs/agents/{context,handoff}.md`, `docs/adr/{0000,0001}`, `docs/reto/` (brief + doc de insumos), `docs/mvp-layout.md`, `docs/plan-hackathon.md`, `docs/URGENTE-Y-NOTICIAS.md`. Los 6 archivos del brainstorm inicial se reorganizaron desde la raíz y se les arreglaron las rutas. **Data real** (`hackathon_VIVIENDAv2.xlsx`, `Buyer Person.pptx`, `Links brochures .xlsx`) movida a `docs/recursos-reto/` y **excluida de git** (repo público, data de Colsubsidio). Sin código de app todavía: el stack se decide en el kickoff. **Siguiente:** kickoff → `/spec`.
- 2026-07-23 — **Scope macro del MVP definido** (grill de Mani + Claude). 8 decisiones cerradas (demo = viaje completo con clímax en asesor, WhatsApp simulado + disclaimer, nutrición con triggers condicionales, scoring de reglas transparentes + similitud + LLM explica, conversación adaptativa, bot agenda visita, no-afiliado sigue el flujo hacia DB central, workflow orquestado con IA puntual) y las abiertas marcadas. Todo en [`docs/mvp-layout.md`](../mvp-layout.md) — incluye mermaid strawman a curar en kickoff.
- 2026-07-23 — **Datos reales del reto analizados** (viven en `docs/recursos-reto/` local y en `plan-research`). **Munición de impacto:** 27,1% de los compradores históricos NO son afiliados (vs. 10% de la regla 90/10); los 16 proyectos con ubicación conocida incumplen el límite (15,9%–63,1%). **Realidades del Excel:** no hay columna "afiliado" (se infiere de `PERIODO_AFILIADO`), `VLR_VIVIENDA` trae 4 ceros de más (÷10.000), y `SEGMENTO_POBLACIONAL`/`CATEGORIA`/`PIRAMIDE_NUEVA` vienen con letras griegas. Detalle en el dashboard del equipo (artifact en `plan-research`, no versionado). Canal medido (`MEDIO`): 43,4% de compras vienen de señalización física, solo 8,3% de canales digitales.
- 2026-07-23 — **RETO ELEGIDO: Vivienda** (perfilamiento inteligente de leads). [`ADR 0001`](../adr/0001-eleccion-reto-vivienda.md). No se re-litiga.
- Contexto de la hackathon, retos, reglas y criterios: ver [`CLAUDE.md`](../../CLAUDE.md) y el repo `plan-research`.

## Roadmap

### Now (ready — sin dependencias pendientes)

- [ ] **Kickoff con todo el equipo** — ahora arranca del [`spec.md`](../spec.md), no del layout. Ratificar la frase de apuesta y resolver los supuestos marcados "decidir en el kickoff": umbral del corte y peso de cada factor, reglas concretas de subsidio, trigger de nutrición con plazo estimado vs flow de revisión periódica, y si el panel de impacto entra. Es el Día 1 del [`docs/plan-hackathon.md`](../plan-hackathon.md).
- [ ] **Scaffold de Next.js** según [ADR 0002](../adr/0002-stack-mvp.md): `create-next-app` (TypeScript, App Router), `lib/types.ts` con los 3 contratos, `.env.example`, conectar el repo a Vercel, crear el proyecto de Supabase. Al terminar, verificar que los 3 feedback loops de [`AGENTS.md`](../../AGENTS.md) corren.
- [ ] Limpiar el Excel real antes del motor de scoring: `VLR_VIVIENDA` ÷10.000, normalizar `RANGO_EDAD`/`ETAPA` (dos formatos por valor), decidir qué hacer con los códigos griegos, y resolver la ubicación contradictoria de `VIBO ONCE`/`KARAKALI` entre las hojas del xlsx de brochures.
- [ ] Preguntar a mentores lo que el spec dejó abierto hacia afuera: ¿un lead form de pauta puede pedir cédula?, ¿qué sabe Colsubsidio de un lead que llega por pauta?, convergencia multi-canal, cruces Ministerio/buró.

### Next (bloqueado hasta que caiga un item de "Now")

- [ ] `/plan` — descomponer el spec en `docs/plan.md` + tickets en `docs/tasks/`. Depende de: kickoff (para no planear sobre supuestos que el equipo va a mover).
- [ ] Guion del pitch de 2 min — depende de: definir MVP. Munición lista: 27,1% no afiliados / 16 de 16 proyectos incumpliendo 90/10.

### Later (someday / sin scope aún)

- [ ] Decidir si se infiere el mapeo real de los códigos griegos cruzando contra los % del PPT, o si el motor los trata como clusters anónimos.
- [ ] Estrategia de "implementabilidad" (por qué Colsubsidio lo llevaría a producción: CRM Salesforce, canal WhatsApp, cruces inferidos).

### Done

- [x] 2026-07-23 — **Stack decidido y documentado** ([ADR 0002](../adr/0002-stack-mvp.md)): Next.js + Vercel + Supabase + Claude. Feedback loops y TODOs de `AGENTS.md` llenados.
- [x] 2026-07-23 — [`docs/spec.md`](../spec.md) escrito (7 bloques, 4 criterios de aceptación, 12 supuestos por validar).
- [x] 2026-07-23 — Contrato migrado a `AGENTS.md` + `CLAUDE.md` como puntero + permission floor en `.claude/settings.json`.
- [x] 2026-07-23 — Scaffold del repo de código (este repo): estructura canónica + reorg de los 6 archivos + data fuera de git.
- [x] 2026-07-23 — Scope macro del MVP cerrado ([`docs/mvp-layout.md`](../mvp-layout.md)).
- [x] 2026-07-23 — Reto elegido: Vivienda ([ADR 0001](../adr/0001-eleccion-reto-vivienda.md)).
- [x] 2026-07-23 — Datos reales analizados (Excel 4.142 compradores, PPT buyer personas, brochures).
