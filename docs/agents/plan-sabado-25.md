# Plan del sábado 25 — el último día completo

> **Deadline duro: domingo 26 jul, 11:30 a.m. hora Colombia.** El domingo NO es un día de trabajo: es buffer. Todo lo que se entrega, se entrega el sábado.
>
> Estado al arrancar: el flujo corre de punta a punta, los 4 criterios de aceptación están construidos y probados (192 tests verdes), y el repo está limpio. Lo que falta es **decidir 10 cosas, grabar el video y no romper nada**.
>
> Contexto: [`auditoria-2026-07-24.md`](auditoria-2026-07-24.md) · [`handoff.md`](handoff.md) (entrada 21:00) · [`URGENTE-Y-NOTICIAS.md`](../URGENTE-Y-NOTICIAS.md)

---

## Lo primero, antes del café (Integrador · 20 min)

Bloquea a todos los demás. Si esto no está hecho a las 08:30, nadie puede probar nada real.

1. **Correr [`db/seed.sql`](../../db/seed.sql)** en el SQL Editor de Supabase. Hoy la URL pública muestra a Carlos con 0 proyectos y una cita en una sala de Medellín que no existe: son filas de pruebas viejas que pisaron a los personajes.
2. **Push a `main`** (el trabajo del viernes está commiteado sin pushear).
3. **Verificar producción**, los cuatro:
   ```
   curl -s .../api/leads | grep -o '"puntaje":[0-9]*'        # 74, 32, 0
   curl -s ".../api/citas?proyecto_id=la-arboleda&limite=3"  # 3 franjas
   curl -s ".../api/enriquecer?cedula=2000000001"            # match: true
   curl -o /dev/null -w "%{http_code}" .../asesor            # 200
   ```
4. **Avisar en el grupo: "prod verde, arranquen".**

---

## 08:30 · Sala de decisiones (30 min, cronometrada, los 5)

Son **10 decisiones abiertas**. Ninguna necesita debate largo: cada una viene con una recomendación por defecto. La regla es **decidir o aceptar el riesgo por escrito** — nada queda "pendiente".

| # | Decisión | Recomendación por defecto | Si se decide que sí, ¿quién? |
|---|---|---|---|
| 1 | ¿El LLM conduce la conversación (spec 02 D1-B)? | **NO.** A 30 horas del cierre, con el flujo determinista probado y el tono ya reescrito, el salto es riesgo puro sin ganancia visible en un video de 2 min | — |
| 2 | ¿Tabla de subsidios con montos reales (ticket 017)? | **SÍ, timeboxed a medio día.** Es el único factor del motor que hoy no puede cambiar el resultado | Datos & Motor |
| 3 | ¿Franja de impacto en `/asesor` (ticket 019)? | **SÍ, 1 hora.** El 27,1% vs. el 10% es la munición del pitch y hoy solo vive en el tablero | Datos & Motor |
| 4 | ¿El tablero entra al video? | **NO.** `spec.md §2` dice que no hay dashboard analítico y el clímax es la ficha. Queda como respaldo para preguntas del jurado | — |
| 5 | ¿La ficha llama al experto LLM, o la explicación se declara determinista? | **Determinista, y se dice como ventaja**: "el porqué no depende de que un modelo esté vivo". `/api/explicacion` hoy no lo consume ninguna pantalla | Calidad IA |
| 6 | ¿Se le pregunta la afiliación al lead sin match? | **NO en el demo.** Hoy se asume no afiliado (caso conservador) y está documentado. Cambiarlo toca la conversación a último minuto | — |
| 7 | ¿Ratificamos el 0,6% que estima la cuota? | **Sí, como heurística declarada.** La frase para el jurado: *"aproxima 20 años sobre el 70% del valor; no es fórmula bancaria certificada"* | — |
| 8 | ¿Ratificamos los pesos (0,45 capacidad / 0,20 similitud / …)? | **Sí.** La frase que los defiende está escrita en spec 03 D4 | — |
| 9 | ¿CHECK de proyectos en `≤ 3` (antes `0 ó 2-3`)? | **Sí, y se corrige la redacción del criterio 4.** Rechazar exactamente 1 proyecto perdía el lead entero, y eso choca con "nadie se descarta" | Integrador (1 línea en `spec.md`) |
| 10 | ¿"Propenso / no propenso" en la bandeja? | **NO.** Ya quedó en dos grupos con lenguaje que no suena a descarte ("Pueden comprar hoy" / "Todavía no pueden comprar") | — |

**Salida de la reunión:** alguien pega las 10 respuestas en el grupo y marca los checkboxes de `spec.md §7`. Son 5 minutos y es lo que evita que el domingo alguien diga "yo pensé que…".

---

## Addendum 12:00 · lo que salió de la discusión de workflow

