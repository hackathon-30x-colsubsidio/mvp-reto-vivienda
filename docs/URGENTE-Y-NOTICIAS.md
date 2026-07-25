# 🚨 Urgente y Noticias

> El documento más concreto y resumido del repo. Si solo vas a leer un archivo hoy, es este. Se actualiza cada vez que algo cambia el rumbo del equipo.
>
> El plan del día vigente es [`agents/plan-sabado-25.md`](agents/plan-sabado-25.md).

## 🔵 2026-07-25 (noche) — Arranca el plan de arquitectura del conversador: 8 ramas, 5 personas, propiedad de archivos asignada

**Lee [`agents/plan-arquitectura-conversador.md`](agents/plan-arquitectura-conversador.md) antes de tocar código.** Es el canal de sincronización de los 5 computadores y trae el reparto, el mapa de propiedad y la bitácora de hallazgos.

**Las dos reglas que hay que interiorizar ya:**

1. **Un archivo tiene una sola dueña.** `preguntas.ts` y `desvio.ts` son de P2; `ChatWhatsApp.tsx` y `guion-demo.ts` de P1; `lib/types.ts` y `/asesor` de P3; `lib/gemini.ts` y `/api/chat` de P4; `similitud.ts` y `lib/matching/` de P5. **Si tocas un archivo que no es tuyo, se rechaza el merge.**
2. **No asumas, consulta.** Un hallazgo que el plan no previó va a la bitácora del documento con el dueño etiquetado, no se resuelve por cuenta propia. Y **todo lo que el lead vaya a leer se consulta antes de escribirlo** — hay 15 puntos marcados `🔴 CONSULTAR`, y los copys del banco de preguntas están **todos sin escribir**.

**Qué cambia, en corto.** Se le pone al conversador la mitad de arriba del sándwich que hoy no tiene: un post-guard que valida lo que Gemini devuelve antes de pintarlo (hoy el stream va directo al cliente y las prohibiciones viven solo en el prompt), un contrato de turno explícito validado con zod, un intérprete de respaldo con IA para lo que el regex no entiende, un banco de preguntas por componente de vivienda, y el cableado de los brochures al matcher.

**⚠️ Dos cosas que chocan con lo que ya está escrito en este documento:**

- **Se levanta la prohibición de que Sara recomiende** (la entrada de las 15:30 dice lo contrario). Pero con una forma precisa: **el matcher decide y Sara solo verbaliza** lo que el motor eligió, con el `porque` ya calculado. La decisión sigue siendo determinista y auditable. La reescritura del prompt está marcada `🔴 CONSULTAR` y hay un test que la fija (`prompt-maestro.test.ts:43`).
- **El seed se va a regenerar en 5 de las 8 ramas.** Súmalo al pendiente rojo de abajo: **correr `db/seed.sql` en Supabase queda para el final**, después del último merge, no antes. Correrlo ahora es trabajo perdido.

**Lo que NO cambia:** la decisión 1 (el código conduce las 7 preguntas base) · el layout, ni un píxel · los 91 tests actuales, que quedan intactos como red · el demo funcionando sin IA.

## 🟢 2026-07-25 (noche) — Cerrados 023, 024 y 025; los recursos ya llegan al chat. Y dos cosas que cambian lo que se dice en cámara

**357 tests verdes, typecheck y lint limpios, todo en `main`.** Recorrido en el navegador con el LLM vivo.

**Lo que se arregló:**

1. **[023](tasks/023-puente-capacidad-antes-del-proyecto.md) — el único defecto que el jurado reproducía solo.** Quien entraba por un proyecto caro perdía el catálogo entero. Verificado en pantalla: un lead con $4.000.000 que elige **ARAUCARIA** pasa de *nutrición con cero proyectos* a **listo con LA MACARENA y cita agendada**. Y la ficha **lo dice**: *"la calificación NO se hizo contra ARAUCARIA… le daría una cuota del 121,6% de su ingreso… se calificó contra LA MACARENA, que sí le cabe"*. Cambiar de proyecto en silencio habría sido caja negra.
2. **[024](tasks/024-confirmacion-del-ingreso.md) — el ingreso ya no se adivina.** `2+2`, `-3` y `999999999999` dejaron de pasar como monto. Y el agente **devuelve el número que entendió** (*"hago las cuentas con $4.000.000 al mes — si me equivoqué, dime el número y lo corrijo"*), que en cámara se lee como cuidado. Lo que no logra leer lo repregunta **una vez**, nunca en bucle.
3. **La capa de recursos ya le llega al lead** (antes solo la veía el asesor). Con ella se cierra la decisión que estaba abierta: **el recurso reemplaza a la invitación a afiliarse**, no se suman. Le hablan a la misma persona de lo mismo, y el recurso además dice por qué y **cuándo cumpliría los 6 meses** que el subsidio exige.
4. **[025](tasks/025-metricas-del-mentor-baratas.md) — dos métricas del mentor** en el tablero: proyecto que más piden y canal que más trae. La de canal **declara en pantalla que no es atribución de campaña**, porque él pidió campaña y QR y eso no se captura.

**🔴 Dos cosas que hay que atender antes de grabar:**

- **🔴 Hay que volver a correr [`db/seed.sql`](../db/seed.sql) en Supabase. Es la única acción que queda y bloquea la grabación.** Medido contra la URL pública el 2026-07-25 en la noche, esto es lo que hay en la base:

  | lead_id | Nombre | Puntaje en la base | Debería ser |
  |---|---|---|---|
  | lead-001 | Diana Marcela Ríos | **65** | **73** |
  | lead-002 | Carlos Andrés Muñoz | 24 | 24 (su explicación **sí** está vieja) |
  | lead-003 | Yuliana Andrea Pérez | 0 | 0 |
  | lead-1785015727239 | Prueba Puente Capacidad | — | fila de prueba, se borra |
  | lead-1785015813435 | sebas | — | fila de prueba, se borra |

  **La ficha de Diana es el clímax del video (beat 3) y está mostrando un puntaje que el motor no calcula**: su fila la pisó una conversación de prueba. Además la explicación de Carlos dice *"cuota de PAYANDÉ ($1.053.000), el 36,9%"* cuando el motor calcula **$1.573.834 = 39,3%**. Correr el seed arregla las tres filas **y de paso barre las dos de prueba** (el archivo hace `delete` antes de sembrar). Después de correrlo hay que ver **73 · 24 · 0**.
- **Los puntajes que citan los docs están viejos: son 73 · 24 · 0, no 75 · 28 · 0.** Verificado contra el seed generado por el motor. Diana sigue **justo en el techo alcanzable** (que sigue siendo 75, no 100), así que la recomendación de no decir la cifra en cámara **no cambia** — pero si alguien la dice, que diga la de verdad.

**📣 Decisión de producto (Mani): el pitch NO habla del 27,1% vs. el 10%.** Con eso se **descarta el [ticket 019](tasks/019-franja-impacto.md)** (la franja de impacto) y hay que **reescribir el beat 0 del [guion](pitch/guion-video.md)**, que abría con esa cifra y la llamaba "la munición". El gancho pasa a ser el hueco real: la página de vivienda sin formulario y sin proyectos — *no existe el embudo*. ⚠️ Queda una decisión pendiente para Mani: la métrica **"Leads no afiliados"** del tablero sigue enunciando esa comparación y va marcada como la principal. No se tocó (el tablero ya estaba fuera del video); quitarla o dejarla es decisión suya.

