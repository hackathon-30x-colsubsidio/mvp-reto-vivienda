# Discusión de workflow — 2026-07-25 (los dos motores, el reto y qué falta)

> **Qué es esto.** El desglose de la discusión de workflow que el equipo tuvo el sábado 25 al mediodía (tres audios, grabados en sala), confrontado contra el código que hay hoy y contra el [brief oficial](../reto/perfilamiento-leads-03.md). No es el transcript: el audio crudo se queda fuera del repo público ([`AGENTS.md`](../../AGENTS.md) § restricciones).
>
> **Para qué sirve.** Es el delta que se le pone encima a [`plan-sabado-25.md`](plan-sabado-25.md). Si retomas el proyecto, lee ese plan primero y esto después: aquí están los tres huecos que la discusión destapó, con la evidencia de cada uno y su ticket.
>
> **Cómo se produjo.** Leyendo el código, no de memoria: el motor se corrió con casos de prueba y las salidas que aparecen abajo son reales, medidas el 2026-07-25 a las 12:00.

---

## 1. Seis supuestos de la sala que el código desmiente

Van primero porque media discusión se gastó en cosas que ya estaban construidas. La regla del repo aplica aquí igual que a los docs: si algo se afirma y el código dice otra cosa, se arregla o se declara.

### 1.1 "Hay que construir el motor 1 y el motor 2"

Los dos existen y corren en producción:

| Lo que la sala llamó | Lo que es | Dónde |
|---|---|---|
| **Motor 2** (puntaje dado un proyecto) | `calcularScore`: gate del 40% + 7 factores con peso, señal y aporte | [`lib/scoring/index.ts`](../../lib/scoring/index.ts) |
| **Motor 1** (recomendar sin proyecto) | `matchear`: descarta por precio, filtra por zona, rankea y devuelve hasta 3 | [`lib/matching/index.ts`](../../lib/matching/index.ts) |
| "El 40% se podría factorizar arriba" | Ya está factorizado: `precioMaximoDe` es el gate despejado para el precio | [`lib/scoring/capacidad.ts`](../../lib/scoring/capacidad.ts) |

**Lo que sí falta es el puente**, y es el hallazgo grande de la discusión: ver §2.1.

### 1.2 "El agente no tiene system prompt"

Sí lo tiene, son 28 líneas y es estricto: [`app/api/chat/route.ts`](../../app/api/chat/route.ts). Prohíbe inventar preguntas, cambiar el orden, recitarle al lead sus propios datos y prometer precios o subsidios que el mensaje base no traiga.

Lo que la sala vio (una respuesta absurda aceptada con entusiasmo) **no lo arregla ningún prompt, porque el LLM no está en ese camino**: el parseo del ingreso es TypeScript puro. Ver §2.2.

### 1.3 "Tenemos nutrición para el que no está afiliado y para el que no cumple el 40%"

Falso, y en el pitch es un riesgo. Hay **3 salidas** y la **única causa de nutrición es el gate del 40%**:

| Salida | Quién | Qué recibe |
|---|---|---|
| `listo` | Afiliado que pasa el gate | Match + cita |
| `listo_restriccion_cupo` | **No afiliado** que pasa el gate | Lo mismo, marcado contra el cupo del 10% |
| `nutricion` | Cualquiera cuya cuota se pasa del 40% | Razón + trigger |

La afiliación **no manda a nadie a nutrición**: pesa 0,05 y es desempate ([ADR 0005](../adr/0005-afiliacion-cupo-y-explicacion.md)). Si alguien lo dice al revés delante del jurado, contradice la pantalla. Ya es una de las 6 preguntas de ensayo del plan del día.

### 1.4 "El agente lee el resultado de los motores, y los motores alimentan al agente"

Hoy el ciclo es de una vía: conversación → motor → ficha del asesor. **El agente nunca ve el score, y es a propósito** ([spec 02 D2](../specs/02-conversador.md)): si lo ve, empieza a insinuarle el veredicto al lead. Cambiarlo a menos de 24 horas del cierre toca lo único que sostiene "cero caja negra".

### 1.5 "El dashboard ya tiene las métricas que pidió el mentor"

