# Plan de arquitectura del conversador

**8 ramas · 5 personas · entrega domingo 26 jul 2026, 11:30 a.m.**

Documento vivo y **canal de sincronización de los 5 computadores**. Si algo aquí contradice el
código, se arregla aquí mismo — no se deja derivar.

## 0 · Cómo se trabaja con este documento

**LA REGLA DE ORO: no asumas, consulta.**

Vas a encontrar cosas que este plan no previó — un archivo que no esperabas, un test que falla por
otra razón, una decisión de producto sin tomar. **No la resuelvas por tu cuenta.**

1. Anótala en la **Bitácora de hallazgos** (§8).
2. Etiqueta a quién le toca según el **mapa de propiedad** (§2).
3. Commit + push de este documento. Sigue con otra parte de tu rama mientras te responden.

Un hallazgo resuelto por asumir es un conflicto de merge, o una contradicción en pantalla el domingo
a las 11:00. Cuesta menos una hora de espera que una hora de deshacer.

**REGLA ESPECIAL — personalidad y comportamiento del agente.**
Cualquier texto que el lead vaya a leer, cualquier regla sobre cómo se comporta Sara, cualquier
umbral que cambie cuándo habla o qué dice: **se consulta antes de escribirlo, siempre.** No hay
excepción por "es obvio" ni por "es una línea". Los puntos concretos van marcados `🔴 CONSULTAR`
dentro de cada rama, y la lista completa está en §7.

La razón está en `AGENTS.md`: *"se está vendiendo la compra que alguien hace una vez en la vida"*.
El tono de esta conversación se reescribió entero una vez porque sonaba a encuesta. No se improvisa.

---

## 1 · Qué se está construyendo

El agente de WhatsApp de `hardcoreai` (Motoko) tiene la arquitectura que queremos: código
determinista decide *si* el agente habla → el LLM propone dentro de un menú cerrado y validado →
código determinista sanitiza lo que devolvió → y solo entonces sale.

Tenemos la mitad de abajo (TypeScript conduce, decisión 1 de la sala del sábado 25). Falta la de
arriba, y hay cuatro huecos medidos:

| # | Hueco | Evidencia |
|---|---|---|
| 1 | Nada valida lo que Gemini devuelve | `app/api/chat/route.ts` conecta el stream directo al cliente. El corte de 3 s de `ChatWhatsApp.agregarBot:275` es de *latencia*, no de *contenido*. Las prohibiciones duras viven solo en `prompt-maestro.ts:79-89` y `:156-170`, y ningún código las hace cumplir. |
| 2 | El dato se pierde en silencio | `interpretarComposicion:285`, `interpretarEdad:295`, `interpretarVivienda:247` y `interpretarCrediticia:272` devuelven `{patch:{}}` con un acuse amable. "Vivo con mi mamá y mi hermana" → la persona cree que contestó y el motor pierde la señal. Solo el ingreso repregunta. |
| 3 | Dos fuentes del hilo | `guion-demo.ts:72-109` reimplementa a mano el ensamblado que `ChatWhatsApp` hace en vivo — el bug que ese archivo existe para prevenir. |
| 4 | La recomendación no depende del perfil | El `NEUTRA` de `similitud.ts` es `0.5`; los proyectos **con** evidencia real puntúan 0,23–0,40. Los que **no** tienen datos ganan estructuralmente: **ZARZAL se lleva el 55% de las citas**. Y `docs/proyectos/proyectos-colsubsidio.json` (alcobas, zonas sociales, área — 18/18 proyectos) no lo lee **ni una línea de código**. |

**Restricciones que gobiernan todo:** no se pierde funcionalidad · el layout no cambia (el *texto*
sí puede mejorar) · se mejora la arquitectura, no se reemplaza la estructura.

---

## 2 · Mapa de propiedad de archivos

**Un archivo tiene una sola dueña.** Si necesitas tocar uno que no es tuyo, va a la bitácora — no
lo edites "rapidito".

| Archivo | Dueña |
|---|---|
| `lib/conversacion/preguntas.ts` | **P2** |
| `lib/conversacion/desvio.ts` | **P2** |
| `components/chat/ChatWhatsApp.tsx` | **P1** |
| `lib/fixtures/guion-demo.ts` | **P1** |
| `lib/gemini.ts` | **P4** |
| `app/api/chat/route.ts` | **P4** |
| `lib/types.ts` | **P3** — contrato compartido, cambiarlo se avisa en el grupo |
| `lib/scoring/similitud.ts` | **P5** |
| `lib/matching/index.ts`, `lib/matching/catalogo.ts` | **P5** |
| `app/asesor/**` | **P3** |
| Archivos nuevos de cada rama | su rama |

**Nadie toca:** `app/globals.css`, `DESIGN.md`, `components/ui/**`, ningún `.css`, ningún JSX
existente. El layout no cambia.

---

## 3 · Decisiones cerradas — no se re-litigan

### Autoridad del LLM

| Ámbito | Decisión |
|---|---|
| Las 7 preguntas base | **Código, siempre.** Decisión 1 intacta: Sara no elige, no reordena, no omite. |
| Interpretar respuestas | **Regex primero, IA de respaldo.** Todos los campos, **incluido el ingreso** — pero el monto pasa igual por `plausible()` y por la confirmación en voz alta de `interpretarIngreso:234`. |
| Recomendar proyectos | **El matcher decide, Sara verbaliza.** Se corre `matchear()` sobre el perfil parcial; Sara redacta lo que el motor eligió, con el `porque` ya calculado. |
| Elegir del banco | **El LLM escoge** de un catálogo cerrado definido en código, validado con zod contra los ids del banco. Puede escoger; **no puede inventar una pregunta**. Si falla → la capa no se activa. |
| Latencia | 3 s en todo, reusando el `AbortController` de `agregarBot:275`. |

### El agente

| Tema | Decisión |
|---|---|
| Guard bloquea | Cae al **texto determinista** — el mismo camino del timeout. El lead nunca se entera. |
| Rastro | Fila `sistema` cuando el guard **bloquea o cambia el sentido**; el aseo de formato puro va solo a log. |
| Formato | Trunca conservando la última frase si es pregunta. Máximo 1 emoji. |
| "¿Eres bot?" | Sara **se declara IA** con naturalidad, con texto determinista fijo. |
| El nombre del lead | Solo donde el texto base ya lo trae. |
| Rendirse | **Nunca.** Quien no califica sale con recurso y trigger. |
| Fuera de tema | Se reconoce en una línea, se dice que de eso no sabe, y `repreguntar()` retoma. |
| Correcciones | Nueva acción `corregir_dato`: sobrescribe, acusa el cambio, retoma sin avanzar. |
| Desvíos | Tras **3 consecutivos** sin avanzar, Sara ofrece asesor. |
| Banco | **Máximo 2**, después de las base. La conversación crece de 7 a 9 turnos como máximo. |

### Mecánica

Los tests actuales quedan **intactos** — si el refactor los rompe, el refactor está mal · seed
regenerable con `seed-espejo.test.ts` vigilando · **zod se agrega** · `/asesor` puede mostrar datos
nuevos **reusando bloques existentes** · a `main` entra lo que esté verde.

> **Precisión al 2026-07-26.** El "91" original quedó viejo hace rato: van **704**. Y la regla tiene
> una excepción con nombre, que NO la debilita: un test marcado `⚠️ BUG CONGELADO` existe para
> **fallar** el día que su bug se arregle, y esa falla es la señal de que se arregló. Cuando pase,
> el test se **voltea** a afirmar el arreglo (con su porqué y un caso de control), no se borra.
> Ya ocurrió una vez: los 14 que cayeron al arreglar los 6 bugs de interpretación. Cualquier otro
> test que se rompa sigue significando que el refactor está mal.

---

## 4 · Por qué el LLM eligiendo del banco NO rompe la decisión 1

Se decidió que el LLM escoge del banco, **y también** que la decisión 1 sigue cerrada. Conviven,
con límites precisos. **Si en tu rama algo se sale de estos cuatro, va a la bitácora:**

1. Las **7 preguntas base** siguen 100% conducidas por código. El banco corre **después**.
2. El LLM escoge un **id** de un catálogo que define el código. Puede escoger; no puede escribir.
3. Zod valida contra los ids existentes. Un id inventado → la capa no se activa.
4. Si Gemini no responde, la capa no se activa y la conversación termina como hoy. **Falla cerrada.**

`replayGuion` replaya **solo las base**, así que el seed y los 3 personajes del demo siguen siendo
deterministas y su `Lead` no cambia.

Es el patrón de Motoko exacto: el modelo escoge una herramienta del set; no escribe la herramienta.

---

## 5 · Reparto

