# spec — Curado de leads de vivienda

> Un **interesado en vivienda que llega por pauta** necesita **saber si puede comprar y cuál proyecto le sirve**, y logra **llegar al asesor con capacidad validada, proyecto y cita**, sin **sentirse interrogado ni quedar descartado si aún no puede**.

> [!NOTE]
> Frase de apuesta a **ratificar en el kickoff** (máx. 10 min). Deriva del borrador de [`mvp-layout.md`](mvp-layout.md) y no debería cambiar de fondo; si cambia, este spec cambia con ella.
>
> Este spec baja [`docs/mvp-layout.md`](mvp-layout.md) a contrato de producto. Lo que el layout dejó abierto se resolvió en la entrevista de `/spec` (2026-07-23) o quedó en el bloque 7. Nada aquí está inventado.

---

## 1. Qué hace

Un **workflow de curado de leads** que toma un lead de pauta digital (Meta, Google Ads, formulario web) y lo entrega al asesor comercial tan calificado como un lead orgánico: con capacidad de compra validada contra reglas explícitas, 2-3 proyectos recomendados con su porqué en lenguaje natural, y una cita agendada en sala de ventas.

El pipeline es **determinista y auditable**; la IA vive en dos puntos acotados: el conversador adaptativo y el experto que redacta el porqué y matchea proyectos. Toda decisión de corte es por reglas visibles.

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
- **No hay dashboard analítico** (funnel, CPL, cohortes). El panel de impacto, si entra, es una franja de 3 cifras dentro de la vista del asesor, no una superficie propia.
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

| Factor | Fuente | Naturaleza |
|---|---|---|
| Afiliación | `PERIODO_AFILIADO` (enriquecimiento) o pregunta | Determina la salida y la marca 90/10 |
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

1. **No repreguntar lo conocido.** Dado un lead cuya cédula existe en la base de identidades, cuando inicia la conversación, entonces el conversador no le pregunta ningún dato que el enriquecimiento ya devolvió y se lo dice explícitamente. *Verificable:* la intersección entre el set de campos preguntados y el set de campos enriquecidos debe ser vacía.
2. **Cero caja negra en el score.** Dado cualquier lead calificado (listo o de nutrición), cuando el asesor abre su ficha, entonces ve todos los factores del score con su valor y su aporte, más una explicación en lenguaje natural que cita cada factor. *Verificable:* el conteo de factores que el motor evaluó debe ser igual al conteo de factores visibles en la ficha.
3. **Nadie se descarta.** Dado un lead que no supera el corte, cuando el motor lo clasifica, entonces queda en nutrición con la regla exacta que falló y un trigger derivado de ella, y al pulsar "simular trigger" vuelve a la conversación. *Verificable:* ningún lead termina el flujo sin una de las 3 salidas, y todo lead en nutrición tiene razón y trigger no vacíos.
4. **El lead listo llega cerrable.** Dado un lead que supera el corte, cuando termina la conversación, entonces tiene entre 2 y 3 proyectos del catálogo con su porqué, una franja de cita registrada, y aparece en la cola del asesor con esos tres elementos visibles. *Verificable:* recorrido del demo de punta a punta sin narración.

## 6. Datos

### Qué trae el lead-evento (ingesta)

Nombre, celular, **cédula**, proyecto de interés y `fuente`. La cédula es la llave del enriquecimiento; su presencia en un lead form de pauta es un supuesto por validar (ver bloque 7).

### Qué aporta el enriquecimiento (sin preguntar)

Afiliación, ciudad, segmento y rango de ingreso, desde una **base sintética de identidades** generada a partir de las distribuciones reales del Excel y las buyer personas. La data real es anónima (no tiene cédulas), así que el "ya te conocemos" del demo se simula con esa base. Un lead sin match se perfila desde cero, que es el caso que hace visible la conversación adaptativa.

### Qué pregunta el conversador, y por qué

Los 4 que el brief lista como capacidad de compra ([brief:20](reto/perfilamiento-leads-03.md)), más la zona de interés para el matcher:

| Dato | Por qué | Cuándo |
|---|---|---|
| Rango de ingreso del hogar | Sin él no se puede evaluar el tope del 40% | Siempre que el enriquecimiento no lo traiga |
| Si ya tiene vivienda | Condiciona subsidios y prioridad | Siempre |
| Subsidios recibidos o aplicables | Pueden meter la cuota bajo el 40% | Siempre |
| Situación crediticia autorreportada | Señal de viabilidad sin tocar DataCrédito | Siempre |
| Zona / ciudad de interés | Insumo del matcher | Si el enriquecimiento no la trae |

