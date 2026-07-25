# spec — Curado de leads de vivienda

> Un **interesado en vivienda que llega por pauta** necesita **saber si puede comprar y cuál proyecto le sirve**, y logra **llegar al asesor con capacidad validada, proyecto y cita**, sin **sentirse interrogado ni quedar descartado si aún no puede**.

> [!NOTE]
> El kickoff formal nunca ocurrió: la ratificación de decisiones pasó a la **sala de decisiones del sábado 25** ([`docs/agents/plan-sabado-25.md`](agents/plan-sabado-25.md)). La frase de apuesta no cambió de fondo.
>
> Este spec baja [`docs/mvp-layout.md`](mvp-layout.md) a contrato de producto. Lo que el layout dejó abierto se resolvió en la entrevista de `/spec` (2026-07-23) o quedó en el bloque 7. Nada aquí está inventado.

---

## 1. Qué hace

Un **workflow de curado de leads** que toma un lead de pauta digital (Meta, Google Ads, formulario web) y lo entrega al asesor comercial tan calificado como un lead orgánico: con capacidad de compra validada contra reglas explícitas, 2-3 proyectos recomendados con su porqué en lenguaje natural, y una cita agendada en sala de ventas.

El pipeline es **determinista y auditable**; la IA vive en un punto acotado: el conversador adaptativo (pulido de tono en streaming). El matcheo es por reglas, y **el porqué que ve el asesor se redacta determinista** desde los factores que el motor ya calculó — decisión de la sala del sábado 25: no depende de que un modelo esté vivo, y se dice como ventaja. `/api/explicacion` (el experto LLM) existe como pulido opcional fuera del camino crítico. Toda decisión de corte es por reglas visibles.

Nadie se descarta. El lead que hoy no puede comprar cae a **nutrición** con la regla exacta que no pasó y un trigger de recontacto derivado de ella.

## 2. Qué NO hace

Del brief oficial ([`docs/reto/perfilamiento-leads-03.md`](reto/perfilamiento-leads-03.md):47-50):

- Estrategia de pauta o marketing.
- Integración real con CRM (Salesforce), DataCrédito o el bot actual del contact center.
- Aprobación de crédito hipotecario, promesa de compraventa, gestión documental.

Del grill de scope y de la entrevista de spec:

- **No corre sobre WhatsApp real.** Chat web con estética WhatsApp + disclaimer visible: "en producción corre sobre WhatsApp Business API". Video del flujo real es nice-to-have, no entregable.
- **No hay webhook real de Meta Lead Ads.** La ingesta es un lead-evento con esquema estándar; el multi-canal se demuestra por diseño, no construyendo canales.
- **No hay integración de calendario.** Las franjas de cita son slots simulados en la DB.
- **No hay analítica de marketing** (funnel, CPL, cohortes). — *Enmienda (sala del sábado 25, decisión 4):* la vista **Métricas** de la consola del asesor (`/asesor/tablero`: cifras operativas, serie diaria, reparto por afiliación) **sí es parte del MVP y del pitch**; lo que sigue fuera es la analítica de pauta. Detalle en [spec 06 D8](specs/06-dashboard-asesor.md).
- **No existe el estado "descartado".** Contradice el propósito social del reto; el corte tiene 3 salidas y ninguna es la basura.
- **No se construye más de un canal conversacional.**
- **La data real de Colsubsidio no entra al repo.** Lo que se versiona en `data/sintetica/` es derivado.

## 3. Usuario

**Usuario primario: el lead de pauta.** Persona que vio un anuncio de un proyecto de Colsubsidio y dejó sus datos. Su **momento de mayor tensión** es el minuto siguiente al clic: quiere saber si esto es para él y no tiene ni idea de si le alcanza. Hoy ese minuto se llena de silencio (espera a que un asesor lo llame) o de un formulario que lo trata como a todos los demás. Si lo interrogan, se va; si lo ignoran, se va.

Sub-caso crítico: el **no afiliado**. Por la regla 90/10 tiene espacio limitado, pero existe y compra (27,1% de los compradores históricos no son afiliados). No se le miente ni se le descarta: se le perfila igual y su lead se marca contra el cupo del proyecto.

**Usuario secundario: el asesor comercial.** Su tensión es la cola: hoy no sabe a quién llamar primero y quema horas en gente que no va a poder comprar. El endpoint del reto es suyo, y por eso es el clímax del demo.

