// El copy que ve el LEAD cuando recibe un recurso. TS puro: el LLM solo pule
// tono después, nunca decide el contenido. Sigue las reglas de redacción de
// lib/conversacion/preguntas.ts (dice para qué sirve · sin jerga · habla de la
// casa, no del trámite).
//
// ⚠️ TONO NO NEGOCIABLE: un recurso NUNCA se lee como rechazo ni como "no
// calificaste". Es "esto te conviene ADEMÁS/MIENTRAS", jamás "esto es lo que te
// queda". Por eso hay DOS moldes: el `listo` dice explícito que un asesor va a
// contactar; el de nutrición dice que le escribimos cuando cambie la condición.

import { NOMBRE_AGENTE } from "../conversacion/preguntas";
import type { RecursoRecomendado, Score } from "../types";

function primerNombre(nombre: string): string {
  return nombre.split(" ")[0];
}

/** Un recurso como viñeta de chat: rotula el externo, cita el porqué, deja el link. */
function vinieta(recurso: RecursoRecomendado): string {
  const externo = recurso.tipo === "aliado_externo" ? " (aliado externo, no es de Colsubsidio)" : "";
  return `• ${recurso.nombre}${externo}: ${recurso.porque} → ${recurso.url}`;
}

/**
 * Lead que SÍ pasó el gate (listo / listo_restriccion_cupo). El asesor lo va a
 * contactar; el recurso es un "además" que lo deja mejor parado, no un reemplazo.
 */
export function mensajeRecursoListo(nombre: string, recursos: RecursoRecomendado[]): string {
  return (
    `Una última cosa, ${primerNombre(nombre)} 🙌 Un asesor de Colsubsidio te va a contactar para avanzar con tu compra. ` +
    `Y mientras tanto, esto te conviene tener a la mano:\n\n` +
    recursos.map(vinieta).join("\n") +
    `\n\nCuando hables con el asesor ya vas un paso adelante.`
  );
}

/**
 * Lead en nutrición. El obstáculo ya se lo dijimos (vive en el trigger); acá va
 * lo que puede HACER para acercarse, en acciones suyas, y que le escribimos.
 */
export function mensajeRecursoNutricion(nombre: string, recursos: RecursoRecomendado[]): string {
  return (
    `${primerNombre(nombre)}, esto no termina acá 💙 Hay pasos que te acercan a tu casa, y este es el que más mueve la aguja:\n\n` +
    recursos.map(vinieta).join("\n") +
    `\n\nApenas eso cambie te escribimos — no tienes que estar pendiente tú. Acá sigo siendo ${NOMBRE_AGENTE}.`
  );
}

/**
 * Elige el molde por la salida. Devuelve `null` si no hay recursos: no hay nada
 * que mostrar y el chat no agrega un mensaje vacío.
 */
export function mensajeDeRecursos(
  nombre: string,
  salida: Score["salida"],
  recursos: RecursoRecomendado[] | undefined,
): string | null {
  if (!recursos || recursos.length === 0) return null;
  return salida === "nutricion"
    ? mensajeRecursoNutricion(nombre, recursos)
    : mensajeRecursoListo(nombre, recursos);
}