## 💬 2026-07-25 15:30 — El jurado ya puede preguntarle a Sara en medio del chat (y pedir un asesor)

**Hecho**, en la rama `feat/026-sara-agente-y-ficha` (294 tests verdes). Hasta ahora, **cualquier cosa que el visitante escribiera se tragaba como respuesta al paso actual**: teclear *"¿cuánto vale?"* se parseaba como si fuera el dato que se le había pedido, y pedir un asesor —el trigger 3 de la operación real— no hacía nada. Es lo primero que hace cualquiera que abre un chat, así que era reproducible en el primer intento.

**Qué se puede decir en cámara ahora, y qué no:**

- **Sí:** *"pregúntale lo que quieras, no pierde el hilo"*. La duda se responde con el **catálogo real** y la **tabla de subsidios con fuente**, y **vuelve a la misma pregunta** — el paso nunca se salta.
- **Sí:** *"si pide un asesor, se lo decimos y queda en el hilo que el asesor ve en su ficha"*. La conversación sigue, para que llegue sabiéndolo todo.
- **Sí:** *"esto funciona aunque el modelo esté caído"*. La detección es TS puro y la respuesta sin LLM ya es correcta.
- **No:** que Sara recomiende o compare proyectos. Está **prohibido en el prompt**: consulta precios y ubicaciones, recomendar es del matcher determinista. Si alguien le pide que recomiende, le dice que en un momento le arma opciones.
- **No:** montos de subsidio. Se responde para qué sirve y quién puede pedirlo, **sin cifra**, porque las fuentes se contradicen.

✅ **Ya mergeada a `main`** (2026-07-25 noche, 338 tests verdes; detalle de la reconciliación en el [handoff](agents/handoff.md)). El orden acordado **023 → 024 → esta** no se cumplió: los tickets 023 y 024 siguen abiertos y no chocan técnicamente con esta rama. Decisiones en el [ADR 0006](adr/0006-prompt-maestro-y-desvio.md).

## ✅ 2026-07-25 14:00 — El 0,6% ya no existe: la cuota se calcula de verdad

**Hecho** (219 tests verdes). El motor ya no estima la cuota con un porcentaje plano: usa la **fórmula de anualidad** con parámetros que tienen fuente — **13% E.A.** (promedio del mercado 2026), **20 años**, y el **LTV del propio Decreto 583** (70%, u **80% si es VIS**). Detalle en [`credito-y-subsidios.md`](credito-y-subsidios.md) y en [spec 03 D2](specs/03-scoring.md), ahora `[CERRADA]`.

**Tres cosas que hay que saber antes de grabar:**

1. **Los puntajes de hoy son Diana 75 · Carlos 28 · Yuliana 0** (antes 74/32/0, con otra aritmética debajo). Diana queda **justo en el techo alcanzable**, que sigue siendo 75 y no 100. Lo seguro en cámara es no decir la cifra y hablar del **orden de la cola**; si se dice, se dice contra 75.
2. **A Carlos hubo que subirle el ingreso** de $2.850.000 a **$4.000.000**. PAYANDÉ es VIS, o sea que financia el 80% y su cuota es más alta: con el ingreso viejo se iba al 45% y **caía en nutrición**, perdiendo el personaje del 90/10. Con $4.000.000 queda en **39,3% — apenas pasa**, que es exactamente su historia y explica su puntaje bajo.
3. **Hay que volver a correr `db/seed.sql`.** Los factores y los puntajes sembrados cambiaron.

**Una consecuencia contraintuitiva que conviene tener lista para el jurado:** una VIS permite financiar **más** (80% vs 70%), así que **a igual precio su cuota mensual es más alta**. Por eso el matcher ahora calcula el techo **por proyecto** y no con un número plano — con uno solo, una VIS cara se colaba con la cuota por encima del 40%.

**Y dos calibraciones que decidió Mani, ya aplicadas:**

- **`RATIO_HOLGURA_PLENA` pasó de 20% a 30%.** Con la cuota real, exigir que fuera la mitad del tope legal para dar "holgura plena" comprimía todos los puntajes. El 30% no es a dedo: **era el tope legal anterior** (Decreto 145 de 2000, hasta que el 583 lo subió al 40%), así que ahora "holgura plena" significa *le cabría incluso bajo la norma más estricta de antes*. Efecto secundario, dicho: la banda quedó estrecha (30–40%), así que **todo el que esté por debajo del 30% satura en 45 puntos**.
- **El SMMLV pasó a $1.750.905** (2026, Decretos 1469/1470 de 2025). A quien contesta "gano 3 salarios mínimos" ya no se le calcula 23% menos, y el rango "3-5 SMMLV" de Diana ahora vale $7.003.620. ⚠️ **Esto mueve el umbral VIS del generador de ~$213M a ~$263M**: al regenerar `proyectos.json`, seis proyectos pasarían de no-VIS a VIS (ZARZAL, PAMPLONA, BOSQUE DE TURPIAL, RESERVA DE AGUAYACÁN, KARAKALI, SAMÁN) y su cuota subiría, porque la VIS financia el 80%. **No se pudo regenerar aquí** —los CSV del Excel real no viven en el repo—, así que el JSON conserva las banderas viejas. Está anotado en el script.

> ⚠️ **Para P2 (ticket 023):** esto tocó `config.ts`, `capacidad.ts`, `scoring/index.ts`, `matching/index.ts`, las fixtures y el seed. Si tu rama ya empezó, **rebasa antes de seguir**.

## 💳 2026-07-25 13:00 — El 0,6% de la cuota está mal, el SMMLV va un año atrasado, y Mi Casa Ya está apagado

Investigación con fuentes citables → [`credito-y-subsidios.md`](credito-y-subsidios.md). Cuatro cosas, y una cambia el pitch a favor.

1. ✅ **El 40% del Decreto 583 está bien** y aplica **sin distinguir VIS de no VIS**, como dice el motor. El mismo decreto además fija lo que faltaba: se financia **hasta el 70% del valor** (80% en VIS).
2. 🔴 **El 0,6% subestima la cuota entre 25% y 45%.** Con la fórmula de anualidad y las tasas de 2026 (13% E.A. promedio; **15,18% ponderada no VIS**, Superfinanciera, corte 19 jun 2026), la cuota real va de **0,70% a 1,00%** del valor a 20 años. El 0,6% equivale a **8,66% E.A.**, tasa que no existe en el mercado — ni a 30 años se llega. Y la cuota del banco **incluye los seguros** de vida e incendio/terremoto, que van en el mismo recibo. **Consecuencia: hoy aprobamos a quien el banco va a rechazar.** Con la cuota real, Carlos pasa de 36,9% a **48,3% → nutrición**.
3. 🔴 **El SMMLV del repo es el de 2025** ($1.423.500). El vigente es **$1.750.905** (+23%, Decretos 1469/1470 de 2025). A quien conteste *"gano 3 salarios mínimos"* se le calcula 23% menos de lo que gana. ⚠️ También mueve el umbral VIS del generador (150 SMMLV: de ~$213M a ~$262M), así que **varios proyectos cambiarían de categoría**.
4. 🟡 **Mi Casa Ya no tiene presupuesto en 2026.** El subsidio vigente es el de **las cajas de compensación** — el de Colsubsidio — hasta **30 SMMLV ≈ $52,5M**, y **solo para afiliados**. Esto es munición, no problema: con el programa nacional apagado, **afiliarse deja de ser un trámite y se vuelve la palanca financiera más grande del negocio**, lo que le da sentido nuevo a la regla 90/10 y al perfilamiento. (El monto exacto por tramo de la convocatoria de Colsubsidio **no está verificado**: hay que abrir su cronograma antes de poner una cifra en cámara.)

