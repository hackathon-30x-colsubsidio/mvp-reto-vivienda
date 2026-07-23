# Handoff — plan-research (Hackathon Colsubsidio × 30X)

> Memoria de sesión + roadmap. Leer al inicio, actualizar al final.
> El roadmap es un DAG: una tarea está **ready** solo cuando sus dependencias están done.

## Memory

_Estado actual del trabajo. Lo nuevo arriba. Mantener corto; enlazar a ADRs/commits en vez de duplicar._

- 2026-07-23 — **Dashboard del equipo creado y desplegado:** [`docs/index.html`](index.html) (single-file, sin dependencias externas), réplica del artifact original de Claude (contenido documentado en [`contexto-artifact-original.md`](../contexto-artifact-original.md)) con las 7 pestañas A1–A7, checklist de las 26 tareas de `plan/PLAN.md` con progreso persistido en `localStorage`, countdown en vivo al cierre y campos para pegar los 3 links de entrega. **En vivo:** https://docs-phi-puce.vercel.app (proyecto Vercel `alejandros-proyects/docs`, deployado por CLI desde `docs/`, no conectado a Git todavía). **Para actualizar tras un cambio:** correr `vercel --prod --yes` dentro de `docs/`. El checklist/links son por navegador (no sincronizan entre personas); el contenido (datos, roadmap, decisiones) sí se comparte apenas se redeploya. **Pendiente si se quiere auto-deploy en cada push:** conectar el repo de GitHub al proyecto de Vercel (vercel.link/git) en vez de deployar por CLI.
- 2026-07-23 — Llegaron los **datos reales del reto Vivienda** en [`docs/recursos-reto/`](../../docs/recursos-reto/) (Excel `hackathon_VIVIENDAv2.xlsx` con 4.142 compradores, PPT de buyer personas, links de brochures/360). **Hallazgo clave que valida el reto:** 27,1% de los compradores históricos NO son afiliados (vs. 10% que permite la regla 90/10), y de los 16 proyectos con ubicación conocida, **los 16 incumplen el límite** (15,9%–63,1%). El Excel real no coincide con lo que promete el brief: no hay columna "afiliado" explícita (se infiere de `PERIODO_AFILIADO` vacío/lleno), `VLR_VIVIENDA` trae 4 ceros de más (÷10.000 para el precio real), y `SEGMENTO_POBLACIONAL`/`CATEGORIA`/`PIRAMIDE_NUEVA` vienen anonimizados con letras griegas en vez de las categorías Básico/Medio/Alto/Joven o top/micro/estándar. Detalle completo + tabla de riesgo por proyecto volcado en el dashboard HTML del equipo (artifact, no versionado en el repo).
- 2026-07-23 — **Scope macro del MVP definido** (grill de Mani + Claude). 8 decisiones cerradas (demo = viaje completo con clímax en asesor, WhatsApp simulado + disclaimer, nutrición demostrada con triggers condicionales, scoring de reglas transparentes + similitud + LLM explica, conversación adaptativa, bot agenda visita, no-afiliado sigue el flujo hacia DB central, workflow orquestado con IA puntual) y las abiertas marcadas para el equipo/mentores. Todo en [`plan/mvp-layout.md`](../../plan/mvp-layout.md) — incluye mermaid strawman a curar en kickoff. **Siguiente:** kickoff (frase de apuesta + curar mermaid + resolver abiertas) → `spec.md`.
- 2026-07-23 — **RETO ELEGIDO: Vivienda** (perfilamiento inteligente de leads). Registrado en [`ADR 0001`](../adr/0001-eleccion-reto-vivienda.md). Barrido completo del repo y **adaptación a Vivienda**: `CLAUDE.md`, `URGENTE-Y-NOTICIAS.md`, `plan/PLAN.md` (retitulado + ejemplos de dominio re-apuntados) y `README.md` (marcado reto + rutas rotas corregidas). Los otros 3 retos quedan como referencia en `sources/retos/`. **Siguiente:** kickoff para cerrar la frase de apuesta + `spec.md` (Día 1 del plan).
- 2026-07-22 — Agregados los **recursos oficiales por reto** en [`sources/retos/`](../../sources/retos/) (brief del reto + doc "cómo usar los recursos"). Insumos ya confirmados por reto (ver más abajo). Glosario nuevo volcado en [`context.md`](context.md). **Delta importante:** el reto **Crédito NO entrega base de datos** — el input es una cédula y hay que scrapear variables exógenas (email, redes, créditos externos); es el reto de mayor riesgo de ejecución (scraping de PII, base frágil para demo).
- 2026-07-22 — Bajada la página oficial (innovacion.colsubsidio.com). Fechas confirmadas **22–26 jul 2026**; equipos 3–5; premios podio de 3 ($10M/$6M/$3M COP + Copilot + implementación). ⚠️ Discrepancia de premios entre ceremonia (por reto, no monetario) y sitio (podio monetario) — confirmar por WhatsApp. Cronograma de explicación de retos: mié 22, 2:00–4:00pm.
- 2026-07-22 — Scaffold del repo. Es research/plan, el código del MVP irá en repo aparte. Reto **aún sin elegir**. Faltan los 4 docs detallados de reto + datos anonimizados que sube Colsubsidio.
- Contexto de la hackathon, retos, reglas y criterios: ver [`CLAUDE.md`](../../CLAUDE.md). Material crudo en [`sources/`](../../sources/).