| Persona | Ramas (en orden) |
|---|---|
| **P1** | 1 · escenarios → 5 · máquina de conversación |
| **P2** | 2 · contrato de turno |
| **P3** | 3 · guardas → 7 · banco de preguntas |
| **P4** | 4 · IA (intérprete + verbalización + selector) |
| **P5** | 6 · sesgo de similitud → 8 · brochures al matcher |

```
1 (escenarios) ──verde──→ 5 (máquina + cableado)      ← última en mergear
2 (contrato) ──contrato publicado──→ 4, 5
3 (guardas) ────────────────────────→ 5 la cablea
7 (banco + tipos) ──campos publicados──→ 4, 8
6 (sesgo) ─── independiente ───→ 8
```

**Arrancan ya:** 1, 2, 3, 6. **Rama 4** cuando P2 publique el tipo (~30 min).
**Rama 7** cuando P3 termine guardas. **Rama 5** cuando la rama 1 esté verde.

> **Estado al 2026-07-26, 03:50.** En `main`: **1, 3, 2 y 4**. Faltan **6, 7, 8 y 5**.
>
> | Rama | Quién | Puede arrancar | Qué la frena de verdad |
> |---|---|---|---|
> | **6** sesgo | P5 | **ya, no depende de nadie** | el punto **13** (mediana vs. normalizar) — decisión de Mani |
> | **7** banco | P3 | **ya**, la 3 ya está en `main` | los puntos **1, 2 y 3**: el copy está **todo sin escribir** |
> | **8** brochures | P5 | cuando la 7 publique campos | puntos **14, 15** y el **17** |
> | **5** máquina | P1 | **ya tiene todo lo que esperaba** (2, 3 y 4 están en `main`) | puntos **4, 5, 7** y el número de turnos |
>
> El cuello de botella **no es código, son decisiones**: 9 de los 17 puntos de §7 siguen abiertos y
> bloquean a la 6 y a la 7. La 4 difirió su parte (c), por eso entró antes que la 7.

---

## 6 · Las 8 ramas, en detalle

### Rama 1 · `feat/escenarios-conversacion` — P1

**Posee:** `lib/conversacion/escenarios/**` (nuevos, solo test).
**Prohibido:** todo lo demás. Esta rama **no modifica ni una línea de código de producción**.
**Bloquea a:** rama 5.

**Entregable.** Un corpus de entradas reales y sucias replayadas contra el conversador, afirmando
qué sale. Es el equivalente de `src/tests/agent/scenarios/` de Motoko y es lo que hace seguro el
refactor de la rama 5.

**⚠️ Se escriben contra el comportamiento ACTUAL, no el deseado.** Un test que afirma lo que
queremos no sirve de red — solo dirá que el refactor no arregló un bug que ya existía. Cuando
encuentres un comportamiento que te parezca malo: **lo congelas igual** y lo anotas en la bitácora.

**Casos mínimos:**
`"vivo con mi mamá y mi hermana"` · `"2 palos"` · `"q vale"` · `"cerca al colegio de los niños"` ·
`"no tngo nada"` · `"soy independiente"` · `"quiero hablar con alguien"` ·
`"¿cuánto cuesta zarzal?"` · texto vacío · solo emoji · `"entre 3 y 5"` ·
`"ya tengo casa pero quiero otra"` · `"2+2"` · `"jajaja"` · `"eres un bot?"`

**Definición de listo:** `npm test` verde · cada caso documenta en un comentario qué comportamiento
está congelando y si es el deseado o no.

---

### Rama 2 · `feat/contrato-turno` — P2 · **RUTA CRÍTICA** · ✅ ENTREGADA

> **Cerrada.** Pusheada en `feat/contrato-turno`, con `npm test` (456), `tsc` y `lint` verdes, el
> seed regenerado sin diff y los 3 pasos hechos. Lo que quedó construido es el bloque de abajo, ya
> reconciliado con el código; los hallazgos para las otras ramas están en §8. Falta el merge.

**Posee:** `lib/conversacion/acciones.ts` (nuevo), `lib/conversacion/interpretacion/**` (nuevos),
`lib/conversacion/preguntas.ts`, `lib/conversacion/desvio.ts`.
**Prohibido:** `ChatWhatsApp.tsx`, `guion-demo.ts`, `lib/types.ts`.
**Bloquea a:** ramas 4 y 5.

**Paso 1 — publicar el contrato en los primeros 30 minutos.** P4 está esperando esto. Commit + push
apenas compile, aunque el resto no esté.

Así quedó en `lib/conversacion/acciones.ts` (todas llevan `campo` menos las tres últimas):

```ts
export type AccionTurno =
  | { tipo: "responder_paso"; campo; patch; acuse?; pulir? }
  | { tipo: "no_entendido"; campo; textoCrudo }              // hoy: {patch:{}} mudo
  | { tipo: "confirmar_dato"; campo; patch; acuse; acuseSiInsiste } // hoy: repreguntar
  | { tipo: "corregir_dato"; campo; patch; acuse }           // nuevo
  | { tipo: "responder_duda"; clase; proyecto?; textoCrudo }
  | { tipo: "fuera_de_tema"; textoCrudo }                    // nuevo
  | { tipo: "handoff_asesor" };
```

Quién produce cada una: `accionDeTexto` / `accionDeValor` / `accionDeCorreccion` (en `preguntas.ts`)
y `accionDeDesvio` / `esFueraDeTema` (en `desvio.ts`). `respuestaDeAccion` es el puente que traduce
al `Respuesta` de hoy — la rama 5 lo retira.

Validado con zod **donde de verdad hay un borde**, que es la salida del modelo y no esta unión:
`INTERPRETACION_POR_CAMPO` es el menú cerrado campo → schema del valor, y `INTERPRETES` casa contra
él con `satisfies`. Es el `SalesToolCallSchema` de Motoko aplicado donde aplica (ver §8).

**Paso 2 — extraer los intérpretes** a `lib/conversacion/interpretacion/`, un archivo por campo,
funciones puras con su test. `preguntas.ts` queda solo con copy + wiring.

**Paso 3 — las ramas nuevas del union.** `no_entendido` **no cambia comportamiento por sí solo**:
hace visible lo que hoy es un `{patch:{}}` mudo. Quien decide qué hacer con él es la rama 5.

**⚠️ `interpretarTexto` sigue SÍNCRONO y PURO.** `guion-demo.ts:89` lo llama de forma síncrona y de
ahí salen `db/seed.sql` y las fixtures. Si lo vuelves `async`, revientas el seed. La capa de IA vive
afuera y la cablea la rama 5.

**🔴 CONSULTAR antes de escribir:**
- ~~El copy del acuse de `corregir_dato`.~~ ✅ consultado y aprobado (§8).
- ~~El copy de `fuera_de_tema`.~~ ✅ consultado y aprobado (§8).
- Cualquier cambio al texto de las 7 preguntas base o a sus acuses. → **no se cambió ni uno.**

**Definición de listo:** `npm test` verde con los tests actuales **sin tocar** ·
`npx tsc --noEmit && npm run lint` · el contrato pusheado y avisado. → ✅ los tres, y el seed
regenerado sin una línea de diff, que es la prueba de que el refactor no movió nada.

---

### Rama 3 · `feat/guardas-salida` — P3

**Posee:** `lib/conversacion/guardas.ts` (nuevo) + su test.
**Prohibido:** todo lo demás. **Esta rama NO cablea nada** — entrega la función pura y la rama 5 la
conecta en 3 líneas.
**Depende de:** nada. Opera sobre `string`. Arranca ya.

**Entregable.** Espejo de `src/agents/sales/guardrails.ts:210` de Motoko:

```ts
postGuard(texto, textoBase, contexto) → {
  aprobado: boolean;
  textoFinal: string;
  violaciones: string[];
  severidad: "bloquea" | "limpia" | "ok";
}
```

| Regla | Severidad | Qué detecta |
|---|---|---|
| `recita_datos_lead` | bloquea | ingreso / afiliación / deuda que no está en `textoBase` |
| `cifra_inventada` | bloquea | monto, % o fecha fuera de `textoBase` y del catálogo |
| `recomienda_sin_motor` | bloquea | nombra proyectos que no vienen del matcher |
| `suplanta_humano` | bloquea | dice ser persona |
| `nombre_agregado` | limpia | el nombre del lead sin estar en `textoBase` |
| `formato_whatsapp` | limpia | markdown, viñetas, encabezados, meta-comentario |
| `exceso_lineas` | limpia | trunca conservando la última frase si es pregunta |
| `exceso_emojis` | limpia | deja máximo 1 |

`bloquea` → devuelve `textoBase` intacto. `limpia` → devuelve el texto saneado.

**🔴 CONSULTAR antes de escribir:**
- El **número** de líneas máximo (Motoko usa 10; nuestro prompt pide 1-3 frases).
- Si `recita_datos_lead` debe bloquear o solo limpiar cuando el dato es la ciudad —
  `mensajeYaSabemos` la usa a propósito ("busco opciones en Bogotá").
