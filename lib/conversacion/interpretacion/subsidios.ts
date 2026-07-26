import type { ValorDe } from "../acciones";

/** Lo que se marca cuando la persona no sabe si aplica. Es un dato, no un vacío. */
export const POR_CONFIRMAR = "Por confirmar";

/**
 * Los subsidios que el chat nombra con etiqueta propia, y cómo los escribe la
 * gente. **Las etiquetas son literalmente las de los chips** de `preguntas.ts`:
 * escribir "mi casa ya" tiene que guardar lo mismo que tocar el chip "Mi Casa
 * Ya" (spec 02 D4, y la convención de `AGENTS.md` sobre que el chip es un atajo,
 * no otra respuesta).
 *
 * Medido el 2026-07-26: sin esto, tocar el chip guardaba
 * `"Subsidio caja de compensación"` y teclear su etiqueta guardaba la frase
 * cruda `"El de mi caja de compensación"`. Dos valores para la misma respuesta.
 *
 * Lo que NO está aquí se sigue guardando tal cual lo escribió: nombrar un
 * subsidio que no conocemos no lo vuelve inválido, y el asesor lo lee como lo
 * dijo.
 */
const CANONICOS: [RegExp, string][] = [
  [/mi casa ya/i, "Mi Casa Ya"],
  [/caja de compensaci[óo]n|\bcaja\b/i, "Subsidio caja de compensación"],
];

/** Un subsidio nombrado, llevado a su etiqueta del chip si lo conocemos. */
function canonizar(mencion: string): string {
  return CANONICOS.find(([patron]) => patron.test(mencion))?.[1] ?? mencion;
}

/**
 * Qué subsidios tiene. La lista vacía es una RESPUESTA ("ninguno todavía"), no
 * un fracaso — `undefined` es el fracaso.
 *
 * Lo que no cae en ninguna de las dos primeras formas se toma tal cual lo
 * escribió: nombrar un subsidio que no está en nuestra tabla no lo vuelve
 * inválido, y el asesor lo ve como lo dijo.
 */
export function interpretarSubsidios(texto: string): ValorDe<"subsidios"> | undefined {
  const t = texto.toLowerCase();
  if (/ninguno|ningun|no tengo|no he|nada|todav[íi]a no|a[úu]n no/.test(t) && !/mi casa ya/.test(t)) {
    return [];
  }
  if (/no s[ée]|ni idea|no estoy segur|creo que|no entiendo/.test(t)) return [POR_CONFIRMAR];

  const lista = texto
    .split(/,| y /)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(canonizar);
  // Solo llega aquí vacío si el texto era pura puntuación (","). Hasta hoy eso
  // pasaba como lista vacía CON el acuse de "¡eso suma!", que es absurdo; se
  // conserva el comportamiento y queda anotado en la bitácora del plan.
  return lista.length > 0 ? lista : undefined;
}
