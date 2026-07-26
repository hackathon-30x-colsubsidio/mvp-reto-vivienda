import type { ValorDe } from "../acciones";

const NIEGA =
  /\b(no|nop|nunca|jam[áa]s|ninguno|ninguna|negativo|todav[íi]a\s+no|a[úu]n\s+no|aun\s+no)\b/i;

/**
 * ¿Ya tiene vivienda, o sería la primera?
 *
 * `undefined` = no se pudo saber. No es un fracaso del parser: es la señal que
 * hoy se perdía en silencio, y ahora la ve quien conduce la conversación.
 */
export function interpretarVivienda(texto: string): ValorDe<"tiene_vivienda"> | undefined {
  const t = texto.toLowerCase();
  const primeraVez =
    /primera|no tengo|nunca|arriendo|arrendad|vivo con|de mis pap|alquil/.test(t) ||
    (NIEGA.test(t) && !/ya tengo|s[íi] tengo/.test(t));
  const yaTiene =
    /ya tengo|s[íi] tengo|tengo (una |mi )?(casa|apartamento|vivienda)|propia|es m[íi]a/.test(t);

  if (primeraVez && !yaTiene) return false;
  if (yaTiene) return true;
  return undefined;
}
