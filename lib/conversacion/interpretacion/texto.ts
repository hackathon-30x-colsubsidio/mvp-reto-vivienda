// Primitivas de texto que comparten los intérpretes. Sin dominio, sin copy.

/** Para comparar como escribe la gente: "chia" tiene que encontrar "Chía". */
export const sinTildes = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Saca los números de una frase escrita por una persona real: "4.500.000",
 * "4'500.000", "4,5", "entre 3 y 5". Los puntos son separadores de miles
 * cuando cierran en 3 dígitos y decimales cuando no ("4.5 millones").
 */
export function numerosDe(texto: string): number[] {
  const crudos = texto.replace(/['`´]/g, ".").match(/\d+(?:[.,]\d+)*/g) ?? [];
  return crudos
    .map((crudo) => {
      const partes = crudo.replace(/,/g, ".").split(".");
      if (partes.length === 1) return Number(partes[0]);
      const ultima = partes[partes.length - 1];
      if (ultima.length === 3) return Number(partes.join(""));
      return Number(`${partes.slice(0, -1).join("")}.${ultima}`);
    })
    .filter((n) => Number.isFinite(n) && n > 0);
}
