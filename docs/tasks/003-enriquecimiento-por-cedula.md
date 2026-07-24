---
id: 003
serves: "spec §4 paso 2 (se enriquece antes de hablar) + criterio de aceptación 1 (no repreguntar lo conocido)"
status: todo
---

# 003 — Enriquecimiento real: cédula → `PerfilConocido`

**Dueño:** B (es dueño de `identidades.json`) · **Costura S1** de [`plan.md §3`](../plan.md)

## Objetivo
Que exista la función que convierte una cédula en lo que Colsubsidio "ya sabe", para que A deje de consumir el perfil por fixture.

## Alcance
- Dentro: `lib/enriquecimiento.ts` con `enriquecer(cedula: string): PerfilConocido`. Lee `data/sintetica/identidades.json`. Sin match devuelve `{ match: false }` y nada más.
- Dentro: las 3 cédulas del ticket 001 sembradas en `identidades.json` con los valores que el demo necesita.
- Fuera: la lógica de qué preguntar (eso es de A) y el endpoint HTTP (el enriquecimiento corre server-side dentro del flujo, no es una superficie propia).

## Done cuando
- [ ] `enriquecer()` devuelve el perfil correcto para las 3 cédulas de los personajes.
- [ ] Una cédula que no existe devuelve `match: false` sin lanzar.
- [ ] Test vitest de ambos casos.
- [ ] A avisado: puede reemplazar su fixture de `PerfilConocido`.

## Notas
Depende de 001. Bloquea a 011 (el test del criterio 1 no se puede escribir contra una fixture).
Las cédulas son **ficticias**: la data real de Colsubsidio es anónima y no trae cédulas ([spec §6](../spec.md)).
