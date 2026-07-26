> 🔁 **HISTÓRICO** — la rama 5 se mergeó a `main` el 2026-07-26 (`0cc1c05`). Este documento era el
> handoff para pushearla y ya cumplió. Lo vigente son las **cuatro trampas** de la sección
> *Conventions* de [`AGENTS.md`](../../AGENTS.md) y la bitácora de
> [`plan-arquitectura-conversador.md`](plan-arquitectura-conversador.md).
>
> ⚠️ **De las 5 piezas del §2, la rama 5 cableó cuatro: el banco (c y d) NO.** Se escribió antes de
> que `/api/banco` existiera, así que no podía llamarlo. El banco se cableó aparte el mismo día
> (`30e1c05`) y **su contrato vigente es el [D8 del spec 02](../specs/02-conversador.md)**, no el §2
> de aquí abajo.
>
> ⚠️ **Los 3 puntos del §3 ya están cerrados**, aunque abajo digan que están abiertos: se
> consultaron y se escribieron en `maquina.ts` (`TEXTO_ES_IA`, `mensajeMuchasPreguntas`,
> `TEXTO_NO_ENTENDI`).

# Rama 5 · lo que necesitas para pushear

**Para P1 (Alejo). Escrito el 2026-07-26, con `main` en `270bb3e`.**

Las otras **7 ramas ya están en `main`** y esta es la única que falta. También es la que enciende
todo: hasta que entre, el guard, el banco, el selector y los bonos son código correcto que **nadie
ejecuta**.

Este documento es autocontenido: no necesitas releer el plan entero para cablear.

---

## 0 · Lo primero: `main` se movió debajo de ti

Construiste la rama 5 antes de que entrara casi todo. **Rebasa antes de mirar nada más**, porque
cuatro de estos cambios te van a romper el build o el sentido:

```bash
git fetch origin && git rebase origin/main
```

| Qué cambió | Por qué te importa |
|---|---|
| **`preguntas.ts` se partió** (rama 2) | Los intérpretes salieron a `lib/conversacion/interpretacion/`. `preguntas.ts` quedó con copy + wiring. Si tu rama los importaba de allá, el import ya no existe. |
| **`CampoPregunta` dejó de ser derivado** (rama 2) | Ahora es el enum de zod de `acciones.ts` y vale **solo para las 7 base**. Los campos del banco viven aparte, en `CampoBanco`. |
| **La geografía cambió** (2026-07-26) | Ciudadela Maiporé es **Soacha**, no Bogotá: 5 de los 18 proyectos se movieron de ciudad. **A Diana le cambiaron los proyectos** — ver §5. |
| **El `porque` cambió** | Es impersonal y sin género, y ya no cita buckets en 0%. Está en el seed, así que si tu rama trae un `seed.sql` viejo, va a chocar. |
| **Existen dos rutas nuevas** | `POST /api/interpretar` (rama 4) y `POST /api/banco` (selector). Las dos las cableas tú. |

---

## 1 · Lo que posees, y lo que no

**Tuyo:** `lib/conversacion/maquina.ts` (nuevo), `components/chat/ChatWhatsApp.tsx`,
`lib/fixtures/guion-demo.ts`.

**⚠️ El JSX no se toca.** Las líneas ~598-889 de `ChatWhatsApp.tsx` quedan idénticas (el archivo
tiene 890 líneas hoy). Si el refactor te empuja a cambiar el marcado, **para y consulta**: el layout
no cambia, y `app/globals.css`, `DESIGN.md` y `components/ui/**` no los toca nadie.

**El entregable:** sacar la lógica de conversación del componente a un reducer puro
`(estado, entrada) → { estado, efectos[] }`, con efectos `pintar_bot`, `pintar_bot_llm`,
`anotar_sistema`, `curar`, `pedir_franjas`. `ChatWhatsApp` queda como renderer + ejecutor de efectos.

Consecuencia grande y deseada: **`replayGuion` pasa a correr el mismo reducer** en vez de
reimplementar el hilo a mano (`guion-demo.ts`, 115 líneas hoy). Hoy hay dos fuentes que pueden
divergir; con esto hay una. Ese es el hueco 3 del plan.

---

## 2 · Las cinco piezas que cableas, con su firma real

Todas verificadas contra el código en `270bb3e`. Ninguna necesita adaptador.

### a) El guard — `lib/conversacion/guardas.ts`

