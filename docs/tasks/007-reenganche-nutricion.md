---
id: 007
serves: "criterio de aceptación 3 — nadie se descarta (al pulsar 'simular trigger' el lead vuelve a la conversación)"
status: todo
---

# 007 — Re-enganche del lead en nutrición

**Dueño:** D dispara, A recibe · **Costura S5** de [`plan.md §3`](../plan.md)

## Objetivo
Que el botón "simular trigger" cierre el círculo: el lead vuelve al chat y la conversación reconoce por qué volvió.

## Alcance
- Dentro: D — el botón en la ficha de nutrición, el cambio de estado del lead y la navegación de vuelta al chat con el `lead_id`.
- Dentro: A — el mensaje de reentrada: retoma la conversación citando el trigger que se cumplió ("ya completaste los N meses de afiliación"), sin volver a pedir el consentimiento ni lo ya respondido.
- Fuera: triggers que se disparen solos por tiempo o por un job. En el demo lo dispara el clic ([spec §4](../spec.md)).

## Done cuando
- [ ] Un clic en la ficha del personaje de nutrición lleva al chat con la conversación retomada.
- [ ] El mensaje de reentrada nombra el trigger exacto, no un genérico.
- [ ] El lead no vuelve a pasar por consentimiento ni repite preguntas ya respondidas.

## Notas
Depende de 001, del motor de B (produce `trigger_nutricion`) y de la ficha de D. Es la mitad del criterio 3 que ningún prompt de arranque tenía asignada.
