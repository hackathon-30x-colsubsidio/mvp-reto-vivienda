import type { ValorDe } from "../acciones";
import { numerosDe } from "./texto";

/**
 * En qué tramo de edad va. Rango, nunca fecha de nacimiento: menos dato, misma
 * señal para la similitud con compradores reales.
 *
 * Entiende el número ("tengo 29") y la palabra ("treinta y dos"), en ese orden.
 * `undefined` = no se pudo saber.
 */
/**
 * "Más de 45" es 46 en adelante, no 45.
 *
 * ⚠️ Sin esto, `numerosDe("Más de 45")` sacaba el 45 y `45 <= 45` lo dejaba en
 * `36_45` — mientras que TOCAR ese mismo chip guardaba `46_mas`. O sea que
 * escribir la etiqueta del chip valía distinto que tocarlo, contra spec 02 D4.
 */
const MAS_DE = /\bm[áa]s de\b|\bmayor(?:es)? de\b|\barriba de\b/i;

export function interpretarEdad(texto: string): ValorDe<"rango_edad"> | undefined {
  const encontrada = numerosDe(texto).find((n) => n >= 14 && n <= 99);
  if (encontrada === undefined) {
    const t = texto.toLowerCase();
    // `(?! y)` es lo que impide que `^treinta` se coma "treinta y ocho" antes de
    // que la segunda rama lo vea: sin él, los 36-39 escritos en letras caían en
    // el tramo 20-35 y movían la similitud con compradores reales.
    if (/veinti|treinta y (uno|dos|tres|cuatro|cinco)\b|^treinta\b(?! y)/.test(t)) return "20_35";
    if (/treinta y (seis|siete|ocho|nueve)|cuarenta/.test(t)) return "36_45";
    if (/cincuenta|sesenta|setenta/.test(t)) return "46_mas";
    return undefined;
  }

  const edad = MAS_DE.test(texto) ? encontrada + 1 : encontrada;
  if (edad <= 35) return "20_35";
  if (edad <= 45) return "36_45";
  return "46_mas";
}
