import type { ValorDe } from "../acciones";

/**
 * Con quién compartiría la casa. Alimenta la similitud con compradores reales
 * (ticket 016), así que las categorías son las del PPT de buyer personas.
 *
 * `undefined` = no se pudo saber. Es el caso medido del plan: "vivo con mi mamá
 * y mi hermana" cae aquí, la persona cree que contestó, y hasta hoy el dato se
 * perdía con un acuse amable.
 */
/**
 * Cómo la gente nombra a un hijo. **Las dos ramas que hablan de hijos usan esta
 * misma lista**, y que no lo hicieran era el bug: la de monoparental exigía la
 * raíz `hij`, así que `"me toca criar sola a mi niña"` no la alcanzaba y caía en
 * la de abajo —que sí reconoce `niñ`— como `familia_con_hijos`. Medido el
 * 2026-07-26.
 *
 * `peques?` va con lookahead y **no con `\b`**, por una trampa que este mismo
 * archivo se comió: en JS la `ñ` no es carácter de palabra, así que `peques?\b`
 * SÍ casa dentro de "pequeño" (hay frontera entre la `e` y la `ñ`). Y "algo
 * pequeño", en esta pregunta, habla del apartamento y no de un hijo. El
 * lookahead excluye cualquier letra que continúe la palabra, la `ñ` incluida.
 * Es el mismo defecto que en `vivienda.ts` hacía que `/\bno s[ée]\b/` nunca
 * casara con "no sé": **`\b` no es de fiar en español.**
 */
const HIJOS = "(?:hij|ni[ñn]|beb[ée]|chiquit|peques?(?![a-zñáéíóú])|pelad[oa]s)";

// El orden importa: "yo sola con mi hija" es monoparental, no "familia con
// hijos" ni "sola" — se descarta primero el caso más específico.
const MONOPARENTAL = new RegExp(
  `sol[oa]s?\\b.*${HIJOS}|${HIJOS}.*\\bsol[oa]\\b|yo con mis? ${HIJOS}|monoparental|madre soltera|padre soltero`,
);
const CON_HIJOS = new RegExp(HIJOS);

export function interpretarComposicion(
  texto: string,
): ValorDe<"composicion_familiar"> | undefined {
  const t = texto.toLowerCase();
  if (MONOPARENTAL.test(t)) return "monoparental";
  if (CON_HIJOS.test(t)) return "familia_con_hijos";
  if (/pareja|espos[oa]|novi[oa]|conyug|señora|marido|prometid/.test(t)) return "pareja";
  if (/sol[oa]\b|yo sol|nadie|independiente|por mi cuenta/.test(t)) return "solo";
  return undefined;
}