**Ojo con el orden de trabajo:** arreglar el 0,6% toca motor, fixtures y seed — **los mismos archivos del [ticket 023](tasks/023-puente-capacidad-antes-del-proyecto.md)**, que va en la rama de P2 y entra primero. No se toca desde otra rama. Y si se corrige, **hay que subirle el ingreso a Carlos** a ~$3.500.000 (2 SMMLV de 2026): ahí queda en ~39%, *apenas pasa*, que es exactamente su historia.

## 🔴 2026-07-25 12:00 — La discusión de workflow destapó UN defecto que el jurado puede reproducir

**Lo que hay que saber en una línea:** los dos motores ya existen, pero **el lead que elige un proyecto que no le cabe pierde el catálogo entero y cae a nutrición**, aunque le quepan 13 de los 18 proyectos. Desglose completo en [`agents/discusion-workflow-2026-07-25.md`](agents/discusion-workflow-2026-07-25.md).

**Medido, no supuesto** (mismo lead: ingreso $4.000.000, sin vivienda, crédito al día):

| Entrada | Salida | Puntaje | Proyectos |
|---|---|---|---|
| sin proyecto de interés | `listo_restriccion_cupo` | 65 | LA MACARENA, MONGUI, LA ARBOLEDA |
| eligió ARAUCARIA ($619.800.000) | **`nutricion`** | **0** | **ninguno** |

Su techo es $266.666.666. Cae por la vivienda que miró, no por su capacidad, y desde que el "soy yo" elige el proyecto **de una lista con los 18 y sus precios**, el jurado lo reproduce en el primer intento. Choca de frente con *"nadie se descarta"* y con el brief (*"recomienda proyectos acordes al perfil"*). → **[Ticket 023](tasks/023-puente-capacidad-antes-del-proyecto.md), ~1 hora, y los 3 personajes no se mueven** (Yuliana sigue en nutrición legítima: su techo es $100M y el proyecto más barato cuesta $149,7M).

**Lo segundo: el ingreso no se valida.** `2+2` se entiende como **$2.000.000**, `-3` como $3.000.000, y `no sé` no se repregunta. Es el insumo del único gate legal del sistema. ⚠️ **No es el system prompt** (existe y es estricto): el parseo es TypeScript y el LLM no está en ese camino. → [Ticket 024](tasks/024-confirmacion-del-ingreso.md), ~40 min.

**Tres cosas que la sala dio por ciertas y el código desmiente** (importan porque se pueden decir en cámara):

1. **Nutrición NO es por afiliación.** La única causa es el gate del 40%. El no afiliado sale `listo_restriccion_cupo`, con sus proyectos y su advertencia de cupo.
2. **El agente sí tiene system prompt** ([`app/api/chat/route.ts`](../app/api/chat/route.ts), 28 líneas).
3. **El tablero no tiene ninguna de las 5 métricas del mentor.** Dos de ellas (proyecto con más interacción, canal de ingreso en grueso) cuestan media hora porque el dato ya se guarda → [ticket 025](tasks/025-metricas-del-mentor-baratas.md), opcional.

**🌿 Cada uno trabaja en su rama y toca solo lo suyo.** El reparto con la **frontera de archivos de cada rol** y las **5 reglas de merge** está en el addendum de [`plan-sabado-25.md`](agents/plan-sabado-25.md). En una línea: **P2** → `feat/023-puente-capacidad` (motor, matcher, fixtures, seed); **P3** → `feat/024-confirmacion-ingreso` (conversación y chat); **P4** → `docs/guion-y-video` (solo `docs/pitch/`); **P1 y P5** trabajan sobre `main`. **El 023 entra primero: hasta que esté mergeado, P4 no graba** porque el flujo que sale en cámara cambia.

**Y lo que se decidió NO hacer, para que nadie lo empiece a las 4 p.m.:** banco de preguntas nuevo, LLM conduciendo, agente viendo el score, botón de trigger masivo (siete mensajes seguidos se ven peor que no tener el botón: el tope de frecuencia **se dice**, no se construye), transcripción de audio en el servidor, y cambiar el enum de `fuente`.

> ⚠️ **La voz ya no es un pendiente: se puede contestar hablando** ([`useDictado.ts`](../components/chat/useDictado.ts), commit `c382f4b`). Es **dictado** del navegador (Web Speech API, es-CO): el texto cae en el campo, la persona lo corrige y entra por el mismo camino que una respuesta escrita. **No es una nota de voz guardada** —ningún audio se sube ni se persiste— y así hay que decirlo en el pitch. En la sala se habló de esto como algo por hacer; ya está hecho.

## 📋 2026-07-25 — Decisiones de Mani + los docs quedaron al día (audit completo)

**Lo que hay que saber en una línea:** el tablero **entra al MVP y al pitch**, la afiliación **nunca se le pregunta al lead** (sale de la cédula), **nadie se descarta ni por aritmética** (un solo proyecto viable ya no bota el lead), y los **pesos del motor quedan abiertos a propósito**.

**Las decisiones (van a los specs, no se re-litigan):**

| # | Decisión | Veredicto |
|---|---|---|
| 1 | ¿El LLM conduce la conversación? | **NO.** Conduce el código; el LLM pule el tono |
| 4 | ¿El tablero entra al video/MVP? | **SÍ** (cambia el default anterior). ⚠️ **Es un plano nuevo para el guion del video** |
| 5 | ¿La ficha llama al experto LLM? | **NO: la explicación es determinista, y se dice como ventaja** — no depende de que un modelo esté vivo |
| 6 | ¿Se le pregunta la afiliación al lead? | **NUNCA.** Sale de la cédula, como en la operación real; sin match se asume no afiliado (caso conservador) |
| 9 | ¿CHECK de proyectos en `≤ 3`? | **SÍ.** Los leads nunca se descartan: rechazar exactamente 1 proyecto perdía el lead entero. Y se muestran **varios proyectos potenciales**, no solo el de entrada |
| 10 | ¿"Propenso / no propenso"? | **NO.** Se adopta la agrupación del mentor, no su vocabulario |
| 3 · 7 · 8 | Franja de impacto · el 0,6% · los pesos | **ABIERTAS.** El 0,6% es supuesto nuestro (financia el 70% del valor, cuota ≈0,6% de eso ≈ 20 años); los pesos quedan calibrables a propósito |

