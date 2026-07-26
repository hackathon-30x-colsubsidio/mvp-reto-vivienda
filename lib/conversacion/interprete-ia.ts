import { z } from "zod";
import { generarJSON } from "@/lib/gemini";
import { INTERPRETACION_POR_CAMPO, type ValorDe } from "./acciones";
import type { CampoInterpretable } from "./interpretacion";
import { plausible } from "./interpretacion/ingreso";

// =====================================================================
// EL INTÉRPRETE DE RESPALDO — lo que se intenta cuando el regex no entendió.
//
// Se invoca SOLO cuando la conversación emitió `no_entendido`. Nunca compite
// con el regex ni lo reemplaza: corre después, sobre lo que aquel dejó pasar.
//
// ── Las tres cosas que lo hacen seguro ───────────────────────────────
//
//  1. **Clasifica, no conversa.** Devuelve un valor del mismo menú cerrado que
//     produce el regex (`INTERPRETACION_POR_CAMPO`). No escribe nada que el
//     lead vaya a leer.
//  2. **Ve un solo mensaje.** Recibe la pregunta que se hizo y el texto de ESE
//     turno, nunca el historial (decisión de Mani, 2026-07-26). Con el
//     historial podría deducir la respuesta de algo que la persona dijo tres
//     turnos antes y entregarla como si la hubiera contestado: eso llega al
//     motor como un hecho sobre su vida que nadie dijo.
//  3. **Falla cerrada.** Sin credencial, por timeout, por JSON ilegible o por
//     un valor fuera del menú devuelve `undefined`, que es exactamente lo que
//     ya devolvía el regex. La conversación repregunta, como hoy.
//
// `null` es una salida VÁLIDA y esperada del modelo: es "yo tampoco sé".
// Empujarlo a adivinar es lo que produce el peor bug abierto del repo
// (`"no sé"` → `tiene_vivienda: false`, que habilita subsidios de primera
// vivienda sobre una afirmación falsa). Por eso el prompt pide null en voz alta.
// =====================================================================

/**
 * Qué significa cada campo y qué distingue a sus opciones, en el lenguaje del
 * regex que ya existe en `interpretacion/`.
 *
 * ⚠️ Esto NO es la fuente de verdad del menú — lo es `INTERPRETACION_POR_CAMPO`,
 * y el modelo lo recibe además como JSON Schema. Esto es la semántica, que un
 * enum no puede llevar: `"regular"` y `"mala"` son dos palabras hasta que
 * alguien dice cuál es cuál. Hay un test que exige que toda opción del enum
 * aparezca aquí, para que agregar una al enum y olvidarla aquí falle en voz alta.
 *
 * El `satisfies` garantiza que estén los seis campos interpretables y solo esos.
 */
const MENU_DEL_CAMPO = {
  tiene_vivienda:
    "Si la persona YA ES DUEÑA de una vivienda hoy.\n" +
    "- true: ya tiene casa o apartamento propio.\n" +
    "- false: sería su primera vivienda (vive en arriendo, con familia, o dice que no tiene).\n" +
    'Si solo dice que NO SABE o que no está segura, eso NO es false: es null.',
  composicion_familiar:
    "Con quién va a vivir en la casa que compre.\n" +
    '- "solo": vive sin nadie más.\n' +
    '- "pareja": con esposo, esposa, novio o novia, sin hijos.\n' +
    '- "familia_con_hijos": con hijos, en pareja.\n' +
    '- "monoparental": con hijos, pero ella o él solo, sin pareja.\n' +
    "Si vive con padres, hermanos u otros familiares que no son pareja ni hijos, no hay opción " +
    "para eso: devuelve null.",
  rango_ingreso_hogar:
    "Cuánta plata entra al hogar AL MES, en pesos colombianos, como número entero.\n" +
    'Ejemplos: "cuatro millones y medio" → 4500000. "dos salarios mínimos" → el equivalente ' +
    "en pesos. Si dice un rango, el punto medio.\n" +
    "Si lo que escribió es un cálculo, un ingreso anual, o no se puede saber si son miles o " +
    "millones, devuelve null. Nunca adivines el orden de magnitud.",
  subsidios:
    "Qué subsidios o ayudas dice tener disponibles, como lista de textos.\n" +
    "- Lista vacía [] si dice explícitamente que no tiene ninguno. Eso es una respuesta, no un vacío.\n" +
    '- ["Por confirmar"] si dice que no sabe o que no está seguro.\n' +
    "- Si nombra uno o varios, devuélvelos tal como los nombró.",
  rango_edad:
    "En qué tramo de edad está.\n" +
    '- "20_35": hasta 35 años.\n' +
    '- "36_45": de 36 a 45.\n' +
    '- "46_mas": 46 en adelante.\n' +
    "Si solo dice una generación o algo vago, devuelve null.",
  situacion_crediticia:
    "Cómo está su historial de crédito.\n" +
    '- "buena": al día, sin deudas, limpio.\n' +
    '- "regular": tuvo un reporte y ya salió, lo arregló, o lo pagó.\n' +
    '- "mala": está en mora, reportado hoy, o con deudas atrasadas.\n' +
    '- "sin_info": nunca ha pedido crédito. Es un dato, no un "no sé".\n' +
    'Ojo: si no se entiende qué dijo, eso NO es "sin_info": es null.',
} as const satisfies Record<CampoInterpretable, string>;