## 4. Flujo (5 pasos)

1. **Entra el lead.** Un lead-evento con esquema estándar (nombre, celular, **cédula**, proyecto de interés, `fuente`: meta / google / web) llega a la ingesta y queda registrado con su fuente. Cualquier canal futuro emite el mismo evento.
2. **Se enriquece antes de hablar.** Con la cédula se consulta la base de identidades: si hay match, el sistema ya sabe afiliación, ciudad, segmento y rango de ingreso; si no hay match, no sabe nada y lo asume.
3. **Conversa lo justo.** El conversador pide autorización de tratamiento de datos, dice explícitamente qué ya sabe, y pregunta **solo lo que falta** para calificar. El set y el orden de preguntas se personalizan por perfil: no es un guion fijo.
4. **Califica, matchea y agenda.** El motor de scoring aplica reglas explícitas y produce una de 3 salidas. Si el lead pasa el corte, el matcher le recomienda 2-3 proyectos del catálogo con su porqué y el agendador le ofrece franjas de sala de ventas. Si no pasa, cae a nutrición con la regla que falló y su trigger.
5. **Todo aterriza en el asesor.** Listos y no listos caen a la misma DB central. El asesor ve una cola priorizada y, al abrir un lead, su ficha completa: score desglosado factor por factor, el porqué en lenguaje natural, los proyectos, la cita, o (si está en nutrición) la razón y el trigger.

### Las 3 salidas del corte

| Salida | Quién | Qué pasa |
|---|---|---|
| **Listo** | Afiliado que pasa el corte | Match + cita + tope de la cola del asesor |
| **Listo con restricción de cupo** | No afiliado que pasa el corte | Mismo tratamiento, marcado contra el 10% del proyecto. El asesor ve el cupo del proyecto al abrirlo |
| **Nutrición** | Cualquiera que no pasa el corte | Razón + trigger de recontacto. Botón "simular trigger" lo re-engancha en el demo |

### Factores del scoring (todos visibles, ninguno oculto)

> El motor emite **7 factores visibles, 6 con peso** (la afiliación se muestra sin peso: es desempate, no criterio). Esta tabla resume la naturaleza de cada señal; la lista exacta y sus pesos viven en [spec 03 D3-D4](specs/03-scoring.md) y `lib/scoring/config.ts`.

| Factor | Fuente | Naturaleza |
|---|---|---|
| Afiliación | `PERIODO_AFILIADO` (enriquecimiento por cédula) | Marca la salida 90/10 y **desempata** entre perfiles parecidos; no decide la cola. **Nunca se pregunta** (sala del sábado 25, decisión 6): sale de la cédula, y sin match se asume no afiliado — el caso conservador |
| Primera cuota estimada ≤ 40% del ingreso del hogar | Ingreso declarado + precio del proyecto | **Tope regulatorio duro**, no heurística |
| Subsidio aplicable | Perfil + preguntas | Puede bajar la cuota bajo el 40% |
| Ya tiene vivienda | Pregunta | Afecta subsidio y prioridad |
| Situación crediticia autorreportada | Pregunta | Señal, no verificación (DataCrédito está fuera de alcance) |
| Similitud con compradores reales | Excel de 4.142 compradores | Evidencia de respaldo, no criterio de corte |