- El texto de la fila `sistema` que queda en el hilo cuando bloquea.

**Definición de listo:** test que prueba cada regla con un caso positivo y uno negativo · ningún
falso positivo sobre los mensajes reales de `preguntas.ts` (pruébalos todos).

---

### Rama 4 · `feat/interprete-ia` — P4 · ✅ ENTREGADA (a) y (b) · ⬜ (c) diferida

> **Cerrada en lo que no dependía de nadie.** Mergeada a `main` con **687 tests** (48 nuevos),
> `tsc` y `lint` verdes, y la capa probada contra Gemini vivo (487–725 ms, muy debajo del corte
> de 3 s). **(c) el selector del banco NO se construyó**: depende de campos que la rama 7 no ha
> publicado. La rama 4 quedó mergeable sin él (decisión de Mani, 2026-07-26), así que el orden
> de merge del plan cambió: **4 entró antes que 7**.

**Posee:** `lib/conversacion/interprete-ia.ts`, `app/api/interpretar/route.ts`,
`lib/conversacion/recomendacion.ts`, `lib/conversacion/selector-banco.ts` (nuevos),
`lib/gemini.ts`, `app/api/chat/route.ts`, **`lib/conversacion/prompt-maestro.ts`** (no estaba
en el mapa de §2 — ver bitácora).
**Prohibido:** `preguntas.ts`, `desvio.ts`, `ChatWhatsApp.tsx`, `lib/matching/**`.
**Depende de:** el tipo `AccionTurno` de la rama 2 · los campos nuevos de la rama 7 (para **c**).

**(a) Intérprete de respaldo.** Solo se invoca cuando la rama 2 emite `no_entendido`.
`POST /api/interpretar {campo, texto}` → salida estructurada validada con zod **contra el mismo enum
que produce el regex**. Fuera del enum → se trata como `no_entendido` → repregunta. Corte 3 s.

⚠️ **El ingreso.** Se acepta que la IA lo interprete, pero el monto que devuelva pasa igual por
`plausible()` (500 mil – 100 millones) y por la confirmación en voz alta que ya existe en
`interpretarIngreso:234`. Es el insumo del único gate legal (40%, Decreto 583 de 2025): un mal
parseo cambia el veredicto en silencio.

**(b) Recomendación verbalizada.** ✅ **Construida, pero SOLO AL FINAL** — no como respuesta a una
duda a mitad (reencuadre de Mani, 2026-07-26). La razón es medida: `precioMaximoDe` devuelve 0 sin
ingreso, que es la 3ª de las 7 preguntas, así que antes de eso `matchear()` filtra el catálogo
entero y no hay nada que verbalizar. A mitad sigue el texto determinista de hoy.

Llena un hueco que nadie había nombrado: **hoy el lead nunca oía sus proyectos.**
`ResultadoCurado.proyectos` es un **número**, y lo único que se nombraba era el #1 dentro del
ofrecimiento de cita. El `porque` de los tres solo lo veía el asesor.

`POST /api/chat { modo: "recomendacion", lead }` corre `curar()` **server-side** y streamea la
redacción. Viaja el lead y no la lista porque la lista no existe en el cliente; calcularla en el
servidor evita cambiar `lib/types.ts`, que es de P3.

**(c) Selector del banco.** ⬜ **NO construido.** Depende de campos que la rama 7 no ha publicado, y
sus tres puntos de consulta (1, 2, 3) siguen abiertos. `selector-banco.ts` **no existe todavía**:
se construye si la rama 7 llega a tiempo, y si no, el chat queda en 7 turnos como hoy.

**🔴 CONSULTAR antes de escribir:**
- ~~La reescritura de `prompt-maestro.ts:157`.~~ ✅ **Resuelto sin reescribirla** (§8): se agregó
  `promptRecomendacion` aparte. El modo duda conserva la prohibición completa —ahí no hay motor
  detrás— y sus dos aserciones quedaron intactas.
- El prompt del selector del banco: **qué le decimos que es "óptimo"**. → sigue abierto con (c).
- ~~El prompt del intérprete.~~ ✅ consultado y aprobado (§8): clasifica, no conversa, y ve **un
  solo mensaje** (nunca el historial).

**Definición de listo:** con `GEMINI_API_KEY` vacía, los tres caminos fallan cerrado y el chat se
completa igual · zod rechaza correctamente una respuesta fuera del enum (test con salida falsa).
→ ✅ los dos, más la sonda contra Gemini vivo pegada en la bitácora.

---

### Rama 5 · `feat/maquina-conversacion` — P1 · **última en mergear**

**Posee:** `lib/conversacion/maquina.ts` (nuevo), `components/chat/ChatWhatsApp.tsx`,
`lib/fixtures/guion-demo.ts`.
**Depende de:** rama 1 verde · contrato de rama 2 · función de rama 3 · endpoints de rama 4 ·
banco de rama 7.

**Entregable.** Sacar la lógica de conversación del componente a un reducer puro:
`(estado, entrada) → { estado, efectos[] }`, con efectos `pintar_bot`, `pintar_bot_llm`,
`anotar_sistema`, `curar`, `pedir_franjas`. `ChatWhatsApp` queda como renderer + ejecutor de efectos.

**⚠️ El JSX no se toca.** Las líneas 598-889 de `ChatWhatsApp.tsx` quedan idénticas. Si el refactor
te empuja a cambiar el marcado, **para y consulta**: el layout no cambia.

Consecuencia grande: `replayGuion` pasa a correr el mismo reducer en vez de reimplementar el hilo.
Hoy hay dos fuentes que pueden divergir; con esto hay una.

**Cablea:** guardas (3) en `agregarBot` antes de `pintar(textoFinal)` · intérprete y selector (4) ·
banco (7). Más el arreglo de una línea: el `catch` de `ofrecerFranjas:504` gana su
`anotar("sistema", ...)` para que el asesor vea el trigger "no pudo agendar".

**🔴 CONSULTAR antes de escribir:**
- Qué hace exactamente el reducer con `no_entendido` (repreguntar una vez, ¿y a la segunda?).
- El copy del ofrecimiento de asesor tras 3 desvíos.
- El copy de la respuesta a "¿eres un bot?".
- Cualquier cambio en el número de turnos que ve el lead.

**Definición de listo:** **los tres `ChatWhatsApp.*.test.tsx` pasan sin tocarlos** · los 3 personajes
recorridos a mano en `npm run dev` · seed regenerado y `seed-espejo.test.ts` verde.

---

### Rama 6 · `fix/sesgo-similitud` — P5

**Posee:** `lib/scoring/similitud.ts` + su test. **Independiente de todo. Arranca ya.**

El `NEUTRA` de `0.5` pasa a la mediana de los proyectos con datos reales (≈0,30), o la similitud se
normaliza contra el máximo del catálogo para ese lead. **~3 líneas.**

Hoy los 6 proyectos **sin** distribución confiable devuelven 0,5 y los que **sí** tienen evidencia
real puntúan 0,23–0,40: los sin datos ganan estructuralmente, y por eso ZARZAL —que ni siquiera
está en el PPT— se lleva el 55% de las citas.

**🔴 CONSULTAR antes de escribir:** cuál de los dos enfoques (mediana vs. normalizar). Cambian los
puntajes de todos los leads sembrados y la ficha del asesor muestra números distintos.

**Definición de listo:** la sonda de 1.200 perfiles corrida, con el antes y el después de la
concentración del #1 pegados en la bitácora · fixtures y seed regenerados.

---

### Rama 7 · `feat/banco-preguntas` — P3

**Posee:** `lib/conversacion/banco-preguntas.ts` (nuevo), `lib/types.ts`, `app/asesor/**`.
**Prohibido:** `preguntas.ts` (es de P2), `lib/matching/**` (es de P5).
**Bloquea a:** ramas 4 y 8 — **publica los nombres de los campos apenas los tengas.**

Banco organizado por **componente de vivienda**. Cada pregunta con su `id`, su campo, su copy y sus
chips, escritos con las mismas reglas de `preguntas.ts`: dice para qué sirve antes de preguntar,
acusa la respuesta, y el campo de texto nunca desaparece.

| Componente | Cobertura en brochures | ¿Se pregunta? |
|---|---|---|
| Alcobas / tamaño del hogar | **18/18** (valores 1, 2, 3) | ✅ |
| Amenidades / zonas sociales | **18/18** | ✅ |
| Área privada | **18/18** (desde 40,58 m²) | ✅ |
| Momento de compra / urgencia | n/a — señal comercial | ✅ (prioriza en la cola, no matchea) |
| Parqueaderos, EDGE | **5/18** | ❌ solo grounding para el modo duda |

