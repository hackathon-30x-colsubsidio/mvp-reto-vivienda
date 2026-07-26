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

Los 91 tests actuales quedan **intactos** — si el refactor los rompe, el refactor está mal · seed
regenerable con `seed-espejo.test.ts` vigilando · **zod se agrega** · `/asesor` puede mostrar datos
nuevos **reusando bloques existentes** · a `main` entra lo que esté verde.

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

### Rama 2 · `feat/contrato-turno` — P2 · **RUTA CRÍTICA**

**Posee:** `lib/conversacion/acciones.ts` (nuevo), `lib/conversacion/interpretacion/**` (nuevos),
`lib/conversacion/preguntas.ts`, `lib/conversacion/desvio.ts`.
**Prohibido:** `ChatWhatsApp.tsx`, `guion-demo.ts`, `lib/types.ts`.
**Bloquea a:** ramas 4 y 5.

**Paso 1 — publicar el contrato en los primeros 30 minutos.** P4 está esperando esto. Commit + push
apenas compile, aunque el resto no esté.

```ts
export type AccionTurno =
  | { tipo: "responder_paso"; patch; acuse?; pulir? }
  | { tipo: "no_entendido"; campo; textoCrudo }      // hoy: {patch:{}} mudo
  | { tipo: "confirmar_dato"; ... }                   // hoy: respuesta.repreguntar
  | { tipo: "corregir_dato"; campo; patch; acuse }    // nuevo
  | { tipo: "responder_duda"; clase; proyecto? }
  | { tipo: "fuera_de_tema"; textoCrudo }             // nuevo
  | { tipo: "handoff_asesor" };
```

Validado con zod al borde, como `SalesToolCallSchema` de Motoko.

**Paso 2 — extraer los intérpretes** a `lib/conversacion/interpretacion/`, un archivo por campo,
funciones puras con su test. `preguntas.ts` queda solo con copy + wiring.

**Paso 3 — las ramas nuevas del union.** `no_entendido` **no cambia comportamiento por sí solo**:
hace visible lo que hoy es un `{patch:{}}` mudo. Quien decide qué hacer con él es la rama 5.

**⚠️ `interpretarTexto` sigue SÍNCRONO y PURO.** `guion-demo.ts:89` lo llama de forma síncrona y de
ahí salen `db/seed.sql` y las fixtures. Si lo vuelves `async`, revientas el seed. La capa de IA vive
afuera y la cablea la rama 5.

**🔴 CONSULTAR antes de escribir:**
- El copy del acuse de `corregir_dato`.
- El copy de `fuera_de_tema`.
- Cualquier cambio al texto de las 7 preguntas base o a sus acuses.

**Definición de listo:** `npm test` verde con los tests actuales **sin tocar** ·
`npx tsc --noEmit && npm run lint` · el contrato pusheado y avisado.

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

### Rama 4 · `feat/interprete-ia` — P4

**Posee:** `lib/conversacion/interprete-ia.ts`, `app/api/interpretar/route.ts`,
`lib/conversacion/recomendacion-parcial.ts`, `lib/conversacion/selector-banco.ts` (nuevos),
`lib/gemini.ts`, `app/api/chat/route.ts`.
**Prohibido:** `preguntas.ts`, `desvio.ts`, `ChatWhatsApp.tsx`, `lib/matching/**`.
**Depende de:** el tipo `AccionTurno` de la rama 2 · los campos nuevos de la rama 7 (para **c**).

**(a) Intérprete de respaldo.** Solo se invoca cuando la rama 2 emite `no_entendido`.
`POST /api/interpretar {campo, texto}` → salida estructurada validada con zod **contra el mismo enum
que produce el regex**. Fuera del enum → se trata como `no_entendido` → repregunta. Corte 3 s.

⚠️ **El ingreso.** Se acepta que la IA lo interprete, pero el monto que devuelva pasa igual por
`plausible()` (500 mil – 100 millones) y por la confirmación en voz alta que ya existe en
`interpretarIngreso:234`. Es el insumo del único gate legal (40%, Decreto 583 de 2025): un mal
parseo cambia el veredicto en silencio.

**(b) Recomendación verbalizada.** Cuando el lead pregunta qué le conviene, se corre `matchear()`
sobre el perfil parcial y el prompt de duda recibe **la lista cerrada que eligió el motor**, con su
`porque`. Sara solo redacta.

**(c) Selector del banco.** Recibe qué dimensiones quedaron sin saber y cuáles discriminan más entre
los proyectos que le quedan al lead; devuelve **un id del banco**, validado con zod. Id inexistente,
timeout o error → la capa no se activa.

**🔴 CONSULTAR antes de escribir:**
- **La reescritura de `prompt-maestro.ts:157`**, de *"nunca recomiendes"* a *"solo puedes nombrar
  los proyectos de esta lista"*. Es un cambio de personalidad y hay un test que lo fija
  (`prompt-maestro.test.ts:43`).
- El prompt del selector del banco: **qué le decimos que es "óptimo"** para preguntar algo.
- El prompt del intérprete: cómo se le pide que clasifique sin sesgar.

