// Umbrales y pesos del motor de scoring. PROPUESTOS, no definitivos:
// el kickoff del equipo los ratifica (spec §7 — "el umbral del corte y el peso
// de cada factor" está marcado como supuesto por validar). Cambiar solo aquí,
// nunca hardcodeado dentro de lib/scoring/index.ts.

export const CONFIG_SCORING = {
  /**
   * Tope legal duro: primera cuota / ingreso mensual del hogar ≤ 40%.
   * Fuente: Decreto 583 de 2025 (modifica el art. 2.1.11.1 del Decreto 1077
   * de 2015). No es un supuesto del equipo — es normativa vigente, así que
   * este número NO se toca sin una razón regulatoria nueva.
   */
  TOPE_CUOTA_SOBRE_INGRESO: 0.4,

  /**
   * % del precio del proyecto que se estima como primera cuota mensual
   * equivalente, para poder comparar contra el ingreso mensual declarado.
   * PROPUESTO: aproxima una cuota de crédito hipotecario a 20 años sobre el
   * 70% del valor de la vivienda (30% cuota inicial + subsidio ya restado
   * en otro paso). Ratificar con un asesor financiero en el kickoff — hoy
   * es una heurística razonable, no una fórmula bancaria certificada.
   */
  PORCENTAJE_PRIMERA_CUOTA_ESTIMADA: 0.006,

  /**
   * Umbral de "similitud alta" con compradores reales del mismo proyecto,
   * usado solo para redactar el valor del factor (evidencia, nunca corta).
   */
  UMBRAL_SIMILITUD_ALTA: 0.5,
} as const;