Campos nuevos en `Lead["respuestas"]`, **todos opcionales** — nada existente se rompe.
Ficha de preferencias en `/asesor` **reusando el bloque de factores que ya existe**: ni CSS ni
componentes nuevos.

**🔴 CONSULTAR antes de escribir — esta rama es casi toda personalidad:**
- **El copy de cada pregunta del banco.** Ninguna está escrita. Van al lead.
- Los chips de cada una.
- Cómo se llaman los campos nuevos en `lib/types.ts` (contrato compartido).
- Si "momento de compra" se pregunta de verdad, o suena a vendedor apurando.

**Definición de listo:** `npx tsc --noEmit` verde en todo el repo (tocaste el contrato compartido) ·
los campos nuevos avisados a P4 y P5 · la ficha del asesor abierta y comparada contra la de hoy.

---

### Rama 8 · `feat/brochures-al-matcher` — P5

**Posee:** `lib/matching/catalogo.ts`, `lib/matching/index.ts`, un script de derivación nuevo.
**Prohibido:** `lib/types.ts` (es de P3), `lib/scoring/similitud.ts` fuera de la rama 6.
**Depende de:** los campos de la rama 7.

**Entregable.** Que las respuestas del banco signifiquen algo — sin esto, el banco es el mismo
pecado de los brochures. Dos partes:

1. **Cablear** `docs/proyectos/proyectos-colsubsidio.json` al catálogo que corre. Hoy no lo lee ni
   una línea. Trae `tipologias[]` con `alcobas` y `banos`, `zonas_sociales[]` y
   `area_privada_desde_m2` para los 18 proyectos.
2. **Bonos nuevos** junto a los dos que ya existen en `lib/matching/index.ts`:

```ts
const BONO_VIS_CON_SUBSIDIO = 0.15;      // ya existe
const BONO_BARRIO_EXACTO = 0.1;          // ya existe
const BONO_ALCOBAS_SUFICIENTES = ...;    // nuevo
const BONO_AMENIDAD_PEDIDA = ...;        // nuevo
const BONO_AREA_SUFICIENTE = ...;        // nuevo
```

**⚠️ Bonos, NUNCA filtros.** Ordenan y jamás descartan. Con solo 6 tipologías de 3 alcobas en todo
el catálogo, un filtro duro dejaría a las familias grandes sin ninguna opción. Cada bono queda
citable en el `porque` del proyecto — cero caja negra intacta.

**🔴 CONSULTAR antes de escribir:**
- **Los valores numéricos de los tres bonos.** Cambian qué proyecto le sale a cada persona.
- Cómo se redacta el `porque` cuando un bono se activa (lo leen el asesor y el lead).
- Si el catálogo derivado se genera con script (como `slots.json`) o se escribe a mano.

**Definición de listo:** la sonda de 1.200 perfiles con el antes/después en la bitácora · el
catálogo derivado generado por script, **nunca a mano** · fixtures y seed regenerados.

---

## 7 · Puntos que requieren consulta

Ningún texto de esta lista se escribe sin aprobación. Marcar aquí cuando se resuelva.

| # | Punto | Rama | Estado |
|---|---|---|---|
| 1 | Copy de las 4 preguntas del banco + sus chips | 7 | 🟡 **escrito como PROPUESTA — falta ratificar** |
| 2 | Nombres de los campos nuevos en `lib/types.ts` | 7 | ✅ **publicados** (2026-07-25) |
| 3 | Si "momento de compra" se pregunta o suena a apuro | 7 | 🟡 **se pregunta, reformulada — falta ratificar** |
| 4 | Respuesta a "¿eres un bot?" | 5 | ⬜ abierto |
| 5 | Copy del ofrecimiento de asesor tras 3 desvíos | 5 | ⬜ abierto |
| 6 | Copy de `corregir_dato` y de `fuera_de_tema` | 2 | ✅ cerrado — consultado y aprobado, ver bitácora |
| 7 | Qué hace el reducer con `no_entendido` a la segunda vez | 5 | ⬜ abierto |
| 8 | Reescritura de `prompt-maestro.ts:157` (prohibición de recomendar) | 4 | ✅ **cerrado sin reescribirla** (2026-07-26) — prompt nuevo aparte, ver bitácora |
| 9 | Prompt del selector del banco: qué es "óptimo" | 4 | ⬜ abierto — **diferido con (c)**, depende de la rama 7 |
| 10 | Prompt del intérprete de respaldo | 4 | ✅ **cerrado** (2026-07-26) — clasifica, no conversa; ve un solo mensaje |
| 11 | Máximo de líneas del guard | 3 | ✅ **3 líneas y 4 frases** (2026-07-25) |
| 12 | Texto de la fila `sistema` cuando el guard bloquea | 3 | ✅ **cerrado** (2026-07-25) |
| 13 | Mediana vs. normalizar en el sesgo de similitud | 6 | ⬜ abierto |
| 14 | Valores de los tres bonos nuevos | 8 | ⬜ abierto |
| 15 | Redacción del `porque` cuando un bono se activa | 8 | ⬜ abierto |
| 16 | Copy del mensaje de recomendación **sin IA** (el fallback) | 4 | ⬜ **abierto — lo ratifica Mani** |
| 17 | El `porque` del matcher ahora lo LEE EL LEAD: mezcla de persona y el "0% … como tu hogar" | 8 | ⬜ **abierto — P5 lo arregla, Mani ratifica el texto** |

> **Quién revisa esto.** Los 17 puntos los decide **Mani**: el plan no asigna revisor de copy, y no
> lo asigna a propósito (§0, regla especial). El "cadenero" de `AGENTS.md` revisa **código** en
> sesión distinta; para el texto que el lead lee no hay equivalente, así que un copy no aprobado no
> tiene quien lo apruebe sino Mani. **Estar en la bitácora no es estar revisado:** esta tabla es la
> lista, la bitácora es el detalle.

---

## 8 · Bitácora de hallazgos

Formato: `- [rama] hallazgo → para quién · estado`. Se agrega abajo; no se reescribe lo de arriba.

- **[3] Las 3 consultas de la rama están resueltas** (2026-07-25) → todos · cerrado.
  **(a) Tope = 3 líneas y 4 frases.** Las dos cotas juntas porque ninguna sola sirve: *ningún*
  mensaje real de `preguntas.ts` trae saltos de línea, así que contar solo líneas no atraparía el
  desborde típico de Gemini (cinco frases en un renglón). Y **4 frases, no 3**, porque
  `mensajeReenganche` tiene exactamente 4: con 3, el guard habría truncado un texto escrito a mano.
  **(b) La ciudad NO es `recita_datos_lead`.** Solo bloquean ingreso, afiliación y deuda — los tres
  que `prompt-maestro.ts:83` nombra. `mensajeYaSabemos:723` dice "opciones en Bogotá" a propósito y
  `preguntas.test.ts:153` lo fija. **(c) Fila `sistema`:** `El guard bloqueó la redacción del agente
  (regla: X). Se pintó el texto determinista del sistema; el lead nunca vio la versión bloqueada.`
- **[3] Contrato publicado para la rama 5** → **P1** · listo, nada que hacer hasta cablear.
  `postGuard(texto, textoBase, contexto?) → { aprobado, textoFinal, violaciones, severidad }`, más
  `notaSistemaGuard(resultado) → string | null` (devuelve `null` cuando el aseo fue puro formato, o
  sea: pintar `textoFinal` siempre, y anotar la fila `sistema` solo si la nota no es `null`).
  `ContextoGuard` es `{ nombre?, proyectosPermitidos?, cifrasPermitidas? }`, **todo opcional**: se
  puede cablear en un sitio antes de tenerlo en todos. Con `texto === textoBase` el resultado es
  siempre `ok` — hay un barrido de 40+ mensajes reales del repo que lo prueba.
- **[3] 🔴 Ratificar: el tope de emojis es RELATIVO a `textoBase`, no 1 fijo** → **todos** · abierto.
  El plan decía "deja máximo 1", pero `mensajeSaludo` trae **dos** (👋 y 🏡) y con tope fijo el guard
  le borraba uno a un mensaje que el equipo escribió. Quedó implementado como
  `max(1, emojis del textoBase)`: persigue que Sara **agregue** emojis, no que la base los tenga. Es
  la lectura del prompt de tono (*"máximo un emoji, y solo si el mensaje original ya traía uno"*).
  Si alguien quiere el 1 duro, son dos líneas — pero hay que reescribir `mensajeSaludo`.
- **[3] 🔴 Ratificar: el copy de la fila `sistema` cuando el guard TRUNCA** → **todos** · abierto.
  §3 pide rastro cuando el guard *"bloquea **o cambia el sentido**"*, y el copy consultado cubre solo
  el bloqueo. Se escribió el derivado en el mismo registro: `El guard corrigió la redacción del
  agente (regla: X). El lead vio el texto ya saneado.` Aplica a `exceso_lineas` y `nombre_agregado`
  (borran contenido); `formato_whatsapp` y `exceso_emojis` van solo a log, como pide §3.
