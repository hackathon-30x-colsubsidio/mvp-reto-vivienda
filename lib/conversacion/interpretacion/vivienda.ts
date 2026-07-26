import type { ValorDe } from "../acciones";
import { sinTildes } from "./texto";

const NIEGA =
  /\b(no|nop|nunca|jam[áa]s|ninguno|ninguna|negativo|todav[íi]a\s+no|a[úu]n\s+no|aun\s+no)\b/i;

/**
 * Decir que no se SABE no es decir que NO.
 *
 * ⚠️ Sin esto, `NIEGA` atrapaba el "no" de "no sé" y devolvía `false`, o sea
 * **una afirmación sobre la vida de alguien que esa persona nunca hizo**. Medido
 * (2026-07-26): `"pues no sé"`, `"no sé todavía"` y `"no estoy seguro"` los tres
 * caían en `tiene_vivienda: false`.
 *
 * Lo que costaba, exacto: el factor `ya_tiene_vivienda` de `lib/scoring/index.ts`
 * puntúa `false` como 1,0 y `undefined` como 0,5 sobre un peso de 0,10, así que
 * la afirmación falsa **regalaba 5 puntos de 100**; y la ficha del asesor decía
 * "No tiene vivienda propia" donde la verdad era "No informado".
 *
 * (Los docs del repo decían además que habilitaba los subsidios de primera
 * vivienda. Es impreciso y quedó corregido: `recursos/index.ts:70` calcula
 * `!tieneVivienda` con `=== true`, así que `false` y `undefined` disparan el
 * recurso igual. Lo que cambia es el puntaje y lo que se afirma en la ficha.)
 */
const DUDA = /\bno se\b|\bni idea\b|no estoy segur|no sabria|todavia no lo se/i;

/**
 * ¿Ya tiene vivienda, o sería la primera?
 *
 * `undefined` = no se pudo saber. No es un fracaso del parser: es la señal que
 * antes se perdía en silencio, y ahora la ve quien conduce la conversación.
 */
export function interpretarVivienda(texto: string): ValorDe<"tiene_vivienda"> | undefined {
  // ⚠️ `sinTildes` y no `toLowerCase`, por la misma razón que en `crediticia.ts`
  // — y aquí además hay una trampa que costó encontrar: **`\b` no funciona
  // después de una vocal acentuada**, porque `é` no es `\w` para JS. `/\bno
  // s[ée]\b/` NUNCA casaba con "no sé". Normalizando primero, `\bno se\b` sí, y
  // sigue sin atrapar "no señora" ni "no sea" (la `\b` los excluye).
  const t = sinTildes(texto);
  const yaTiene =
    /ya tengo|s[íi] tengo|tengo (una |mi )?(casa|apartamento|vivienda)|propia|es m[íi]a/.test(t);

  if (yaTiene) return true;
  // La duda se mira ANTES que la negación: si no, el "no" de "no sé" gana.
  if (DUDA.test(t)) return undefined;

  const primeraVez =
    /primera|no tengo|nunca|arriendo|arrendad|vivo con|de mis pap|alquil/.test(t) ||
    NIEGA.test(t);

  return primeraVez ? false : undefined;
}
