---
id: 007
serves: "criterio de aceptación 3 — nadie se descarta (al pulsar 'simular trigger' el lead vuelve a la conversación)"
status: doing
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

## Estado (2026-07-23, rama `feature/asesor`)

**La mitad de D está hecha.** Falta la de A — y sin ella el criterio 3 NO está verificado, porque solo se verifica de punta a punta.

- [x] Botón "simular trigger" en la ficha de nutrición (`BotonSimularTrigger`).
- [x] `PATCH /api/leads/:leadId` con `{ "accion": "re_enganchar" }` — marca `re_enganchado_en` en la DB. **No cambia `estado`**: el lead sigue siendo de nutrición (ADR 0003), para no meter un cuarto valor en `Score.salida` y romper el contrato compartido.
- [x] Navegación de vuelta al chat en **un solo clic**.
- [x] El re-enganche deja una fila en `conversaciones` con `rol='sistema'` y el **trigger exacto** dentro del mensaje.
- [ ] **A:** leer el query param y redactar la reentrada.

### Contrato con A

```
/?lead_id=<id>&reenganche=1
```

Hoy `app/page.tsx` guarda la conversación en estado de React y **no lee la URL**, así que el clic llega al landing. A necesita: leer `lead_id`, cargar el lead con `GET /api/leads/<id>` (trae el `trigger_nutricion`) y arrancar la conversación retomada.

El motivo no hay que inventarlo: está en el `trigger_nutricion` del lead y en la última fila `rol='sistema'` de su conversación.

## Notas
Depende de 001, del motor de B (produce `trigger_nutricion`) y de la ficha de D. Es la mitad del criterio 3 que ningún prompt de arranque tenía asignada.
