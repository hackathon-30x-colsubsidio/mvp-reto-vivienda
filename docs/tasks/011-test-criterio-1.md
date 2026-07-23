---
id: 011
serves: "criterio de aceptación 1 — no repreguntar lo conocido (intersección vacía entre campos preguntados y enriquecidos)"
status: todo
---

# 011 — Test del criterio 1

**Dueño:** A

## Objetivo
Convertir el criterio 1 en algo que falle en rojo, no en una promesa del prompt del conversador.

## Alcance
- Dentro: test vitest sobre la lógica adaptativa — dado el `PerfilConocido` del afiliado (que trae ciudad, segmento y rango de ingreso), el set de campos que la conversación va a preguntar **no interseca** con el set de campos que el enriquecimiento devolvió.
- Dentro: el caso inverso — sin match, se pregunta todo el set del [spec §6](../spec.md).
- Fuera: evaluar el tono o la redacción del LLM. Esto testea qué se pregunta, no cómo.

## Done cuando
- [ ] `npm test` verde con ambos casos.
- [ ] El test corre contra el enriquecimiento real (ticket 003), no contra una fixture de perfil.

## Notas
Depende de 001 y 003. La lógica adaptativa tiene que exponer el set de campos a preguntar como dato (no enterrado en el prompt) para que esto sea testeable — eso es parte del diseño, no una concesión al test.