**Y el audit de docs, que era el otro pedido.** Un agente fresco leía `plan.md` (del jueves), `prompts/` y `roles-recta-final` como si fueran vigentes, y arrancaba creyendo que la IA estaba caída y que el chat terminaba en `console.log`. Ahora: **`AGENTS.md` abre con "empieza aquí"** (plan-sabado-25 → handoff → URGENTE), **todo doc superado lleva banner `🔁 HISTÓRICO`** con su vigente, y ningún doc vivo afirma algo que el código desmienta.

**Tres cosas que el audit encontró y conviene saber antes del pitch:**

1. **El techo real del puntaje es 75, no 100 ni 90.** El subsidio aporta 0 a todo lead real (nadie pregunta el monto) y la similitud aporta la mitad fija. **Diana con 74 está a UN punto del máximo alcanzable**, no a 26. Si alguien dice "74 sobre 100" en el video, se está subvendiendo. ⚠️ Los 57 leads sintéticos del tablero **sí** traen subsidio, así que el promedio mezcla dos techos.
2. **`/api/match` y `/api/explicacion` no las llama ninguna pantalla.** No es deuda (decisión 5), pero que nadie invierta tiempo ahí creyendo que están en el camino del demo.
3. **El hilo de la conversación se guarda y nunca se lee.** Es la brecha más barata de cerrar y la que da paridad con lo que el asesor ya tiene hoy en su plataforma.

## 🟠 2026-07-25 15:00 — El matcher cambió (zona estricta + similitud real) y eso mueve TRES cosas que el equipo tiene que saber

Detalle completo en [`handoff.md` 2026-07-25 15:00](agents/handoff.md). **211 tests verdes, typecheck y lint limpios.** Lo que le cambia el día a cada quien:

1. **`db/seed.sql` cambió OTRA VEZ → hay que volver a correrlo en Supabase antes de grabar.** Los guiones de los 3 personajes ahora responden 2 preguntas nuevas y sus puntajes/proyectos los recalculó el motor con la similitud real. El seed viejo en producción muestra fichas que el código ya no produce.
2. **La ficha de Carlos cambió de narrativa: ahora recibe 1 SOLO proyecto (Payandé).** Es la zona estricta funcionando — Carlos es de Ricaurte y Payandé es lo único de su zona que le cabe. Antes recibía 3 de ciudades ajenas. Si el guion del video decía "3 proyectos marcados por cupo", ya no es verdad: ahora la historia es *"solo se recomienda donde quiere vivir, y se le dice por qué"*.
3. **`lib/types.ts` cambió (contrato entre tracks):** `respuestas` tiene 2 campos nuevos, `composicion_familiar` y `rango_edad` — el chat los pregunta ("¿con quién la compartirías?" y rango de edad) y la similitud los consume. Si tu track construye contra `Lead`, typecheck te lo va a decir.

**Y una decisión reversible a un solo punto:** las recomendaciones ahora citan % del PPT de buyer personas ("el 91% gana hasta 2 SMLV, como tu hogar"). Daniel duda de si esos números son distribuibles al público — si el equipo decide que no, se vacían las `evidencias` en `similitudCon()` (`lib/scoring/similitud.ts`) y desaparecen de ficha, porqué y prompt a la vez, sin tocar nada más.

## 🔴 2026-07-24 21:00 — HAY QUE CORRER `db/seed.sql` ANTES DE GRABAR (y los 4 bloqueantes ya están corregidos)

**Acción obligatoria de quien tenga la consola de Supabase: pegar [`db/seed.sql`](../db/seed.sql) en el SQL Editor y ejecutarlo.** Sin eso, el link público le muestra al jurado datos rotos.

**Qué encontró la auditoría en producción** (medido con `curl`, no supuesto): **Carlos aparecía con puntaje 0/100, cero proyectos y una cita en "Sala Medellín Poblado"** —ciudad que el catálogo real no tiene— y **Diana con situación crediticia "mala" y 70/100** en vez de su ficha curada. No era un bug del código actual: son filas de conversaciones de prueba corridas contra deploys viejos, que **pisaron a los personajes sembrados** (upsert por `lead_id`, tal como avisa el ticket 006). El seed las borra y vuelve a sembrar.

> ⚠️ **Regla de operación hasta el domingo:** probar el chat con **cédulas y lead_id nuevos**, nunca con `lead-001/002/003`. Si alguien conversa como Diana en producción, hay que re-sembrar antes de grabar.

**Lo que se corrigió** (190 tests verdes, typecheck y lint limpios — detalle en [`handoff.md`](agents/handoff.md) y [`auditoria-2026-07-24.md`](agents/auditoria-2026-07-24.md)):

- **El criterio 4 ya se cumple: el lead listo sale con CITA.** No existía en el flujo vivo — el chat nunca ofrecía franjas y `slots.json` colgaba de ids que el catálogo real no tiene, así que pedir horarios devolvía **lista vacía sin fallar**. Ahora el chat ofrece 3 franjas del proyecto recomendado y persiste la elegida.
- **El criterio 3 ya se demuestra: el botón "simular trigger" vuelve a la conversación.** `app/page.tsx` no leía `?lead_id=` y el clic aterrizaba en el landing. Ahora retoma nombrando la razón original, sin repreguntar nada y sin volver a pedir el consentimiento.
- **La portada ya lleva a `/asesor`** con un clic (no había ningún enlace: el demo no era autogestionado).
- **Los 3 personajes viven en el catálogo real y sus números los calcula el MOTOR.** Diana 74 · Carlos 32 con 3 proyectos marcados por cupo · Yuliana en nutrición, a $110.286 de pasar. Se acabaron los 84/61/0 escritos a mano que el motor nunca produjo. `db/seed.sql` y `data/sintetica/slots.json` **ahora se generan** (`npx tsx scripts/generar-seed.ts` · `generar-slots.ts`) — no se editan a mano nunca más.
- **Tres cosas que se veían en pantalla y contradecían "cero caja negra":** el subsidio decía "Aplica" y aportaba 0 puntos sin explicar por qué; la similitud mostraba "~370 compradores" sin decir que es una derivación; y la regla fallida se mostraba como `cuota_ingreso_40`. Las tres arregladas, y el trigger ahora dice **cuánto le falta** para pasar.
- **La bandeja ya no separa al no afiliado en su propio grupo** debajo del afiliado: era una decisión ya tomada (spec 06 D7) que la pantalla deshacía.

**Sigue abierto y es del equipo, no del código:** el monto real de los subsidios (hoy el factor no puede bajar la cuota y lo dice), la similitud por proyecto, si al lead sin match se le pregunta la afiliación, y si el tablero entra al video de 2 minutos.

## 🎨 2026-07-24 18:50 — El design system de Colsubsidio reemplazó a "El formato sellado", y la consola del asesor cambió de forma

Rama `feat/consola-asesor`. **Si vas a tocar UI, esto te aplica: `DESIGN.md` cambió entero.**

