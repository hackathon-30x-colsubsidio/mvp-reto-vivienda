# 0005 — Capa de recursos ortogonal a `Score.salida` + trigger temporal de elegibilidad

**Estado:** Aceptada · **Fecha:** 2026-07-25

## Contexto

Un lead que **pasa** el gate legal del 40% pero saca puntaje bajo no recibía nada extra, y un lead en nutrición solo recibía su `trigger_nutricion`. Faltaba una forma de decirle a alguien *"esto te conviene mejorar"* sin que eso significara descartarlo ni negarle el asesor.

La tentación era resolverlo con un **umbral de puntaje** ("si sacas menos de X, te mandamos a un flujo de ayuda"). Se descartó por dos razones ya cerradas en el canon:

1. **No hay umbral de puntaje y no lo va a haber** — [`spec 06 D7`](../specs/06-dashboard-asesor.md) es explícito: *"el puntaje ordena, no decide"*. Meter un corte reintroduciría la caja negra que el reto prohíbe.
2. **El puntaje es un escalar que colapsa la información que necesitamos.** Un 32 puede serlo por no-afiliación, por situación crediticia o por margen apretado — y cada caso pide un recurso distinto. Un solo número no distingue cuál.

Además, la "rama temporal" del trigger de nutrición ([`spec 05 D2`](../specs/05-nutricion-reenganche.md)) nunca se había implementado porque "ninguna regla fallida es temporal". Eso dejó de ser cierto: la afiliación tiene un plazo real de **6 meses** de aporte continuo antes de poder postular al subsidio.

## Decisión

**Se construye una capa de recursos ORTOGONAL a `Score.salida`.** Un lead puede estar `listo`, ir al asesor con cita agendada, **y además** recibir un recurso porque un factor salió débil. La regla es **"recurso + esperar contacto del asesor"**, nunca "recurso EN VEZ DE asesor". No es una salida nueva ni el premio de consolación de la nutrición.

Cuatro decisiones duras la definen:

1. **El disparador es a nivel de FACTOR, no de puntaje.** Reutiliza los 7 factores que el motor ya emite (`Score.factores`); cada recurso cita el factor que lo activó (cero caja negra). Se dispara solo por factores **desfavorables categóricos** (no afiliado, crediticia mala/regular, sin subsidio declarado) — **sin ningún corte numérico por factor** (decisión del equipo, 2026-07-25). Distinto de un umbral de puntaje global y también distinto de un corte de holgura, que se descartó por no ser verificable.

   **Un recurso solo cuelga de un factor cuya aritmética esa acción puede mover.** El gate del 40% (`cuota_ingreso_40`) **no dispara ningún recurso directamente**: esa cuota se deriva del *precio* de la vivienda, no de deudas ni de ahorro, así que ni consolidar cartera ni ahorrar para el enganche la mueven un peso. Lo que sí puede moverla es afiliarse (desbloquea el subsidio, que sí se resta de la cuota antes del gate), y ese recurso cuelga del factor `afiliacion`. Colgar cartera del gate sería cero caja negra violado en su forma más citable: recomendar una acción afirmando que atiende un factor cuya aritmética no toca.

2. **La capa NO toca el motor.** Se computa en `curar()` a partir de los factores ya calculados. `Score` queda intacto (su contrato es sagrado, ver [ADR 0002](0002-stack-mvp.md) y `spec 03 D6/D10`). El cambio a `lib/types.ts` es **aditivo y opcional**: `RecursoRecomendado` nuevo + `recursos?` en `LeadCurado` y `ResultadoCurado`.

3. **La fecha temporal vive en el recurso, no en `trigger_nutricion`.** `lib/recursos/elegibilidad.ts` computa "hoy + 6 meses" (TS puro, determinista, `desde` inyectable) y alimenta el `porque` del recurso de afiliación. `triggerDelGate` no se toca: el gate del 40% y la antigüedad de afiliación son condiciones distintas y no se mezclan en un mismo campo con `CHECK`.

4. **Tope de 2 recursos**, 1 primario. Mostrar 5 diluye la acción. La secuenciación es honesta con los requisitos reales: para un **no-afiliado** el primario es la afiliación (es la puerta al subsidio); para un afiliado, el subsidio puede ser primario directo.

### Catálogo

