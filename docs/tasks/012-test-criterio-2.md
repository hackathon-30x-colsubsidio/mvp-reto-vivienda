---
id: 012
serves: "criterio de aceptación 2 — cero caja negra (tantos factores visibles como el motor evaluó)"
status: todo
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

## Notas
Depende de 001 y del motor de B. Es la defensa de la restricción no-negociable "cero caja negra" de [`AGENTS.md`](../../AGENTS.md): que un factor quede oculto es exactamente lo que el reto castiga.