**Por qué:** el repo tenía **dos** sistemas de diseño para el mismo producto. El del zip de Claude Design (`Colsubsidio Design System`) ya se estaba portando —`app/chat.css` es literalmente el puerto de su kit `lead-chat/`, y `public/marca/` son sus logos— pero la consola del asesor seguía en el mundo propio anterior. El producto tenía **una cara en cada sistema**. Decisión: gana el zip ([ADR 0004](adr/0004-design-system-colsubsidio.md)).

**Lo que cambió, y no es sutil:**

- **Fuentes, en toda la app:** Geist → **Sora** (títulos) + **Work Sans** (cuerpo) + **JetBrains Mono** (cifras). Esto toca también el chat y la landing, no solo el asesor: las fuentes viven en `layout.tsx`.
- **`/asesor` ahora es una consola lista/detalle:** barra lateral azul con el logo, lista de leads a la izquierda, ficha a la derecha. El asesor ya no pierde la cola al abrir un lead. En móvil la lateral colapsa y la lista se oculta en la ficha.
- **Se invirtieron reglas que eran duras:** ahora **sí hay sombras** (`shadow-xs` en tarjetas), **sí hay píldoras** (los sellos de estado) y los radios pasaron de 3/6px a 6/10/16px.
- **Los estados del score usan paleta propia** (verde / ámbar / azul), separada a propósito de la de marca. **Un chip amarillo ya nunca es un estado.**
- **Los datos simulados se marcan en violeta** (`EtiquetaSimulado`): los 57 leads sintéticos del tablero ya se distinguen de un vistazo.
- **Entró `lucide-react`.** Se acabaron los `→ ✓ ✗` a mano y el emoji en la consola.

**Lo que NO cambió:** `lib/` completo (scoring, matching, tablero, tipos), las rutas, el contrato de datos y el copy en español. **Los 173 tests pasan**, y los de `FichaLead` / `TablaFactores` —los que blindan "cero caja negra"— pasaron **sin editarse**, salvo una aserción que fijaba el glifo `"✗ No"` y ahora cuenta marcadores.

**Para quien escriba UI de aquí en adelante:** `globals.css` está en **tres capas y solo se edita la primera** (los tokens del kit, con sus nombres verbatim). Las otras dos son alias de compatibilidad y publicación a Tailwind. Si cambias un color, cambias un token — nunca un componente.

**⚠️ Pendiente de verificación humana:** el recorrido a ojo no se hizo (la automatización de navegador no estuvo disponible). Se verificó sirviendo el HTML y el CSS compilado del dev server: las 3 rutas en 200, la ficha con sus 7 factores completos, un solo `.resaltado` por pantalla y las utilidades resolviendo los tokens nuevos. **Falta mirarlo en pantalla, en claro y en oscuro, y en móvil.**

**Nota del merge (2026-07-25):** esta rama y la auditoría de las 21:00 tocaron la bandeja en paralelo y **llegaron por separado a la misma conclusión** — fundir "Listos" y "Listos · cupo 90/10" en un solo grupo, porque apilarlos volvía a poner al no afiliado debajo del afiliado sin importar el puntaje. Al mezclar se conservó **el copy de la auditoría** (cita el Decreto 583 y trae mensajes de vacío por grupo) sobre el layout de consola de esta rama. `GRUPOS` vive ahora en `ListaLeads.tsx` como fuente única: lo usan la lista y el panel derecho.

## ⚖️ 2026-07-24 18:40 — La afiliación ya no decide la cola: desempata

`afiliacion_cupo` pesaba **0,20** en el puntaje, el segundo factor más alto. Un afiliado arrancaba **18 puntos** arriba de un no afiliado idéntico, así que la regla 90/10 reordenaba la cola sola. **Bajó a 0,05** y los 0,15 liberados se fueron a la capacidad de pago (0,30 → **0,45**).

El respaldo es del mentor, textual: *"la prioridad siempre son los afiliados, **pero siempre va a ser la prioridad de los ingresos**"*. A Colsubsidio le interesa cerrar la venta; la afiliación solo debe decidir entre dos perfiles parecidos.

**Medido:** dos perfiles idénticos que solo difieren en afiliación quedan a **4,5 puntos** (75 vs 71); un no afiliado con $12M **le gana** a un afiliado con $2,6M (71 vs 42). Carlos pasó de 57 a **71**.

**Y las dos consecuencias también se soltaron (ratificado por Mani a las 19:00):**

- **El matcher ya no descarta por cupo.** El precio es el único descarte; los proyectos con el cupo copado se muestran **de últimos y con la advertencia encima** (*"hay que validar cupo antes de separar"*). **Carlos pasó de 0 a 3 proyectos.**
- **La cola ya no pone la afiliación por encima del puntaje.** `listo` y `listo_restriccion_cupo` son un solo grupo ordenado por puntaje; nutrición sigue de última porque todavía no puede comprar, no por afiliación.

**Esto supersede la decisión de las 13:50** (regla dura para no esconder el vacío). El hallazgo del 90/10 **no se pierde: cambia de lugar** — se dice en cada recomendación y se sigue midiendo en el tablero, en vez de aparecer como un lead vacío. ⚠️ **Los PNG de los diagramas 03, 04 y 06 quedaron por reexportar.**

## 🔌 2026-07-24 18:10 — La cadena quedó conectada, y apareció por qué NUNCA se guardó nada

> ✅ **La migración YA ESTÁ APLICADA** (Mani, ese mismo 2026-07-24; re-verificada contra producción el 2026-07-25). **No hay que volver a correrla** — lo único que sí se re-corre es `db/seed.sql`. El resto de esta entrada queda como registro de qué pasó.

~~**Acción obligatoria de quien tenga acceso a Supabase: pegar [`db/migracion-001-puntaje.sql`](../db/migracion-001-puntaje.sql) en el SQL Editor y ejecutarlo.**~~ Hecha.

**El hallazgo:** la tabla `leads` de producción **no tiene la columna `puntaje`**. Está en `db/schema.sql` desde que el tablero introdujo el puntaje 0–100, pero la base se creó antes y nunca se migró. Toda escritura rebotaba con `Could not find the 'puntaje' column of 'leads' in the schema cache`. Por eso ninguna conversación aparecía en Supabase: **no era el chat ni el motor, era una columna que no existe.** Diagnosticado corriendo `/api/curar` contra la base real, no leyendo código.