Estático en TS ([`lib/recursos/catalogo.ts`](../../lib/recursos/catalogo.ts)) — grounding actualizable, no en DB: un catálogo no muta ([ADR 0002](0002-stack-mvp.md)). Siete recursos con links verificados y sus caveats reales (antigüedad de afiliación, orden de postulación del subsidio, alcance de la cobranza). Los dos de la **Secretaría del Hábitat de Bogotá** se marcan `aliado_externo` y **nunca** se presentan como oferta propia. Compra de cartera cuelga del factor `situacion_crediticia` (mala/regular), no del gate, y lleva **copy autocalificante** ("si hoy pagas cuotas de otros créditos…") porque el conversador no captura deudas y el sistema no puede afirmar una premisa que no verifica — misma protección que el guard anti-absurdo del subsidio (no se ofrece a quien ya lo declaró). `ahorro_para_mi_casa` queda en el catálogo pero **sin mapear**: ayuda con la cuota inicial y ningún factor modela esa barrera; entra el día que exista un factor de capacidad de enganche.

### Mapeo factor → recurso (estado 2026-07-25)

| Factor desfavorable | Recurso(s) |
|---|---|
| `afiliacion` = no afiliado | Afiliación (con fecha temporal) |
| `situacion_crediticia` = mala/regular | Educación financiera (aliado externo) + Compra de cartera |
| `subsidio_aplicable` = no declarado (afiliado, no propietario) | Subsidio + Guía de subsidios |
| `cuota_ingreso_40` (gate) | **ninguno directo** — lo que mueve el gate es la afiliación (→ subsidio) |
| `ya_tiene_vivienda`, `cupo_90_10`, `similitud_compradores_reales` | ninguno |

## Consecuencias

- El asesor ve los recursos en la ficha ([`BloqueRecursos`](../../app/asesor/_components/BloqueRecursos.tsx)), en superficie neutra (nunca el azul-nutrición), con el aliado externo rotulado **en texto** y el factor disparador citado con etiqueta legible.
- El lead los ve al cerrar la conversación, con dos moldes de mensaje ([`mensajes.ts`](../../lib/recursos/mensajes.ts)): el de `listo` dice explícito que un asesor lo contactará; el de nutrición dice que le escribimos cuando cambie la condición. Tono no negociable: nunca "no calificaste".
- El LLM solo pule tono después; **nunca decide qué recurso mostrar** (regla de `AGENTS.md`).

### Limitación conocida: los recursos son DERIVADOS, no históricos

Los recursos **no se persisten**: se **recomputan** desde los factores guardados cada vez que se lee un lead ([`leadCuradoDesdeFila`](../../lib/leads-repo.ts)). No hay columna nueva en la tabla `leads` ni migración de DB.

La consecuencia: **si cambia el catálogo o el mapeo, los leads viejos cambian de recurso retroactivamente** — no queda registro de qué recurso se le mostró a alguien en el pasado. Para el MVP es irrelevante e incluso conveniente (cero migración, un solo lugar de verdad). Se deja escrito aquí para que no se descubra después: si algún día se necesita auditar "qué recurso vio este lead en tal fecha", habrá que persistirlos como snapshot, y eso es otra decisión.

## Alternativas descartadas

- **Umbral de puntaje** → reintroduce caja negra y colapsa la información del factor. Contradice `spec 06 D7`.
- **Corte de holgura por factor** (recurso si el margen es apretado aunque pase el gate) → exige un número por factor que justificar, y peor: se apoya en premisas no capturadas (deudas). Descartado.
- **La fecha temporal dentro de `trigger_nutricion`** → mezcla dos condiciones distintas en un campo con `CHECK`, y ensucia el trigger del gate. La fecha vive en el recurso.
- **Persistir los recursos** → migración de DB a 24h del deadline, para un beneficio (histórico) que el demo no necesita.

## Fuentes

- [`spec 05`](../specs/05-nutricion-reenganche.md) — nadie se descarta; trigger híbrido; la rama temporal.
- [`spec 06 D7`](../specs/06-dashboard-asesor.md) — el puntaje ordena, no decide.
- [`spec 03 D3`](../specs/03-scoring.md) — los 7 factores que la capa reutiliza.
- Código: [`lib/recursos/`](../../lib/recursos/) (catálogo, mapeador, elegibilidad, mensajes), [`BloqueRecursos`](../../app/asesor/_components/BloqueRecursos.tsx).
- [`AGENTS.md`](../../AGENTS.md) — cero caja negra; el LLM no decide; TS puro sin LLM.