El **40%** no es un supuesto del equipo: el [Decreto 583 de 2025](https://minvivienda.gov.co/normativa/decreto-0583-2025) (28 may 2025) modificó el art. 2.1.11.1 del Decreto 1077 de 2015 y fijó ahí el techo de la primera cuota sobre los ingresos del hogar, sin distinción VIS / no VIS (antes era 30%, por el Decreto 145 de 2000). Si la cuota estimada lo supera, el banco legalmente no puede prestar, y eso se le dice al lead y al asesor con la norma citada.

### Cómo entra el jurado

Landing con **3 personajes pre-sembrados** (afiliado listo, no afiliado listo, lead de nutrición): un clic arranca su conversación. Más un botón "soy yo" con formulario libre. Garantiza que los 3 caminos se vean en 2 minutos sin depender de que el jurado responda bien.

## 5. Criterios de aceptación

> Son **4, uno por cada tramo del demo** de 2 min ([`mvp-layout.md` §5](mvp-layout.md)). Se eligieron los 4 deliberadamente: cada uno defiende una restricción no-negociable distinta y ninguno es redundante.

1. **No repreguntar lo conocido.** Dado un lead cuya cédula existe en la base de identidades, cuando inicia la conversación, entonces el conversador no le pregunta ningún dato que el enriquecimiento ya devolvió y se lo hace saber explícitamente. **Hacérselo saber no es recitarle su ficha:** el mensaje dice que sus datos ya están y que no se los repreguntaremos, y *usa* lo que sabe (busca opciones en su ciudad) en vez de enumerarlo — el ingreso no se le menciona nunca, porque leerle sus propios datos suena a expediente ([spec 02, nodo 3](specs/02-conversador.md)). Quien ve la ficha completa es el asesor. *Verificable:* la intersección entre el set de campos preguntados y el set de campos enriquecidos debe ser vacía.
2. **Cero caja negra en el score.** Dado cualquier lead calificado (listo o de nutrición), cuando el asesor abre su ficha, entonces ve todos los factores del score con su valor y su aporte, más una explicación en lenguaje natural que cita cada factor. *Verificable:* el conteo de factores que el motor evaluó debe ser igual al conteo de factores visibles en la ficha.
3. **Nadie se descarta.** Dado un lead que no supera el corte, cuando el motor lo clasifica, entonces queda en nutrición con la regla exacta que falló y un trigger derivado de ella, y al pulsar "simular trigger" vuelve a la conversación. *Verificable:* ningún lead termina el flujo sin una de las 3 salidas, y todo lead en nutrición tiene razón y trigger no vacíos.
4. **El lead listo llega cerrable.** Dado un lead que supera el corte, cuando termina la conversación, entonces tiene **hasta 3** proyectos del catálogo con su porqué, una franja de cita registrada, y aparece en la cola del asesor con esos tres elementos visibles. *Verificable:* recorrido del demo de punta a punta sin narración.
   > **Redacción corregida el 2026-07-25 (sala del sábado, decisión 9).** Decía "entre 2 y 3", y el CHECK de la DB rechazaba exactamente 1 proyecto: con eso **se perdía el lead entero**, que choca de frente con "nadie se descarta". Hoy el límite es `≤ 3` ([ADR 0003](adr/0003-esquema-db-leads.md), enmienda). El principio que manda: se le muestran **varios proyectos potenciales**, no solo el de entrada — y si el catálogo solo da uno, ese uno se entrega; el lead nunca se cae por aritmética.

## 6. Datos

### Qué trae el lead-evento (ingesta)

Nombre, celular, **cédula**, proyecto de interés y `fuente`. La cédula es la llave del enriquecimiento; su presencia en un lead form de pauta es un supuesto por validar (ver bloque 7).

### Qué aporta el enriquecimiento (sin preguntar)

Afiliación, ciudad, segmento y rango de ingreso, desde una **base sintética de identidades** generada a partir de las distribuciones reales del Excel y las buyer personas. La data real es anónima (no tiene cédulas), así que el "ya te conocemos" del demo se simula con esa base. Un lead sin match se perfila desde cero, que es el caso que hace visible la conversación adaptativa.

### Qué pregunta el conversador, y por qué

Los 4 que el brief lista como capacidad de compra ([brief:20](reto/perfilamiento-leads-03.md)), más la zona de interés para el matcher:

| Dato | Por qué | Cuándo | Cómo se responde |
|---|---|---|---|
| Ingreso del hogar | Sin él no se puede evaluar el tope del 40% | Siempre que el enriquecimiento no lo traiga | **Texto libre** — la lista sesga |
| Si ya tiene vivienda | Condiciona subsidios y prioridad | Siempre | Atajos + texto |
| Subsidios recibidos o aplicables | Pueden meter la cuota bajo el 40% | Siempre | Atajos + texto |
| Situación crediticia autorreportada | Señal de viabilidad sin tocar DataCrédito | Siempre | Atajos + texto |
| Zona / ciudad de interés | Insumo del matcher | Si el enriquecimiento no la trae | **Texto libre** |

**El set no es un guion fijo.** Personalizar la calificación es parte del reto, así que qué se pregunta, en qué orden y con qué redacción depende del perfil ya conocido. Un afiliado de segmento alto y un no afiliado sin datos no viven la misma conversación.

**Y el cómo pesa tanto como el qué.** El brief pide recoger esto "sin sentirse como un interrogatorio" ([brief:20](reto/perfilamiento-leads-03.md)) y el mentor lo subió de tono: la conversación tiene que **enamorar**, porque comprar vivienda *"es algo que haces una vez en tu vida y probablemente al lado de otra persona"* ([detalle](reto/charla-mentor.md#conversacion-deseada)). De ahí salen tres reglas que no son cosméticas: cada pregunta **dice para qué sirve** antes de preguntar, cada respuesta **recibe un acuse** antes de la siguiente, y el **campo de texto nunca desaparece** — los atajos son atajos, no la única salida. Contrato completo en [spec 02 D4](specs/02-conversador.md); las reglas de redacción viven en el encabezado de [`lib/conversacion/preguntas.ts`](../lib/conversacion/preguntas.ts).

### Catálogo de proyectos

**18 proyectos oficiales** del reto, unión de las dos hojas de `Links brochures .xlsx` (16 con brochure, 17 con recorrido 360). Al repo entra una ficha derivada por proyecto en `data/sintetica/`, nunca el insumo original. Limpieza previa obligatoria: `VLR_VIVIENDA` ÷10.000 y la ubicación de `VIBO ONCE` / `KARAKALI`, que discrepa entre las dos hojas (Ricaurte vs Bogotá) — **resuelta el 2026-07-25: los dos son de Bogotá**, con el material comercial oficial como fuente (Karakalí en Chapinero, Cra 15 # 63A-22; Vibo Once en el Centro, Cra 14 # 3-58 — ver [`docs/proyectos/`](proyectos/proyectos-colsubsidio.md)). No fue un criterio del equipo: fue una tercera fuente, mejor que las dos que se contradecían, porque trae la dirección.

### Consentimiento y marco regulatorio

- **Habeas data (Ley 1581 de 2012).** El conversador pide autorización de tratamiento de datos **antes de preguntar nada**, y el consentimiento se registra con marca de tiempo en la DB. Cuesta un mensaje y es evidencia auditable.
- **Regla 90/10.** El estado de afiliado y el cupo del proyecto son datos de primera clase, no metadata.
- **Decreto 583 de 2025.** El tope del 40% se aplica y se cita textualmente en la explicación.
- **La data real nunca sale del entorno local.** `docs/recursos-reto/` está en `.gitignore`; lo público es sintético o derivado.

## 7. Supuestos por validar

- [ ] **¿Un lead form de pauta puede pedir la cédula?** Es la llave del enriquecimiento, pero pedirla en Meta/Google mete fricción justo donde el brief dice "sin sentirse como un interrogatorio". Preguntar a mentores. *Plan B si no:* celular como llave, con match más débil. **Grilling 2026-07-24: se sostiene** la cédula en el demo (ya construido, es el momento wow del criterio 1); Rol 4 lo pregunta al mentor hoy y solo si dicen no se pasa al plan B. — **Evidencia nueva (charla con el mentor, 2026-07-24): la piden sí o sí.** Es lo que resuelve afiliado / no afiliado, y si eres afiliado *no te piden nada más* porque ya tienen la data ([detalle](reto/charla-mentor.md#autorizacion-de-datos)). Falta que el TEAM marque el checkbox.
- [ ] **¿Qué sabe Colsubsidio en la vida real de un lead que llega por pauta?** Supuesto de trabajo: si es afiliado lo conocen, si no, no. Ya estaba abierto en [`mvp-layout.md` §7](mvp-layout.md).
- [ ] **El umbral del corte y el peso de cada factor.** El *qué* se evalúa está cerrado (tabla del bloque 4); el *cuánto pesa*, no. **Sigue abierto a propósito (sala del sábado 25, decisión 8): Mani dejó los pesos calibrables** — los valores de hoy (0,45 capacidad / 0,20 similitud / 0,15 subsidio / 0,10 vivienda / 0,05 crediticia / 0,05 afiliación) son una propuesta defendible con su razón escrita en [spec 03 D4](specs/03-scoring.md), no un número absoluto. Lo que **sí** está cerrado es la línea listo / nutrición: la fija el gate legal del 40%, no un umbral elegido.
- [ ] **El 0,6% que estima la cuota mensual.** Es la heurística que convierte precio en cuota: se asume que el lead financia el **70%** del valor (30% de cuota inicial) y que la mensualidad es el **0,6% de lo financiado**, lo que aproxima un crédito a ~20 años con tasas colombianas típicas. De ahí sale la cuota que se compara contra el 40% del Decreto 583. **No es un dato de Colsubsidio ni fórmula bancaria certificada: es un supuesto nuestro, y se declara como tal ante el jurado.** Pendiente de ratificar (sala del sábado 25, decisión 7).
- [x] **Reglas concretas de subsidio aplicable.** ~~Sin esto el factor existe pero no calcula.~~ **Cerrado en el grilling 2026-07-24:** tabla simple de 2-3 subsidios reales de Colsubsidio con montos y fuente citada (cero inventos); el motor resta el subsidio de la cuota antes del corte del 40%. Ticket [017](tasks/017-tabla-subsidios.md).
- [x] **Trigger de nutrición con plazo estimado.** ~~Añadirle una fecha estimada queda abierto a discusión.~~ **Cerrado en el grilling 2026-07-24: híbrido.** La fecha entra solo cuando la regla fallida es **temporal y derivable del dato del lead** (ej. antigüedad de afiliación → fecha exacta de recontacto); en el resto (cuota>40%, subsidio) queda condición pura. Cero fechas inventadas. El personaje de nutrición del demo es el caso CON fecha.
- [x] **Panel de impacto en la vista del asesor.** ~~Opcional, no descartado.~~ **Cerrado en el grilling 2026-07-24: entra como franja** de 3 cifras (% leads curados, horas comerciales ahorradas, alerta 90/10 por proyecto), **timeboxed a medio día** y lo primero que se corta si el sábado aprieta. Ticket [019](tasks/019-franja-impacto.md).
- [x] **Códigos griegos.** ~~Decidir si se infiere el mapeo o se tratan como clusters anónimos.~~ **Cerrado en el grilling 2026-07-24: clusters anónimos ante el jurado.** El mapeo descifrado viaja solo como etiqueta `[inferido]` (ya es como lo implementó Track B en `generar_sintetica.py`), nunca presentado como oficial.
- [ ] **Convergencia multi-canal a WhatsApp.** ¿El reto espera tratamiento por canal o basta una conversación única? Preguntar a mentores. — **Evidencia nueva (charla con el mentor, 2026-07-24): pidió literalmente "un centralizador que me vaya filtrando todo independientemente de dónde entre"** ([detalle](reto/charla-mentor.md#lo-que-ve-el-asesor)), lo que apunta a conversación única. También describió los 4 canales reales, que no son los que hoy acepta `LeadEvento.fuente` ([spec 01 D3](specs/01-ingesta-enriquecimiento.md)). Falta que el TEAM lo cierre.
- [ ] **Cruces Ministerio de Vivienda / buró.** ¿Demostrados o basta simularlos? Ya estaba en [`URGENTE-Y-NOTICIAS.md`](URGENTE-Y-NOTICIAS.md).
- [ ] **Esquema de la DB central.** Los campos que este spec implica están claros; el esquema formal se cierra en `/plan` y va como ADR.
- [x] **Stack.** ~~Sin decidir.~~ **Decidido 2026-07-23:** Next.js + Vercel + Supabase + LLM en streaming — ver [ADR 0002](adr/0002-stack-mvp.md). El proveedor terminó siendo **Google Gemini** (`gemini-2.5-flash` en Vertex), no Anthropic: se cambió por disponibilidad de key y está registrado en la nota del ADR. Feedback loops de [`AGENTS.md`](../AGENTS.md) ya llenados.
- [x] **Performance del conversador.** **Cerrado con el stack:** streaming obligatorio en toda llamada al LLM, primer token < 2s ([ADR 0002](adr/0002-stack-mvp.md)).
- [x] **¿El LLM conduce la conversación?** **Cerrado en la sala del sábado 25 (decisión 1): NO.** El flujo determinista conduce y el LLM solo pule el tono ([spec 02 D1](specs/02-conversador.md), opción A).
- [x] **Vocabulario "propenso / no propenso" en la bandeja.** **Cerrado en la sala del sábado 25 (decisión 10): NO.** La bandeja va con dos grupos que no suenan a descarte ("Pueden comprar hoy" / "Todavía no pueden comprar").

---

**Estado (2026-07-25):** el flujo corre de punta a punta y los 4 criterios de aceptación están construidos y probados. El plan del día vigente es [`docs/agents/plan-sabado-25.md`](agents/plan-sabado-25.md); [`docs/plan.md`](plan.md) y sus tickets quedan como registro histórico del build.