**Definición de listo:** con `GEMINI_API_KEY` vacía, los tres caminos fallan cerrado y el chat se
completa igual · zod rechaza correctamente una respuesta fuera del enum (test con salida falsa).

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
| 1 | Copy de las 4 preguntas del banco + sus chips | 7 | ⬜ abierto |
| 2 | Nombres de los campos nuevos en `lib/types.ts` | 7 | ⬜ abierto |
| 3 | Si "momento de compra" se pregunta o suena a apuro | 7 | ⬜ abierto |
| 4 | Respuesta a "¿eres un bot?" | 5 | ⬜ abierto |
| 5 | Copy del ofrecimiento de asesor tras 3 desvíos | 5 | ⬜ abierto |
| 6 | Copy de `corregir_dato` y de `fuera_de_tema` | 2 | ⬜ abierto |
| 7 | Qué hace el reducer con `no_entendido` a la segunda vez | 5 | ⬜ abierto |
| 8 | Reescritura de `prompt-maestro.ts:157` (prohibición de recomendar) | 4 | ⬜ abierto |
| 9 | Prompt del selector del banco: qué es "óptimo" | 4 | ⬜ abierto |
| 10 | Prompt del intérprete de respaldo | 4 | ⬜ abierto |
| 11 | Máximo de líneas del guard | 3 | ✅ **3 líneas y 4 frases** (2026-07-25) |
| 12 | Texto de la fila `sistema` cuando el guard bloquea | 3 | ✅ **cerrado** (2026-07-25) |
| 13 | Mediana vs. normalizar en el sesgo de similitud | 6 | ⬜ abierto |
| 14 | Valores de los tres bonos nuevos | 8 | ⬜ abierto |
| 15 | Redacción del `porque` cuando un bono se activa | 8 | ⬜ abierto |

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

### 2026-07-26 · rama 1 (escenarios) — 7 hallazgos, ninguno arreglado aquí

La red congeló el comportamiento actual y en el camino destapó esto. **Ninguno se tocó**: cada uno
lleva su test `⚠️ BUG CONGELADO` en `lib/conversacion/escenarios/`, así que el día que su dueño lo
arregle, el test falla — y esa falla es la señal de que se arregló, no un problema.

**Para P2 (rama 2 · intérpretes).** Los cinco salen de `preguntas.ts` y los cinco cambian lo que
llega al motor:

- **`interpretarVivienda` INVENTA "primera vivienda".** `"pues no sé"`, `"no sé todavía"` y
  `"no estoy seguro"` → `tiene_vivienda: false`. Causa: `NIEGA` atrapa el "no" de "no sé". No es
  pérdida de dato como el hueco 2 — es una **afirmación falsa**, y `tiene_vivienda: false` habilita
  los subsidios que solo aplican a primera vivienda. Es el peor de los siete. · ⬜ abierto
- **`interpretarEdad` clasifica mal los 36–39 escritos en letras.** `"treinta y ocho"` → `20_35`
  (debería ser `36_45`). Causa: la rama `^treinta\b` se evalúa **antes** que
  `treinta y (seis|siete|ocho|nueve)`, así que gana siempre. La edad alimenta la similitud, o sea
  que el error llega hasta qué proyecto se recomienda. · ⬜ abierto
- **`interpretarCrediticia` no normaliza tildes.** `"ya salí de un reporte"` → `mala`;
  `"ya sali de un reporte"` → `regular`. El regex `/sali|.../` no atrapa `salí`, y entonces cae
  hasta la rama de mora porque "reporte" contiene "report". **Quien escribe bien su español queda
  calificado peor.** `interpretarZona` sí usa `sinTildes` — unificar eso es exactamente el trabajo
  de la rama 2. · ⬜ abierto
- **Dos chips no valen lo mismo escritos que tocados**, contra la regla de spec 02 D4 y el
  comentario de `preguntas.ts:407`:
  - `"Más de 45"` escrito → `36_45`; el chip → `46_mas`. (`numerosDe` saca el 45 y `45 <= 45`.)
  - `"El de mi caja de compensación"` escrito → guarda la frase cruda; el chip → la etiqueta
    canónica `"Subsidio caja de compensación"`. Mismo patrón con `"mi casa ya"`.

  Hay un test nuevo que recorre **todos** los chips de **todos** los pasos y compara chip contra
  texto, con estos dos en una lista de excepciones nombrada. Al arreglarlos hay que sacarlos de esa
  lista o el test falla. · ⬜ abierto
- **Los intérpretes no fallan igual entre sí.** Ante algo que no entienden, `composicion_familiar`
  y `rango_edad` devuelven `{}` (pierden el dato), pero `situacion_crediticia` devuelve
  `sin_info` — que en la ficha se lee como "nunca ha pedido crédito". O sea que `"jajaja"` queda
  registrado como un hecho sobre su vida financiera. Cuando la rama 2 defina `no_entendido`, este
  caso tiene que entrar ahí y **no** seguir afirmando. · ⬜ abierto

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
