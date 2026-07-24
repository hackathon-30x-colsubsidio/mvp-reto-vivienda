# Tracks del equipo

Contexto breve de qué hace cada prompt (`prompt-a.md`–`prompt-d.md`). Detalle completo y contratos en [`../reparto-inicial.md`](../reparto-inicial.md).

| Track | Nombre | Qué construye |
|---|---|---|
| **A** | Conversación & entrada | El scaffold de Next.js (desbloquea a todos) + el chat estilo WhatsApp: landing con los 3 personajes del demo, conversación adaptativa que pregunta solo lo que falta, conectada a Claude en streaming. Su output es un `Lead`. |
| **B** | Scoring & datos | Limpia el Excel real y genera la data sintética (`data/sintetica/`: identidades, proyectos, distribuciones) — punto de sincronización del equipo. Construye el motor de scoring en TS puro (reglas, sin LLM): afiliación 90/10, tope de cuota ≤40%, subsidio, similitud. Su output es un `Score`. |
| **C** | Matching & explicación | Dado el `Score` de B, recomienda 2-3 proyectos del catálogo (reglas) y redacta el porqué en lenguaje natural con el "experto en vivienda" (LLM, grounded, nunca inventa datos). Su output es `LeadCurado` sin cita. |
| **D** | Vista asesor, DB & nutrición | Diseña el esquema de Supabase (leads, conversaciones, citas) y construye `/asesor`: la cola priorizada + la ficha del lead (score desglosado, explicación, proyectos, cita) — el clímax del demo. Incluye el botón "simular trigger" de nutrición. |

Todos consumen los contratos de `lib/types.ts` por fixture, no el código de los demás — se integra el sábado.

## Lo que los tracks NO cubren

El reparto asignó las cajas del workflow, no las flechas entre ellas. Las **costuras** (enriquecimiento real, la regla del 40% compartida, el agendador, el orquestador, el re-enganche de nutrición, los personajes canónicos, el shell del demo, el deploy verificado, el video) y los **tests de los criterios de aceptación** viven en [`../plan.md §3`](../plan.md) y están ticketeados en [`../tasks/`](../tasks/README.md). Cada prompt de arranque lista los tickets de su track.

**Ramas:** la convención es `feature/{conversacion,scoring,matching,asesor}`. Hoy conviven además `Track-B` y `mani-TrackC`; consolidar antes del primer merge.
