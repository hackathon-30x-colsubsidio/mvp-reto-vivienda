---
id: 001
serves: "spec §4 — Cómo entra el jurado (3 personajes pre-sembrados); insumo de los 4 criterios de aceptación"
status: todo
---

# 001 — Personajes canónicos del demo

**Dueño:** A (en el scaffold) · **Costura S6** de [`plan.md §3`](../plan.md)

## Objetivo
Que los 3 personajes del demo existan **una sola vez** en el repo, con números exactos, y que A/B/C/D los importen en vez de inventarlos cada uno.

## Alcance
- Dentro: `lib/fixtures/personajes.ts` con los 3 personajes del [spec §4](../spec.md) — afiliado listo, no afiliado listo, lead de nutrición. Cada uno con: `cedula`, `nombre`, `celular`, `fuente`, `proyecto_interes`, afiliación, ciudad, segmento, **rango de ingreso del hogar** y qué debe salir del corte.
- Dentro: los `LeadEvento`, `PerfilConocido` y `Lead` de cada personaje, tipados contra `lib/types.ts`.
- Fuera: las fixtures de `Score` y `LeadCurado` (las derivan B y C desde estos personajes, no al revés).

## Done cuando
- [ ] `lib/fixtures/personajes.ts` existe en `main` y typechequea.
- [ ] Cada personaje tiene ingreso y precio de proyecto tales que el corte da lo que dice su nombre (el de nutrición **falla** el 40%, el no afiliado **pasa**).
- [ ] Las 3 cédulas están anunciadas al grupo: B las siembra en `identidades.json` (ticket 003), C escribe sus explicaciones sobre estos números, D arma sus fixtures desde aquí.
- [ ] Ningún track tiene personajes propios con otros números.

## Notas
Es el primer ticket del repo: bloquea a 003, 004, 011, 012, 013 y 014. Los números se proponen en el scaffold y **el kickoff los ratifica**; si cambian, cambian aquí y sólo aquí.
Cédulas **ficticias** — la data real de Colsubsidio es anónima y no trae cédulas ([spec §6](../spec.md)).