> Delta de este plan, no reemplazo. Desglose completo con la evidencia de cada punto en [`discusion-workflow-2026-07-25.md`](discusion-workflow-2026-07-25.md).

**Tres tickets nuevos, en este orden:**

| # | Qué | Quién | Cuánto | Por qué entra hoy |
|---|---|---|---|---|
| [023](../tasks/023-puente-capacidad-antes-del-proyecto.md) | 🔴 Capacidad primero, proyecto después | P2 | ~1 h | Es el **único defecto abierto que el jurado reproduce solo**: elegir un proyecto caro lo manda a nutrición con 0 proyectos aunque le quepan 13 de los 18. Los 3 personajes **no se mueven** |
| [024](../tasks/024-confirmacion-del-ingreso.md) | 🟠 Confirmar el ingreso | P3 | ~40 min | `2+2` se entiende como $2.000.000 y el acuse dice "ya puedo calcular con números reales". Es el insumo del único gate legal |
| [025](../tasks/025-metricas-del-mentor-baratas.md) | 🟡 Dos métricas del mentor | P2 | ~30 min | Solo si 023 y 024 están verdes. El tablero tiene 0 de las 5 que él pidió; dos ya tienen su dato guardado |

**Tres cosas que se dijeron en la sala y el código desmiente.** Importan porque se pueden decir en cámara:

1. **Nutrición no es por afiliación.** La única causa es el gate del 40%; el no afiliado sale `listo_restriccion_cupo` con proyectos y advertencia de cupo. Va al ensayo de preguntas del jurado de P5.
2. **El agente sí tiene system prompt** (28 líneas en `app/api/chat/route.ts`). El defecto del ingreso es TypeScript, no IA.
3. **Los dos "motores" ya existen** (`calcularScore` y `matchear`), y el "40% factorizado arriba" también (`precioMaximoDe`). Lo que falta es el puente, que es el 023.

**Se suma a "lo que NO se va a hacer":** banco de preguntas nuevo, agente viendo el score, y **botón de trigger masivo** (el contraargumento de la propia sala es el bueno: siete mensajes seguidos se ven peor que no tener el botón; el tope de frecuencia se dice en el pitch).

---

## El reparto (5 personas, sábado completo)

### P1 · Integrador — *dueño de que el demo esté vivo*

| Bloque | Qué | Listo cuando |
|---|---|---|
| 08:10 | Seed + push + verificación de prod | Los 4 `curl` en verde y avisado al grupo |
| 09:00–12:00 | **Recorrido de aceptación en la URL pública** ([ticket 014](../tasks/014-recorrido-criterio-4.md)): los 3 personajes + "soy yo", de punta a punta, **sin tocar código** y anotando todo lo que chirríe | Una lista de defectos priorizada, no una impresión |
| 12:00–17:00 | Arreglar lo que salga del recorrido y del QA de P3. **Solo eso**: es el dueño del `main` verde | `npm test`, `tsc`, `lint` y build verdes antes de cada push |
| Todo el día | Cadenero del merge: nadie entra a `main` sin recorrido verde | — |

**Lo que NO hace:** features nuevas. Su trabajo es que lo que existe no se caiga.

---

### P2 · Datos & Motor — *el único que toca `lib/scoring/`*

| Bloque | Qué | Listo cuando |
|---|---|---|
| 09:00–12:30 | **[Ticket 017](../tasks/017-tabla-subsidios.md) — tabla de subsidios.** 2-3 subsidios reales de Colsubsidio con monto y **fuente citada**. El motor resta el subsidio antes del corte del 40% | El factor deja de decir "sin monto verificado" y **aporta puntos**; test que lo prueba |
| | ⚠️ **Regla dura:** si a las 12:30 no hay una fuente citable, **se cae el ticket** y se queda la redacción honesta de hoy. Cero montos inventados (`AGENTS.md`) | — |
| 13:30–15:00 | **[Ticket 019](../tasks/019-franja-impacto.md) — franja de impacto en `/asesor`.** 3 cifras: % de leads que pasan el corte · % de no afiliados vs. el 10% que permite la regla · leads en nutrición con trigger. El registry de `lib/tablero/metricas.ts` ya las calcula: es portarlas | Se ven al abrir `/asesor`, cada una con su fuente escrita debajo |
| 15:00–17:00 | *Solo si sobra:* [016](../tasks/016-distribuciones-por-proyecto.md) → [018](../tasks/018-similitud-en-explicacion.md), la similitud real por proyecto | Hoy el factor declara que es neutro; es honesto, así que esto es mejora, no deuda |

**Después de tocar cualquier fixture:** `npx tsx scripts/generar-seed.ts` y volver a correr el seed. El test falla si se olvida.

---

### P3 · Calidad IA & Demo — *el jurado hostil*

