---
id: 002
serves: "spec §4 — factor 'primera cuota ≤ 40%' + criterio de aceptación 4 (2-3 proyectos que el lead sí puede pagar)"
status: todo
---

# 002 — Cerrar los dos huecos de `lib/types.ts`

**Dueño:** A (es el único que toca `lib/types.ts`) · [`plan.md §8`](../plan.md)

## Objetivo
Que C pueda filtrar proyectos por precio sin reimplementar la regla del 40% ni adivinar el ingreso del lead.

## Alcance
- Dentro: `Score` gana `precio_maximo: number` — el precio máximo cuya primera cuota cabe en el 40% del ingreso declarado del hogar. Lo calcula el motor de B (ticket 004).
- Dentro: `/api/match` recibe `{ lead: Lead; score: Score }`, no sólo `Score` — el matcher necesita `zona_interes` e ingreso, que viven en `Lead`.
- Fuera: cualquier otro cambio a los contratos. Si aparece uno, es otro ticket y otro anuncio al grupo.

## Done cuando
- [ ] `lib/types.ts` actualizado y `npx tsc --noEmit` verde en `main`.
- [ ] Anunciado **una sola vez** al grupo (regla de [`reparto-inicial.md`](../reparto-inicial.md): cambiar `lib/types.ts` se avisa).
- [ ] Las fixtures de `Score` reflejan el campo nuevo.

## Notas
Ratificar en el kickoff antes de implementar: es la alternativa a duplicar el ingreso dentro de `Score`, que dejaría el mismo dato en dos contratos.
Depende de 001 (los personajes dan los números con los que se prueba). Bloquea a 004 y al matcher de C.
