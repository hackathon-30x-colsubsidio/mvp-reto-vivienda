---
id: 010
serves: "restricción no-negociable 'demo autogestionado' (AGENTS.md) — el jurado recorre el flujo solo, sin nadie que reintente"
status: todo
---

# 010 — Fallback del conversador si Claude falla

**Dueño:** A · Riesgo #1 de [`plan.md §7`](../plan.md)

## Objetivo
Que una caída de la API, un rate limit o un timeout no rompan el demo mientras el jurado lo recorre sin nosotros.

## Alcance
- Dentro: si `/api/chat` falla o no responde, la conversación continúa con el guion pre-escrito del personaje (los guiones ya se redactan como insumo del track A).
- Dentro: lo mismo para `/api/explicacion` — si el experto no responde, la ficha muestra la explicación de referencia de `docs/explicaciones-referencia.md` (lo crea C) para ese personaje.
- Fuera: reintentos sofisticados, cola, cache. Un `try/catch` con el guion al lado alcanza.

## Done cuando
- [ ] Con la `ANTHROPIC_API_KEY` inválida a propósito, los 3 personajes siguen recorriéndose de punta a punta.
- [ ] El fallback no miente: nada en pantalla afirma que la respuesta la generó el modelo cuando no fue así.

## Notas
Aplica sólo a los 3 personajes pre-sembrados. El botón "soy yo" con formulario libre sí depende de la API y puede degradar con un mensaje honesto.
El fallback es seguro barato para un demo asíncrono, no una feature del producto.