| Bloque | Qué | Listo cuando |
|---|---|---|
| 09:00–12:00 | **QA adversarial del "soy yo"**: cédula inexistente, cédula de las 303, ingreso escrito raro ("no sé", "depende del mes", "2 y medio"), responder **escribiendo** en todos los pasos en vez de tocar chips, cerrar el navegador a mitad | Lista de defectos con pasos para reproducir, en el grupo |
| 12:00–14:00 | **Evaluar el output del LLM** contra [`explicaciones-referencia.md`](../explicaciones-referencia.md) con `GEMINI_API_KEY` local. Si no llega al estándar, se ajusta el prompt, no el estándar | Veredicto escrito: el conversador suena humano / no suena |
| 14:00–16:00 | **Revisión visual**: claro y oscuro, móvil, y la prueba de fuego — **¿alguna pantalla necesita que alguien la explique?** Si sí, está mal diseñada (`AGENTS.md`) | Recorrido en las dos temáticas, sin narración |
| 16:00–17:00 | Reexportar los **PNG de los diagramas 03, 04 y 06** (quedaron desactualizados) | `python scripts/check_diagramas.py` verde |

---

### P4 · Pitch & Video — *la mitad de la nota*

| Bloque | Qué | Listo cuando |
|---|---|---|
| 09:00–11:00 | **Actualizar el guion** ([`guion-video.md`](../pitch/guion-video.md)) con lo que cambió ayer: (a) el beat 2 ahora tiene **cita agendada dentro del chat** — es un plano nuevo y es el criterio 4; (b) ⚠️ **Diana ya NO responde el ingreso** (viene del enriquecimiento), así que el plano de "escribir en vez de tocar un botón" hay que hacerlo con **Carlos** o con "soy yo"; (c) los proyectos ahora son reales (LA ARBOLEDA, PAYANDÉ, LA MACARENA) | Guion cronometrado a 120 s duros |
| 11:00–13:00 | Ensayo en seco: recorrer el flujo leyendo el guion, cronómetro en mano | Cabe en 2:00 sin correr |
| 14:00–17:00 | **Grabación.** ⚠️ Calentar el lambda **justo antes de dar REC** (abrir el chat y mandar un mensaje): en frío Vertex tarda ~7 s y se ve el fallback. Grabar de corrido; si se corta varios minutos, recalentar | Tomas crudas de los 3 caminos + la ficha |
| 17:00–20:00 | Edición + voz en off + el tramo de implementabilidad (30 s, ya diagramado en [020](../tasks/020-tramo-implementabilidad.md)) | **Video final exportado** |

**Antes de grabar, sí o sí:** pedirle al Integrador que corra el seed. Una conversación de prueba pisa al personaje sembrado y la ficha sale con otros números.

---

### P5 · Producto / Mani — *decisiones, mentores y el freeze*

| Bloque | Qué | Listo cuando |
|---|---|---|
| 08:30 | Conducir la sala de decisiones (30 min, cronómetro) | Las 10 respuestas en el grupo |
| 09:30–11:00 | **Mentores**: enviar las [preguntas](../pitch/preguntas-mentores.md) que están listas desde ayer. Las dos que más valen: ¿el lead form puede pedir cédula? y ¿esperan tratamiento por canal o conversación única? | Enviadas, con hora |
| 11:00–13:00 | **README público**: el repo es el entregable. Qué es, cómo se corre, el link del demo, y qué es sintético y qué es derivado de data real | Un extraño lo entiende sin preguntar |
| 14:00–17:00 | **Ensayo de preguntas del jurado.** Las 6 que van a caer: *¿de dónde sale el 0,6%? · ¿el 40% es real? · ¿esto se lleva a producción? · ¿qué pasa si el LLM se cae? · ¿la data es real? · ¿por qué el no afiliado igual recibe proyectos?* | Cada uno sabe responder 2 sin dudar |
| **17:00** | **Declarar el FREEZE.** Nada nuevo entra: solo defectos del recorrido | Anunciado en el grupo |

---

## Los tres checkpoints (todos, 15 min, de pie)

| Hora | Pregunta única | Si la respuesta es "no" |
|---|---|---|
| **12:30** | ¿El recorrido de los 3 personajes corre en la **URL pública** sin narración? | Todo el mundo para y ayuda al Integrador. Nada más importa |
| **17:00** | ¿Está grabado el material del video? | Se corta scope: cae 016/018, cae lo que no se vea en cámara |
| **20:00** | ¿El video está exportado y el link del demo verde? | El domingo deja de ser buffer y se vuelve trabajo — hay que decirlo en voz alta |

---

## Reglas del día (las cuatro que ya nos costaron tiempo)

