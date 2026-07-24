import { CONFIG_SCORING } from "./config";
import type { Lead } from "../types";

// Capacidad de compra — la MISMA aritmética del gate del 40%, despejada al
// revés (ticket 004). Vive junto al motor a propósito: el matcher consume el
// número y NO reimplementa la norma. Si el Decreto cambia, cambia en config.ts
// y estas dos funciones siguen siendo correctas.

/**
 * Primera cuota mensual estimada para un precio de vivienda.
 * El porcentaje es la heurística de `config.ts` (propuesta, a ratificar).
 */
export function cuotaEstimada(precio: number): number {
  return precio * CONFIG_SCORING.PORCENTAJE_PRIMERA_CUOTA_ESTIMADA;
}

/**
 * El precio de vivienda más alto que este lead puede pagar sin pasarse del
 * tope legal del 40% del ingreso del hogar (Decreto 583 de 2025).
 *
 * Es exactamente la condición del gate despejada para el precio:
 *   precio * %cuota − subsidio ≤ 40% × ingreso
 *   precio ≤ (40% × ingreso + subsidio) / %cuota
 *
 * Sin ingreso declarado devuelve 0: no se le recomienda nada a quien no
 * sabemos si puede pagarlo. Es el caso conservador, no un error.
 */
export function precioMaximoDe(lead: Lead): number {
  const ingreso = lead.respuestas.ingreso_hogar_mensual ?? 0;
  if (ingreso <= 0) return 0;

  const subsidio = lead.respuestas.subsidio_monto_mensual ?? 0;
  const cuotaMaxima = ingreso * CONFIG_SCORING.TOPE_CUOTA_SOBRE_INGRESO + subsidio;

  return Math.floor(cuotaMaxima / CONFIG_SCORING.PORCENTAJE_PRIMERA_CUOTA_ESTIMADA);
}