- **[3] Límite conocido del guard: no detecta un proyecto INVENTADO** → **P4** · informativo.
  `recomienda_sin_motor` compara contra los 18 nombres del catálogo, así que atrapa "te sirve más
  ZARZAL" pero no "Torres del Parque" — no hay contra qué compararlo. Un nombre inventado solo cae si
  además trae cifra. Es argumento para que el prompt del §6(b) reciba **lista cerrada**, no libertad.
- **[3] Aviso a quien parta `preguntas.ts`: `guardas.ts` NO importa `parsearIngresoMensual`** →
  **P2** · informativo. Reimplementa 10 líneas de la aritmética de montos a propósito, para no quedar
  colgando de un símbolo que la rama 2 está moviendo a `lib/conversacion/interpretacion/`. **No lo
  "deduplique" al hacer el merge:** el guard tiene que poder correr aunque ese refactor esté a medias.
  (Calibración que salió de ahí: "4 millones y medio" **no** se bloquea contra un `textoBase` que dice
  "$4.500.000". Reescribir una cifra como la escribiría un humano no es inventarla, y bloquear eso
  apagaba la capa de IA sin que nadie lo notara.)
- **[7] CAMPOS NUEVOS PUBLICADOS** → **P4** y **P5** · listo, ya pueden construir contra esto.
  Todos opcionales dentro de `Lead["respuestas"]`, nada existente se rompe (`tsc` verde en todo el
  repo): `alcobas_deseadas?: 1|2|3` (3 = "3 o más") · `amenidades_interes?: AmenidadInteres[]` ·
  `espacio_preferido?: "compacto"|"amplio"` · `momento_compra?: "inmediato"|"este_ano"|"explorando"`
  · `preferencias_libres?: string[]`. El tipo `AmenidadInteres` es
  `"mascotas"|"gimnasio"|"coworking"|"deporte"|"verdes"|"social"|"ninos"` y vive en `lib/types.ts`.
  **Para P4 (selector, §6 rama 4c):** `IDS_BANCO` da el enum de zod, `bancoDisponible(respuestas)`
  devuelve solo las que aún no tienen dato (versión banco del criterio 1), cada pregunta trae
  `paraQueSirve` escrito para el modelo y `matchea: boolean`, y `preguntaDelBanco(id)` devuelve
  `undefined` ante un id inventado — la capa no se activa, falla cerrada.
- **[7] 🔴 El copy de las 4 preguntas y sus chips está ESCRITO PERO SIN RATIFICAR** → **todos** ·
  abierto. Es texto que va a leer el lead. Está redactado con las reglas de `preguntas.ts` (dice para
  qué sirve antes de preguntar · acusa cada respuesta · el campo de texto nunca desaparece) y hay
  test para las tres, pero **el tono no lo cubre ningún test**. Se puede reescribir entero sin tocar
  una línea de lógica; los `it.each(BANCO)` siguen pasando. Lo que sí está medido y no es opinión es
  **cuáles** dimensiones vale la pena preguntar. Las cuatro, en `lib/conversacion/banco-preguntas.ts`.
- **[7] "Momento de compra" SÍ se pregunta, con la justificación por delante** → **todos** · falta
  ratificar. La objeción del plan ("suena a vendedor apurando") es real, y se resolvió en el copy en
  vez de borrando la pregunta: *"no es para apurarte sino al contrario… si apenas estás mirando, lo
  anoto para que nadie te llame de más"*. La contrapartida es explícita para quien contesta que está
  mirando, y el acuse de esa opción promete lo mismo. **Si al leerlo sigue sonando a cierre, se cae
  la pregunta y quedan 3** — el banco funciona igual.
