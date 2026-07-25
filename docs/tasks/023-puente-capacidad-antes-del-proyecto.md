---
id: 023
serves: "criterio de aceptación 4 (el lead listo llega cerrable) + criterio 3 (nadie se descarta) + brief:22 (recomienda proyectos acordes al perfil)"
status: done (2026-07-25 noche — `referenciaParaCalificar()` en `lib/curar.ts`; medido en el navegador: un lead que entra por ARAUCARIA con $4.000.000 pasa de `nutricion` sin proyectos a `listo_restriccion_cupo` con LA MACARENA y cita agendada. Los 3 canónicos no se movieron: 73/24/0)
---

# 023 — 🔴 El puente: capacidad primero, proyecto después

**Dueño:** Datos & Motor (P2) · rama **`feat/023-puente-capacidad`** · **~1 hora** · nace de la [discusión de workflow 2026-07-25](../agents/discusion-workflow-2026-07-25.md) §2.1

> **Es el primero que entra a `main`** ([reglas de merge](../agents/plan-sabado-25.md)): cambia salidas del motor, así que P4 no graba y P1 no cierra el recorrido hasta que esté mergeado. Al mergear, P1 vuelve a correr el seed en Supabase.

## El defecto

`curar()` califica contra **un solo** proyecto: el de entrada, o el más económico si no hay. Si ese proyecto se pasa del 40%, la salida es `nutricion` y `matchear` devuelve vacío. **El resto del catálogo no se mira**, aunque le quepa.

Medido el 2026-07-25 con un lead de ingreso $4.000.000 (sin vivienda, crédito al día, Bogotá):

| Entrada | Salida | Puntaje | Proyectos |
|---|---|---|---|
| sin proyecto de interés | `listo_restriccion_cupo` | 65 | LA MACARENA, MONGUI, LA ARBOLEDA |
| eligió ARAUCARIA ($619.800.000) | `nutricion` | 0 | ninguno |

Su techo es $266.666.666 y **13 de los 18 proyectos le caben**. Cae a nutrición por la vivienda que miró, no por su capacidad. Y desde que el "soy yo" elige el proyecto de una lista con los 18 y sus precios, **el jurado lo reproduce en el primer intento**.

Es también lo que el equipo diseñó en voz alta en la sala: *"si no cumple el 40%, pasa al motor uno"*.

## Alcance

- Dentro: en [`lib/curar.ts`](../../lib/curar.ts), calcular `precioMaximoDe(lead)` **antes** de elegir el proyecto de referencia (es el 40% "factorizado arriba" que pedía la sala; la función ya existe en [`lib/scoring/capacidad.ts`](../../lib/scoring/capacidad.ts)).
- Dentro: si el proyecto de interés se pasa del techo **pero al menos uno del catálogo cabe**, recalificar contra el mejor que cabe y salir `listo` / `listo_restriccion_cupo`.
- Dentro: la ficha tiene que **decirlo**, no cambiar de proyecto en silencio: *"el proyecto que miró se le va del tope (93% del ingreso); estos otros sí le caben"*. Un cambio de referencia invisible es caja negra ([`AGENTS.md`](../../AGENTS.md)).
- Dentro: si **nada** del catálogo cabe, sigue siendo `nutricion` con su trigger. Con esto nutrición pasa a significar lo que debería: *no le cabe nada de lo que vendemos*.
- Fuera: tocar el orden del ranking de `matchear` (spec [04 D2](../specs/04-match-agenda.md)), los pesos, y la redacción del trigger.

## Done cuando

- [ ] El caso ARAUCARIA + $4.000.000 devuelve proyectos y sale `listo_restriccion_cupo`, no `nutricion`.
- [ ] La ficha muestra por qué la calificación no se hizo contra el proyecto de entrada.
- [ ] Un lead sin ningún proyecto asequible sigue cayendo a `nutricion` con razón y trigger.
- [ ] `npm test` verde y `npx tsx scripts/generar-seed.ts` corrido (el test `seed-espejo` avisa si quedó viejo).

## Notas

**Los 3 personajes no se mueven, verificado a mano antes de escribir el ticket:** Diana y Carlos ya pasan el gate; **Yuliana sigue en nutrición legítimamente** porque su techo es $100.000.000 y el proyecto más barato del catálogo (LA MACARENA) cuesta $149.702.400. El demo no se rompe y el tercer camino se conserva.

Es el argumento más fuerte del pitch que hoy no se puede hacer: el lead **no se castiga por haber mirado la vivienda equivocada**.