**El set no es un guion fijo.** Personalizar la calificación es parte del reto, así que qué se pregunta, en qué orden y con qué redacción depende del perfil ya conocido. Un afiliado de segmento alto y un no afiliado sin datos no viven la misma conversación.

### Catálogo de proyectos

**18 proyectos oficiales** del reto, unión de las dos hojas de `Links brochures .xlsx` (16 con brochure, 17 con recorrido 360). Al repo entra una ficha derivada por proyecto en `data/sintetica/`, nunca el insumo original. Limpieza previa obligatoria: `VLR_VIVIENDA` ÷10.000 y la ubicación de `VIBO ONCE` / `KARAKALI`, que discrepa entre las dos hojas (Ricaurte vs Bogotá).

### Consentimiento y marco regulatorio

- **Habeas data (Ley 1581 de 2012).** El conversador pide autorización de tratamiento de datos **antes de preguntar nada**, y el consentimiento se registra con marca de tiempo en la DB. Cuesta un mensaje y es evidencia auditable.
- **Regla 90/10.** El estado de afiliado y el cupo del proyecto son datos de primera clase, no metadata.
- **Decreto 583 de 2025.** El tope del 40% se aplica y se cita textualmente en la explicación.
- **La data real nunca sale del entorno local.** `docs/recursos-reto/` está en `.gitignore`; lo público es sintético o derivado.

## 7. Supuestos por validar

- [ ] **¿Un lead form de pauta puede pedir la cédula?** Es la llave del enriquecimiento, pero pedirla en Meta/Google mete fricción justo donde el brief dice "sin sentirse como un interrogatorio". Preguntar a mentores. *Plan B si no:* celular como llave, con match más débil.
- [ ] **¿Qué sabe Colsubsidio en la vida real de un lead que llega por pauta?** Supuesto de trabajo: si es afiliado lo conocen, si no, no. Ya estaba abierto en [`mvp-layout.md` §7](mvp-layout.md).
- [ ] **El umbral del corte y el peso de cada factor.** El *qué* se evalúa está cerrado (tabla del bloque 4); el *cuánto pesa* y dónde cae la línea listo / nutrición, no. Se cierra en el ticket del motor con fundamento, no a ojo.
- [ ] **Reglas concretas de subsidio aplicable.** Cuáles subsidios, con qué requisitos y de qué monto. Sin esto el factor existe pero no calcula.
- [ ] **Trigger de nutrición con plazo estimado.** La inversa de la regla que falló está cerrada. Añadirle una fecha estimada de recontacto queda **abierto a discusión**: el riesgo es que se vuelva tedioso. La alternativa que Mani planteó es un flow que revise periódicamente a los que están en nutrición, en vez de calcularle una fecha a cada uno. Decidir en el kickoff.
- [ ] **Panel de impacto en la vista del asesor.** Alcance **opcional, no descartado**: 3 cifras (% de leads curados, horas comerciales ahorradas, alerta 90/10 por proyecto). Entra solo si sobra tiempo, y debe leerse como franja, no como dashboard.
- [ ] **Códigos griegos.** `SEGMENTO_POBLACIONAL` / `CATEGORIA` / `PIRAMIDE_NUEVA` vienen anonimizados. Decidir si se infiere el mapeo contra los % del PPT o se tratan como clusters anónimos. Afecta al matcher.
- [ ] **Convergencia multi-canal a WhatsApp.** ¿El reto espera tratamiento por canal o basta una conversación única? Preguntar a mentores.
- [ ] **Cruces Ministerio de Vivienda / buró.** ¿Demostrados o basta simularlos? Ya estaba en [`URGENTE-Y-NOTICIAS.md`](URGENTE-Y-NOTICIAS.md).
- [ ] **Esquema de la DB central.** Los campos que este spec implica están claros; el esquema formal se cierra en `/plan` y va como ADR.
- [x] **Stack.** ~~Sin decidir.~~ **Decidido 2026-07-23:** Next.js + Vercel + Supabase + API de Claude — ver [ADR 0002](adr/0002-stack-mvp.md). Feedback loops de [`AGENTS.md`](../AGENTS.md) ya llenados.
- [x] **Performance del conversador.** **Cerrado con el stack:** streaming obligatorio en toda llamada a Claude, primer token < 2s ([ADR 0002](adr/0002-stack-mvp.md)).

---

**Siguiente paso:** `/plan` para bajar esto a `docs/plan.md` + tickets en `docs/tasks/`. Antes conviene el kickoff, que cierra la frase de apuesta y los supuestos marcados como "decidir en el kickoff".
