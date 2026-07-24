# Charla con el mentor de Vivienda — 2026-07-24

> **Qué es esto.** Digest curado de la sesión de preguntas con el mentor de Colsubsidio asignado al reto Vivienda. Junto al [brief oficial](perfilamiento-leads-03.md) es la fuente de verdad de **cómo funciona hoy** la operación que el MVP va a mejorar. Los specs de [`docs/specs/`](../specs/README.md) lo citan por sección.
>
> **Qué NO es.** No es el transcript. El audio crudo se queda fuera del repo (este repo es público, [`AGENTS.md`](../../AGENTS.md) § restricciones). Aquí solo entran hechos operativos que el mentor expuso para que los equipos diseñen: nada de nombres de personas, credenciales, ni datos de clientes.
>
> ⚠️ **Dos advertencias de fiabilidad, no las borres:**
> 1. Es una **transcripción automática de audio** con ruido de sala. Donde el audio quedó ambiguo va marcado `[transcripción dudosa]`.
> 2. Las cifras las dio el mentor **de memoria, en conversación**. Son órdenes de magnitud para argumentar, **no cifras oficiales de Colsubsidio**. Para el pitch se usan las cifras calculadas del Excel (27,1%), que sí son verificables.

---

## Dolor y funnel {#dolor-y-funnel}

- **El nombre del problema es el problema.** El mentor lo dijo así: el dolor está en el perfilamiento. Magnitud que dio de ejemplo: de ~10.000 leads, ~6.000 **no sirven para nada**. Lo segundo que duele es la interacción posterior a la captación.
- **El funnel real tiene dos cierres, no uno:**
  1. **Separación** — el comprador aparta el inmueble. Puede ser menos de $1M COP según el proyecto. **Este es el primer cierre de venta y el objetivo al que hay que llegar.**
  2. **Escrituración** — puede tardar hasta 3 años y la gestiona **otra área**. Fuera del alcance del reto.
- **La ruta operativa hoy:** captación → prefiltro (Contact Center) → si hay interés, remisión a **sala de ventas** con cita agendada (día y hora) → el asesor muestra el proyecto → si hay interés se valida crédito aprobado, requisitos, si ya tuvo vivienda, acceso a subsidio → separación.
- Cuando no califica, la sala de ventas registra el motivo: no tiene ingresos suficientes, no le interesa la ubicación, los acabados, el metraje, etc.
- **Colsubsidio ofrece el ecosistema completo:** subsidio **y** crédito.

## Fuentes y canales {#fuentes-y-canales}

Cuatro fuentes principales, todas aterrizan hoy en el CRM (Salesforce) `[transcripción dudosa: el audio dice "self"/"Cfors"]`:

| Fuente | Cómo entra | Quién atiende |
|---|---|---|
| **Meta — lead forms** | Formulario dentro de Meta | Contact Center (equipo telefónico) |
| **Meta — click-to-WhatsApp** | El anuncio abre WhatsApp | Flujo automático de WhatsApp; humano solo si escala |
| **BTL** | Material físico con número de WhatsApp o URL | Igual que click-to-WhatsApp |
| **Web (.com)** | Landing de proyectos o página de subsidio, dejan el dato | **Directo a sala de ventas** |

- **Efectividad, de mayor a menor: landing .com > Meta > WhatsApp.** El .com convierte mejor porque **es orgánico**: ninguna pauta lleva ahí, la persona llegó navegando por su cuenta, así que va mucho más perfilada y no hay que "dar tantas vueltas". WhatsApp va último porque el enfoque comercial es reciente (versión nueva desde abril 2026).
- Esa brecha orgánico vs. pago es literalmente el enunciado del reto: *"¿cómo hacemos que los leads pagos se vuelvan igual de efectivos que los orgánicos?"*.

## Regla 90/10 e ingresos {#90-10-e-ingresos}

Se le preguntó explícitamente el caso: alguien que cumple con el ingreso y a quien la cuota le cabe en el 40%, **pero no está afiliado**, ¿vale más que un afiliado sin capacidad de pago?

> La prioridad siempre son los afiliados, **pero siempre va a ser la prioridad de los ingresos**.

Es decir: la capacidad de compra manda sobre la afiliación a la hora de perfilar. La afiliación sigue siendo un cupo regulatorio duro (el 10%), no un criterio para botar gente.

## La conversación que quieren {#conversacion-deseada}

- **No quieren un bot robotizado.** Textual: *"no nos interesa que sean robotizados, lo que nos interesa es que sea lo más humanamente posible, que capte la información, que pueda filtrar al cliente hacia la decisión de compra"*. Rechazan explícitamente *"ese prototipo de chatbot donde la gente se enreda"*.
- **Híbrido, no una cosa ni la otra.** Hoy tienen un flujo de WhatsApp por opciones numeradas. Puede ser el mejor flujo del mundo, pero **la gente prefiere escribir**. La estadística que citó: hay que tener **las dos** opciones, porque unas personas prefieren escoger y otras prefieren escribir o mandar **notas de voz**.
- **Dónde la lista sesga y hay que abrir el input:** en los momentos de indagación — **ingresos y ubicación/zona**. El argumento fue concreto: *"si tú dices que ganas 500.000 pesos, el listado no tiene esa opción"*, y *"si dice que gana más de 10, ¿cuánto es más de 10?"*. Una lista larga además cansa.
- Conclusión operativa que dejó: hay **puntos clave donde uno decide** si pone flujo de opciones o lenguaje natural. No es una decisión global.
- **Por qué importa el tono:** comprar vivienda no se hace todos los días, *"es algo que haces una vez en tu vida y probablemente al lado de otra persona"*. La conversación tiene que **enamorar**, no encuestar.

