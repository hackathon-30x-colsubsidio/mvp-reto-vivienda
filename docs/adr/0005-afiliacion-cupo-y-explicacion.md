# 0005 — La afiliación desempata, el cupo 90/10 advierte, y el porqué es determinista

**Estado:** Aceptada · **Fecha:** 2026-07-24 (las tres decisiones) · ratificadas en la sala de decisiones del 2026-07-25

## Contexto

Tres decisiones tomadas el viernes cambiaron cómo se comporta el sistema en lo que el jurado va a mirar de frente: cómo se ordena la cola del asesor, qué recibe un no afiliado, y quién escribe el "por qué" que sostiene toda la promesa de cero caja negra.

Las tres quedaron marcadas `[CERRADA — Mani]` en los specs por componente, pero el propio [`docs/specs/README.md`](../specs/README.md) dice que **los specs no superseden ADRs**: si algo cambia una decisión de arquitectura, se escribe como ADR nuevo. Este es ese ADR. No introduce nada: registra lo que ya corre, con su porqué, para que nadie lo revierta por accidente ni lo re-litigue el domingo.

## Decisión

### 1. La afiliación es desempate, no criterio

`afiliacion_cupo` pesaba **0,20** en el puntaje — el segundo factor más alto. Un afiliado arrancaba **18 puntos** arriba de un no afiliado idéntico, así que la regla 90/10 reordenaba la cola por sí sola. Bajó a **0,05**, y los 0,15 liberados se fueron íntegros a `holgura_capacidad` (0,30 → **0,45**).

**Por qué:** contradecía al mentor, textual — *"la prioridad siempre son los afiliados, PERO siempre va a ser la prioridad de los ingresos"* ([detalle](../reto/charla-mentor.md#90-10-e-ingresos)). A Colsubsidio le interesa cerrar la venta; la afiliación solo debe decidir entre dos perfiles parecidos.

**Medido después del cambio:** dos perfiles idénticos que solo difieren en afiliación quedan a **4,5 puntos** (antes 18), y un no afiliado con $12M **le gana** a un afiliado con $2,6M (71 vs 42).

> Los **valores numéricos** siguen calibrables (sala del sábado 25, decisión 8: *"lo de los pesos no es algo absoluto ahorita"*). Lo que este ADR fija es la **jerarquía**: la capacidad de pago manda y la afiliación desempata. Cambiar eso es cambiar la decisión, no ajustar un número.

### 2. El cupo 90/10 marca y advierte; no descarta

El matcher descartaba los proyectos con el cupo de no afiliados agotado. Como **los 18 proyectos del catálogo ya venden por encima del 10%**, eso dejaba a todo no afiliado con **cero proyectos**. Hoy esos proyectos **se recomiendan igual, de últimos y con la advertencia encima**: *"⚠️ el cupo de no afiliados ya está copado: lleva 82 de 37 permitidos (regla 90/10), así que el asesor tiene que validar cupo antes de separar"*.

En la cola, `listo` y `listo_restriccion_cupo` comparten grupo y adentro manda el puntaje.

**Por qué:** la versión anterior escondía el hallazgo detrás de un lead vacío. No se le promete la unidad al lead ni se le oculta el límite al asesor: **el hallazgo cambia de lugar, no se pierde** — en vez de manifestarse como una lista vacía, se dice en cada recomendación y se sigue midiendo en la vista de métricas. Supersede la decisión del 2026-07-24 13:50, que conservaba la regla dura precisamente para no esconder el vacío.

> **Corolario del 2026-07-25:** con todos los cupos copados, ordenar por "más cupo libre" degeneraba en "el proyecto más pequeño" y tapaba el precio. Los copados empatan en 0 (`max(0, cupoLibre)`) y manda el precio; el cupo desempata solo **mientras haya cupo de verdad**.

### 3. El porqué que ve el asesor se redacta determinista

La explicación de la ficha se arma en TypeScript (`explicacionDeterminista()` en [`lib/curar.ts`](../../lib/curar.ts)) desde los `valor` que el motor ya calculó. `/api/explicacion` —el experto LLM, con su prompt grounded y su fallback— **sigue existiendo y ninguna pantalla lo llama**.

**Por qué:** el cierre de la cadena no puede depender de que un modelo esté vivo, y un texto armado desde los factores **no puede inventar cifras**. Se vende como ventaja ante el jurado: *el porqué no depende de que un modelo esté vivo*, que es la respuesta directa a "¿qué pasa si el LLM se cae?".

## Consecuencias

- El LLM queda en **un solo punto** del producto: pulir el tono del conversador. El ADR 0002 decía dos.
- `/api/explicacion` y `/api/match` son **código sin consumidor** en el recorrido del demo. No es deuda: es pulido opcional fuera del camino crítico, y conviene saberlo antes de invertir tiempo ahí.
- La regla 90/10 deja de ser un corte y pasa a ser **información en pantalla**. Cualquier pieza nueva que la trate como filtro contradice este ADR.
- El techo del puntaje y la separación entre perfiles cambiaron: ver [spec 03 D5](../specs/03-scoring.md) para la aritmética.

## Fuentes

- [spec 03 D4 y D9](../specs/03-scoring.md) · [spec 04 D1 y D3](../specs/04-match-agenda.md) · [spec 06 D7](../specs/06-dashboard-asesor.md)
- [Charla con el mentor](../reto/charla-mentor.md#90-10-e-ingresos) — la prioridad de los ingresos.
- [`agents/handoff.md`](../agents/handoff.md) — entradas del 2026-07-24 18:40, 19:00 y 21:00, con lo medido en cada una.
- [`agents/plan-sabado-25.md`](../agents/plan-sabado-25.md) — decisiones 5 y 8 de la sala.
