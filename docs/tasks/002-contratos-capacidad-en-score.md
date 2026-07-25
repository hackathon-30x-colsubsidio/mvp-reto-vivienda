---
id: 002
serves: "spec §4 — factor 'primera cuota ≤ 40%' + criterio de aceptación 4 (2-3 proyectos que el lead sí puede pagar)"
status: done (2026-07-24 — resuelto, pero no como estaba escrito: ver "Cómo terminó")
---

# 002 — Cerrar los dos huecos de `lib/types.ts`

**Dueño:** A (es el único que toca `lib/types.ts`) · [`plan.md §8`](../plan.md)

## Cómo terminó (2026-07-24, anotado el 2026-07-25)

De las dos propuestas, **una se implementó y la otra se descartó**. El ticket se cierra diciéndolo, porque el descarte es la parte que nadie había escrito en ningún lado:

- ✅ **`/api/match` recibe `{ lead, score }`.** Implementado en [`app/api/match/route.ts`](../../app/api/match/route.ts).
- ❌ **`Score.precio_maximo` NO existe y no va a existir.** El campo habría congelado dentro del `Score` un número derivado, obligando a recalcularlo cada vez que cambiara el ingreso. En su lugar hay una **función**: [`precioMaximoDe(lead)`](../../lib/scoring/capacidad.ts), el gate del 40% despejado al revés, con test de que en ese precio la cuota da exactamente 40%. La consumen `curar()`, `/api/match` y `/api/explicacion` — o sea el objetivo del ticket (que nadie reimplemente la regla del 40%) se cumplió por otra vía. Es el ticket [004](004-capacidad-compartida.md).

## Objetivo (original)
Que C pueda filtrar proyectos por precio sin reimplementar la regla del 40% ni adivinar el ingreso del lead.

## Alcance (original)
- Dentro: `Score` gana `precio_maximo: number` — el precio máximo cuya primera cuota cabe en el 40% del ingreso declarado del hogar. Lo calcula el motor de B (ticket 004).
- Dentro: `/api/match` recibe `{ lead: Lead; score: Score }`, no sólo `Score` — el matcher necesita `zona_interes` e ingreso, que viven en `Lead`.
- Fuera: cualquier otro cambio a los contratos. Si aparece uno, es otro ticket y otro anuncio al grupo.
