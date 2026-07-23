---
id: 012
serves: "criterio de aceptación 2 — cero caja negra (tantos factores visibles como el motor evaluó)"
status: doing
---

# 012 — Test del criterio 2

**Dueño:** B (el conteo) + D (el render)

## Objetivo
Que sea imposible que el motor evalúe un factor que la ficha del asesor no muestre.

## Alcance
- Dentro: test que compara `score.factores.length` con el número de factores renderizados en la ficha de `/asesor`, para los 3 personajes.
- Dentro: test de que cada `FactorScore` renderizado muestra `nombre`, `valor`, `cumple` y `fuente` — ninguno se muestra a medias.
- Fuera: evaluar la calidad de la explicación en lenguaje natural eso lo gobierna el estándar escrito a mano en `docs/explicaciones-referencia.md`, que crea C, no un test automático.

## Done cuando
- [ ] `npm test` verde para los 3 personajes.
- [ ] Agregar un factor nuevo al motor sin tocar la ficha **rompe** el test.

## Estado (2026-07-23, rama `feature/asesor`)

**Escrito y verde** en `app/asesor/_components/TablaFactores.test.tsx`, contra los 3 personajes de `lib/fixtures/` (ticket 001). Queda `doing` hasta que el motor real de B reemplace a las fixtures.

- [x] Un factor renderizado por cada uno del `score` — los 3 personajes.
- [x] Cada fila muestra los **cuatro** campos de `FactorScore`: nombre, valor, cumple y fuente.
- [x] Los factores que **no cumplen** se muestran igual (no se filtran los malos).
- [x] **Agregar un factor al motor sin tocar la ficha ROMPE el test.**
- [ ] **B:** cuando el motor real produzca los factores, correr `npm test` y confirmar que sigue verde.

### Cómo rompe (lo que pedía el "done cuando")

El `.map()` de la tabla haría que un factor nuevo apareciera solo — bien para "cero caja negra", pero saldría con su nombre técnico crudo (`estabilidad_laboral`) delante del jurado. Por eso el test compara los nombres que produce el motor contra `ETIQUETA_FACTOR` de `TablaFactores.tsx` y falla si alguno no tiene etiqueta legible:

```
Factores nuevos sin etiqueta en la ficha: estabilidad_laboral.
Agrégalos a ETIQUETA_FACTOR en TablaFactores.tsx (ticket 012).
```

Verificado inyectando un factor en `lib/fixtures/scores.ts`: el test falla con ese mensaje y vuelve a verde al revertirlo. **Si el test te trae hasta acá: agrega la etiqueta, no borres el test.**

## Notas
Depende de 001 y del motor de B. Es la defensa de la restricción no-negociable "cero caja negra" de [`AGENTS.md`](../../AGENTS.md): que un factor quede oculto es exactamente lo que el reto castiga.
