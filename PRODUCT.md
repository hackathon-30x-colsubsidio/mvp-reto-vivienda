# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primario: el lead de pauta.** Persona que vio un anuncio de un proyecto de vivienda de Colsubsidio (Meta, Google Ads, formulario web) y dejó sus datos. Su momento de mayor tensión es el minuto siguiente al clic: quiere saber si esto es para él y no sabe si le alcanza. Si lo interrogan se va; si lo ignoran se va. Sub-caso crítico: el **no afiliado**, que por la regla 90/10 tiene cupo limitado pero sí compra (27,1% de los compradores históricos).

**Secundario: el asesor comercial.** Su tensión es la cola: hoy no sabe a quién llamar primero y quema horas en gente que no puede comprar. La ficha del lead es el endpoint del reto y el clímax del demo.

**Evaluador de facto: el jurado de la hackathon.** Recorre el flujo solo, sin narración, en ~2 minutos.

## Product Purpose

Workflow de curado de leads que toma un lead de pauta digital y lo entrega al asesor tan calificado como un lead orgánico: capacidad de compra validada contra reglas explícitas, 2-3 proyectos recomendados con su porqué en lenguaje natural, y cita agendada en sala de ventas. Éxito = el asesor abre la ficha y sabe a quién llamar y por qué, sin preguntarle nada al sistema.

## Positioning

El pipeline es **determinista y auditable**; la IA vive en dos puntos acotados (el conversador y el redactor del porqué). Toda decisión de corte es por reglas visibles — es lo contrario de un lead score de caja negra. Y **nadie se descarta**: no existe el estado "descartado"; quien no pasa el corte cae a nutrición con la regla exacta que falló y un trigger de recontacto derivado de ella.

## Operating Context

Tres superficies, recorridas en este orden en el demo:

1. **Landing del jurado** (`/`) — 3 personajes pre-sembrados (afiliado listo, no afiliado listo, lead de nutrición) + un botón "soy yo" con formulario libre. Un clic arranca la conversación.
2. **Chat estilo WhatsApp** (`/`, en estado de conversación) — pide autorización de datos, dice explícitamente qué ya sabe del lead, y pregunta solo lo que falta. Chat web con estética WhatsApp y disclaimer visible de que en producción corre sobre WhatsApp Business API.
3. **Consola del asesor** (`/asesor`, `/asesor/[leadId]`) — cola priorizada y ficha completa: score factor por factor, el porqué en lenguaje natural, proyectos, cita, o razón + trigger de nutrición.

Todas las llamadas al LLM van en streaming (primer token < 2s). Escala del demo: jurado + equipo, decenas de sesiones concurrentes.

## Capabilities and Constraints

**Hace:** ingesta de lead-evento con fuente, enriquecimiento por cédula contra base de identidades, conversación adaptativa (set y orden de preguntas por perfil), scoring por reglas en TS puro, 3 salidas de corte, match de 2-3 proyectos, agendamiento en slots simulados, cola y ficha del asesor, botón "simular trigger" que re-engancha un lead de nutrición.

**No hace:** estrategia de pauta; integración real con CRM / DataCrédito / contact center; aprobación de crédito; WhatsApp real; webhook real de Meta Lead Ads; integración de calendario; dashboard analítico; más de un canal conversacional; estado "descartado".

**Stack:** Next.js (App Router) + Vercel + Supabase + Gemini en streaming. Tailwind v4. Tipos compartidos en `lib/types.ts`. La API key solo server-side.

**Terminología del dominio (usar tal cual en la UI):** afiliado / no afiliado, regla 90/10, nutrición (nunca "descartado"), lead-evento, fuente, cupo, trigger de recontacto, primera cuota, sala de ventas.

**Deadline duro:** domingo 26 jul 2026, 11:30 a.m. hora Colombia.

## Brand Commitments

**Paleta corporativa Colsubsidio** (vinculante, de la guía de identidad cromática):

| | Amarillo | Azul | Grafito |
|---|---|---|---|
| HEX | `#ffd000` | `#0067b1` | `#575756` |
| Pantone | 109 C | 2196 C | Cool Gray 11 C |

Con tintes al 80/60/40% del amarillo y el azul, y al 60/40/20% del grafito.

**El chat conserva el verde auténtico de WhatsApp** (`#075e54`) — decisión de producto, no descuido: el reconocimiento instantáneo del canal vale más que la consistencia de marca en esa superficie. La marca Colsubsidio vive ahí solo en el avatar y el nombre del contacto.

**Tema:** light y dark, ambos completos.

**Idioma:** español de Colombia, en toda la interfaz y todo el código.

## Evidence on Hand

- Excel real de **4.142 compradores históricos** de Colsubsidio (local, nunca entra al repo público). De ahí sale la munición del pitch: **27,1% de los compradores no son afiliados** y los **16 proyectos** con ubicación conocida incumplen el límite 90/10.
- Data sintética/derivada versionada en `data/sintetica/`.
- El tope de **40% de la primera cuota sobre el ingreso del hogar** es norma citable: [Decreto 583 de 2025](https://minvivienda.gov.co/normativa/decreto-0583-2025), que modificó el art. 2.1.11.1 del Decreto 1077 de 2015.
- **No hay** logo oficial de Colsubsidio en el repo (`public/` solo tiene los SVG del scaffold de Next). No fabricar uno: la marca se sostiene con la paleta y el nombre en texto hasta que alguien aporte el asset.
- **No hay** testimonios, clientes citables, benchmarks ni precios que inventar.

## Product Principles

1. **Cero caja negra.** Toda decisión del sistema (score, corte, match, trigger) se explica en lenguaje natural y con sus factores a la vista. La explicación pesa tanto como la recomendación; si no se puede justificar con factores visibles, no entra al demo.
2. **Nadie se descarta.** La UI nunca presenta a un lead como perdido. Nutrición es una salida digna, con su razón y su camino de vuelta.
3. **Autogestionado.** El jurado recorre el flujo solo. Si una pantalla necesita que alguien la explique, está mal diseñada.
4. **No repreguntar lo conocido.** Lo que el enriquecimiento ya sabe se dice, no se pregunta.
5. **Feo pero funciona > bonito pero falso.** Ningún dato inventado, ninguna cifra sin fuente, ninguna pantalla que prometa una integración que no existe.

## Accessibility & Inclusion

Audiencia amplia y no técnica (compradores de vivienda de todos los segmentos socioeconómicos, en móvil). El demo se proyecta y se graba en video, así que el contraste tiene que sobrevivir a un proyector: texto en tamaños generosos y contraste AA como piso. Cuidado específico con el amarillo `#ffd000`, que **no** alcanza contraste sobre blanco para texto — es color de superficie y acento, nunca de texto sobre fondo claro.