- **[7] La tabla de cobertura del §6 está mal en dos filas. Medido sobre los 18 brochures** →
  **P5** · corregir antes de escribir los bonos de la rama 8.
  **(a) El área privada NO empieza en 40,58 m²:** va de **21,6 a 68,06 m²**, mediana 40,55. El 40,58
  es el valor de un proyecto suelto. **(b) "Amenidades 18/18" es cierto y engañoso:** los 18 listan
  zonas sociales, pero con 60+ etiquetas escritas a mano que no se pueden comparar ("portería tipo
  lobby" / "portería con lobby" / "portería"). Como **discriminador** son muy desparejas —
  `ninos` **18/18** (un bono por eso se lo lleva todo el catálogo: es ruido), `gimnasio` 14, `social`
  14, `deporte` 12, `coworking` 11, `verdes` 11, `mascotas` **4**. **(c)** Solo **3 de 18** proyectos
  tienen tipología de 3 alcobas (Samán, Araucaria, Los Nogales) y 1 no declara ninguna (Bosque de
  Arrayán) → confirma "bonos, NUNCA filtros". **(d)** `estado`/entrega solo se conoce en **7 de 18**,
  por eso `momento_compra` está marcado `matchea: false`: **no le construyas bono.**
- **[7] Las familias de amenidad tienen que agruparse IGUAL en los dos lados** → **P5** · pendiente.
  Yo normalizo lo que escribe el lead; el script de la rama 8 normaliza lo que dicen los brochures, y
  si no coinciden el bono nunca se activa. Estas son las mías, sobre `zonas_sociales[]`:
  `mascotas` = `/mascota|zona pet/` · `gimnasio` = `/gimnasio|ecogym|zona fitness|biosaludable/` ·
  `coworking` = `/coworking|juntas|reuniones|sala de lectura|social living/` · `deporte` =
  `/cancha|piscina|pista de trote|yoga/` · `verdes` = `/zonas verdes|sendero/` · `social` =
  `/salón social|salón comunal|edificio comunal|terraza comunal|bbq|fogata/` · `ninos` =
  `/infantil|kids|arenero|teatrino|zona de juegos|salón de juegos/`.
- **[7] El área NO se pregunta en m², y eso cambia tu bono** → **P5** · decidido, avísame si estorba.
  `BONO_AREA_SUFICIENTE` no puede comparar contra un número que el lead nunca dio: nadie sabe de
  memoria cuántos m² necesita, y una pregunta que la gente no puede contestar rompe la conversación.
  Llega `espacio_preferido: "compacto" | "amplio"`, que sí se puede contestar y sí ordena contra
  `area_privada_desde_m2` (mediana 40,55 como corte natural).
- **[7] `banco-preguntas.ts` importa los TIPOS de `preguntas.ts`** → **P2** · informativo.
  `PreguntaBanco extends PasoPregunta`, y `Respuesta`/`OpcionRespuesta` vienen de ahí. Es
  deliberado: así una pregunta del banco **es** un paso normal y la rama 5 la cablea sin adaptador.
  Solo son tipos (se borran al compilar). Si al partir `preguntas.ts` mueves `PasoPregunta`, avísame
  y cambio el import — no lo dejes sin exportar.
- **[7] Quien cablee el banco: usa `aplicarRespuestaBanco`, no el spread pelado** → **P1** ·
  informativo. El patch normal REEMPLAZA, y con dos preguntas del banco por conversación se perdía
  el texto crudo de la primera en `preferencias_libres`. Esa función lo concatena. También:
  `MAX_PREGUNTAS_BANCO = 2` está exportado, no lo vuelvas a escribir a mano.

### 2026-07-26 · rama 1 (escenarios) — 7 hallazgos, ninguno arreglado aquí

La red congeló el comportamiento actual y en el camino destapó esto. **Ninguno se tocó**: cada uno
lleva su test `⚠️ BUG CONGELADO` en `lib/conversacion/escenarios/`, así que el día que su dueño lo
arregle, el test falla — y esa falla es la señal de que se arregló, no un problema.

**Para P2 (rama 2 · intérpretes).** Los cinco salen de `preguntas.ts` y los cinco cambian lo que
llega al motor.

> ✅ **Los cuatro primeros quedaron ARREGLADOS el 2026-07-26** — ver la entrada *"los 6 bugs de
> interpretación"* al final de esta bitácora, con su medición antes/después. El quinto sigue
> abierto y es de la rama 5. **Nada de lo de abajo hay que volver a hacerlo**; se conserva porque
> el diagnóstico original es la razón por la que se arreglaron.

- ~~**`interpretarVivienda` INVENTA "primera vivienda".**~~ `"pues no sé"`, `"no sé todavía"` y
  `"no estoy seguro"` → `tiene_vivienda: false`. Causa: `NIEGA` atrapa el "no" de "no sé". No es
  pérdida de dato como el hueco 2 — es una **afirmación falsa**. · ✅ **arreglado**
  (⚠️ la frase original decía que *"habilita los subsidios que solo aplican a primera vivienda"*:
  **es impreciso**, `undefined` los habilita igual. Lo que costaba, medido, son 5 puntos de 100 en
  el factor `ya_tiene_vivienda` y un "No tiene vivienda propia" afirmado en la ficha.)
- ~~**`interpretarEdad` clasifica mal los 36–39 escritos en letras.**~~ `"treinta y ocho"` → `20_35`
  (debería ser `36_45`). Causa: la rama `^treinta\b` se evalúa **antes** que
  `treinta y (seis|siete|ocho|nueve)`, así que gana siempre. La edad alimenta la similitud, o sea
  que el error llega hasta qué proyecto se recomienda. · ✅ **arreglado** con `(?! y)`
- ~~**`interpretarCrediticia` no normaliza tildes.**~~ `"ya salí de un reporte"` → `mala`;
  `"ya sali de un reporte"` → `regular`. El regex `/sali|.../` no atrapa `salí`, y entonces cae
  hasta la rama de mora porque "reporte" contiene "report". **Quien escribe bien su español queda
  calificado peor.** `interpretarZona` sí usa `sinTildes`. · ✅ **arreglado** aplicando `sinTildes`
- ~~**Dos chips no valen lo mismo escritos que tocados**~~, contra la regla de spec 02 D4 y el
  comentario de `preguntas.ts:407`:
  - `"Más de 45"` escrito → `36_45`; el chip → `46_mas`. (`numerosDe` saca el 45 y `45 <= 45`.)
  - `"El de mi caja de compensación"` escrito → guarda la frase cruda; el chip → la etiqueta
    canónica `"Subsidio caja de compensación"`. Mismo patrón con `"mi casa ya"`.

  El test que recorre **todos** los chips de **todos** los pasos sigue ahí, y su lista de
  excepciones **quedó vacía**, con un test que exige que siga vacía. · ✅ **arreglados los dos**
- **Los intérpretes no fallan igual entre sí.** Ante algo que no entienden, `composicion_familiar`
  y `rango_edad` devuelven `{}` (pierden el dato), pero `situacion_crediticia` devuelve
  `sin_info` — que en la ficha se lee como "nunca ha pedido crédito". O sea que `"jajaja"` queda
  registrado como un hecho sobre su vida financiera.
  · ⚠️ **el vocabulario ya está** (`no_entendido` lo emite la rama 2 con su `campo` y su
  `textoCrudo`); lo que falta es **qué se hace con él**, y eso **ya NO es de P2**:
  → **P1 (rama 5), punto 7 de la lista.** La afirmación falsa sobrevive solo dentro de
  `respuestaDeAccion`, el puente que la rama 5 borra al cablear el reducer. · ⬜ abierto

**Para P5 (rama 8 · catálogo).**

- **Dos `recorrido_360` del catálogo están rotos**, y son dos problemas distintos:
  - `ZARZAL` termina en un `U+200B` (espacio de ancho cero) pegado a la URL.
  - `VERSALLES` **no trae una URL sino cuatro**, metidas en el mismo string y separadas por saltos
    de línea (`APTOA`, `APTOB`, `APTOC`, `AMENIDADES`). El `href` se las lleva concatenadas.

  Los dos se ven bien a simple vista en el JSON. Importa más de lo que parece: **ZARZAL es el
  proyecto del 55% de las citas**, así que es el enlace que el jurado tiene más probabilidad de
  cliquear desde la ficha. El de VERSALLES además plantea una decisión de producto —¿se muestran
  los cuatro recorridos, o solo uno?— que es de P3/P5, no mía. · ⬜ abierto

**Para P1 (rama 5 · máquina) — deuda que yo mismo dejé.**

- `escenarios/replay.ts` **reimplementa** la decisión de avanzar-o-no que hoy vive en
  `ChatWhatsApp.enviarTexto`. Es una segunda fuente, o sea el hueco 3 otra vez, y es deliberado
  pero temporal: mientras la lógica viva dentro del componente, la red no tiene contra qué correr.
  **Cuando exista el reducer, `replayEscenario` pasa a llamarlo y ese bloque se borra.** Está dicho
  también en el encabezado del archivo. · ⬜ abierto

**Dato para el punto 4 de la lista de consulta:** hoy, a `"¿eres un bot?"`, `detectarDesvio` sí lo
atrapa (duda `general`) pero la respuesta determinista es *"esa no te la puedo confirmar por aquí
sin inventarte nada"*. O sea que **Sara hoy no sabe decir que es una IA** — dice que no puede
confirmarlo, que suena a evasiva justo en la pregunta donde la honestidad importa.

### 2026-07-26 · rama 2 (contrato de turno) — entregada y mergeada

- **[rama 2] El contrato está pusheado** en `feat/contrato-turno`: `lib/conversacion/acciones.ts` trae `AccionTurno`, `CampoPregunta` y el menú cerrado. **zod ya entró** (`zod@4.4.3`). → **P4 y P5, arranquen** · ✅ hecho
- **[rama 2] El zod que necesita la rama 4 es `INTERPRETACION_POR_CAMPO`, no un `AccionTurnoSchema`.** La unión la construye TS y la consume TS en el mismo proceso: nunca cruza un borde, así que validarla es ceremonia. Lo que sí cruza es la salida del modelo, y ese mapa es campo → schema del valor, **el mismo enum que produce el regex** (`INTERPRETES` lo cumple con `satisfies`). Fuera del enum → `no_entendido` → repregunta. → **P4** · ✅ resuelto, así quedó
- **[rama 2] El monto del ingreso tiene DOS puertas, no una.** zod dice "es un número"; `plausible()` (exportado de `interpretacion/ingreso.ts`) dice "es un número que alguien puede tener": 500 mil – 100 millones. La rama 4 tiene que llamar las dos — de ese número sale el gate del 40%. → **P4** · ✅ disponible
- **[rama 2] `CampoPregunta` se estrechó a los 7 campos que la conversación pregunta** (antes era todo `keyof Lead["respuestas"]`, incluidos `subsidio_monto_mensual` y `afiliado_autoreportado`, que nadie pregunta). Vive en `acciones.ts` con `satisfies` contra `lib/types.ts`, así que renombrar un campo allá **no compila** acá. Si el banco reusa `CampoPregunta`, sus campos van a `CAMPOS_PREGUNTA`. → **P3 (rama 7)** · ⚠️ para saber
- **[rama 2] BUG pre-existente en `interpretarEdad`, congelado:** `^treinta\b` se come "treinta y ocho" antes de la segunda rama, así que **36-39 escritos en palabras caen en el tramo 20_35** y mueven la similitud. El arreglo es `^treinta\b(?! y)`, una línea. No se toca en esta rama porque cambia el puntaje de quien escriba así; hay test que lo congela y lo dice. → **quien decida comportamiento** · ✅ **arreglado el 2026-07-26**
- **[rama 2] Dos comportamientos feos más, congelados y ahora visibles** en `MUDO_HOY` de `preguntas.ts`: (a) `situacion_crediticia` guarda `"sin_info"` cuando NO entendió, así que el motor no distingue eso de "nunca he pedido crédito"; (b) `subsidios` acusa "¡eso suma!" con lista vacía (solo pasa si el texto era pura puntuación). → **P1 (rama 5), punto 7 de la lista** · ⬜ abierto
- **[rama 2] `fuera_de_tema` es un refinamiento de `no_entendido`, no un tercer desvío.** El orden que no rompe nada: 1) `detectarDesvio` → 2) `accionDeCorreccion` → 3) `accionDeTexto` → 4) y **solo si salió `no_entendido`**, `esFueraDeTema`. Va de último porque el error es feo: "de eso no sé nada" a quien escribió "vivo con mi mamá y mi hermana". Al ingreso nunca le aplica (emite `confirmar_dato`). → **P1 (rama 5)** · ✅ listo para cablear
- **[rama 2] "¿eres un bot?" hoy entra como `duda / general`** y sale con el "no te la puedo confirmar" — porque trae signo de pregunta. Detectarlo cambiaría `detectarDesvio`, que es de P2: si la rama 5 quiere su acción propia (decisión cerrada: Sara se declara IA), **pídanla y la agrego**; o detéctenlo en el reducer antes de llamar a `detectarDesvio`. → **P1 (rama 5), punto 4 de la lista** · ⬜ abierto
- **[rama 2] Copy aprobado (punto 6):** `corregir_dato` → «Listo, lo corrijo 🙏 Me quedo con lo último que me dijiste.» · `fuera_de_tema` → «Jaja, de eso sí no sé nada 😄 Yo soy buena para lo de la casa.» Los dos se retoman con `repreguntar()`, que ya dice "Sigamos donde estábamos", así que el acuse no lo repite. **Excepción decidida sobre la regla existente:** al corregir el **ingreso** se usa su propio acuse, que lee el número en voz alta — lo pide el ticket 024 y de ese número sale el único gate legal. → **si eso no gusta, es una línea** · ✅ escrito
- **[rama 2] `handoff.md` se actualiza al mergear**, no antes: ocho ramas escribiendo la memoria del build en paralelo es un conflicto garantizado. La bitácora es el canal del día. → **quien cierre el día** · ✅ hecho al mergear la rama 2

