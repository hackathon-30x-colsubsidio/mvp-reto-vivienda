---
id: 025
serves: "spec 06 D3 (las métricas del mentor) — las dos que ya se pueden calcular"
status: todo
---

# 025 — 🟡 Las dos métricas del mentor que ya se pueden calcular

**Dueño:** Datos & Motor (P2) · **~30 min, solo si 023 y 024 están verdes** · nace de la [discusión de workflow 2026-07-25](../agents/discusion-workflow-2026-07-25.md) §2.4

## Por qué

De las 5 métricas que el mentor dijo no tener ([charla-mentor.md#metricas](../reto/charla-mentor.md)), el tablero hoy calcula **cero**. Tres son imposibles sin cambiar el contrato (exigen persistir el lead desde que autoriza, no desde que termina) y eso está declarado fuera de alcance. **Las otras dos ya tienen su dato guardado en cada lead** y solo hace falta agregarlo.

Es la forma más barata de que el mentor oiga su propio vocabulario cuando pregunte por el tablero.

## Alcance

- Dentro: **proyecto con más interacción** — conteo de `proyecto_interes` sobre los leads. Es la #4 de su lista, y spec [06 D3](../specs/06-dashboard-asesor.md) ya la marca como "se puede ya".
- Dentro: **canal de ingreso** — reparto por `fuente`. Es la #5 **en grueso**, y hay que decirlo así: él pidió atribución con campaña y QR (spec [01 D4](../specs/01-ingesta-enriquecimiento.md)), y eso no existe. Lo que se muestra es el canal, no la campaña.
- Dentro: las dos entran como objetos nuevos en el array `METRICAS` de [`lib/tablero/metricas.ts`](../../lib/tablero/metricas.ts). **La pantalla no se toca**: el registry está diseñado para esto y cada métrica lleva su `descripcion` con la fuente del número.
- Fuera: abandono por etapa, tasa de abandono, duración de la conversación. Las tres dependen de un cambio de contrato.
- Fuera: el video. El tablero quedó fuera del guion (decisión 4 del plan del sábado); esto es munición para preguntas del jurado.

## Done cuando

- [ ] Las dos cifras se ven en `/asesor/tablero` con su fuente escrita debajo.
- [ ] La de canal dice explícitamente que es canal en grueso, no atribución de campaña.
- [ ] `calcular` es puro y solo lee `datos` (regla del registry: nada de `new Date()` ni fetch).

## Notas

Es lo primero que se corta si el sábado aprieta. No sirve a ningún criterio de aceptación: sirve a la conversación con el mentor.
