import type { FichaProyecto } from "@/lib/matching/tipos";
import { catalogo } from "@/lib/matching/catalogo";
import { pesos } from "@/lib/formato";
import type { AccionTurno, ClaseDuda } from "./acciones";
import { sinTildes } from "./interpretacion/texto";
import type { PasoPregunta } from "./preguntas";
import { SUBSIDIOS_GROUNDING } from "./subsidios";

// =====================================================================
// CUANDO LA PERSONA SE SALE DEL GUION.
//
// Hasta hoy, TODO lo que el lead teclea se consume como respuesta al
// paso actual: si escribe "¿cuánto vale?", eso entra a
// `interpretarTexto` y se parsea como si fuera el dato que se le pidió.
// Y si escribe "quiero hablar con un asesor" —el tercer trigger de
// handoff del mentor, spec 02 D6— no pasa nada.
//
// Este módulo detecta esos dos casos y nada más. Es TS puro: la
// DECISIÓN de desviar nunca depende de que un modelo esté vivo, igual
// que el resto de decisiones del sistema (ADR 0002). El LLM solo pule
// la respuesta después, y si no contesta se pinta el texto de aquí,
// que ya es una respuesta correcta por sí sola.
//
// ── Conservador a propósito ──────────────────────────────────────────
//
// El costo de los dos errores no es simétrico. Desviar de más rompe la
// conversación: la persona contestó lo que se le preguntó y el agente
// la ignora. Desviar de menos deja el comportamiento de hoy, que ya
// funciona. Por eso, ante la duda, `null` — y por eso los
// contraejemplos (las respuestas reales de los 3 personajes del demo)
// pesan tanto como los ejemplos en `desvio.test.ts`.
//
// Es agnóstico al set de preguntas: no conoce ninguna pregunta
// concreta, así que quien edite `preguntas.ts` no lo afecta.
// =====================================================================

export type Desvio =
  | { tipo: "asesor" }
  | {
      tipo: "duda";
      clase: ClaseDuda;
      proyecto?: FichaProyecto;
    };

/**
 * Pedir un humano. Solo con señal fuerte: la palabra "asesor", o una
 * forma explícita de pedir que le hablen a uno.
 *
 * Ojo con "llamar": la forma amplia (`me .* llam`) atrapa "me llamo Diana", que
 * es lo contrario de un desvío. Se enumeran las formas de pedirlo.
 */
const PIDE_ASESOR =
  /\basesor(a|es|as)?\b|\bhumano\b|persona real|hablar con alguien|con una persona|me\s+(pueden?|podr[íi]an?)\s+llamar|ll[áa]menme|\bme\s+llamen\b|n[úu]mero de tel/i;

/**
 * Una pregunta sin signos: la gente escribe "cuanto cuesta la arboleda" mucho
 * más de lo que escribe "¿Cuánto cuesta LA ARBOLEDA?". Se exige interrogativo
 * AL INICIO **y** palabra del dominio, porque cualquiera de los dos suelto
 * atrapa respuestas legítimas ("que tenga buenas zonas comunes", "tengo una
 * cuota del carro").
 */
