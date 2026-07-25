import { CONFIG_SCORING } from "./config";
import type { Lead } from "../types";

// Capacidad de compra — la MISMA aritmética del gate del 40%, despejada al
// revés (ticket 004). Vive junto al motor a propósito: el matcher consume el
// número y NO reimplementa la norma. Si el Decreto cambia, cambia en config.ts
// y estas funciones siguen siendo correctas.
//
// ⚠️ Hasta el 2026-07-25 esto era `precio × 0,6%`. Ese número decía aproximar
// "20 años sobre el 70% del valor" y no daba: equivale a una tasa del 8,66%
// E.A., que no existe en el mercado. Ahora se calcula la cuota de verdad, con
// la fórmula de anualidad y parámetros con fuente (docs/credito-y-subsidios.md).

/**
 * El factor de una anualidad: cuánto se paga al mes por cada peso prestado.
 *
 *     factor = i / (1 − (1+i)^−n)
 *
 * `i` es la tasa MENSUAL equivalente de la efectiva anual —no la anual dividida
 * en 12, que es un error clásico y subestima— y `n` el número de cuotas.
 */
function factorCuotaMensual(): number {
  const { TASA_EA, PLAZO_ANIOS } = CONFIG_SCORING.CREDITO;
  const i = (1 + TASA_EA) ** (1 / 12) - 1;
  const n = PLAZO_ANIOS * 12;
  return i / (1 - (1 + i) ** -n);
}

/** Qué fracción del valor de la vivienda se financia, según sea VIS o no. */
function ltv(vis: boolean): number {
  const { LTV_VIS, LTV_NO_VIS } = CONFIG_SCORING.CREDITO;
  return vis ? LTV_VIS : LTV_NO_VIS;
}

/**
 * La primera cuota mensual estimada para una vivienda de ese precio.
 *
 * No incluye los seguros de vida deudor e incendio/terremoto, que el banco
 * cobra en el mismo recibo: la cuota real es algo mayor que esta. Se dice para
 * que nadie lea este número como el total exacto que va a pagar.
 */
export function cuotaEstimada(precio: number, vis = false): number {
  return precio * ltv(vis) * factorCuotaMensual();
}

/**
 * Lo que este lead pagaría al mes por esa vivienda, ya descontado el subsidio.
 *
 * Es la cifra que entra al gate. Vive aquí y no en cada consumidor porque la
 * misma resta estaba escrita en tres lugares (el factor de la cuota, el trigger
 * de nutrición y ahora el puente del ticket 023): tres copias de una norma es
 * como se desincronizan las pantallas del asesor.
 */
export function cuotaNetaDe(lead: Lead, precio: number, vis = false): number {
  const subsidio = lead.respuestas.subsidio_monto_mensual ?? 0;
  return Math.max(0, cuotaEstimada(precio, vis) - subsidio);
}

/**
 * El gate del 40% preguntado sobre UN proyecto: ¿su cuota le cabe a este lead?
 *
 * Es la misma condición que evalúa `factorCuotaIngreso40`, no una aproximación:
 * quien pregunte esto y quien califique tienen que responder igual, o el sistema
 * recomendaría lo que el gate rechaza. Sin ingreso o sin precio devuelve
 * `false` — el caso conservador, igual que `precioMaximoDe`.
 */
export function cabeEnElTope(lead: Lead, precio: number, vis = false): boolean {
  const ingreso = lead.respuestas.ingreso_hogar_mensual ?? 0;
  if (ingreso <= 0 || precio <= 0) return false;
  return cuotaNetaDe(lead, precio, vis) / ingreso <= CONFIG_SCORING.TOPE_CUOTA_SOBRE_INGRESO;
}

/**
 * El precio de vivienda más alto que este lead puede pagar sin pasarse del
 * tope legal del 40% del ingreso del hogar (Decreto 583 de 2025).
 *
 * Es la condición del gate despejada para el precio:
 *   precio × LTV × factor − subsidio ≤ 40% × ingreso
 *   precio ≤ (40% × ingreso + subsidio) / (LTV × factor)
 *
 * `vis` importa y no es un detalle: una VIS permite financiar el 80% en vez del
 * 70%, así que a igual precio su cuota es MÁS alta y el techo del lead es MÁS
 * bajo. Por defecto se calcula el caso no VIS, que es el de la mayoría del
 * catálogo; quien filtre proyectos debe pasar el `vis` de cada uno.
 *
 * Sin ingreso declarado devuelve 0: no se le recomienda nada a quien no
 * sabemos si puede pagarlo. Es el caso conservador, no un error.
 */
export function precioMaximoDe(lead: Lead, vis = false): number {
  const ingreso = lead.respuestas.ingreso_hogar_mensual ?? 0;
  if (ingreso <= 0) return 0;

  const subsidio = lead.respuestas.subsidio_monto_mensual ?? 0;
  const cuotaMaxima = ingreso * CONFIG_SCORING.TOPE_CUOTA_SOBRE_INGRESO + subsidio;

  return Math.floor(cuotaMaxima / (ltv(vis) * factorCuotaMensual()));
}