```ts
postGuard(texto: string, textoBase: string, contexto?: ContextoGuard): ResultadoGuard
// ResultadoGuard = { aprobado, textoFinal, violaciones: ReglaGuard[], severidad: "bloquea"|"limpia"|"ok" }
// ContextoGuard = { nombre?, proyectosPermitidos?, cifrasPermitidas? }  ← todo opcional

notaSistemaGuard(resultado: ResultadoGuard): string | null
```

Va en `agregarBot`, **justo antes de `pintar(textoFinal)`**. Son tres líneas:

```ts
const r = postGuard(acumulado.trim() ? acumulado : textoBase, textoBase, { nombre: evento.nombre });
pintar(r.textoFinal);
const nota = notaSistemaGuard(r);
if (nota) anotar("sistema", nota);
```

- **Pinta `textoFinal` siempre.** Con `bloquea` ya es `textoBase` — el mismo camino del timeout, el
  lead nunca se entera.
- **`notaSistemaGuard` devuelve `null`** cuando el aseo fue puro formato: eso va a log, no al hilo.
- Con `texto === textoBase` el resultado es **siempre `ok`**. Hay un barrido de 40+ mensajes reales
  que lo prueba, así que cablearlo en el camino del fallback no cambia nada.
- `ContextoGuard` es todo opcional: puedes cablearlo en un sitio antes de tenerlo en todos.

### b) El intérprete de respaldo — `POST /api/interpretar`

```
{ campo, texto, pregunta? }  →  200 { valor }     // `valor: null` = no entendió, es legítimo
                                503              // solo si no hay credencial
```

Se invoca **solo** cuando el turno emite `no_entendido`. Nunca compite con el regex: corre después.

### c) El selector del banco — `POST /api/banco`

```
{ lead }  →  200 { id }      // `id: null` es la respuesta NORMAL: "ninguna vale la pena"
```

Corre **después de las 7 base**, máximo `MAX_PREGUNTAS_BANCO` (= 2) veces. Falla cerrada en los
cuatro casos: sin credencial, sin preguntas disponibles, sin candidatos que reordenar (nutrición) y
ante un id inventado. Con `id: null` la conversación termina como hoy — el banco es aditivo.

### d) El banco — `lib/conversacion/banco-preguntas.ts`

```ts
preguntaDelBanco(id: string): PreguntaBanco | undefined   // undefined si se lo inventó
bancoDisponible(respuestas): PreguntaBanco[]              // solo lo que falta por preguntar
aplicarRespuestaBanco(respuestas, patch): Lead["respuestas"]
MAX_PREGUNTAS_BANCO = 2
```

`PreguntaBanco` es `Omit<PasoPregunta, "campo"> & { campo: CampoBanco; id; paraQueSirve; matchea }`:
**se pinta, acusa e interpreta igual que un paso base**, así que tu reducer la trata como un paso más.

> ⚠️ **Usa `aplicarRespuestaBanco`, no el spread pelado.** El patch normal REEMPLAZA, y con dos
> preguntas del banco por conversación se perdería el texto crudo de la primera en
> `preferencias_libres` — que es justo el campo que existe para que no se pierda nada.

### e) La recomendación verbalizada — `lib/conversacion/recomendacion.ts`

```ts
proyectosParaVerbalizar(lead): ProyectoVerbalizable[]      // vacío en nutrición
listaParaPrompt(proyectos): string                          // la lista CERRADA para el prompt
mensajeRecomendacionDeterminista(proyectos): string | null  // el fallback sin IA
```

Corre **solo al final**, con el perfilamiento completo: `precioMaximoDe` devuelve 0 sin ingreso, así
que antes no hay nada que verbalizar.

### Y el arreglo de una línea que te toca

El `catch` de `ofrecerFranjas` gana su `anotar("sistema", …)`, para que el asesor vea el trigger
**"no pudo agendar"** en vez de un silencio.

---

## 3 · Las tres decisiones que solo tú puedes cerrar

Son los únicos puntos del §7 que siguen abiertos. **Los otros 14 están cerrados.** Estos son de
personalidad del agente, así que van a la regla especial: **se consultan antes de escribirlos.**

