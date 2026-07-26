import type { AccionTurno, CampoPregunta } from "./acciones";
import { accionDeCorreccion, accionDeTexto, type Respuesta } from "./preguntas";
import { accionDeDesvio, detectarDesvio, esFueraDeTema } from "./desvio";

// =====================================================================
// LA MÁQUINA DE CONVERSACIÓN — la decisión del turno, sin React.
//
// Hasta esta rama, "qué pasó cuando el lead escribió algo" se decidía
// dentro de un componente de 890 líneas, repartido entre `enviarTexto`
// y `responderPregunta`. No se podía probar sin montar el chat entero,
// y `guion-demo.ts` tenía que reimplementarlo a mano para sembrar el
// demo — dos fuentes que pueden divergir, el hueco 3 del plan.
//
// Este módulo es la mitad que se puede sacar sin tocar una línea de
// JSX: **la decisión**. Es puro y síncrono. Los EFECTOS (pintar la
// burbuja, llamar al LLM, guardar) se quedan en `ChatWhatsApp`, que es
// donde viven de verdad.
//
// ⚠️ El orden de los clasificadores NO es libre. Lo fijó la rama 2 en
// el encabezado de `desvio.ts:205` y aquí solo se respeta:
//
//   1. `detectarDesvio`     → duda / asesor
//   2. `accionDeCorreccion` → corregir_dato
//   3. `accionDeTexto`      → responder_paso / confirmar_dato / no_entendido
//   4. y SOLO sobre un `no_entendido`, `esFueraDeTema`
//
// El 4 va de último porque equivocarse ahí es feo: contestarle "de eso
// no sé nada" a quien escribió "vivo con mi mamá y mi hermana" sería
// peor que el silencio de hoy.
// =====================================================================

/**
 * Cuántas veces seguidas puede alguien preguntar sin contestar antes de que
 * Sara le ofrezca un asesor.
 *
 * Hasta esta rama no había tope: se podía preguntar indefinidamente y la
 * conversación nunca avanzaba (medido en `escenarios/conversaciones.test.ts`).
 * Ofrecer no es cortar — la conversación sigue igual después.
 */
export const MAX_DESVIOS_SEGUIDOS = 3;

/**
 * Lo que Sara dice cuando ni el regex ni la IA entendieron.
 *
 * Se disculpa ELLA, no culpa a la persona. Es el mismo registro del acuse del
 * ingreso ilegible ("Perdona, ese número no logré leerlo bien 😅"), que es el
 * único caso que hasta hoy repreguntaba.
 *
 * Consultado y aprobado el 2026-07-26 (punto 7 del plan).
 */
export const TEXTO_NO_ENTENDI =
  "Perdóname, no te seguí bien 🙅‍♀️ ¿Me lo dices de otra forma?";

/**
 * "¿Eres un bot?" — la pregunta que hoy se responde peor de todas.
 *
 * `detectarDesvio` la clasifica como duda `general`, y la respuesta determinista
 * de una duda general es "esa no te la puedo confirmar sin inventarte nada":
 * una evasiva justo donde la honestidad es lo único que importa. Se intercepta
 * antes de llegar allá.
 *
 * Consultado y aprobado el 2026-07-26 (punto 4 del plan).
 */
export const TEXTO_ES_IA =
  "Sí, soy un asistente de IA de Colsubsidio 🙂 Lo que hablemos aquí le llega completo a un asesor de verdad.";

/**
 * Tras `MAX_DESVIOS_SEGUIDOS` preguntas sin avanzar.
 *
 * Ofrece el asesor y **sigue conversando**, igual que el handoff de spec 02 D6:
 * cada dato que se alcance a saber antes es un dato que la persona no repite
 * cuando la llamen. Cortar aquí le costaría a ella, no a nosotros.
 *
 * Consultado y aprobado el 2026-07-26 (punto 5 del plan).
 */
export function mensajeMuchasPreguntas(): string {
  return "Veo que tienes varias preguntas, y son buenas 🙌 Te propongo algo: le paso tu caso a un asesor para que te las resuelva de una, y mientras tanto seguimos con lo mío, que es cortico. ¿Te parece?";
}

/** La fila `sistema` del handoff por acumulación de dudas (ADR 0003). */
export function notaSistemaMuchasPreguntas(cuantas: number): string {
  return `El lead hizo ${cuantas} preguntas seguidas sin avanzar el perfilamiento. Se le ofreció un asesor humano; la conversación continúa.`;
}

/**
 * La fila `sistema` de un dato que no se pudo interpretar.
 *
 * Es el "marcarlo" de la decisión del punto 7: a la segunda vez se sigue, pero
 * **no en silencio**. Hasta hoy el dato se perdía con un acuse amable y nadie
 * —ni la persona, ni el motor, ni el asesor— se enteraba.
 *
 * Va como fila del hilo y no como campo del `Lead` a propósito: `lib/types.ts`
 * es de otra rama, y el asesor ya lee el hilo completo en su ficha.
 */
export function notaSistemaSinInterpretar(campo: CampoPregunta, texto: string): string {
  return `No se pudo interpretar la respuesta del lead a "${campo}": «${texto}». Se repreguntó una vez y se siguió sin el dato.`;
}

/**
 * ¿Está preguntando si habla con una máquina?
 *
 * Cerrado y positivo a propósito, como `esFueraDeTema`: solo formas explícitas.
 * "Eres real" queda por fuera porque también significa "¿esto es en serio?" y
 * confundirlas haría que Sara se declare IA cuando le están celebrando algo.
 */
