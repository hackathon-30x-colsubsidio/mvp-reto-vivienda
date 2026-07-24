---
id: 006
serves: "spec §4 — el flujo de 5 pasos completo; sostiene los criterios de aceptación 2, 3 y 4"
status: todo
---

# 006 — Orquestador `/api/curar`

**Dueño:** A · **Costura S4** de [`plan.md §3`](../plan.md) · **Riesgo #1 del proyecto**

## Objetivo
Que la cadena exista como código de alguien: terminar la conversación dispara score → match → explicación → persistencia, y el lead aparece en la cola del asesor.

## Alcance
- Dentro: `app/api/curar/route.ts` — recibe un `Lead` completo, llama al scoring (B), y si la salida es `listo` o `listo_restriccion_cupo` llama al match y a la explicación (C); si es `nutricion` se salta el match. Persiste vía `/api/leads` (D).
- Dentro: manejo del caso "un paso falla" — el lead se persiste igual con lo que alcanzó a calcularse, nunca se pierde.
- Fuera: la lógica interna de cada paso (es de B, C y D) y la UI.

## Done cuando
- [ ] Un `Lead` de cada personaje entra por `/api/curar` y sale un `LeadCurado` persistido y visible en `/asesor`.
- [ ] El de nutrición no pasa por el matcher y llega con `regla_fallida` y `trigger_nutricion`.
- [ ] Corre **en la URL pública de Vercel**, no sólo en localhost (ticket 009).

## Notas
**Se hace el viernes, no en la integración del sábado.** Es lo único que prueba que las 4 partes encajan; dejarlo para el final es descubrir el desencaje sin tiempo para arreglarlo.
Depende de 001, 002 y de que existan las superficies de B, C y D aunque sea con datos parciales.
