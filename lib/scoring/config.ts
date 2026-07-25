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
   * Los parámetros del crédito con los que se estima la primera cuota.
   *
   * ⚠️ REEMPLAZARON AL 0,6% PLANO (2026-07-25). Aquel decía aproximar "una
   * cuota a 20 años sobre el 70% del valor" y **no daba**: con la fórmula de
   * anualidad, el 0,6% equivale a una tasa del **8,66% E.A.**, que no existe
   * hoy en el mercado. Subestimaba la cuota entre 25% y 45%, así que el motor
   * aprobaba a gente que el banco iba a rechazar — el error más caro posible
   * para un producto cuya promesa es "capacidad validada".
   *
   * Cada número aquí tiene fuente (ver `docs/credito-y-subsidios.md`):
   */
  CREDITO: {
    /**
     * Tasa efectiva anual. 13% es el promedio del mercado colombiano en 2026
     * (la ponderada de no VIS que reporta la Superfinanciera es 15,18%, y el
     * rango del mercado va de 10,93% a 17,75%). Se toma el promedio, no el
     * extremo bajo: estimar por debajo es lo que rompió el modelo anterior.
     */
    TASA_EA: 0.13,
    /** El plazo estándar de un crédito hipotecario de vivienda. */
    PLAZO_ANIOS: 20,
    /**
     * Cuánto del valor de la vivienda se puede financiar. Lo fija el mismo
     * Decreto 583 de 2025 que pone el tope del 40%, así que no es supuesto
     * nuestro: 70% en general, 80% en VIS. Ojo con la consecuencia — la VIS
     * permite financiar MÁS, así que su cuota mensual es más alta a igual precio.
     */
    LTV_NO_VIS: 0.7,
    LTV_VIS: 0.8,
  },

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
   *
   * ⚠️ LA AFILIACIÓN ES DESEMPATE, NO CRITERIO (rebalanceado el 2026-07-24).
   * Pesaba 0,20 — el segundo factor más alto — así que un afiliado arrancaba
   * 18 puntos arriba de un no afiliado y la afiliación decidía la cola por sí
   * sola. Eso contradice al mentor, que fue textual: *"la prioridad siempre son
   * los afiliados, PERO siempre va a ser la prioridad de los ingresos"*
   * (charla-mentor.md #90-10-e-ingresos). A Colsubsidio le interesa la venta;
   * la afiliación solo debe romper el empate entre dos perfiles parecidos.
   *
   * Por eso el peso bajó a 0,05 (≤5 puntos: alcanza para desempatar, no para
   * reordenar) y los 0,15 liberados se fueron íntegros a la capacidad de pago,
   * que es lo que el mentor dijo que manda.
   */
  PESOS: {
    holgura_capacidad: 0.45, // qué tan por debajo del 40% cae la cuota — MANDA
    similitud_compradores: 0.2, // fit con la distribución real del proyecto
    subsidio: 0.15, // cuánto del pago mensual cubre el subsidio
    sin_vivienda: 0.1, // propósito social: priorizar a quien no tiene
    situacion_crediticia: 0.05, // señal autorreportada, no verificación
    afiliacion_cupo: 0.05, // DESEMPATE entre perfiles parecidos, nada más
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
