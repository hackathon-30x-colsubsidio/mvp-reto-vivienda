import type { ValorDe } from "../acciones";

/** Lo que se marca cuando la persona no sabe si aplica. Es un dato, no un vacío. */
export const POR_CONFIRMAR = "Por confirmar";

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
    .filter(Boolean);
  // Solo llega aquí vacío si el texto era pura puntuación (","). Hasta hoy eso
  // pasaba como lista vacía CON el acuse de "¡eso suma!", que es absurdo; se
  // conserva el comportamiento y queda anotado en la bitácora del plan.
  return lista.length > 0 ? lista : undefined;
}