const INTERROGATIVO_INICIAL = /^\s*[¿"']*\s*(y\s+)?(cu[aá]nto|cu[aá]nta|cu[aá]ndo|d[oó]nde|cu[aá]l|qu[eé])\b/i;
const PALABRA_DOMINIO = /precio|vale|cuesta|entrega|ubicad|queda|subsidio|cuota|financia/i;

const ES_SUBSIDIO = /subsidio|mi casa ya|caja de compensaci/i;
const ES_UBICACION = /d[oó]nde|ubicad|queda|direcci[oó]n|barrio|sector|ciudad/i;
const ES_PRECIO = /precio|vale|cuesta|costo|valor|cu[aá]nto|cuota|financia/i;

/** Del más largo al más corto: "BOSQUE DE ARRAYÁN" antes que "SAMÁN". */
const POR_NOMBRE_LARGO = [...catalogo].sort(
  (a, b) => b.nombre.length - a.nombre.length,
);

/**
 * El proyecto que la persona nombró, si es uno de los 18.
 *
 * Con frontera de palabra y no `includes`: los nombres cortos del catálogo
 * (SAMÁN, ABETO, INARI) aparecerían dentro de otras palabras. Los nombres solo
 * traen letras y espacios una vez sin tildes, así que se pueden meter a un
 * RegExp sin escapar nada.
 */
export function buscarProyecto(texto?: string): FichaProyecto | undefined {
  if (!texto) return undefined;
  const plano = sinTildes(texto);
  return POR_NOMBRE_LARGO.find((p) =>
    new RegExp(`\\b${sinTildes(p.nombre)}\\b`).test(plano),
  );
}

/**
 * ¿Esto que escribió el lead es una respuesta al paso, o se salió del guion?
 *
 * `null` significa "es una respuesta": el chat sigue exactamente como antes.
 */
export function detectarDesvio(texto: string): Desvio | null {
  if (PIDE_ASESOR.test(texto)) return { tipo: "asesor" };

  const esPregunta =
    /[?¿]/.test(texto) ||
    (INTERROGATIVO_INICIAL.test(texto) && PALABRA_DOMINIO.test(texto));
  if (!esPregunta) return null;

  // El subsidio manda sobre el precio: "¿cuánto me dan de subsidio?" trae
  // "cuánto", pero no está preguntando por el precio de nada.
  const clase = ES_SUBSIDIO.test(texto)
    ? "subsidio"
    : ES_UBICACION.test(texto)
      ? "ubicacion"
      : ES_PRECIO.test(texto)
        ? "precio"
        : "general";

  const proyecto = buscarProyecto(texto);
  return { tipo: "duda", clase, ...(proyecto ? { proyecto } : {}) };
}

/**
 * Lo que se puede afirmar sobre subsidios sin inventar un peso.
 *
 * Se arma desde `SUBSIDIOS_GROUNDING` en vez de escribirse a mano: un espejo
 * copiado a mano es una segunda fuente y termina viejo (convención del repo).
 * Y sale SIN cifras porque las fuentes se contradicen en el monto — eso está
 * decidido en `subsidios.ts`, aquí solo se respeta.
 */
function textoSubsidios(): string {
  const enMinuscula = (t: string) => t[0].toLowerCase() + t.slice(1);
  const vigente = SUBSIDIOS_GROUNDING.find((s) => s.estado === "vigente");
  const apagado = SUBSIDIOS_GROUNDING.find((s) => s.estado !== "vigente");
  if (!vigente) return NO_SE;

  return [
    `Te cuento lo que sí sabemos: ${enMinuscula(vigente.nombre)} está vigente y es para ${vigente.para_quien} — ${vigente.efecto}.`,
    apagado ? `${apagado.nombre}, en cambio, ${apagado.efecto}.` : "",
    `No te doy una cifra a propósito: ${vigente.nota}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Decir "no sé" es la respuesta correcta, no un fracaso.
 *
 * Es la misma política del prompt de duda (`prompt-maestro.ts`): rellenar con
 * lo que suene razonable, en la compra que alguien hace una vez en la vida, es
 * exactamente lo que este proyecto no hace.
 */
const NO_SE =
  "Esa no te la puedo confirmar por aquí sin inventarte nada, y prefiero no hacerlo. Queda anotada para que el asesor te la resuelva.";

/**
 * La respuesta a la duda SIN LLM.
 *
 * Es dos cosas a la vez: el fallback de `/api/chat` cuando no hay credencial o
 * el modelo no contesta, y una respuesta correcta por sí sola. Todo lo que dice
 * sale del catálogo real o de la tabla de subsidios con fuente.
 *
 * `proyectoInteres` es el proyecto por el que el lead entró (viene del evento
 * de pauta): si preguntó "¿cuánto vale?" sin nombrar nada, es casi seguro que
 * pregunta por ese.
 */
export function respuestaDeterministaDuda(
  d: Extract<Desvio, { tipo: "duda" }>,
  proyectoInteres?: string,
): string {
  const proyecto = d.proyecto ?? buscarProyecto(proyectoInteres);

  if (d.clase === "subsidio") return textoSubsidios();

  if (proyecto && d.clase === "precio") {
    return `${proyecto.nombre} está desde ${pesos(proyecto.precio_desde)} en ${proyecto.ciudad}. Ojo con el "desde": es la tipología más económica, no un precio cerrado — el valor exacto te lo confirma el asesor.`;
  }

  if (proyecto && d.clase === "ubicacion") {
    const donde = proyecto.zona
      ? `${proyecto.zona}, en ${proyecto.ciudad}`
      : proyecto.ciudad;
    return `${proyecto.nombre} queda en ${donde}. La dirección exacta y la visita te las cuadra el asesor.`;
  }

  return NO_SE;
}

/**
 * Pidió un humano: se le dice que sí, y se sigue.
 *
 * Se sigue a propósito. El handoff real ocurre en la ficha —el asesor recibe la
 * conversación completa, incluida esta petición— y cada dato que se alcance a
 * saber antes es un dato que la persona no tendrá que repetir cuando la llamen.
 * Cortar aquí le costaría a ella, no a nosotros.
 */
export function mensajeHandoffAsesor(nombre: string): string {
  const primerNombre = nombre.split(" ")[0];
  return `Claro que sí, ${primerNombre}. Le paso tu caso a un asesor de carne y hueso, con todo lo que me has contado, para que no tengas que repetir nada. Mientras te escribe seguimos, si quieres: así llega sabiéndolo todo.`;
}

/** La fila `sistema` que deja el rastro del trigger en el hilo (ADR 0003). */
export function notaSistemaHandoff(): string {
  return "El lead pidió hablar con un asesor humano (trigger de handoff, spec 02 D6). La conversación continúa para no perder el perfilamiento.";
}

// ── Lo que no es respuesta, ni duda, ni corrección ───────
//
// `fuera_de_tema` NO es un tercer tipo de desvío: es un REFINAMIENTO de
// `no_entendido`. El orden en que se pregunta importa, y es el único que no
// rompe nada (lo cablea la rama 5):
//
//   1. `detectarDesvio`      → duda / asesor
//   2. `accionDeCorreccion`  → corregir_dato
//   3. `accionDeTexto`       → responder_paso / confirmar_dato / no_entendido
//   4. y SOLO si salió `no_entendido`, `esFueraDeTema`
//
// El paso 4 va de último porque el costo de equivocarse es feo: contestarle
// "de eso no sé nada" a quien escribió "vivo con mi mamá y mi hermana" —el caso
// medido del hueco 2— sería peor que el silencio de hoy. Por eso aquí solo hay
// señales POSITIVAS y cerradas; lo ambiguo sigue siendo `no_entendido`.

/** Risa pelada: "jaja", "jejeje", "hahaha", "jjjj". */
const SOLO_RISA = /^(?:ja|je|ji|ha|he|hi|ah|eh){2,}$|^j{3,}$/i;

/**
 * Una cuenta y nada más: "2+2", "-3". Se exige el operador — un número pelado
 * ("4.500.000") es la respuesta al ingreso, no una cuenta.
 */
const SOLO_CUENTA = /^[\d\s.,]*[+\-*/=%][\d\s.,+\-*/=%]*$/;

const TIENE_LETRA_O_NUMERO = /[\p{L}\p{N}]/u;

/**
 * ¿Esto que no se pudo interpretar era siquiera un intento de responder?
 *
 * ⚠️ Solo se pregunta sobre un `no_entendido`. Al paso del ingreso NO le aplica
 * nunca: un ingreso ilegible emite `confirmar_dato` y se repregunta, que es lo
 * correcto para "2+2" cuando lo que se preguntó fue cuánto entra al mes.
 */
export function esFueraDeTema(texto: string): boolean {
  const t = texto.trim();
  // Vacío, solo emoji, solo signos: no hay nada que interpretar.
  if (!TIENE_LETRA_O_NUMERO.test(t)) return true;
  if (SOLO_RISA.test(t.replace(/[\s!¡?¿.,]/g, ""))) return true;
  return SOLO_CUENTA.test(t);
}

/**
 * Se reconoce en una línea, se dice que de eso no sabe, y `repreguntar()`
 * retoma. Sara no regaña ni se disculpa: no pasó nada malo.
 */
export function mensajeFueraDeTema(): string {
  return "Jaja, de eso sí no sé nada 😄 Yo soy buena para lo de la casa.";
}

/** El desvío, en el vocabulario de `AccionTurno`. Lo consume la rama 5. */
export function accionDeDesvio(desvio: Desvio, textoCrudo: string): AccionTurno {
  if (desvio.tipo === "asesor") return { tipo: "handoff_asesor" };
  return {
    tipo: "responder_duda",
    clase: desvio.clase,
    ...(desvio.proyecto ? { proyecto: desvio.proyecto } : {}),
    textoCrudo,
  };
}

/**
 * Se retoma la pregunta pendiente.
 *
 * La repregunta la hace el CÓDIGO, no el modelo: así el agente no puede perder
 * el hilo del perfilamiento ni inventarse una pregunta nueva por su cuenta
 * (decisión 1 de la sala del sábado 25 — conduce el código).
 */
export function repreguntar(paso: PasoPregunta): string {
  return `Sigamos donde estábamos. ${paso.pregunta}`;
}
