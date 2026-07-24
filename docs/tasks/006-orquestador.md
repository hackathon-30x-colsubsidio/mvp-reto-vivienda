---
id: 006
serves: "spec §4 — el flujo de 5 pasos completo; sostiene los criterios de aceptación 2, 3 y 4"
status: done (2026-07-24 — /api/curar en pie, probado contra la Supabase real; falta correr db/migracion-001-puntaje.sql)
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
- [x] Un `Lead` de cada personaje entra por `/api/curar` y sale un `LeadCurado` persistido y visible en `/asesor`. — Verificado contra la base real: fila en `leads` con 7 factores, 3 proyectos y las respuestas completas, más el hilo en `conversaciones`.
- [x] El de nutrición no pasa por el matcher y llega con `regla_fallida` y `trigger_nutricion`. — Cubierto en [`lib/curar.test.ts`](../../lib/curar.test.ts).
- [ ] Corre **en la URL pública de Vercel**, no sólo en localhost (ticket 009). — **Bloqueado hasta correr [`db/migracion-001-puntaje.sql`](../../db/migracion-001-puntaje.sql)**: la base de producción no tiene la columna `puntaje`.

## Cómo quedó

- La lógica vive en [`lib/curar.ts`](../../lib/curar.ts) (puro, testeable sin server) y la ruta queda en HTTP + persistencia.
- **Determinista de punta a punta:** el porqué se redacta con los `valor` de los factores que el motor ya calculó, sin LLM. `/api/explicacion` sigue existiendo para la versión pulida en la ficha; el demo ya no depende de que el modelo esté vivo para cerrar la cadena.
- **Se guarda también el hilo** (tabla `conversaciones`), con filas `sistema` para la ingesta y el consentimiento. Antes no se guardaba ninguna.
- **Sin autorización de datos no se persiste nada** (403). Habeas data, no cortesía.
- **Contra qué proyecto se califica:** el de entrada si existe en el catálogo real; si no, el más económico. Hoy los 3 canónicos caen al fallback porque sus proyectos son inventados ([ticket 001](001-personajes-canonicos.md)).

## Notas
**El `Lead` que entrega el chat ya sirve (2026-07-24).** Trae `ingreso_hogar_mensual` como número —parseado del texto libre, o el punto medio del rango que trajo el enriquecimiento— y `situacion_crediticia` como enum, así que el motor no va a mandar a nutrición a todo el mundo por falta de datos ([spec 02](../specs/02-conversador.md), brechas 1 y 3). **Lo que sigue faltando es `subsidio_monto_mensual`**: nadie lo pregunta, así que al conectar la cadena el subsidio no va a bajar la cuota de nadie. Si el TEAM quiere que lo haga, es una pregunta más en la conversación, no trabajo del orquestador.

**Se hace el viernes, no en la integración del sábado.** Es lo único que prueba que las 4 partes encajan; dejarlo para el final es descubrir el desencaje sin tiempo para arreglarlo.
Depende de 001, 002 y de que existan las superficies de B, C y D aunque sea con datos parciales.
