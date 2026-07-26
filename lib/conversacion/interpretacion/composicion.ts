import type { ValorDe } from "../acciones";

/**
 * Con quién compartiría la casa. Alimenta la similitud con compradores reales
 * (ticket 016), así que las categorías son las del PPT de buyer personas.
 *
 * `undefined` = no se pudo saber. Es el caso medido del plan: "vivo con mi mamá
 * y mi hermana" cae aquí, la persona cree que contestó, y hasta hoy el dato se
 * perdía con un acuse amable.
 */
export function interpretarComposicion(
  texto: string,
): ValorDe<"composicion_familiar"> | undefined {
  const t = texto.toLowerCase();
  // El orden importa: "yo sola con mi hija" es monoparental, no "familia con
  // hijos" ni "sola" — se descarta primero el caso más específico.
  if (
    /(sol[oa]s?\b.*\bhij|hij[oa]s?.*\bsol[oa]|yo con mis? hij|monoparental|madre soltera|padre soltero)/.test(
      t,
    )
  ) {
    return "monoparental";
  }
  if (/hij|niñ|bebé|bebe|chiquit|pelad[oa]s/.test(t)) return "familia_con_hijos";
  if (/pareja|espos[oa]|novi[oa]|conyug|señora|marido|prometid/.test(t)) return "pareja";
  if (/sol[oa]\b|yo sol|nadie|independiente|por mi cuenta/.test(t)) return "solo";
  return undefined;
}
