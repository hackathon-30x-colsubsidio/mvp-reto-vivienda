# Explicaciones de referencia (Track C)

> El estándar de calidad del "porqué". Escritas **a mano**, no por el modelo.
> Si el experto en vivienda no llega a este nivel, el prompt está mal, no el estándar.

Este documento tiene dos usos y los dos importan:

1. **Vara de medir.** El prompt del experto (`lib/matching/prompt-experto.ts`) se ajusta hasta que su output para estos 3 personajes sea comparable a lo de aquí abajo. La comparación es contra la [checklist de cobertura](#checklist-de-cobertura-criterio-de-aceptación-2), no contra el gusto de quien lee.
2. **Fallback del [ticket 010](tasks/010-fallback-conversador.md).** Si `/api/explicacion` no responde mientras el jurado recorre el demo, la ficha del asesor muestra el texto de este documento para ese personaje. El demo es autogestionado: nadie va a estar ahí para reintentar.

**Los personajes son los canónicos** de [`lib/fixtures/`](../lib/fixtures/) ([ticket 001](tasks/001-personajes-canonicos.md), dueño A). Los números de aquí salen de `lib/fixtures/scores.ts` y `lib/fixtures/leads.ts`; si el kickoff los mueve, se mueven ahí primero y este documento se reescribe encima.

## Las dos voces (convención del contrato)

Los dos campos de texto que produce el Track C no le hablan a la misma persona:

| Campo | Quién lo lee | Voz | Verificación |
|---|---|---|---|
| `LeadCurado.explicacion` | El **asesor**, en su ficha | Tercera persona, nombra al lead, resume el veredicto completo | Cita los 6 factores del score |
| `ProyectoRecomendado.porque` | El **lead**, en el chat | Segunda persona ("tu cuota", "tu ciudad"), corta y concreta | Cita los factores que hacen que **ese** proyecto le sirva |

Regla que cruza a las dos: **cero jerga bancaria**. El lead promedio de este flujo compra VIS. Nada de "capacidad de endeudamiento", "relación cuota-ingreso" ni "scoring". Se dice "lo que pagarías al mes" y "cuánto entra al hogar".

---

## 1. Diana Marcela Ríos — afiliada, pasa el corte

**Salida:** `listo` · Afiliada · Bogotá · 3-5 SMMLV · interés inicial: Torres de Bellavista

### `LeadCurado.explicacion` (la ve el asesor)

> Diana está afiliada a Colsubsidio, así que entra por el 90% de la cuota de afiliados y no compite por el cupo restringido. La primera cuota estimada del proyecto le queda en el **32% de lo que entra al hogar**, holgada bajo el tope legal del 40% que fija el **Decreto 583 de 2025**, y eso es antes de aplicar **Mi Casa Ya**, el subsidio al que dice tener derecho y que baja la cuota todavía más. **No tiene vivienda propia**, lo que le conserva el subsidio y la prioridad. **Reporta estar al día con sus créditos**, sin mora (es lo que ella declara, no una consulta a centrales de riesgo). Y **se parece en un 84% a quienes ya compraron** en este proyecto: no es un perfil excepcional, es exactamente el que compra aquí. Llamarla es cerrar, no explorar.

### `ProyectoRecomendado.porque` (los ve Diana en el chat)

**Torres de Bellavista** (`p-07`)
> Es el proyecto por el que preguntaste y sí te sirve: la cuota mensual estimada es el 32% de lo que entra a tu hogar, cuando la ley te permite hasta el 40%. Queda en Bogotá, donde vives, y con Mi Casa Ya esa cuota baja todavía más.

**Reserva de los Cerros** (`p-12`)
> Te lo muestro porque está en el mismo rango de precio que Torres de Bellavista y también en Bogotá, así que la cuota te sigue quedando cómoda. Vale la pena que compares los dos antes de decidir: 8 de cada 10 personas que compraron aquí tienen un perfil como el tuyo.

---

## 2. Carlos Andrés Muñoz — no afiliado, pasa el corte con restricción de cupo

**Salida:** `listo_restriccion_cupo` · No afiliado · Medellín · 1-3 SMMLV · interés inicial: Reserva del Poblado

> [!IMPORTANT]
> Este es el personaje que carga el argumento del pitch: **27,1% de los compradores históricos no son afiliados** y la regla 90/10 solo deja espacio al 10%. La explicación tiene que ser honesta sobre la restricción **sin sonar a rechazo**, porque no lo es.

### `LeadCurado.explicacion` (la ve el asesor)

> Carlos **no está afiliado a Colsubsidio**, así que su compra cuenta contra el cupo del 10% de no afiliados que la regla 90/10 le deja a este proyecto. Eso no lo descalifica: define contra qué cupo se marca y por qué conviene atenderlo pronto, antes de que el cupo se agote. En capacidad de pago está sólido: la primera cuota estimada es el **35% de lo que entra al hogar**, dentro del tope legal del 40% del **Decreto 583 de 2025**, y lo logra **sin ningún subsidio** (por no ser afiliado hoy no aplica a los de la caja, así que no hay margen extra de donde tirar si sube el precio). **No tiene vivienda propia** y **reporta estar al día con sus créditos**, sin mora autorreportada. **Se parece en un 61% a los compradores no afiliados** que ya cerraron en este proyecto: hay precedente de que este perfil compra aquí.

### `ProyectoRecomendado.porque` (los ve Carlos en el chat)

**Reserva del Poblado** (`p-03`)
> Es el que te interesaba y te sirve: la cuota mensual estimada es el 35% de lo que entra a tu hogar y la ley permite hasta el 40%, así que pasas incluso sin subsidio. Está en Medellín, donde vives. Como no estás afiliado a Colsubsidio, tu compra entra por un cupo más pequeño de este proyecto, así que si te gusta, vale la pena moverse rápido.

**Alto de las Palmas** (`p-09`)
> Tiene un precio parecido y queda en tu misma zona, así que la cuota te queda igual de alcanzable. Te lo propongo además porque hoy tiene más espacio disponible para compradores no afiliados que Reserva del Poblado.

---

## 3. Yuliana Andrea Pérez — no pasa el corte, queda en nutrición

**Salida:** `nutricion` · Sin match en la base de identidades · 1-2 SMMLV · interés inicial: Alameda del Río

> [!IMPORTANT]
> Aquí se juega el **criterio de aceptación 3: nadie se descarta**. La explicación tiene que decir con claridad qué falló, que no es una decisión nuestra, y qué la destrabaría. Ni una palabra que suene a "no calificas".

### `LeadCurado.explicacion` (la ve el asesor)

> Yuliana **hoy no puede comprar Alameda del Río, y la razón es una sola y es de norma**: la primera cuota estimada sería el **52% de lo que entra a su hogar** y el **Decreto 583 de 2025** fija el techo en el 40%. Por encima de eso ningún banco puede prestarle, no es criterio nuestro. Los demás factores explican por qué no hay de dónde compensar: **no aparece en la base de afiliados** (sin match por cédula, así que se asume no afiliada hasta confirmarlo), **no declaró ningún subsidio aplicable** que baje la cuota, y **reporta mora reciente** en sus créditos, que es lo que ella misma cuenta, no una consulta a centrales. **No tiene vivienda propia**, que es lo único que hoy juega a su favor: conserva intacto el acceso a subsidio cuando lo pida. Su **similitud con los compradores del proyecto es del 38%**, la más baja de los tres. **Queda en nutrición, no descartada:** se le recontacta si sube el ingreso del hogar o si aplica a un subsidio que meta la cuota bajo el 40%. Un proyecto más económico también la destrabaría.

### Qué ve Yuliana en el chat (no hay proyectos que recomendar)

> Con lo que me contaste, la cuota mensual de Alameda del Río te quedaría en la mitad de lo que entra a tu hogar, y por ley un banco solo puede prestarte hasta el 40%. No es una decisión nuestra: es el Decreto 583 de 2025. Eso no te cierra la puerta. Dos cosas cambian el resultado: que aumente el ingreso del hogar (por ejemplo si alguien más aporta a la compra) o que apliques a un subsidio de vivienda. Te escribo apenas alguna de las dos se dé, o si abrimos un proyecto que te quede en el rango.

**Regla que falló y su trigger** (los produce el motor de B, aquí solo se redactan):

- `regla_fallida`: la primera cuota estimada (52% del ingreso del hogar) supera el tope legal del 40% del Decreto 583 de 2025.
- `trigger_nutricion`: recontactar si sube el ingreso del hogar o si aplica a un subsidio que baje la cuota bajo el 40%.

---

## Checklist de cobertura (criterio de aceptación 2)

El criterio se verifica **contando**: los 6 factores que evalúa el motor tienen que aparecer los 6 en la explicación. Ninguna explicación de arriba deja uno por fuera.

| Factor del score (spec §4) | Diana | Carlos | Yuliana |
|---|---|---|---|
| `afiliacion` | afiliada, entra por el 90% | no afiliado, cuenta contra el 10% | sin match, se asume no afiliada |
| `cuota_ingreso_40` | 32%, cita el Decreto 583 | 35%, cita el Decreto 583 | 52%, **es la regla que falla** |
| `subsidio_aplicable` | Mi Casa Ya, baja la cuota | ninguno, y explica por qué | ninguno declarado |
| `ya_tiene_vivienda` | no tiene, conserva subsidio | no tiene | no tiene, único factor a favor |
| `situacion_crediticia` | al día, marcado como autorreportado | al día, autorreportado | mora reciente, autorreportada |
| `similitud_compradores` | 84% | 61% (contra no afiliados) | 38% |

## Qué hace que una explicación pase el estándar

Seis criterios. Se revisan en este orden y el primero que falle descarta el output del modelo:

1. **Cobertura completa.** Aparecen los 6 factores con su valor. Un factor omitido es exactamente lo que el reto castiga (restricción no-negociable "cero caja negra").
2. **La norma se cita, no se parafrasea.** Donde entra el 40% aparece "Decreto 583 de 2025". Es lo que convierte un umbral en una obligación legal, y es la diferencia entre "no te alcanza" y "el banco no puede prestarte".
3. **Cero dato inventado.** Ni un peso, ni un plazo, ni un subsidio que no venga en el input. Si el catálogo no trae el precio, la explicación no lo menciona.
4. **Cada proyecto dice por qué es ese y no otro.** "Está en tu ciudad y la cuota te cabe" sirve; "es una excelente opción" no dice nada.
5. **El señalamiento honesto.** Lo autorreportado se marca como autorreportado (no consultamos centrales de riesgo). La restricción de cupo se nombra sin disfrazarla. La cuota que no pasa se dice de frente.
6. **Nadie queda descartado.** En nutrición siempre hay una salida concreta y accionable, no un "vuelve luego".

## Pendientes que suben el estándar

- **Montos en pesos.** Hoy todo está en porcentajes porque el catálogo real de B (`data/sintetica/proyectos.json`) aún no existe. Con precios reales, la explicación puede decir la cuota estimada en pesos, que es mucho más concreto para el lead. Depende del [ticket 004](tasks/004-capacidad-compartida.md) (`cuotaEstimada`).
- **Nombres de proyecto.** Torres de Bellavista, Reserva de los Cerros, Alto de las Palmas y Alameda del Río son inventados en las fixtures. El catálogo real trae **18 proyectos oficiales** ([spec §6](spec.md)); cuando B lo publique, estos nombres se reemplazan aquí y en las fixtures.
- **Reglas de subsidio.** Mi Casa Ya se nombra como el lead lo declara. Las reglas concretas (cuál, con qué requisitos, de qué monto) siguen abiertas en [spec §7](spec.md) y se cierran en el kickoff.
