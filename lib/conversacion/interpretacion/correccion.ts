/**
 * ¿El lead está corrigiendo algo que ya había dicho?
 *
 * ⚠️ La lista es corta A PROPÓSITO, por la misma asimetría que gobierna
 * `desvio.ts`: tomar una respuesta por una corrección es peor que no detectar la
 * corrección. Sin marca explícita, esto devuelve `false`.
 *
 * Las que se dejaron por fuera y por qué:
 *   · "en realidad" — "en realidad no tengo nada" es una respuesta legítima a la
 *     pregunta de subsidios, y el intérprete de vivienda también la reconoce
 *     ("no tengo"). La marca habría comido el dato que la persona sí estaba dando.
 *   · "perdón", "no" sueltos — la mitad de las respuestas del set empiezan así.
 *
 * Quien detecta la marca no decide nada: `accionDeCorreccion` en `preguntas.ts`
 * exige además que algún campo YA RESPONDIDO reconozca el texto.
 */
const MARCA_CORRECCION =
  /me equivoqu[ée]|equivocaci[óo]n|corr[íi]jo|corregir|correcci[óo]n|quise decir|quer[íi]a decir|dije mal|escrib[íi] mal|mejor dicho|mentiras/i;

export function pareceCorreccion(texto: string): boolean {
  return MARCA_CORRECCION.test(texto);
}
