---
id: 020
serves: "premio de 1er lugar (implementación con Colsubsidio) + mvp-layout §5 (video)"
status: todo
---

# 020 — Tramo de implementabilidad en el video

**Dueño:** Rol 4 (Pitch & Video) · parte de [015](015-guion-y-video.md) · nace del grilling 2026-07-24

## Objetivo
Demostrar que esto se lleva a producción real, no solo que corre en un demo. El 1er premio incluye implementación con Colsubsidio.

## Alcance
- Dentro: ~30 seg del video con un diagrama simple — "esto corre hoy en Vercel; a producción es WhatsApp Business API + Salesforce (CRM) + el cruce real de afiliados; los puntos de integración ya están aislados (ingesta estándar, IA en 2 endpoints)".
- Dentro: usa lo que **ya es verdad** de la arquitectura ([ADR 0002](../adr/0002-stack-mvp.md)), cero código nuevo.
- Fuera: doc extenso de arquitectura de producción. Es un tramo del pitch, no un anexo.

## Done cuando
- [ ] El diagrama existe y el tramo cabe en el video de 2 min.
- [ ] Nombra los 3 puntos de integración real y por qué el diseño actual los deja listos.

## Notas
Decisión de grilling: "30 seg del video + diagrama (recommended)".
