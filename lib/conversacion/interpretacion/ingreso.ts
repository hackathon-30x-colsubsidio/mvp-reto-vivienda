import { numerosDe } from "./texto";

// El ingreso es el único dato con el que el sistema puede equivocarse en serio:
// de él sale el gate del 40% (Decreto 583 de 2025). Todo lo de este archivo
// existe para que un número mal leído no cambie el veredicto en silencio.

/**
 * Salario mínimo mensual legal vigente. **$1.750.905 en 2026**, fijado por los
 * Decretos 1469 y 1470 del 29 de diciembre de 2025 (+23% sobre 2025). Ya NO es
 * un supuesto: tiene fuente — ver docs/credito-y-subsidios.md.
 *
 * Se duplica a propósito el valor de `lib/fixtures/cola-historica.ts`: este
 * módulo lo carga el cliente y no debe arrastrar las fixtures al bundle. Si
 * cambia el año, cambian los dos (y `scripts/generar_sintetica.py`).
 */
const SMMLV = 1_750_905;

/**
 * Lo escrito no es un monto sino una cuenta, un signo o un error de dedo.
 *
 * Sin esto, `2+2` entraba como $2.000.000 y `-3` como $3.000.000: el parser ve
 * los dígitos y no el operador. Ojo con el guion — `2-3` SÍ es un rango válido
 * ("entre 2 y 3"), así que solo se rechaza cuando ABRE el texto, que es la
 * forma de un negativo.
 */
const NO_ES_MONTO = /[+*/=%]|^\s*-/;

/**
 * Ingresos mensuales fuera de los cuales no se califica sin confirmar.
 *
 * ⚠️ Los dos números son **supuesto nuestro, no dato de Colsubsidio**: el piso
 * queda por debajo del salario mínimo (nadie compra vivienda con menos, y casi
 * siempre es un cero que faltó) y el techo, en cien millones al mes, es
 * absurdo para este catálogo. Existen porque el ingreso es el insumo del ÚNICO
 * gate legal del sistema: un número mal leído cambia el veredicto en silencio.
 */
export const INGRESO_MINIMO_PLAUSIBLE = 500_000;
export const INGRESO_MAXIMO_PLAUSIBLE = 100_000_000;

/**
 * El monto solo cuenta si cae en un rango que una persona puede tener de verdad.
 *
 * Es el gate que TODO monto tiene que pasar, venga del regex de aquí abajo o
 * del modelo de la rama 4: zod dice "es un número", esto dice "es un número que
 * alguien puede tener". Devuelve `undefined` cuando no, y ese `undefined` es lo
 * que hace que se repregunte en vez de calificar con una suposición.
 */
export function plausible(monto: number): number | undefined {
  const redondeado = Math.round(monto);
  return redondeado >= INGRESO_MINIMO_PLAUSIBLE && redondeado <= INGRESO_MAXIMO_PLAUSIBLE
    ? redondeado
    : undefined;
}

/**
 * Convierte a pesos mensuales lo que la persona escribió. Acepta las formas en
 * que la gente responde de verdad: un monto, "2 millones y medio", "3 salarios
 * mínimos", "entre 2 y 3" (se toma el punto medio).
 *
 * Devuelve `undefined` cuando el número queda ambiguo (p. ej. un "800" pelado:
 * ¿ochocientos mil, u ochocientos?). Eso NO rompe la conversación: el texto
 * crudo se guarda igual en `rango_ingreso_hogar` y el asesor lo ve tal cual.
 */
export function parsearIngresoMensual(texto: string): number | undefined {
  const limpio = texto.toLowerCase();
  if (NO_ES_MONTO.test(limpio)) return undefined;
  const numeros = numerosDe(limpio);
  if (numeros.length === 0) return undefined;

  // "entre 2 y 3", "2-3": punto medio del rango que la persona dio.
  const base = numeros.length >= 2 ? (numeros[0] + numeros[1]) / 2 : numeros[0];
  const conMedio = /\by\s+medio\b/.test(limpio) ? base + 0.5 : base;

  if (/mill|\bmm\b/.test(limpio)) return plausible(conMedio * 1_000_000);
  if (/m[íi]nimo|salario|smmlv|smlv/.test(limpio)) {
    return plausible(conMedio * SMMLV);
  }
  if (/\bmil\b/.test(limpio)) return plausible(conMedio * 1_000);

  // Sin unidad: un monto completo se escribe con sus ceros; un número pequeño
  // es la forma corta de "millones" ("gano 3" tras preguntar cuánto entra al mes).
  if (conMedio >= 100_000) return plausible(conMedio);
  if (conMedio <= 30) return plausible(conMedio * 1_000_000);
  return undefined;
}

/** El rango del enriquecimiento ("3-5 SMMLV") llevado a un monto usable por el motor. */
export function ingresoDesdeRango(rango: string): number | undefined {
  return parsearIngresoMensual(rango);
}
