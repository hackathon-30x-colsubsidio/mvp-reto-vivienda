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

  /**
   * PESOS del puntaje de prioridad (capa 2 del motor). Cada factor aporta
   * peso * valor_norm * 100 al puntaje 0–100 que ordena la cola del asesor.
   * PROPUESTOS, suman 1.0 — el kickoff los ratifica (spec §7 marca "el peso de
   * cada factor" como supuesto por validar). El gate legal del 40% NO tiene
   * peso: es capa 1, bloquea antes de puntuar, no compite con estos.
   */
  PESOS: {
    holgura_capacidad: 0.3, // qué tan por debajo del 40% cae la cuota
    afiliacion_cupo: 0.2, // afiliado + cupo 90/10 disponible en el proyecto
    similitud_compradores: 0.2, // fit con la distribución real del proyecto
    subsidio: 0.15, // cuánto del pago mensual cubre el subsidio
    sin_vivienda: 0.1, // propósito social: priorizar a quien no tiene
    situacion_crediticia: 0.05, // señal autorreportada, no verificación
  },

  /**
   * Normalización de la holgura de capacidad: la cuota/ingreso va de 0 puntos
   * en el tope legal (40%) a 1 punto en RATIO_HOLGURA_PLENA (20%) o menos.
   * Lineal entre ambos. Aísla "apenas pasa" de "pasa con mucho margen".
   */
  RATIO_HOLGURA_PLENA: 0.2,

  /**
   * Normalización de la situación crediticia autorreportada → señal 0–1.
   */
  PUNTOS_CREDITICIA: {
    buena: 1,
    regular: 0.6,
    sin_info: 0.4,
    mala: 0,
  },
} as const;