1. **Los 3 personajes SÍ se prueban** —son el demo, hay que recorrerlos— pero **terminar** su conversación pisa la fila sembrada (upsert por `lead_id`), así que la ficha pasa a mostrar lo que contestó quien probaba. Dos consecuencias prácticas: para probar **repetido** se usa "soy yo", y **se re-siembra antes de grabar y antes del checkpoint de las 12:30**. Recetario completo abajo.
2. **Nunca `npm run build` con `npm run dev` encendido.** Deja el puerto 3000 colgado y parece que la app se rompió. Si pasa: `curl` al puerto → `000` significa server caído, no bug.
3. **Tres archivos son generados, no se editan a mano:** `db/seed.sql`, `data/sintetica/slots.json` y las fixtures derivadas. Si tocas una fixture, **regenera** (`npx tsx scripts/generar-seed.ts`).
4. **Cero inventos.** Si un dato no tiene fuente, se declara como supuesto o no entra. Aplica a los montos de subsidio, a los precios y a cualquier cifra del pitch.

---

## Cómo probar sin romper el demo (recetario)

**Lo que pisa la fila sembrada** es *terminar* una conversación como Diana, Carlos o Yuliana: el guardado ocurre al final, en `/api/curar`, con un upsert por `lead_id`. Abandonar a mitad no persiste nada. Y arreglarlo cuesta 5 segundos (volver a correr el seed). Así que la regla no es "no los toques", es **"deja la base sembrada antes de que alguien mire"**.

### La forma sana de probar mil veces: "soy yo"

El formulario genera un `lead_id` único (`lead-<timestamp>`), así que **nunca toca a los 3 canónicos**. Y con la cédula se elige qué caso reproducir, porque el enriquecimiento ya resuelve las 303 identidades:

| Qué quieres ver | Cédula | Qué pasa |
|---|---|---|
| **El caso Diana** — no le repreguntan nada (criterio 1) | `2000000050` | Afiliado · Bogotá · más de 4 SMLV → no le preguntan ni ingreso ni ciudad. Sale `listo` con puntaje alto |
| **Apenas pasa** — el corte del 40% justo | `2000000001` | Afiliado · Bogotá · menos de 2 SMLV ($2.847.000) → la cuota del proyecto más barato le da 31,5%. Pasa, pero con poco margen |
| **El caso Carlos** — no afiliado, cupo 90/10 | `2000000003` | En la base pero NO afiliado → **sí le preguntan el ingreso** (de un no afiliado no se conocen ingresos), y sale `listo_restriccion_cupo` con la advertencia de cupo en cada proyecto |
| **El caso Yuliana** — sin match, se pregunta todo | `9999999999` (inventada) | Sin match → le preguntan hasta la zona. Para forzar **nutrición**, responder un ingreso de `1.500.000`: la cuota del proyecto más barato le da 60% |

Un detalle del formulario: el **proyecto de interés es opcional** (si se deja en "Todavía no tengo uno en mente", se califica contra el más económico del catálogo, que es el caso conservador). Desde el 2026-07-25 **se elige de una lista** con los 18 proyectos reales, agrupados por ciudad y con su precio desde — antes era texto libre, y un nombre mal escrito hacía que el sistema calificara contra otro proyecto **sin decirlo**.

### Limpiar la basura de pruebas (1 línea de SQL)

Las filas de "soy yo" se acumulan en la bandeja del asesor. Para barrerlas sin re-sembrar —las FK son `on delete cascade`, así que se llevan sus conversaciones y sus citas:

```sql
delete from leads where lead_id not in ('lead-001', 'lead-002', 'lead-003');
```

Y si además los canónicos quedaron pisados, entonces sí: [`db/seed.sql`](../../db/seed.sql) completo.

### Probar sin tocar la base para nada

Comentar `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_KEY` en `.env.local` y levantar `npm run dev`: todo cae a fixtures, `/asesor` muestra los 3 personajes desde el código y **no se escribe nada**. Sirve para QA de conversación, tono, contraste y modo oscuro.

⚠️ **Lo que NO sirve en ese modo:** la cadena completa. Sin DB, `/api/curar` responde 503, el chat lo dice en voz alta ("no se pudo guardar") y **no llega a ofrecer la cita** — así que el criterio 4 hay que probarlo contra Supabase, con "soy yo".

---

## Lo que NO se va a hacer (dicho ahora, no el domingo)

Para que nadie lo empiece a las 4 p.m.:

- WhatsApp real, Salesforce, DataCrédito, calendario real → **fuera de alcance por el brief**, y el tramo de implementabilidad ya explica cómo se enchufarían.
- Métricas de abandono por etapa → exigen guardar el lead desde que autoriza. **Es un cambio de contrato**, no una cifra más.
- Notas de voz, multi-canal construido, aprendizaje en línea → nombrarlos en el pitch, no construirlos.
- La rama con fecha del trigger de nutrición → hoy ninguna regla fallida es temporal, así que no hay qué mostrar.