**Respuesta a los 5 hallazgos que la rama 1 dejó para P2.** Los cinco son ciertos y los cinco viven
ahora en `lib/conversacion/interpretacion/`, un archivo por campo, así que arreglarlos dejó de ser
cirugía sobre un archivo de 800 líneas. **Ninguno se arregló en la rama 2**, y la razón es la misma
para todos: los cinco cambian el dato que llega al motor, o sea el puntaje y el proyecto
recomendado. La rama 2 se entregó con la promesa de no mover nada (el seed regenera sin una línea de
diff, y esa es la prueba). Estado uno por uno:

> ✅ **Los cuatro se aprobaron y se arreglaron el 2026-07-26** (entrada al final de esta bitácora).
> Lo de abajo queda como el porqué de cada arreglo, no como trabajo pendiente.

- **`interpretarVivienda` inventa "primera vivienda"** → **el más grave de los cinco.** Está en
  `interpretacion/vivienda.ts`, aislado y con test. El arreglo fue mirar la duda **antes** que la
  negación. · ✅ **arreglado** (la gravedad real, ya medida, no es que habilite subsidios —eso pasa
  igual con `undefined`— sino los 5 puntos de 100 y la afirmación en la ficha)
- **`interpretarEdad`, 36-39 en letras** → confirmado por dos caminos independientes (mi test lo
  encontró antes de leer esta bitácora, mismo diagnóstico). `interpretacion/edad.ts`, arreglo de un
  `(?! y)`. · ✅ **arreglado**
- **`interpretarCrediticia` no normaliza tildes** → la rama 1 dice que unificar eso "es exactamente
  el trabajo de la rama 2", y tiene razón a medias: `sinTildes` **ya quedó extraído** a
  `interpretacion/texto.ts` y compartido con la zona y el desvío, así que la pieza estaba lista. Lo
  que faltaba era *aplicarlo*. · ✅ **arreglado**
- **Los dos chips que no valen lo mismo escritos que tocados** → el chip y el texto libre pasan por
  **la misma tabla** (`RESPUESTA_DE`), así que el arreglo fue un solo sitio por cada uno. La
  excepción de `"Más de 45"` era aritmética (`45 <= 45`), la del subsidio era normalizar la
  etiqueta. · ✅ **arreglados los dos, y la lista de excepciones quedó vacía**
- **"Los intérpretes no fallan igual entre sí"** → **esta sí quedó resuelta estructuralmente.** El
  caso de `situacion_crediticia` ya entra por `no_entendido` con su `campo` y su `textoCrudo`: la
  afirmación falsa sobrevive **solo** dentro de `respuestaDeAccion`, el puente que la rama 5 borra
  cuando cablee el reducer. En `MUDO_HOY` está escrito, con el porqué, para que se vea al borrarlo.
  O sea: P1, cuando cablees, `no_entendido` de crediticia **no debe afirmar `sin_info`**. · ✅ el
  vocabulario está; la decisión es del punto 7

### 2026-07-26 · rama 4 (IA: intérprete + recomendación) — entregada sin (c)

- **[rama 4] Lo más importante que aprendí, y cambia cómo se leen los 4 bugs abiertos: el intérprete
  de IA NO los rescata.** Solo corre cuando el regex devuelve `undefined`. Los 4 bugs (y los 2
  nuevos de abajo) devuelven un valor **equivocado con seguridad**, así que la capa nunca se activa
  y el dato malo entra al motor igual. Esta rama tapa el hueco 2 (el dato que se pierde en
  silencio); **no tapa la afirmación falsa**. Los 4 siguen esperando tu aprobación. → **todos** ·
  ⬜ los 4 siguen abiertos
- **[rama 4] 🔴 DOS BUGS NUEVOS de interpretación, de la misma familia que los 4** — los encontró
  la sonda en vivo, en casos donde el regex contesta con seguridad. Los dos son de una línea y los
  dos están en `interpretacion/composicion.ts`:
  - `"con mi señora y los peques"` → **`pareja`**, debería ser `familia_con_hijos`. `"peques"` no
    está en la lista de raíces de hijos (`hij|niñ|bebé|chiquit|pelad[oa]s`) y la rama de `señora`
    gana primero.
  - `"me toca criar sola a mi niña"` → **`familia_con_hijos`**, debería ser `monoparental`. La rama
    de monoparental exige la raíz `hij`, y "niña" no la tiene — aunque la rama de abajo sí
    reconoce `niñ`. O sea: las dos ramas no usan el mismo vocabulario de "hijo".
  → **P2** · ✅ **arreglados el 2026-07-26** — las dos ramas usan ahora **una sola** lista de raíces
- **[rama 4] `prompt-maestro.ts` NO tenía dueña en §2** y la rama 4 la necesitaba. La tomé. Si
  alguien más la necesita, avisar antes. → **todos** · ⚠️ para saber
- **[rama 4] El punto 8 se cerró SIN reescribir la prohibición.** En vez de cambiar
  `promptDuda:157` (que rompía `prompt-maestro.test.ts:43-46`, contra la regla de §3), se agregó
  **`promptRecomendacion` aparte**. El modo duda conserva la prohibición completa, y es correcto:
  ahí no hay motor detrás. Los dos modos dicen lo mismo, *el que escoge es el código*. Ningún test
  existente se tocó. → **todos** · ✅ resuelto
- **[rama 4] Hoy el lead NUNCA oía sus proyectos, y nadie lo había nombrado.**
  `ResultadoCurado.proyectos` es un `number`: lo único que se decía era el #1 dentro del
  ofrecimiento de cita ("puedes ir a ver ARAUCARIA"). El `porque` de los tres solo llegaba al
  asesor. Eso es lo que llena (b). → **P1 (rama 5), hay que cablearlo** · ✅ listo
- **[rama 4] Cómo se cablea (b), para P1.** `POST /api/chat { modo: "recomendacion", lead }` →
  streamea el mensaje. Va en `terminar()`, **entre `mensajeCierre` y `ofrecerFranjas`**. El
  fallback sin IA es `mensajeRecomendacionDeterminista(proyectosParaVerbalizar(lead))`, que
  devuelve `null` cuando no hay nada que decir (nutrición) — con `null` no se pinta nada. Viaja el
  `lead` y no la lista porque la lista no existe en el cliente, y calcularla server-side evita
  cambiar `lib/types.ts`, que es de P3. → **P1 (rama 5)** · ✅ listo para cablear
- **[rama 4] 🔴 Ratificar: el copy del mensaje de recomendación SIN IA.** El aprobado fue el
  prompt; este es su derivado, y existe porque el demo no puede depender de que Gemini esté vivo.
  Dice menos a propósito: nombra los proyectos con su precio "desde" (dato duro del catálogo) y
  manda el porqué al asesor, en vez de resumir tres `porque` en una frase que ya no sería citable.
  Cabe en las 3 líneas y 4 frases del guard, con test que lo verifica.
  → *«Con todo lo que me contaste, estos son los que te sirven: LA ARBOLEDA (desde $194.023.050),
  MONGUI (desde $179.361.000) y VERSALLES (desde $211.000.000). El asesor te lleva el detalle de
  cada uno y por qué te los escogí.»* → **todos** · ⬜ abierto
- **[rama 4] 🔴 Para P5: el `porque` del matcher ahora lo LEE EL LEAD, no solo el asesor.** Sube el
  listón de un texto que se escribió para la ficha. Dos cosas que ya se ven en los personajes
  sembrados: (a) mezcla persona — *"es el proyecto por el que **preguntó**"* junto a *"como
  **tú**"*; (b) VERSALLES trae *"el **0%** gana más de 2 salarios mínimos, **como tu hogar**"*, que
  se contradice solo. Sara lo reescribe al redactar, pero el fallback determinista no, y el asesor
  lo ve tal cual hoy. → **P5** · ⬜ abierto
- **[rama 4] Excepción consciente a una restricción no-negociable de `AGENTS.md`.** `generarJSON()`
  (intérprete y, en su día, selector) **no va en streaming**. Las dos razones de esa regla —el
  límite de tiempo de Vercel y que el chat se vea vivo— no aplican a una clasificación de una
  palabra que nadie ve llegar, y streamearla obligaría a acumular el texto entero antes de
  validarlo. **Todo lo que el lead LEE sigue en streaming**, sin excepción. Anotado en `AGENTS.md`.
  → **todos** · ✅ documentado