**Lo que se conectó (ticket [006](tasks/006-orquestador.md), la costura S4 — era el riesgo #1 del proyecto):** la conversación ya no muere en un `console.log`. Al cerrar, el `Lead` va a **`/api/curar`**, que califica con el motor, matchea proyectos, redacta el porqué y **persiste el lead con su hilo completo** de mensajes. Verificado contra la Supabase real: fila con 7 factores, 3 proyectos y las respuestas completas, más las filas de `conversaciones` (incluidas las de `sistema` para ingesta y consentimiento).

- **Mientras la migración no estuvo corrida, el demo NO se cayó:** se guardaba igual, sin puntaje, y **lo decía en voz alta** — en el chat y en los logs. Un demo que finge haber guardado es peor que uno que falla a la vista. Ese camino de compatibilidad sigue en `lib/leads-repo.ts` como seguro para una base nueva.
- **Sin autorización de datos no se persiste nada** (403). Habeas data, no cortesía.
- **Los 3 personajes, calificados con el catálogo real:** Diana `listo` 75/100 con 3 proyectos · Carlos `listo_restriccion_cupo` 57/100 con **0 proyectos** (los 18 tienen el cupo 90/10 agotado — la munición del pitch aparece sola) · Yuliana `nutricion` con su trigger.
- **⚠️ Correr una conversación PISA la fila sembrada de ese personaje** (upsert por `lead_id`). Es lo que pide el ticket 006, pero conviene saberlo antes del video.
- **⚠️ Cambio a un criterio de aceptación, para ratificar:** el CHECK de proyectos pasó de `0 ó 2-3` a `≤ 3`. Rechazaba exactamente 1 proyecto, y con eso **se perdía el lead entero** — choca con "nadie se descarta" ([ADR 0003](adr/0003-esquema-db-leads.md), enmienda).

## 💬 2026-07-24 16:45 — La conversación de WhatsApp dejó de sonar a encuesta, y **2 de las 3 brechas de datos quedaron cerradas**

Rama `feat/conversacion-humana`. Lo que se está vendiendo es *"algo que haces una vez en tu vida y probablemente al lado de otra persona"* (mentor), y el chat preguntaba como un formulario: pregunta, respuesta, siguiente pregunta, sin reaccionar nunca a lo que la persona acababa de contar.

**Qué cambió, en una línea cada uno:**

- **Cada pregunta dice para qué sirve antes de preguntar.** El ingreso pasó de *"¿cuál es tu rango de ingresos mensuales?"* a *"solo la uso para no mostrarte casas que después te aprieten el bolsillo"*.
- **Cada respuesta recibe un acuse** antes de la siguiente pregunta. **No pasan por el LLM**: son instantáneos, así que humanizan sin costar latencia ni tocar el blindaje de 3s.
- **El input libre ya nunca desaparece.** Los chips conviven con el campo de texto en todos los pasos y escribir vale lo mismo que tocarlos. Ingreso y zona siguen **sin chips**: ahí la lista sesga (es literal del mentor).
- **El agente tiene nombre (Sara)** y saluda con el proyecto por el que entró el lead, como la operación real de click-to-WhatsApp.
- **Orden nuevo:** primero lo que ilusiona (*¿tu primera vivienda?*), después lo incómodo (ingreso, crédito).

**🟢 Brechas cerradas:** `situacion_crediticia` ya sale como el **enum** que espera el motor, y el ingreso **ya se obtiene como número** (entiende "4.500.000", "2 millones y medio", "3 salarios mínimos", "entre 2 y 3"; a quien ya trajo rango del enriquecimiento se le toma el **punto medio** sin repreguntarle). Si la frase es ambigua, no adivina. **🔴 Sigue abierta la del monto del subsidio:** nadie lo pregunta, así que el subsidio todavía no baja la cuota.

**⚠️ Dos cosas que el TEAM ratifica o tumba** (son las preguntas 3 y 6 del [spec 02](specs/02-conversador.md), respondidas provisionalmente para no dejar el motor roto; ambas se revierten en una línea): **el orden** de las preguntas, y que **el punto medio del rango** sirva como ingreso de quien ya venía perfilado.

**Lo que NO se tocó:** quién conduce la conversación (sigue el código, D1-A — la decisión 2 de abajo **sigue abierta**), el scoring, el matcher, y la pregunta de afiliación (sigue sin existir porque es decisión del TEAM).

## 📋 2026-07-24 — Hay specs por componente + diagramas, y **6 decisiones esperando al TEAM**

Existe [`docs/specs/`](specs/README.md): un spec por cada parte del MVP (ingesta · conversador · scoring · match+agenda · nutrición · dashboard) más el [diagrama unificado](specs/00-mvp-unificado.md), cada uno con su mermaid validado. También entró el digest de la [charla con el mentor](reto/charla-mentor.md) (el transcript crudo NO va al repo: es público).

**Es un borrador para decidir encima, no decisiones tomadas.** Cada spec separa el **QUÉ** (contrato con fuente citada) del **CÓMO** (propuesta discutible), y marca cada punto como `[CERRADA]`, `[HOY — así está construido]` o `[PROPUESTA — TEAM decide]`. Cada uno cierra con sus **Preguntas al TEAM**. Nada se cierra por omisión.

**🔴 Lo que hay que arreglar ya, y nadie lo había visto:** el motor necesita el ingreso como **número** y la conversación solo lo pregunta como **texto libre**. Nadie los conecta, así que **cualquier lead que entre por "soy yo" cae a nutrición, gane lo que gane**. Igual con el monto del subsidio (nunca se pregunta → el subsidio jamás baja la cuota) y con la situación crediticia (texto libre donde el código espera una categoría).

> **↑ Actualizado a las 16:45:** el ingreso y la situación crediticia **ya quedaron cerrados**; el monto del subsidio sigue abierto. Ver la entrada de arriba.

**Las 6 decisiones para la reunión**, en orden de urgencia:
1. **Cuál de las dos escalas de puntaje es la buena** — hoy la pantalla muestra un número distinto al que calcula el motor.
2. **¿El LLM conduce la conversación, o sigue conduciendo el código?** El mentor pidió que "enamore" y rechazó el chatbot de opciones; nosotros tenemos lo segundo construido y quedan menos de 48h. — **Sigue abierta, pero es menos urgente desde las 16:45:** el flujo determinista ya no suena a formulario ni encierra al lead en botones (ver la entrada de arriba). La pregunta ahora es si el salto vale el riesgo, no si hay que salvar el tono.
3. **Qué le decimos al no afiliado que califica y no tiene cupo** — los 18 proyectos ya tienen el cupo copado, así que hoy recibe cero proyectos. Es lo más delicado del demo y lo más potente del pitch.
4. **Los pesos del motor y el 0,6% que estima la cuota** — abiertos desde `spec.md §7`.
5. **¿La bandeja habla de "propenso / no propenso"?** Son las palabras del mentor, pero chocan con "nadie se descarta".
6. **Los IDs de `slots.json`** (`p-03`…) no existen en el catálogo real: las franjas no van a aparecer para proyectos reales.

Detalle completo en [`handoff.md`](agents/handoff.md), entrada del 2026-07-24 16:10.

## 🟢 2026-07-24 11:30 — IA en producción: diagnosticada y BLINDADA (Nico)

El 500 de `/api/chat` está **resuelto para el demo**. Ya no es hipótesis: es **cold start**. Medido en prod, 4 llamadas seguidas → `200·1.3s`, `200·2.0s`, `200·1.1s`, `500·7.5s`. **Lambda caliente = 1-2s (cumple el <2s); lambda frío = ~7s y a veces 500**, por el intercambio JWT→OAuth de la cuenta de servicio de Vertex que en frío no está cacheado. El fix de modelo-por-backend (`19f116b`) **sí está desplegado y funcionando** — el "build viejo" quedó descartado.

- **Blindaje puesto (Nico, Track A):** timeout de **3s con `AbortController`** en `ChatWhatsApp.tsx`. Si el LLM no da el primer token en 3s (frío), corta y muestra el texto determinístico en vez de congelar "escribiendo…" 7s. Con el primer token cancela el corte y deja fluir el stream. typecheck + lint + 91 tests verdes.
- **Decisión del equipo: se queda en Vertex** (gasta el crédito de $300, no la tarjeta). El demo es **video** → el lambda va a estar caliente → se verá el pulido del LLM en 1-2s.
- **🎬 Truco para grabar:** Vercel enfría el lambda tras unos minutos sin tráfico. **Justo antes de dar REC, manda un mensaje de calentamiento** (abre el chat, escribe algo). Graba de corrido; si cortas varios minutos, vuelve a calentar.
- **Pendiente (Rol Calidad IA / Track C):** `/api/explicacion` tiene el **mismo** riesgo de cold-start — su consumidor necesita el mismo blindaje. Opcional: hacer visible el error del server (hoy `controller.error()` da un 500 mudo).

## 🔴 2026-07-24 10:55 — La IA está CAÍDA en producción (dueño: Nico)

`/api/chat` y `/api/explicacion` devuelven **500 consistente a los ~6s** en https://mvp-reto-vivienda.vercel.app. El resto del demo está sano: `/`, `/asesor` y `/api/leads` responden 200 contra Supabase.

- **El demo NO se rompe.** El fallback determinístico del chat funciona (`ChatWhatsApp.tsx:108-127`): el jurado ve el mensaje, sin el pulido del LLM. **Pero cada mensaje se cuelga ~6s** en "escribiendo…" antes de rendirse — eso sí arruina el video.
- **NO es la credencial.** Si el JSON no parseara daría 503; da 500, o sea parsea y la llamada a Vertex es la que falla. La cuenta de servicio está verificada: autentica, tiene el rol y la Vertex AI API está habilitada.
- **En local funciona**: 0,82–1,33s de primer token por la ruta de Vertex. En producción llegó a responder **una vez, con 8,01s** — que igual **incumple el <2s** del ADR 0002. Sospecha (sin confirmar): el intercambio JWT→OAuth de la cuenta de servicio en un lambda frío. **Primer paso: leer los logs de Vercel.**
- **Trampa que ya costó dos deploys:** el modelo **depende del backend**. `gemini-2.5-flash` está retirado en AI Studio pero **vivo en Vertex**; los `gemini-3.x` **no existen** en Vertex. La tabla medida está en el comentario de `lib/gemini.ts`. Si tocas el modelo, mídelo contra el backend donde va a correr.
- **Decisión de costo, del equipo:** Vertex gasta el crédito de $300 pero hoy está caído; `GEMINI_API_KEY` de AI Studio está verificada a 1,68s pero cobra a la tarjeta. Con un timeout en el cliente el demo sobrevive con cualquiera.

Detalle completo, mediciones y los pasos sugeridos: `docs/agents/handoff.md`, entrada del 2026-07-24 10:55.
## 🎯 2026-07-24 — Grilling de scope: 10 decisiones + recast a 4 roles de cierre
Sesión de grilling (Mani) a ~48h del deadline. No tocó código; fijó el rumbo de la recta final. Detalle en [`handoff.md`](agents/handoff.md) (Memory, 2026-07-24 10:52).

**Recast del equipo a 4 roles de cierre** (cada quien conserva su código; mapeo por afinidad al track):
- **Rol 1 — Integrador** (ex-A): orquestador `/api/curar`, criterio 3, franjas en el chat, env vars de Vercel, smoke test de Gemini, lidera la integración del sábado.
- **Rol 2 — Datos & Motor** (ex-B): distribuciones por proyecto + `buyer_personas.json`, tabla de subsidios, trigger híbrido, enriquecimiento por cédula, franja de impacto.
- **Rol 3 — Calidad IA & Demo** (ex-C): catálogo real en el matcher, similitud en la explicación, evaluar contra las referencias, QA sin narración.
- **Rol 4 — Pitch & Video** (ex-D): guion + video, tramo de implementabilidad, preguntas a mentores, y **primero que todo: `plan-research` a privado**.

**Decisiones cerradas (no re-litigar):** subsidios = tabla fundamentada · trigger = híbrido (fecha solo si es temporal y derivable) · similitud = distribución por proyecto · buyer personas del PPT entran al workflow · griegos = clusters anónimos `[inferido]` · panel de impacto = franja timeboxed · cédula se sostiene + pregunta a mentor · video = screen recording real + tramo de implementabilidad.

**🔴 Dos fugas de data real, sin resolver hasta que Rol 4 actúe:** (1) `plan-research` es público con los 3 insumos de Colsubsidio (commit `8bc42eb3`) — ticket [021](tasks/021-plan-research-privado.md); (2) **en ESTE repo público**, `data/buyer-personas-vivienda.md` (commit `d07dbe3`) es una transcripción del PPT con **22 tablas de nombres de empresas reales** — ticket [022](tasks/022-sanear-buyer-personas-md.md). Ambas van en contra de la restricción no-negociable de `AGENTS.md`. Los agregados % del md sí sirven y alimentan el ticket [016](tasks/016-distribuciones-por-proyecto.md); lo que sale son los nombres propios.

**Tickets nuevos:** [016](tasks/016-distribuciones-por-proyecto.md)–[021](tasks/021-plan-research-privado.md). El video ([015](tasks/015-guion-y-video.md)) ya tiene dueño (Rol 4).

## ✅ Decisión tomada: vamos por VIVIENDA
El reto está **cerrado: Vivienda** (perfilamiento inteligente de leads). Registrado en `docs/adr/0001-eleccion-reto-vivienda.md`. **No se re-litiga.** El porqué corto: mejor balance de los 4 criterios, datos reales usables (Excel 4.142 compradores + buyer personas + brochure), demo autocontenido por WhatsApp, ROI clarísimo (CPL + horas comerciales) y gancho regulatorio 90/10.

## ✅ 2026-07-23 — Stack decidido: Next.js + Vercel + Supabase + Claude
Registrado en `docs/adr/0002-stack-mvp.md`. Lo que cada quien necesita saber **antes de escribir código**:
- **Un solo monolito Next.js (TypeScript, App Router)** deployado en Vercel — frontend y API routes juntos, auto-deploy al pushear a `main`. `main` siempre desplegable: es el link del demo.
- **Los datos estáticos NO van a base de datos**: son JSON en `data/sintetica/`, generados por un script Python que corre **solo offline** en `scripts/`. Python nunca en producción.
- **Supabase** solo para lo que muta: leads, conversaciones, citas (2-3 tablas).
- **La IA solo vive en 2 endpoints** (`/api/chat` y `/api/explicacion`), con `claude-opus-4-8` y **streaming obligatorio**. *(Superado: el proveedor pasó a Gemini esa misma noche, y desde el 2026-07-25 la explicación de la ficha es determinista — el LLM queda solo en el conversador.)* El scoring es TypeScript puro sin LLM — es la regla "cero caja negra".
- **El repo es público**: API keys solo en `.env` local (gitignored) y env vars de Vercel. Jamás en un commit.
- **Contratos entre tracks** (`Lead`, `Score`, `LeadCurado`) en `lib/types.ts` — cada quien construye contra fixtures, nadie espera al de al lado.
Feedback loops (`npm test` / `tsc --noEmit` / `npm run dev`) ya definidos en `AGENTS.md`. Siguiente paso: scaffold de Next.js + conectar Vercel y Supabase.

## ✅ 2026-07-24 — La DB existe y `/asesor` está en el link público
Track D mergeado a `main` (`db137f7`). El demo ya se recorre entero en **https://mvp-reto-vivienda.vercel.app** — landing y chat de A, `/asesor` de D. Esquema en [`docs/adr/0003-esquema-db-leads.md`](adr/0003-esquema-db-leads.md), SQL en `db/`.

- ~~**🔴 Falta un paso para que producción persista:**~~ *(Resuelto el 2026-07-24: la URL pública responde `origen: supabase`, medido con `curl`.)* Las env vars de Supabase están en el `.env` de una sola máquina. Hay que cargarlas en **Vercel → Settings → Environment Variables** y **redesplegar**. Mientras tanto el demo funciona con fixtures y lo avisa en pantalla (no miente, pero no guarda nada).
- **Nadie escribe a Supabase directo.** A y C llaman a `POST /api/leads` (recibe un `LeadCurado`) y `POST /api/citas` (persiste la franja elegida). Un solo lugar valida y mapea.
- **Los criterios de aceptación los enforcea Postgres**, no la revisión de código: un lead de nutrición sin trigger, o uno calificado sin factores, **falla el insert**. Verificado contra la DB real. Si tu track recibe un 422, es el dato, no el servidor.
- **A tiene pendiente cerrar el criterio 3** ([ticket 007](tasks/007-reenganche-nutricion.md)): el botón "simular trigger" ya lleva al chat con `/?lead_id=X&reenganche=1`, pero `app/page.tsx` no lee la URL todavía, así que el clic aterriza en el landing.
- **Ojo con el modo oscuro:** `globals.css` vuelve el body casi negro con `prefers-color-scheme: dark`. `/asesor` ya se blinda sola; quien construya otra pantalla con colores claros debería hacer lo mismo, o el jurado con el sistema en oscuro no verá nada.

## Qué hacer ya
1. **Cada quien toma su track y arranca HOY** — el reparto en 4 con tareas concretas, contratos y fixtures está en **`docs/reparto-inicial.md`**. Nadie espera a nadie: A hace el scaffold (~1h) mientras B limpia el Excel, C redacta explicaciones de referencia y D monta Supabase.
2. **Todo el equipo lee antes de codear:** `docs/spec.md` (el contrato de producto), `docs/adr/0002-stack-mvp.md` (las reglas del stack) y `docs/reparto-inicial.md` (tu track).
3. **Kickoff** (puede ser corto ya): ratificar frase de apuesta, contratos de `lib/types.ts`, umbrales del corte y esquema de la DB (ADR 0003). El trabajo de los tracks no se bloquea esperándolo.

## 2026-07-23 — Scope macro del MVP definido: leer `docs/mvp-layout.md`
Grill de scope hecho (Mani + Claude). **8 decisiones cerradas** (demo = viaje completo con clímax en la vista del asesor, WhatsApp simulado + disclaimer, nutrición demostrada con triggers condicionales, scoring de reglas transparentes + similitud con compradores reales + LLM explica, conversación adaptativa, bot agenda visita a sala de ventas, el no-afiliado sigue el flujo hacia una DB central, workflow orquestado con IA en puntos específicos) y las **abiertas marcadas para el kickoff**: frase de apuesta, curar el mermaid (es strawman), esquema de la DB de leads, vista del asesor, entrada del demo, métricas de performance del scoring. El kickoff ya no arranca de cero: arranca de `docs/mvp-layout.md`.

## 2026-07-23 — Llegaron los datos reales de Vivienda: el reto se valida solo
Se agregaron los recursos oficiales en `docs/recursos-reto/` (Excel de 4.142 compradores, PPT de buyer personas, links de brochures/360). Análisis completo hecho hoy — esto es lo que cambia el juego:

- **27,1% de los compradores históricos NO son afiliados**, casi 3× el 10% que permite la regla 90/10. Y no es un promedio maquillado: **de los 16 proyectos con ubicación conocida, los 16 incumplen el límite** (desde 15,9% en Mongui hasta 63,1% en Araucaria). Esto es la cifra de impacto lista para el pitch — el problema no es hipotético, ya está pasando en el 100% de los proyectos analizados.
- **El Excel real NO coincide con lo que promete el brief.** No hay columna "afiliado" (se infiere de si `PERIODO_AFILIADO` está vacío), `VLR_VIVIENDA` trae 4 ceros de más (dividir entre 10.000 para el precio real, ej. 1.495.000.000.000 → $149,5M), y `SEGMENTO_POBLACIONAL`/`CATEGORIA`/`PIRAMIDE_NUEVA` vienen anonimizados con **letras griegas** (KAPPA, PI, OMEGA...) en vez de las categorías Básico/Medio/Alto/Joven o top/micro/estándar que promete el brief. Quien construya el motor de scoring tiene que limpiar esto primero — está detallado en la pestaña "Datos" del dashboard del equipo.
- El canal real medido en la data (columna `MEDIO`): 43,4% de las compras vienen de señalización física en punto de venta, solo 8,3% de canales digitales (WhatsApp+Redes+Web). Valida por qué la pauta digital hoy no convierte al mismo ritmo — exactamente el hueco que ataca el perfilador.

## Lo más importante que sigue abierto
- **Decisión pendiente:** qué hacer con los códigos griegos del Excel — ¿tratarlos como clusters anónimos (más honesto para el jurado) o intentar inferir el mapeo cruzando contra los % del PPT de buyer personas (más vistoso, más riesgo de estar mal)?
- Ver detalle completo en `docs/agents/handoff.md` (sección Memory) y en el dashboard del equipo (artifact con pestañas Solución/Datos/Hoy/Flujo/Equipo/Decisiones/Entrega).

## Preguntas abiertas de Vivienda (resolver por WhatsApp, no bloquean el arranque)
- ¿El cruce con **Ministerio de Vivienda / buró** se espera *demostrado* o basta con *inferirlo*? (Las integraciones reales están fuera de alcance según el brief.)
- **Convergencia multi-canal → WhatsApp:** ¿es válido que todas las fuentes de pauta converjan a una sola conversación de WhatsApp, o esperan tratamiento por canal? (También es decisión de producto del team.)
- **¿Qué info ya conoce Colsubsidio del lead que llega?** Supuesto de trabajo: si es afiliado lo conocen, si no, no. Averiguar cómo se sabría en real y qué campos trae un lead de pauta.
- **Premios:** persiste la discrepancia "1 ganador por reto + 3 globales" (apertura/`resumen-ceremonia.md`) vs "podio único de 3 monetario" (sitio oficial). Confirmar cuál rige. En cualquier caso: diseñar para *implementabilidad*, no solo para el demo.