## Roadmap

### Now (ready — sin dependencias pendientes)

- [ ] Limpiar el Excel real (`hackathon_VIVIENDAv2.xlsx`) antes de construir el motor de scoring: `VLR_VIVIENDA` ÷10.000, normalizar `RANGO_EDAD`/`ETAPA` (dos formatos para el mismo valor), decidir qué hacer con los códigos griegos de `SEGMENTO_POBLACIONAL`/`CATEGORIA`/`PIRAMIDE_NUEVA`.
- [ ] **Definir el MVP mínimo de Vivienda** (qué demuestra en 2 min, qué NO entra) — frase de apuesta + `spec.md` de 7 bloques. Es el Día 1 del `plan/PLAN.md`. **Avance: el scope macro ya está cerrado en [`plan/mvp-layout.md`](../../plan/mvp-layout.md)** (8 decisiones + abiertas marcadas); falta el kickoff para cerrar frase de apuesta, curar el mermaid y resolver las abiertas (esquema DB, vista asesor, entrada demo, métricas de scoring). Preguntas nuevas para mentores/WhatsApp: convergencia multi-canal→WhatsApp y qué info se conoce del lead entrante.
  - Insumos, todos ya en `docs/recursos-reto/`: buyer personas por proyecto (PPT) + Excel 4.142 compradores + links de brochure/360. Canal declarado: WhatsApp. Regla 90/10 como gancho — ya validada con datos reales (27,1% no afiliados global, 16 de 16 proyectos incumpliendo el límite).
  - Constante clave: **la explicación pesa tanto como la recomendación** — el diferenciador es el "porqué" en lenguaje natural (por qué este proyecto para este lead), no el modelo.

### Next (bloqueado hasta que caiga un item de "Now")

- [ ] Decidir stack + crear el repo público del MVP (después del inicio del evento) — depende de: definir MVP.
- [ ] Guion del pitch de 2 min (problema → solución → demo → impacto) — depende de: definir MVP. Ya hay munición de impacto lista: 27,1% no afiliados / 16 de 16 proyectos incumpliendo 90/10.

### Later (someday / sin scope aún)

- [ ] Decidir si se intenta inferir el mapeo real de los códigos griegos (SEGMENTO_POBLACIONAL/CATEGORIA/PIRAMIDE_NUEVA) cruzando contra los % del PPT de buyer personas, o si el motor los trata como clusters anónimos.
- [ ] Estrategia de "implementabilidad" (por qué Colsubsidio podría llevarlo a producción: CRM Salesforce, canal WhatsApp, cruces inferidos).

### Done

- [x] 2026-07-23 — **Elegido el reto: Vivienda** (ADR 0001). Repo barrido y adaptado al reto.
- [x] 2026-07-23 — Recursos reales del reto Vivienda recibidos y analizados (Excel 4.142 compradores, PPT buyer personas, links de brochures/360). Ver Memory arriba.
- [x] 2026-07-22 — Bajada e integrada la info del sitio oficial (fechas 2026, premios, cronograma, contacto).
- [x] 2026-07-22 — Repo scaffolded (CLAUDE.md, docs/agents, docs/adr, README).
