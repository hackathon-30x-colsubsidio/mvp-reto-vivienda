---
id: 019
serves: "spec §7 (panel de impacto opcional) + criterio de impacto del demo"
status: descartado (2026-07-25 noche, decisión de Mani — el pitch NO habla del 27,1% vs 10%, así que la franja pierde su razón de ser. Ver URGENTE)
---

# 019 — Franja de impacto en /asesor

> 🔁 **DESCARTADO el 2026-07-25 (noche), decisión de Mani.** El pitch **no va a hablar del 27,1% vs. el 10%**, y esa comparación era la primera de las tres cifras y la razón de ser de la franja. No se construye.
>
> ⚠️ Lo que esto deja abierto, y que decide Mani: la métrica **"Leads no afiliados"** del tablero (`lib/tablero/metricas.ts`) sigue viva, va marcada `principal: true` y su descripción **es** esa comparación; el encabezado de `/asesor/tablero` también la enuncia. No se tocaron: quitar producto probado necesita una decisión explícita, no una inferencia. El tablero, eso sí, ya estaba fuera del video (decisión 4 del plan del sábado).

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
