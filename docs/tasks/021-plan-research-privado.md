---
id: 021
serves: "restricción no-negociable de AGENTS.md — la data real de Colsubsidio nunca es pública"
status: todo
---

# 021 — 🔴 Poner plan-research en privado

**Dueño:** Rol 4 (Pitch & Video) — **primero que todo lo demás** · seguridad

## Objetivo
Cortar el sangrado: el repo hermano `plan-research` es **público en GitHub** con los 3 archivos de data real de Colsubsidio commiteados (`hackathon_VIVIENDAv2.xlsx`, `Links brochures .xlsx`, `Buyer Person.pptx`, commit `8bc42eb3`), descargables sin login. Viola la restricción no-negociable de `AGENTS.md`.

## Alcance
- Dentro: poner `plan-research` en **privado** hoy. Si quien toma el rol no tiene permisos, **escalar YA** a quien los tenga.
- Fuera (post-hackathon): reescribir el historial (`git filter-repo`/BFG) para sacar los 3 archivos. Riesgo residual: quien ya lo clonó.

## Done cuando
- [ ] `plan-research` deja de ser accesible sin login.
- [ ] Se avisa al equipo y se actualiza el bullet del leak en [`handoff.md`](../agents/handoff.md).

## Notas
Hallado en el handoff 2026-07-24 09:15 y ratificado en el grilling de scope. No espera al kickoff.