| # | Qué decidir |
|---|---|
| **4** | La respuesta a **"¿eres un bot?"**. Decidido en §3 que Sara **se declara IA con naturalidad**, con texto determinista fijo. Falta escribir ese texto. |
| **5** | El copy del **ofrecimiento de asesor tras 3 desvíos consecutivos** sin avanzar. |
| **7** | **Qué hace el reducer con `no_entendido` a la segunda vez.** Hoy `preguntas.ts` ya tiene la política para el ingreso —repregunta una vez, a la segunda sigue con `acuseSiInsiste`, "porque insistir es interrogar"—; falta decidir si vale para todos los campos. |

El contrato de turno que consumes es `AccionTurno` (`lib/conversacion/acciones.ts`), con siete
ramas: `responder_paso · no_entendido · confirmar_dato · corregir_dato · responder_duda ·
fuera_de_tema · handoff_asesor`.

---

## 4 · Las trampas que ya costaron tiempo

- **Nada de extensiones `.js`** en imports relativos de `lib/`. Turbopack no las resuelve y la ruta
  entera responde 500. La convención es sin extensión.
- **Nunca `npm run build` con `npm run dev` encendido.** Ambos escriben en `.next`; el dev server
  queda colgado reteniendo el puerto 3000. Síntoma engañoso: pantalla en blanco. Prueba primero
  `curl -o /dev/null -w "%{http_code}" http://localhost:3000/` → `000` es server caído, no bug.
- **Si `tsc` se queja de identificadores duplicados en `.next/types/…`**, es iCloud duplicando
  archivos generados: `find .next -name "* [0-9].*" -delete`.
- **Los 4+1 archivos generados no se editan a mano.** Si cambias una fixture, regenera:
  ```bash
  npx tsx scripts/generar-seed.ts
  npx tsx scripts/generar-slots.ts
  npx tsx scripts/generar-buyer-personas.ts
  npx tsx scripts/generar-catalogo-detalle.ts
  ```
  `lib/fixtures/seed-espejo.test.ts` falla si el seed quedó viejo.

---

## 5 · Lo que NO puede cambiar (y una cosa que ya cambió)

**Los 3 personajes del demo se declaran por lo que TECLEAN.** `replayGuion` corre su guion contra el
conversador real, así que el personaje sembrado y ese mismo personaje conversado en vivo por el
jurado tienen que producir el mismo `Lead` y el mismo puntaje. Si agregas o quitas una pregunta base,
el replay falla en voz alta diciendo cuál quedó sin respuesta. **El banco no entra al replay:**
`replayGuion` replaya solo las 7 base, y por eso el seed sigue siendo determinista.

**⚠️ Lo que ya cambió, y no es culpa tuya:** con la corrección de la geografía, a **Diana** le pasaron
de `LA ARBOLEDA, MONGUI, VERSALLES` a **`LA ARBOLEDA, KARAKALI, VIBO ONCE`** (su puntaje sigue en 73
y su salida no se mueve). Si el video grabado muestra los nombres viejos, esa toma hay que rehacerla
— pero eso es del pitch, no de tu rama.

---

## 6 · Antes de pedir merge

```bash
npm test && npx tsc --noEmit && npm run lint
```

Hoy `main` está en **789 tests verdes**. Tu definición de listo:

1. **Los tres `ChatWhatsApp.*.test.tsx` pasan SIN TOCARLOS.** Si el refactor los rompe, el refactor
   está mal.
2. **La red de escenarios de la rama 1 sigue verde** (`lib/conversacion/escenarios/`): son las
   entradas sucias congeladas contra el comportamiento actual. Es la red que hace seguro tu refactor.
3. Los 3 personajes recorridos a mano en `npm run dev`.
4. Seed regenerado y `seed-espejo.test.ts` verde.
5. **Probar con `GEMINI_API_KEY` vacía:** el chat se completa, sin banco y sin intérprete. El demo
   nunca depende de la IA.

**Protocolo:** rebase sobre `main` (nunca merge de `main` hacia tu rama), y **tú eres la última en
mergear**. Si tocas un archivo que no es tuyo, se rechaza el merge.

---

## 7 · Dónde está el detalle

- [`plan-arquitectura-conversador.md`](plan-arquitectura-conversador.md) — el plan y su **bitácora**,
  que trae los hallazgos de las 7 ramas con nombre y dueño. El §7 tiene los 17 puntos de consulta con
  su estado.
- [`handoff.md`](handoff.md) — la memoria del build.
- `AGENTS.md` — las restricciones no-negociables y las convenciones del repo.
