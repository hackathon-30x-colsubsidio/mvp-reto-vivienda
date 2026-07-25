---
id: 004
serves: "spec §4 — 'primera cuota estimada ≤ 40% del ingreso del hogar' (Decreto 583 de 2025), tope regulatorio duro"
status: done (2026-07-24 — `lib/scoring/capacidad.ts::precioMaximoDe` es la única aritmética; la consumen `curar()`, `/api/match` y `/api/explicacion`, y hay test del borde 39/41%)
---

# 004 — La regla del 40% como función compartida

**Dueño:** B exporta, C importa · **Costura S2** de [`plan.md §3`](../plan.md)

## Objetivo
Que exista **una sola** implementación del tope del 40% en el repo, y que el matcher de C la use en vez de reimplementarla.

## Alcance
- Dentro: `lib/scoring/capacidad.ts` con `cuotaEstimada(precio, ingreso)` y `precioMaximo(ingreso)` (el inverso: el precio más alto cuya primera cuota cabe en el 40%).
- Dentro: los supuestos del cálculo de la primera cuota (plazo, tasa, cuota inicial) **en un solo objeto de config con su fundamento comentado** — el kickoff los ratifica.
- Dentro: `Score.precio_maximo` lo llena esta función (ticket 002).
- Fuera: el resto de factores del score y la elección de proyectos.

## Done cuando
- [ ] `npm test` verde con el caso borde: 39% del ingreso pasa, 41% no pasa.
- [x] `precioMaximo(ingreso)` y `cuotaEstimada(precio, ingreso)` son consistentes entre sí (property test o caso ida y vuelta). — [`lib/scoring/capacidad.ts`](../../lib/scoring/capacidad.ts) + su test en [`lib/curar.test.ts`](../../lib/curar.test.ts): en el precio máximo la cuota da exactamente el tope del 40%. **Ojo con la firma:** quedó `precioMaximoDe(lead)` y `cuotaEstimada(precio)`, no `(ingreso)` — el subsidio también entra en la cuenta.
- [ ] C importa la función y **no** tiene su propia versión del 40%.
- [ ] El output cita "Decreto 583 de 2025" para que la explicación de C lo pueda repetir textual.

## Notas
El 40% es **normativa vigente**, no heurística: [Decreto 583 de 2025](https://minvivienda.gov.co/normativa/decreto-0583-2025) modificó el art. 2.1.11.1 del Decreto 1077 de 2015 ([spec §4](../spec.md)). Si la cuota lo supera, el banco legalmente no puede prestar.
Depende de 002. Bloquea el matcher de C.