const PREGUNTA_IDENTIDAD =
  /\b(eres|sos|es)\s+(un\s+|una\s+)?(bot|rob[oó]t|m[aá]quina|ia|inteligencia artificial|persona real|humano|humana)\b|\bhablo con (un|una)\s+(bot|m[aá]quina|persona|humano|robot)\b|\beres humana?\b|\bsos humana?\b/i;

export function esPreguntaDeIdentidad(texto: string): boolean {
  return PREGUNTA_IDENTIDAD.test(texto);
}

/**
 * Los números que aparecen en un texto, normalizados.
 *
 * Existe por un falso positivo medido en el navegador el 2026-07-26: el guard
 * bloqueaba la recomendación de Sara con `cifra_inventada` porque el `porque`
 * de cada proyecto trae los porcentajes de la similitud ("el 63% de quienes
 * compraron ahí son afiliados, como tú"). Esos porcentajes los calculó el
 * motor y viajan al prompt dentro de `listaParaPrompt`, así que Sara SÍ puede
 * citarlos — pero no estaban en `cifrasPermitidas` y el lead terminaba viendo
 * siempre el texto determinista.
 *
 * Ensancha lo permitido solo con cifras que el propio motor emitió, y solo
 * para ese turno.
 */
export function cifrasDe(texto: string): number[] {
  return (texto.match(/\d[\d.,]*/g) ?? [])
    .map((crudo) => Number(crudo.replace(/[.,]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** Lo que la máquina necesita saber del turno para decidir. */
export interface ContextoTurno {
  /** El campo de la pregunta pendiente. */
  campo: CampoPregunta;
  /** Los campos que el lead ya contestó, para poder detectar una corrección. */
  yaRespondidos: CampoPregunta[];
}

/** `identidad` es de esta rama; el resto sale del vocabulario de la rama 2. */
export type AccionDeTurno =
  | AccionTurno
  | { tipo: "identidad"; textoCrudo: string }
  /**
   * Una respuesta que ya viene interpretada porque su pregunta no es de las 7
   * base y trae su propio intérprete (hoy: el banco). Ver `decidirTurnoLibre`.
   */
  | { tipo: "responder_libre"; respuesta: Respuesta; textoCrudo: string };

/**
 * Qué pasó en este turno. Puro, síncrono y sin React.
 *
 * Lo que NO decide: si hay que llamar a la IA de respaldo (eso es un efecto, y
 * solo aplica sobre `no_entendido`), ni cuántas veces se ha repreguntado (eso
 * es estado del chat). Aquí solo se clasifica lo que la persona escribió.
 */
export function decidirTurno(texto: string, ctx: ContextoTurno): AccionDeTurno {
  // 0. ¿Pregunta si es una máquina? Va antes del desvío porque `detectarDesvio`
  //    la clasificaría como duda general y contestaría una evasiva.
  if (esPreguntaDeIdentidad(texto)) return { tipo: "identidad", textoCrudo: texto };

  // 1. Se salió del guion: pregunta algo, o pide un humano.
  const desvio = detectarDesvio(texto);
  if (desvio) return accionDeDesvio(desvio, texto);

  // 2. Está corrigiendo algo que ya había dicho.
  const correccion = accionDeCorreccion(texto, ctx.yaRespondidos);
  if (correccion) return correccion;

  // 3. Es una respuesta a la pregunta pendiente.
  const accion = accionDeTexto(ctx.campo, texto);

  // 4. No se pudo interpretar: ¿era siquiera un intento de responder?
  if (accion.tipo === "no_entendido" && esFueraDeTema(texto)) {
    return { tipo: "fuera_de_tema", textoCrudo: texto };
  }

  return accion;
}

/**
 * El turno de una pregunta que NO es de las 7 base — hoy, una del banco.
 *
 * Conserva **los tres primeros clasificadores tal cual**, porque ninguno
 * depende del campo: quien pregunta si habla con una máquina, quien tiene una
 * duda, quien pide un asesor y quien corrige un dato que ya dio merecen la
 * misma atención en la pregunta 8 que en la 3.
 *
 * Lo único que cambia es quién interpreta la respuesta. El campo del banco NO
 * vive en el enum de zod de `acciones.ts` —a propósito, ver `CampoBanco`— así
 * que `accionDeTexto` no tiene intérprete para él; lo trae la pregunta.
 *
 * Y por eso mismo **no hay rama `no_entendido` aquí**: los intérpretes del
 * banco siempre devuelven una `Respuesta` —lo que no logran clasificar entra a
 * `preferencias_libres` y llega crudo a la ficha del asesor— así que no queda
 * nada que rescatar con la IA ni que refinar como fuera de tema.
 */
export function decidirTurnoLibre(
  texto: string,
  ctx: {
    yaRespondidos: CampoPregunta[];
    interpretar: (texto: string) => Respuesta;
  },
): AccionDeTurno {
  if (esPreguntaDeIdentidad(texto)) return { tipo: "identidad", textoCrudo: texto };

  const desvio = detectarDesvio(texto);
  if (desvio) return accionDeDesvio(desvio, texto);

  const correccion = accionDeCorreccion(texto, ctx.yaRespondidos);
  if (correccion) return correccion;

  return { tipo: "responder_libre", respuesta: ctx.interpretar(texto), textoCrudo: texto };
}