- **[rama 4] Sonda contra Gemini vivo, 11 casos donde el regex se rinde** (Vertex,
  `gemini-2.5-flash`): **487–725 ms**, muy debajo del corte de 3 s. Rescata dato real
  (`"estoy viendo si vendo la que tengo"` → `true`; `"pues mas o menos, tuve un lio hace años"` →
  `regular`) y **se niega a inventar** donde importa (`"pues todavia lo estoy pensando"`,
  `"jajaja"`, `"ni idea"`, `"800"` → todos `undefined` → repregunta). El ingreso es el más
  conservador de todos: `"entre los dos juntamos como cinco y pico"` también sale `undefined`, que
  es el sesgo correcto para el insumo del gate del 40%. → **todos** · ✅ medido

### 2026-07-26 · los 6 bugs de interpretación — ARREGLADOS

Aprobados por Mani y arreglados con medición antes y después. **Los 3 personajes canónicos no se
movieron: 73 / 24 / 0**, y `db/seed.sql` regenera **sin una línea de diff**. Los 14 tests
`BUG CONGELADO` que fallaron al arreglarlos se voltearon a afirmar el arreglo, con su porqué.
**704 tests verdes.**

| # | Qué hacía | Arreglo | Dónde |
|---|---|---|---|
| 1 | `"pues no sé"` → `tiene_vivienda: false` | mirar la duda **antes** que la negación | `vivienda.ts` |
| 2 | `"treinta y ocho"` → `20_35` | `^treinta\b(?! y)` | `edad.ts` |
| 3 | `"ya salí de un reporte"` → `mala` | `sinTildes` en vez de `toLowerCase` | `crediticia.ts` |
| 4a | `"Más de 45"` escrito → `36_45` (el chip da `46_mas`) | `más de N` cuenta como N+1 | `edad.ts` |
| 4b | `"El de mi caja…"` escrito → frase cruda | tabla de etiquetas canónicas | `subsidios.ts` |
| 5 | `"con mi señora y los peques"` → `pareja` | `peques?` entra a la lista de hijos | `composicion.ts` |
| 6 | `"me toca criar sola a mi niña"` → `familia_con_hijos` | **una sola** lista de raíces de "hijo" para las dos ramas | `composicion.ts` |

- **[bugs] 🔴 La causa raíz de tres de los seis es la misma, y es una trampa de JavaScript: `\b` no
  es de fiar en español.** `\b` se define sobre `[A-Za-z0-9_]`, así que **las vocales acentuadas y
  la `ñ` NO son caracteres de palabra**. Dos consecuencias medidas, en direcciones opuestas:
  - `/\bno s[ée]\b/` **nunca** casaba con "no sé" (no hay frontera entre `é` y el espacio: los dos
    son "no-palabra"). Fue el primer intento de arreglo del bug 1 y falló en silencio.
  - `/peques?\b/` **sí** casa dentro de "pequeño" (sí hay frontera entre `e` y `ñ`). Lo atrapó un
    test de control que escribí para el bug 5: `"con mi señora, algo pequeño"` entraba como
    `familia_con_hijos`.

  La salida es `sinTildes` primero, o un lookahead explícito. **Barrido hecho: no queda ningún otro
  `\b` pegado a un carácter acentuado en el repo.** → **todos** · ✅ documentado en el código
- **[bugs] Corrección a los docs del repo, no al código.** Se venía repitiendo (aquí, en
  `URGENTE-Y-NOTICIAS.md` y en el handoff) que `tiene_vivienda: false` *"habilita los subsidios de
  primera vivienda"*. **Es impreciso**: `recursos/index.ts:70` calcula `!tieneVivienda` sobre
  `=== true`, así que `false` y `undefined` disparan el recurso **igual**. Lo que de verdad costaba
  el bug, medido: el factor `ya_tiene_vivienda` de `scoring/index.ts:147` puntúa `false` como 1,0 y
  `undefined` como 0,5 sobre un peso de 0,10, o sea que la afirmación falsa **regalaba 5 puntos de
  100**, y la ficha del asesor afirmaba "No tiene vivienda propia" donde la verdad era "No
  informado". Sigue siendo grave; es grave por otra razón. → **todos** · ✅ corregido
- **[bugs] El hueco 2 pasó de 2 campos perdidos a 3, y NO es un retroceso.** En la conversación
  sucia de `conversaciones.test.ts`, `tiene_vivienda` dejó de inventar un `false` y ahora se declara
  vacío. **Perder el dato es mejor que afirmarlo falso**, y quién atiende ese vacío lo decide la
  rama 5 (punto 7). → **P1 (rama 5)** · ⬜ sigue abierto
- **[auditoría] 🔴 Un `BUG CONGELADO` que estaba en el código SIN entrada en la bitácora y sin
  dueño.** `entradas-sucias.test.ts:267`: cuando la persona contesta la zona con un deseo, un emoji
  o una ciudad sin proyectos, **el texto crudo entra a `zona_interes`** y el matcher lo trata como
  ubicación. `clasificarZona` **ya sabe** que no era un lugar (devuelve `tipo: "deseo"` o
  `"sin_reconocer"`), pero `respuestaZona` guarda el texto igual.

  Medido sobre el afiliado listo (2026-07-26), y **le cuesta una recomendación al lead**:

  | Lo que contestó | Proyectos |
  |---|---|
  | `"Bogotá"` | **3** — LA ARBOLEDA, MONGUI, VERSALLES |
  | `"cerca al colegio de los niños"` | **2**, y marcados *alternativa fuera de zona* |
  | `"en medellin"` | **2**, ídem |
  | `"🎉"` | **2**, ídem |

  Le decimos "no encontramos nada en tu zona" a quien **nunca nombró una zona**. El arreglo natural
  es no guardar como zona lo que `clasificarZona` ya clasificó como no-lugar; dónde queda entonces
  ese texto (que el asesor sí quiere leer) es la decisión. Toca `preguntas.ts` e `interpretacion/`.
  → **P2 decide y arregla · P5 tiene que saberlo** (cambia qué entra a `matchear`) · ⬜ abierto
- **[bugs] `data/sintetica/slots.json` estaba VIEJO en disco**, y no por esta tanda. Desde que el
  catálogo resolvió la ubicación de KARAKALI y VIBO ONCE (2026-07-25) nadie lo regeneró, así que la
  ciudad de esas dos salas de ventas decía *"Ricaurte o Bogotá (ubicación contradictoria entre
  hojas, sin confirmar)"* — texto que el lead vería al agendar. Regenerado. Es el recordatorio de
  por qué los 4 archivos generados se regeneran y no se editan. → **todos** · ✅ arreglado

---

## 9 · Protocolo de sincronización

1. **Commit frecuente.** `AGENTS.md` ya lo pide: los modelos borran cosas por accidente.
2. **Push apenas algo compile**, aunque esté a medias, si otra rama te está esperando.
3. **Rebase sobre `main`** antes de pedir merge; nunca merge de `main` hacia tu rama.
4. **Si tocas un archivo que no es tuyo, se rechaza el merge.** Sin excepciones.
5. **Nadie mergea la rama 5 hasta el final.** Es la que puede romper el demo.

---

## 10 · Verificación

**Por rama, antes de pedir merge:**

```bash
npm test && npx tsc --noEmit && npm run lint
```

**Ramas 6 y 8:** correr la sonda de 1.200 perfiles (5 ingresos × 5 zonas × 4 composiciones ×
3 edades × afiliado × subsidio) sobre `curar()` y pegar en la bitácora la concentración del #1 antes
y después. Hoy: **55% ZARZAL**.

**Ramas 2, 5, 6, 7 y 8:** regenerar el espejo (`npx tsx scripts/generar-seed.ts` + las fixtures
derivadas). `seed-espejo.test.ts` falla si quedó viejo.

**Antes de dar por cerrado — una sola persona, al final:**

1. `npm run dev` y recorrer los 3 personajes de punta a punta.
2. Probar en vivo las entradas sucias de la rama 1 sobre "soy yo", incluidas las 2 del banco.
3. Abrir `/asesor` con los 3 personajes sembrados y confirmar que la ficha se ve igual.
4. Probar con `GEMINI_API_KEY` vacía: el chat se completa, sin banco y sin intérprete.

⚠️ **Nunca correr `npm run build` con `npm run dev` encendido** (`AGENTS.md` — costó 20 min una vez).

**Orden de merge a `main`:** `1, 3, 6 → 2 → 7 → 4, 8 → 5`.

⚠️ **Cambió el 2026-07-26:** la rama 4 entró **antes** que la 7. Podía, porque difirió (c), que era
lo único suyo que dependía de los campos de la 7. Van en `main`: **1, 3, 2, 4**. Faltan **6, 7, 8 y
5**, y la 5 sigue siendo la última.