## Autorización de datos {#autorizacion-de-datos}

- **Es innegociable y va primero.** Sin autorización de tratamiento de datos no se puede continuar; hay activos digitales donde literalmente no se deja avanzar. La razón: necesitan poder contactar después.
- **La cédula es la llave de identificación.** Con ella saben si eres afiliado o no.
  - **Si eres afiliado:** no piden nada más (nombre, etc.) — ya tienen la data.
  - **Si no eres afiliado:** piden nombre, cédula, correo y teléfono.
- **Están ajustando la redacción**, no el requisito: cambiar *"¿autorizas?"* por *"compártenos la autorización"*. Son palabras que le cambian la intención al usuario.

> Esto valida directamente el supuesto de la cédula que [`spec.md §7`](../spec.md) tenía abierto: en la operación real la cédula se pide sí o sí, porque es lo que resuelve afiliado / no afiliado.

## Click-to-WhatsApp: cómo funciona hoy {#click-to-whatsapp}

1. El usuario escribe desde el anuncio.
2. Un **texto personalizado lo redirige al proyecto por el que entró**: si entró por Araucaria, le muestra Araucaria.
3. Autogestión: puede **cotizar**, ver la información del proyecto (metros, precios desde…) y **agendar**.
4. **Escala a humano** (asesor del Contact Center, por WhatsApp) cuando: **no pudo agendar**, **no pudo cotizar**, o **pide hablar con un asesor** habiendo explorado las opciones.
5. Ese lead se crea en el CRM y ahí queda la gestión.

## Puntos de fuga medidos {#puntos-de-fuga}

Los dos lugares donde hoy se les cae la gente, medidos en la plataforma de WhatsApp:

1. **La autorización de datos.** *"Un punto súper complejo."*
2. **La selección de proyecto.**

Aún no saben la causa: la versión nueva salió en abril de 2026 y apenas están entendiendo qué ocurre. Hay una mejora de la selección de proyectos por salir, pero aclaró que **no la están haciendo porque la gente se caiga ahí**, sino porque no les gustó cómo quedó en abril `[transcripción dudosa]`.

## Remarketing: nunca contacto frío {#remarketing}

- Sí mandan mensajes salientes por WhatsApp, pero **solo a bases de remarketing**: afiliados, o gente que ya tuvo contacto previo. Se les pide agendar cita o hablar con un asesor, según dónde se quedaron.
- **Nunca compran bases de datos. Contacto cero, nunca.**

## Lo que el asesor ve hoy {#lo-que-ve-el-asesor}

En la plataforma donde vive el WhatsApp le llega:

- **La conversación completa** (mensaje entrante / saliente).
- **Un resumen de quién le está hablando:** nombre, cédula, correo, celular, **proyecto de interés**, **rango de ingresos** y —si es afiliado— la **categoría de afiliación**.
- Todo queda registrado en el CRM **antes** de que el asesor entre.

**Las dos categorías que el mentor pidió para el asesor:** si el lead es **propenso a comprar** o **no es propenso**. Lo dijo al describir qué necesita del sistema: *"un centralizador que me vaya filtrando todo independientemente de dónde entre, para yo decir si es propenso a que vaya a comprar o no es propenso"*.

## Objetivo del área {#objetivo}

Textual, en cuatro partes:

1. **No queremos seguir pagando por más leads.**
2. Que lo que llegue, **llegue calificado**.
3. Que el **esfuerzo de operación sea el mínimo**.
4. Que la **conversión a la venta aumente**.

Y una precisión de arquitectura: hay **dos cosas distintas** ahí — *"la herramienta que me perfila"* y *"el flujo, si yo lo voy a mandar a WhatsApp"*.

## Métricas que quieren y hoy no tienen {#metricas}

Esto es lo más accionable de la charla para el tablero. Dijo que las etapas de abandono las conocen, **pero no a nivel de detalle**: no puede decir *"las personas que seleccionaron tal proyecto con tal rango de ingresos se me están quedando acá"*, ni separar dónde se quedan afiliados vs. no afiliados.

| # | Métrica | Cómo la enunció |
|---|---|---|
| 1 | **Abandono por etapa, cruzado por segmento** | Poder decir en qué paso se cae la gente, filtrando por **proyecto × rango de ingresos × afiliación** |
| 2 | **Duración promedio de la conversación** | Tanto en el **bot** como en la **atención asistida** (humana) |
| 3 | **Tasa de abandono** | Global |
| 4 | **Proyecto con más interacción** | Cuál se selecciona/consulta más |
| 5 | **Atribución de canal de ingreso** | Por dónde entró cada lead |

Sobre la #5 dio el detalle técnico y el problema abierto: hoy sí saben quién llegó por un anuncio, y si hay un **QR** o un **botón flotante** con **mensaje personalizado**, lo identifican por ese mensaje. **Pero si el usuario borra el mensaje antes de enviarlo, la atribución se pierde.** Preguntó abiertamente cómo cambiar eso, incluso si toca cambiar de plataforma.

## Cómo usar este documento {#como-usar}

- Los specs de componente citan estas secciones por anchor, por ejemplo `charla-mentor.md#metricas`.
- Lo que aquí aparece como **hecho de la operación** puede marcarse `[CERRADA]` en un spec. Lo que aquí aparece como **pregunta abierta del mentor** (la atribución que se pierde, la causa de las fugas) **no se puede cerrar** desde este documento.
- Preguntas que quedaron sin hacer o sin responder van a [`docs/pitch/preguntas-mentores.md`](../pitch/preguntas-mentores.md), no aquí.
