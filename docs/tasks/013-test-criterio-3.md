---
id: 013
serves: "criterio de aceptación 3 — nadie se descarta (toda salida existe; nutrición siempre con razón y trigger)"
status: todo
---

# 013 — Test del criterio 3

**Dueño:** B

## Objetivo
Garantizar que ningún lead pueda terminar el flujo sin una de las 3 salidas, y que nutrición nunca llegue muda.

## Alcance
- Dentro: test que recorre un set de leads variados (los 3 personajes + casos límite: sin ingreso declarado, sin match de enriquecimiento, ingreso altísimo, ingreso bajísimo) y verifica que **todos** salen con `salida` en `listo | listo_restriccion_cupo | nutricion`.
- Dentro: para toda salida `nutricion`, `regla_fallida` y `trigger_nutricion` no vacíos y el trigger es la inversa de la regla que falló.
- Fuera: la parte manual del criterio (que el botón devuelva al chat) — esa es del ticket 007 y del recorrido 014.

## Done cuando
- [ ] `npm test` verde, sin ningún lead sin salida.
- [ ] Un lead con datos incompletos cae a nutrición con razón legible, no lanza ni devuelve `undefined`.

## Notas
Depende de 001. El [spec §2](../spec.md) es explícito: **el estado "descartado" no existe** — contradice el propósito social del reto.
