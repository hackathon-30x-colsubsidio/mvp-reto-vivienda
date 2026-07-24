---
id: 021
serves: "restricción no-negociable de AGENTS.md — la data real de Colsubsidio nunca es pública"
status: done
---

# 021 — 🔴 Poner plan-research en privado

**Dueño:** Rol 4 (Pitch & Video) — **primero que todo lo demás** · seguridad

## Objetivo
Cortar el sangrado: el repo hermano `plan-research` es **público en GitHub** con los 3 archivos de data real de Colsubsidio commiteados (`hackathon_VIVIENDAv2.xlsx`, `Links brochures .xlsx`, `Buyer Person.pptx`, commit `8bc42eb3`), descargables sin login. Viola la restricción no-negociable de `AGENTS.md`.

## Alcance
- Dentro: poner `plan-research` en **privado** hoy. Si quien toma el rol no tiene permisos, **escalar YA** a quien los tenga.
- Fuera (post-hackathon): reescribir el historial (`git filter-repo`/BFG) para sacar los 3 archivos. Riesgo residual: quien ya lo clonó.

## Done cuando
- [x] `plan-research` deja de ser accesible sin login. **Hecho 2026-07-24 (Rol 4):** `gh repo edit hackathon-30x-colsubsidio/plan-research --visibility private`. Verificado `isPrivate: true`.
- [x] Se avisa al equipo y se actualiza el bullet del leak en [`handoff.md`](../agents/handoff.md).

## Pendiente (fuera de alcance de este ticket)
Reescribir el historial (`git filter-repo`/BFG) para sacar los 3 archivos del commit `8bc42eb3` — post-hackathon. Riesgo residual: quien ya lo clonó antes del cambio a privado.

## Notas
Hallado en el handoff 2026-07-24 09:15 y ratificado en el grilling de scope. No espera al kickoff.
