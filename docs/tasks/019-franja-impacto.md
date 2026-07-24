---
id: 019
serves: "spec §7 (panel de impacto opcional) + criterio de impacto del demo"
status: todo
---

# 019 — Franja de impacto en /asesor

**Dueño:** Rol 2 (Datos & Motor) · **timebox medio día** · nace del grilling 2026-07-24

## Objetivo
Poner la munición ya validada delante del jurado sin narración: no un dashboard, una **franja de 3 cifras** arriba de `/asesor`.

## Alcance
- Dentro: 3 cifras calculadas del Excel/leads — (1) **27,1%** de compradores históricos no afiliados vs. 10% permitido, (2) horas comerciales ahorradas (estimación con supuesto explícito), (3) alerta 90/10 por proyecto (proyectos que ya exceden el cupo).
- Dentro: se lee como franja estática, no como superficie propia (spec §2: no dashboard analítico).
- Fuera: cohortes, funnel, CPL interactivo. Si el timebox se pasa, **se corta** — no bloquea la integración.

## Done cuando
- [ ] Las 3 cifras salen de datos reales/derivados, cada una con su fuente.
- [ ] La franja se ve en `/asesor` y respeta dark mode.

## Notas
Decisión de grilling: "entra como franja (recommended)", timeboxed. Es lo primero que se corta si el sábado aprieta.
