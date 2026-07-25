# Explicaciones de referencia (Track C)

> El estándar de calidad del "porqué". Escritas **a mano**, no por el modelo.
> Si el experto en vivienda no llega a este nivel, el prompt está mal, no el estándar.

Este documento tiene dos usos y los dos importan:

1. **Vara de medir.** El prompt del experto (`lib/matching/prompt-experto.ts`) se ajusta hasta que su output para estos 3 personajes sea comparable a lo de aquí abajo. La comparación es contra la [checklist de cobertura](#checklist-de-cobertura-criterio-de-aceptación-2), no contra el gusto de quien lee.
2. **Fallback del [ticket 010](tasks/010-fallback-conversador.md).** Si `/api/explicacion` no responde mientras el jurado recorre el demo, la ficha del asesor muestra el texto de este documento para ese personaje. El demo es autogestionado: nadie va a estar ahí para reintentar.

**Los personajes son los canónicos** de [`lib/fixtures/`](../lib/fixtures/) ([ticket 001](tasks/001-personajes-canonicos.md)), y desde el **2026-07-24** viven sobre el **catálogo real de 18 proyectos**: sus scores y sus proyectos ya no se escriben a mano, los calcula el motor (`curar()`). Las explicaciones de aquí abajo son la única parte escrita a mano, y sus cifras están tomadas de ese cálculo — el texto vive tipado en [`lib/fixtures/leads-curados.ts`](../lib/fixtures/leads-curados.ts) y el fallback lo lee de ahí, sin duplicarlo. **Si cambian los pesos, el catálogo o el guion del personaje, estas explicaciones se reescriben.**

## Las dos voces (convención del contrato)

Los dos campos de texto que produce el Track C no le hablan a la misma persona:

| Campo | Quién lo lee | Voz | Verificación |
|---|---|---|---|
| `LeadCurado.explicacion` | El **asesor**, en su ficha | Tercera persona, nombra al lead, resume el veredicto completo | Cita los factores del score |
| `ProyectoRecomendado.porque` | El **lead**, en el chat | Segunda persona ("tu cuota", "tu ciudad"), corta y concreta | Cita los factores que hacen que **ese** proyecto le sirva |

Regla que cruza a las dos: **cero jerga bancaria**. El lead promedio de este flujo compra VIS. Nada de "capacidad de endeudamiento", "relación cuota-ingreso" ni "scoring". Se dice "lo que pagarías al mes" y "cuánto entra al hogar".

---

## 1. Diana Marcela Ríos — afiliada, pasa el corte

**Salida:** `listo` · 74/100 · Afiliada · Bogotá · 3-5 SMMLV ($5.694.000) · interés inicial: **LA ARBOLEDA** ($194.023.050)

### `LeadCurado.explicacion` (la ve el asesor)

> Diana es afiliada a Colsubsidio y puede comprar hoy: la primera cuota estimada de LA ARBOLEDA ($1.164.138) es el **20,4% del ingreso de su hogar** ($5.694.000), muy por debajo del tope del 40% que fija el **Decreto 583 de 2025** — le sobra la mitad del margen que permite la norma, y eso es lo que la pone arriba en la cola. **No tiene vivienda propia**, **está al día en sus créditos** (autorreportado) y **declaró Mi Casa Ya, todavía sin monto verificado**: el asesor lo valida y la postula, y cuando entre bajará aún más la cuota. Le caben tres proyectos en Bogotá, empezando por el que preguntó.

### `ProyectoRecomendado.porque` (los ve Diana en el chat)

**LA ARBOLEDA** (`la-arboleda`)
> Es el proyecto por el que preguntaste y sí te sirve: desde $194.023.050, dentro del máximo de $379.600.000 que te permite el tope del 40% de tus ingresos. Queda en Bogotá, donde vives, y es VIS, así que admite los subsidios de vivienda de interés social.

**LA MACARENA** (`la-macarena`)
> Te la muestro porque es la más económica que te sirve —desde $149.702.400— y también en Bogotá, así que la cuota te queda todavía más holgada. Vale la pena que compares antes de decidir.

---

## 2. Carlos Andrés Muñoz — no afiliado, pasa el corte con restricción de cupo

**Salida:** `listo_restriccion_cupo` · 32/100 · No afiliado · Ricaurte · $2.850.000 · interés inicial: **PAYANDÉ** ($175.500.000)

> [!IMPORTANT]
> Este es el personaje que carga el argumento del pitch: **27,1% de los compradores históricos no son afiliados** y la regla 90/10 solo deja espacio al 10%. La explicación tiene que ser honesta sobre la restricción **sin sonar a rechazo**, porque no lo es. Desde el 2026-07-24 **sí recibe proyectos** (antes salía con las manos vacías): se muestran con la advertencia de cupo encima.

### `LeadCurado.explicacion` (la ve el asesor)

> Carlos SÍ puede comprar: la cuota estimada de PAYANDÉ ($1.053.000) es el **36,9% del ingreso de su hogar** ($2.850.000) y cabe bajo el tope del 40% del **Decreto 583 de 2025** — justo, pero cabe, y por eso su puntaje de prioridad es bajo, no su salida. Lo que hay que saber antes de llamarlo es otra cosa: **no es afiliado**, así que compite por el 10% de cupo que permite la regla 90/10, y los tres proyectos que le sirven ya lo tienen copado (PAYANDÉ lleva 27 no afiliados de 14 permitidos). No se le esconde el límite ni se le promete la unidad: **el asesor valida cupo antes de separar**. **No tiene vivienda propia** y **está al día en sus créditos** (autorreportado).

### `ProyectoRecomendado.porque` (los ve Carlos en el chat)

**PAYANDÉ** (`payande`)
> Es el que te interesaba y te sirve: desde $175.500.000, dentro del máximo de $190.000.000 que te permite el tope del 40% de tus ingresos, y queda en Ricaurte, tu zona. Ojo con una cosa, y te la digo de frente: el cupo de no afiliados de este proyecto ya está copado (27 de 14 permitidos por la regla 90/10), así que el asesor tiene que validar cupo antes de separar.

**LA MACARENA** (`la-macarena`)
> Te la muestro porque es más económica ($149.702.400), así que la cuota te queda con más aire que en PAYANDÉ. Está en Bogotá, no en tu zona — si te sirve moverte, vale la pena compararla.

---

## 3. Yuliana Andrea Pérez — no pasa el corte, queda en nutrición

**Salida:** `nutricion` · Sin match en la base de identidades · $2.135.250 (1-2 SMMLV) · interés inicial: **LA MACARENA** ($149.702.400, el más económico del catálogo)

> [!IMPORTANT]
> Aquí se juega el **criterio de aceptación 3: nadie se descarta**. La explicación tiene que decir con claridad qué falló, que no es una decisión nuestra, y qué la destrabaría. Ni una palabra que suene a "no calificas". Que su proyecto de interés sea el **más barato del catálogo** es deliberado: hace evidente que el problema no es que esté mirando por encima de sus posibilidades.

### `LeadCurado.explicacion` (la ve el asesor)

> Yuliana todavía no puede comprar, y la razón es una sola y es legal: la cuota estimada de LA MACARENA —el proyecto más económico del catálogo— es $898.214, o sea el **42,1% del ingreso de su hogar** ($2.135.250), y el **Decreto 583 de 2025** pone el techo en 40%. No es criterio nuestro: por encima de ese porcentaje el banco no puede prestarle. **No se descarta, queda en nutrición**, y le falta poquísimo: con **$2.245.536** de ingreso del hogar —**$110.286 más**— pasa el corte. También la destraban un subsidio que baje la cuota o un proyecto más económico que entre al catálogo. Reporta una **mora reciente** (autorreportada) y **no tiene vivienda propia**.

### Qué ve Yuliana en el chat (no hay proyectos que recomendar)

> Con lo que me contaste, la cuota mensual de LA MACARENA te quedaría en el 42% de lo que entra a tu hogar, y por ley un banco solo puede prestarte hasta el 40%. No es una decisión nuestra: es el Decreto 583 de 2025. Y estás **muy cerca**: con unos $110.000 más al mes en el hogar ya te alcanzaría. Eso no te cierra la puerta. Te escribo apenas suba el ingreso, apliques a un subsidio que baje la cuota, o abramos un proyecto que te quede en el rango.

**Regla que falló y su trigger** (los produce el motor, aquí solo se redactan):

- `regla_fallida`: `Tope del 40% (Decreto 583 de 2025) — Cuota estimada $898.214 = 42.1% del ingreso ($2.135.250)`.
- `trigger_nutricion`: se recontacta si el ingreso del hogar llega a $2.245.536 (le faltan $110.286), si aplica a un subsidio que baje la cuota mensual, o si entra al catálogo un proyecto que sí le quepa.

---

## Checklist de cobertura (criterio de aceptación 2)

El criterio se verifica **contando**: los **7 factores** que evalúa el motor tienen que aparecer en la explicación. Ninguna explicación de arriba deja uno por fuera.

| Factor del score (spec §4) | Diana | Carlos | Yuliana |
|---|---|---|---|
| `afiliacion` | afiliada, no compite por cupo | no afiliado, cuenta contra el 10% | sin match, se asume no afiliada |
| `cuota_ingreso_40` | 20,4%, cita el Decreto 583 | 36,9%, cita el Decreto 583 | 42,1%, **es la regla que falla** |
| `subsidio_aplicable` | Mi Casa Ya declarado, **sin monto verificado** | ninguno | ninguno declarado |
| `ya_tiene_vivienda` | no tiene | no tiene | no tiene |
| `situacion_crediticia` | al día, marcado como autorreportado | al día, autorreportado | mora reciente, autorreportada |
| `similitud_compradores_reales` | evidencia de respaldo, **hoy neutra para todos** | íd. | íd. |
| `cupo_90_10` | no aplica (afiliada) | **copado: 27 de 14** | no aplica al veredicto |

## Qué hace que una explicación pase el estándar

Seis criterios. Se revisan en este orden y el primero que falle descarta el output del modelo:

1. **Cobertura completa.** Aparecen los factores con su valor. Un factor omitido es exactamente lo que el reto castiga (restricción no-negociable "cero caja negra").
2. **La norma se cita, no se parafrasea.** Donde entra el 40% aparece "Decreto 583 de 2025". Es lo que convierte un umbral en una obligación legal, y es la diferencia entre "no te alcanza" y "el banco no puede prestarte".
3. **Cero dato inventado.** Ni un peso, ni un plazo, ni un subsidio que no venga en el input. Si el catálogo no trae el precio, la explicación no lo menciona.
4. **Cada proyecto dice por qué es ese y no otro.** "Está en tu ciudad y la cuota te cabe" sirve; "es una excelente opción" no dice nada.
5. **El señalamiento honesto.** Lo autorreportado se marca como autorreportado (no consultamos centrales de riesgo). La restricción de cupo se nombra sin disfrazarla. **Un factor que no puede aportar dice por qué** — el subsidio declarado sin monto no se presenta como si ya bajara la cuota. La cuota que no pasa se dice de frente.
6. **Nadie queda descartado.** En nutrición siempre hay una salida concreta y accionable, con su número cuando se puede derivar, no un "vuelve luego".

## Pendientes que suben el estándar

- ~~**Montos en pesos.**~~ **Hecho:** con el catálogo real y `cuotaEstimada` ([ticket 004](tasks/004-capacidad-compartida.md)), las explicaciones ya dicen la cuota en pesos y el precio máximo que le permite la norma.
- ~~**Nombres de proyecto.**~~ **Hecho el 2026-07-24:** los personajes viven sobre los 18 proyectos oficiales ([spec §6](spec.md)); se acabaron Torres de Bellavista y compañía.
- **Reglas de subsidio.** Mi Casa Ya se nombra como el lead lo declara, y hoy la explicación **dice explícitamente que no tiene monto verificado**, así que no baja la cuota. Las reglas concretas (cuál, con qué requisitos, de qué monto) siguen abiertas en [spec §7](spec.md) → [ticket 017](tasks/017-tabla-subsidios.md).
- **Similitud real.** Hoy es una señal neutra igual para todos y el factor lo declara. Con las distribuciones por proyecto ([ticket 016](tasks/016-distribuciones-por-proyecto.md)) pasa a decir a qué se parece este lead en concreto ([018](tasks/018-similitud-en-explicacion.md)).
