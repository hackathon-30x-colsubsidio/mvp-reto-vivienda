# 0006 — Sara consulta el catálogo pero no recomienda, y el desvío se detecta con reglas

**Estado:** Aceptada · **Fecha:** 2026-07-25

## Contexto

Hasta hoy, el conversador tenía un solo trabajo: reescribir el tono de un mensaje que TypeScript ya había redactado. Eso dejaba **dos huecos que el jurado puede encontrar solo**, porque son lo primero que hace cualquiera que abra un chat:

1. **Preguntar algo.** Todo lo que la persona tecleaba se consumía como respuesta al paso actual. Escribir *"¿cuánto vale?"* entraba a `interpretarTexto` y se parseaba como si fuera el dato que se le había pedido: la duda se perdía **y** el paso quedaba mal contestado.
2. **Pedir un asesor.** Es el tercer trigger de handoff de la operación real ([mentor](../reto/charla-mentor.md#click-to-whatsapp), spec [02 D6](../specs/02-conversador.md)) y no hacía absolutamente nada.

Además, lo que el agente *es* estaba repartido: un prompt inline dentro de `app/api/chat/route.ts`, otro dormido en `lib/matching/prompt-experto.ts`, y ninguna forma de saber sin leer tres archivos qué sabe Sara ni qué tiene prohibido.

## Decisión

### 1. El catálogo completo entra al contexto, como CONSULTA y no como recomendación

El spec 02 D2 decía lo contrario, explícito: *"lo que NO entra: el catálogo completo de 18 proyectos con precios"*, por miedo a que el agente empezara a recomendar en medio de la indagación. Se cambió.

**La frontera quedó en el verbo, no en el dato.** Sara puede consultar el catálogo (qué vale un proyecto, dónde queda, si es VIS); comparar dos, sugerir cuál conviene o decir "ese te sirve" está **prohibido en el prompt, con esas palabras**. Recomendar es del matcher determinista, que lo hace con la capacidad de pago ya calculada y con reglas auditables.

**Por qué:** esconderle el catálogo no evita que recomiende — solo lo obliga a decir *"no sé"* cuando alguien pregunta por un proyecto que sí tenemos, y eso es peor que el riesgo que se quería evitar. El catálogo se inyecta **generado desde `data/sintetica/proyectos.json`**, así que si mañana entra un proyecto, Sara lo sabe sin que nadie edite un prompt (spec 02 D5, nivel 2: el grounding vive en datos).

### 2. El perfil del lead NO viaja en modo duda

El historial sí (es la conversación); el `PerfilConocido` no.

**Por qué:** no hace falta para responder cuánto cuesta un proyecto, y no mandarlo vuelve **imposible** —no solo prohibida— la regla de que Sara nunca le recite sus datos de vuelta. El dato que no está no se filtra. Es la misma lógica con la que el agente tampoco ve el puntaje ni la salida.

### 3. El modo `duda` vive dentro de `/api/chat`, no en una ruta nueva

`POST /api/chat` acepta `modo: "duda" | "tono"`. Sin `modo` se comporta byte a byte como antes.

**Por qué:** el [ADR 0002](0002-stack-mvp.md) fija que la IA vive en `/api/chat` y `/api/explicacion`, y el cliente ya tiene todo el blindaje montado sobre esa ruta: abort si el primer token no llega en 3s, fallback al texto determinista, y el indicador de "escribiendo" que siempre se apaga. Una ruta nueva habría que blindarla otra vez, y la segunda copia de un blindaje es la que se queda vieja.

### 4. La detección del desvío es determinista; el LLM solo redacta la respuesta

`detectarDesvio()` ([`lib/conversacion/desvio.ts`](../../lib/conversacion/desvio.ts)) es TS puro. Decide **si** la persona se salió del guion; el LLM decide **cómo suena** la respuesta, y si no está vivo se pinta la respuesta determinista, que sale del catálogo real y de la tabla de subsidios con fuente.

**Por qué:** es la misma regla que gobierna el resto del sistema (ADR 0002: la IA no decide nada que haya que explicar). Y tiene una consecuencia práctica: **el demo funciona sin credencial de LLM.** La respuesta sin modelo no es un mensaje de error, es una respuesta correcta.

**La heurística es conservadora a propósito.** El costo de los dos errores no es simétrico: desviar de más rompe la conversación (le consume el paso a alguien que sí estaba contestando), desviar de menos deja el comportamiento anterior, que ya funcionaba. Ante la duda, no desvía. Los contraejemplos del test incluyen, textuales, las respuestas que teclean los 3 personajes del demo.

### 5. El paso pendiente lo retoma el CÓDIGO, y el desvío nunca lo avanza

Después de atender el desvío, quien vuelve a hacer la pregunta es `repreguntar()`, no el modelo — que tiene prohibido, en el prompt, hacer preguntas nuevas o intentar seguir el perfilamiento.

**Por qué:** es la decisión 1 de la sala del sábado 25 (conduce el código) aplicada al único punto donde el LLM habla por sí mismo. Sin esto, un modelo que se entusiasma se lleva por delante el orden de las preguntas.

**El handoff no corta la conversación.** Se responde que sí, queda una fila `sistema` en el hilo —o sea que el asesor lo ve en la ficha, [ADR 0003](0003-esquema-db-leads.md)— y se sigue. En el demo no hay humano al otro lado, y cada dato que se alcance a saber antes de la llamada es un dato que la persona no va a repetir.

### 6. El prompt experto queda declarado DORMIDO, no borrado

`lib/matching/prompt-experto.ts` redactaba el porqué de la ficha vía `/api/explicacion`. Desde el [ADR 0005](0005-afiliacion-cupo-y-explicacion.md) la explicación que se ve es determinista y **ninguna pantalla lo llama**. Se conserva, y el inventario de [`prompt-maestro.ts`](../../lib/conversacion/prompt-maestro.ts) lo dice con todas sus letras.

**Por qué:** no es código huérfano, es código en pausa. Lo que hacía falta no era borrarlo sino que nadie lo descubriera por accidente y creyera que está vivo.

## Consecuencias

- El LLM vuelve a tener **dos** puntos en el producto: pulir el tono (95% de las llamadas) y responder dudas. El ADR 0005 lo había dejado en uno.
- La lista de lo que Sara sabe y tiene prohibido vive **en un archivo**, no en tres. Quien vaya a tocar el agente empieza por ahí.
- Una duda mal clasificada ya no cuesta el paso, pero **sí cuesta un turno**: la persona ve la respuesta y la pregunta repetida. Es el intercambio aceptado.
- El `Lead` final y el puntaje **no cambian**: `replayGuion` llama `interpretarTexto` directo, sin pasar por el chat, así que el personaje sembrado y el conversado en vivo siguen dando el mismo resultado.
- **Queda por medir:** el primer token del modo duda contra el límite de 2s del ADR 0002. Verificado a mano con el LLM vivo el 2026-07-25 (precio, subsidio y handoff, en `localhost`), pero sin cronómetro.

## Para después del domingo

- El modo duda no ve el perfil, así que no puede responder *"¿yo sí califico?"*. Es la pregunta más humana que hay y hoy se contesta con un "no te la puedo confirmar". Darle el perfil abre la puerta a que recite datos: hay que diseñarlo, no improvisarlo.
- El cuarto trigger de handoff (N turnos sin llenar ningún dato) sigue `[PROPUESTA]` en el spec 02 D6.
- La detección por regex atrapa lo obvio. Un clasificador —o el propio LLM decidiendo si hubo desvío— cubriría más, a cambio de latencia y de que la decisión deje de ser explicable. No para esta semana.

## Fuentes

- [spec 02 D2, D6 y pregunta 13](../specs/02-conversador.md) — el contrato que este ADR cierra.
- [ADR 0002](0002-stack-mvp.md) — streaming, primer token < 2s, dónde vive la IA · [ADR 0003](0003-esquema-db-leads.md) — las filas `sistema` del hilo · [ADR 0005](0005-afiliacion-cupo-y-explicacion.md) — la explicación determinista.
- [`docs/credito-y-subsidios.md`](../credito-y-subsidios.md) — de dónde sale la tabla de subsidios, con URLs.
- Código: [`lib/conversacion/prompt-maestro.ts`](../../lib/conversacion/prompt-maestro.ts), [`lib/conversacion/subsidios.ts`](../../lib/conversacion/subsidios.ts), [`lib/conversacion/desvio.ts`](../../lib/conversacion/desvio.ts), [`app/api/chat/route.ts`](../../app/api/chat/route.ts).