/**
 * Los campos que la IA puede interpretar. Salen de las llaves del menú, así que
 * el `satisfies` de arriba es lo que garantiza que estén todos y solo esos.
 *
 * `zona_interes` no está a propósito: su intérprete nunca falla (la última rama
 * guarda el texto crudo), así que nunca emite `no_entendido` y no hay nada que
 * reintentar.
 */
export const CAMPOS_IA = Object.keys(MENU_DEL_CAMPO) as [
  CampoInterpretable,
  ...CampoInterpretable[],
];

export const CampoIASchema = z.enum(CAMPOS_IA);

/** El sobre en el que viaja la respuesta: un objeto, porque el JSON Schema de
 *  Gemini quiere un objeto en la raíz, y `null` para "no sé". */
function esquemaDe(campo: CampoInterpretable) {
  return z.object({ valor: INTERPRETACION_POR_CAMPO[campo].nullable() });
}

/** El JSON Schema que recibe el modelo. Sale del MISMO zod que valida después:
 *  no hay forma de que la instrucción y la validación se desincronicen. */
export function esquemaJSONDe(campo: CampoInterpretable): unknown {
  return z.toJSONSchema(esquemaDe(campo));
}

/**
 * La instrucción de sistema. Clasificador, no conversador.
 *
 * 🔴 Copy consultado con Mani el 2026-07-26 (punto 10 de la lista de consulta).
 * No lo edites sin volver a consultarlo: de esto sale el dato que entra al motor.
 */
export function promptInterprete(campo: CampoInterpretable): string {
  return `Clasificas una respuesta de una conversación de WhatsApp sobre compra de vivienda en
Colombia. NO conversas, NO respondes, NO saludas, NO haces preguntas: solo clasificas.

QUÉ HAY QUE SACAR DEL MENSAJE:
${MENU_DEL_CAMPO[campo]}

Reglas que no puedes romper:
- Si el mensaje no dice con claridad cuál es, devuelve null. Null es la respuesta correcta, no un fracaso.
- No completes lo que la persona no dijo. "No sé", "no estoy seguro" y "todavía no lo he pensado" son null.
- Clasifica SOLO el mensaje que se te da. No supongas nada a partir de otra cosa.
- El español colombiano informal, con errores de dedo y sin tildes, es lo normal aquí: entiéndelo, no lo castigues.

Responde solo con el JSON pedido.`;
}

/** Lo que se le muestra al modelo del turno: la pregunta y el texto, nada más. */
export function entradaInterprete(texto: string, pregunta?: string): string {
  const contexto = pregunta ? `PREGUNTA QUE SE LE HIZO: ${pregunta}\n` : "";
  return `${contexto}LO QUE ESCRIBIÓ: "${texto}"`;
}

/**
 * Valida lo que devolvió el modelo contra el menú cerrado del campo.
 *
 * Es el borde de confianza de toda la capa: fuera del enum, `null`, o con otra
 * forma → `undefined`, que la conversación ya sabe tratar (repregunta).
 *
 * El ingreso pasa por DOS puertas, no una: zod dice "es un número entero
 * positivo" y `plausible()` dice "es un número que alguien puede tener de
 * verdad" (500 mil a 100 millones). De ese monto sale el único gate legal del
 * sistema (40%, Decreto 583 de 2025), así que un 42 o un 900.000.000 no puede
 * entrar solo por tener la forma correcta.
 */
export function validarInterpretacion<C extends CampoInterpretable>(
  campo: C,
  crudo: unknown,
): ValorDe<C> | undefined {
  const parseado = esquemaDe(campo).safeParse(crudo);
  if (!parseado.success || parseado.data.valor === null) return undefined;

  const valor = parseado.data.valor as ValorDe<C>;

  if (campo === "rango_ingreso_hogar") {
    return plausible(valor as number) as ValorDe<C> | undefined;
  }
  return valor;
}

/** El corte de latencia de toda la capa de IA, igual que el del chat. */
export const LIMITE_INTERPRETE_MS = 3000;

/**
 * Interpreta con IA lo que el regex no entendió. `undefined` = tampoco se supo.
 *
 * Nunca lanza: cualquier falla es `undefined`, y la conversación sigue por el
 * mismo camino que ya recorría antes de que esta capa existiera.
 */
export async function interpretarConIA<C extends CampoInterpretable>(
  campo: C,
  texto: string,
  pregunta?: string,
): Promise<ValorDe<C> | undefined> {
  const crudo = await generarJSON({
    system: promptInterprete(campo),
    prompt: entradaInterprete(texto, pregunta),
    esquema: esquemaJSONDe(campo),
    // Un valor del menú cabe de sobra; el techo bajo es parte de que no se
    // ponga a explicar por qué lo clasificó así.
    maxTokens: 120,
    signal: AbortSignal.timeout(LIMITE_INTERPRETE_MS),
  });

  return validarInterpretacion(campo, crudo);
}