Cero de cinco. Lo que él pidió ([charla-mentor.md#metricas](../reto/charla-mentor.md)) contra lo que calcula [`lib/tablero/metricas.ts`](../../lib/tablero/metricas.ts):

| El mentor pidió | ¿Está? |
|---|---|
| Abandono por etapa × proyecto × ingreso × afiliación | No. Exige persistir el lead desde el consentimiento: cambio de contrato, fuera de alcance |
| Duración de la conversación | No. El hilo se guarda y nadie lo agrega |
| Tasa de abandono global | No. Depende de la primera |
| **Proyecto con más interacción** | No, pero el dato ya está guardado (`proyecto_interes`) |
| **Atribución de canal, en grueso** | No, pero el dato ya está guardado (`fuente`) |

Las 6 métricas que sí hay (leads hoy, leads 7 días, % que pasa el corte, % no afiliados, puntaje promedio, en nutrición) son buenas y son nuestras, pero **no son su vocabulario**. Ver §2.4.

### 1.6 "Esto lo podríamos hacer con un Google Forms"

Es la pregunta del jurado, no un hueco, y la respuesta ya está construida. Un formulario no puede:

1. **No preguntar** lo que ya sabe (criterio de aceptación 1: el enriquecimiento por cédula).
2. Aceptar *"2 millones y medio"* o *"Bogotá, por el norte"* como respuesta válida, que es el **híbrido** que el mentor pidió explícitamente.
3. Explicar su veredicto en lenguaje natural citando los factores.

El LLM vive exactamente en 1 punto: **tono y texto abierto**. El veredicto es TypeScript puro a propósito, y eso se vende como ventaja, no como límite: *el porqué no depende de que un modelo esté vivo* (decisión 5 de la sala del sábado).

---

## 2. Los tres huecos reales, con su evidencia

### 2.1 🔴 El lead que eligió un proyecto que no le cabe pierde todo el catálogo

**Contrato roto:** el brief pide *"recomienda proyectos acordes al perfil de cada lead, no todo el catálogo"* ([brief:22](../reto/perfilamiento-leads-03.md)) y el repo promete que **nadie se descarta**.

**Qué pasa hoy.** `curar()` califica contra **un solo** proyecto: el de entrada si existe, y si no el más económico ([`resolverProyectoDeReferencia`](../../lib/curar.ts)). Si ese proyecto se pasa del 40%, la salida es `nutricion`, y `matchear` devuelve vacío por diseño (`if (score.salida === "nutricion") return []`). El resto del catálogo no se mira.

**Medido** con el mismo lead (ingreso $4.000.000, sin vivienda, crédito al día, Bogotá):

| Entrada | Salida | Puntaje | Proyectos |
|---|---|---|---|
| sin proyecto de interés | `listo_restriccion_cupo` | 65 | LA MACARENA, MONGUI, LA ARBOLEDA |
| eligió ARAUCARIA ($619.800.000) | **`nutricion`** | **0** | **ninguno** |

Su techo real es **$266.666.666** y **13 de los 18 proyectos le caben**. Cae a nutrición por la vivienda que miró, no por su capacidad.

**Por qué importa ahora:** desde el 2026-07-25 el "soy yo" elige el proyecto de una **lista con los 18 y sus precios**, así que el jurado puede reproducirlo en el primer intento.

**Es exactamente lo que la sala diseñó en voz alta** ("si no cumple el 40% pasa al motor uno"), y es lo que falta construir. → **[Ticket 023](../tasks/023-puente-capacidad-antes-del-proyecto.md)**

### 2.2 🟠 El ingreso no se valida ni se confirma

Corrido contra el parser real ([`parsearIngresoMensual`](../../lib/conversacion/preguntas.ts)):

| Lo que teclea el lead | Lo que el sistema entiende |
|---|---|
| `2+2` | $2.000.000 |
| `-3` | $3.000.000 |
| `999999999999` | $999.999.999.999 |
| `no sé` / `depende del mes` | nada (se guarda el texto crudo y **no se repregunta**) |

Y el acuse responde *"con eso ya puedo calcular con números reales"*. El ingreso es **el insumo del único gate legal del sistema**: un número mal entendido cambia el veredicto sin que nadie se entere. No es un problema de IA, es que falta el eco de confirmación. → **[Ticket 024](../tasks/024-confirmacion-del-ingreso.md)**

### 2.3 🟠 El techo del puntaje sigue en 75 y el subsidio no puede mover nada

Ya estaba registrado por el audit de las 11:30, y la discusión lo vuelve urgente porque toca lo que se dice en cámara: el subsidio aporta **0 puntos a todo lead real** (nadie pregunta el monto) y la similitud aporta la mitad fija. **Diana con 74 está a un punto del máximo alcanzable, no a 26.**

Dos salidas honestas, y hay que elegir una hoy: entra el [ticket 017](../tasks/017-tabla-subsidios.md) con fuente citable, o se dice el techo en voz alta. Callarlo es subvenderse.

### 2.4 🟡 Dos métricas del mentor cuestan media hora y no están

`proyecto_interes` y `fuente` ya se persisten en cada lead. El registry de [`metricas.ts`](../../lib/tablero/metricas.ts) está diseñado para esto (se agrega un objeto al array `METRICAS` y la pantalla no se toca). Es la forma más barata de que el mentor oiga su propio vocabulario cuando pregunte por el tablero. → **[Ticket 025](../tasks/025-metricas-del-mentor-baratas.md)**

Ojo con el alcance: la atribución que él pidió incluye campaña y QR (spec [01 D4](../specs/01-ingesta-enriquecimiento.md)); lo que se puede hoy es el **canal en grueso** (meta / google / web). Se dice así, no se infla.

---

## 3. El layout contra el reto (qué hay que hacer y qué no)

Las 7 líneas de *"cómo se ve un buen resultado"* del brief son el examen completo. Nada que no esté en esta tabla debería consumir tiempo hoy.

| # | Lo que pide el reto | Hoy | Dónde |
|---|---|---|---|
| 1 | Recibe leads de distintas fuentes y no los trata igual | ✅ parcial. `fuente` es `meta/google/web`; los canales del mentor son lead-form, click-to-WhatsApp, BTL y .com | [`lib/types.ts`](../../lib/types.ts), CHECK en [`db/schema.sql`](../../db/schema.sql) |
| 2 | Distingue afiliado desde el inicio | ✅ por cédula, nunca se pregunta | [`lib/enriquecimiento.ts`](../../lib/enriquecimiento.ts), 303 identidades |
| 3 | Valida o infiere capacidad sin interrogatorio | ✅ los 4 datos se recogen · ⚠️ el subsidio no calcula (§2.3) · ⚠️ el ingreso no se valida (§2.2) | [`preguntas.ts`](../../lib/conversacion/preguntas.ts) |
| 4 | Prioriza: listos al asesor, el resto a nutrición | ✅ 3 salidas, cola por puntaje | `ordenarCola`, `/asesor` |
| 5 | **Recomienda proyectos acordes al perfil** | ⚠️ **se rompe si el lead eligió un proyecto que no le cabe** (§2.1) | [`lib/curar.ts`](../../lib/curar.ts) |
| 6 | El flujo se recorre sin intervención del equipo | ✅ 3 personajes + "soy yo" | `LandingJurado` |
| 7 | Multi-canal: demostrar que la lógica escala | ⚠️ por diseño (correcto por scope), pero sin su vocabulario | [ticket 020](../tasks/020-tramo-implementabilidad.md) |

Y lo que el reto **excluye** (pauta, CRM, DataCrédito, aprobación de crédito, escrituración) se respeta hoy. Las **notas de voz** que salieron en la sala: el mentor las mencionó como parte del híbrido, no como requisito. Se nombran en el tramo de implementabilidad, **no se construyen**, y **no se anuncia "próximamente por voz" en la UI**: eso es prometer lo que no existe.

---

## 4. Lo que NO se hace, dicho ahora

Sale de la propia sala, y conviene que esté escrito para que nadie lo empiece a las 4 p.m.:

- **Un banco de preguntas nuevo.** El motor 1 ya funciona con precio máximo + zona. La única pregunta que valdría agregar es el **monto del subsidio**, y solo si entra el ticket 017.
- **Que el LLM conduzca la conversación.** Cerrado en NO (decisión 1). No se re-litiga.
- **Que el agente vea el score** (§1.4).
- **Botón de trigger masivo.** El contraargumento de la propia sala es el correcto: siete mensajes seguidos son incómodos y se ven peor que la ausencia del botón. El trigger por lead ya demuestra el criterio 3. El tope de frecuencia **se dice** en el pitch, no se construye.
- **Notas de voz, multi-canal construido, métricas de abandono por etapa.**
- **Cambiar el enum de `fuente`.** Toca un CHECK de la base a horas del cierre, sin plano nuevo en el video.

---

## 5. Fuentes

- [Brief oficial del reto](../reto/perfilamiento-leads-03.md) — las 7 líneas de "buen resultado" y lo que el reto excluye.
- [Charla con el mentor](../reto/charla-mentor.md) — el híbrido, la cédula, el 90/10 con ingresos, y las 5 métricas.
- [`plan-sabado-25.md`](plan-sabado-25.md) — el plan del día y las 10 decisiones. Este documento es su delta, no su reemplazo.
- [`spec.md`](../spec.md) §4-§5 — las 3 salidas y los 4 criterios de aceptación.
- Código medido: [`lib/curar.ts`](../../lib/curar.ts), [`lib/scoring/`](../../lib/scoring/), [`lib/matching/index.ts`](../../lib/matching/index.ts), [`lib/conversacion/preguntas.ts`](../../lib/conversacion/preguntas.ts), [`lib/tablero/metricas.ts`](../../lib/tablero/metricas.ts).
