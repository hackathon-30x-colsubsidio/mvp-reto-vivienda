import type { ValorDe } from "../acciones";
import { numerosDe } from "./texto";

/**
 * En qué tramo de edad va. Rango, nunca fecha de nacimiento: menos dato, misma
 * señal para la similitud con compradores reales.
 *
 * Entiende el número ("tengo 29") y la palabra ("treinta y dos"), en ese orden.
 * `undefined` = no se pudo saber.
 */
export function interpretarEdad(texto: string): ValorDe<"rango_edad"> | undefined {
  const edad = numerosDe(texto).find((n) => n >= 14 && n <= 99);
  if (edad === undefined) {
    const t = texto.toLowerCase();
    if (/veinti|treinta y (uno|dos|tres|cuatro|cinco)\b|^treinta\b/.test(t)) return "20_35";
    if (/treinta y (seis|siete|ocho|nueve)|cuarenta/.test(t)) return "36_45";
    if (/cincuenta|sesenta|setenta/.test(t)) return "46_mas";
    return undefined;
  }
  if (edad <= 35) return "20_35";
  if (edad <= 45) return "36_45";
  return "46_mas";
}
