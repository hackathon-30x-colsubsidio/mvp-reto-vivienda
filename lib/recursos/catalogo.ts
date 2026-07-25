// Catálogo de recursos — grounding actualizable (docs/agents/context.md): los
// datos viven aquí, en un archivo editable, no dentro de un prompt. TS puro.
//
// Cada recurso es real y con link verificado. Los caveats IMPORTAN y no se
// borran: reflejan requisitos reales (antigüedad de afiliación, orden de
// postulación del subsidio, alcance de la cobranza). Un mensaje que promete de
// más es tan caja negra como un puntaje sin desglose.
//
// ⚠️ Los recursos con tipo "aliado_externo" NO son de Colsubsidio (Secretaría
// del Hábitat de Bogotá). Nunca se presentan como oferta propia — el molde de
// mensajes.ts los rotula como aliado externo, y el bloque del asesor también.
//
// NOTA HONESTA (no inventar): Colsubsidio NO tiene un programa propio robusto de
// educación financiera (su /creditos/educacion-financiera redirige a productos
// de crédito). Por eso la mejora del historial crediticio se cubre con el
// recurso EXTERNO de la Secretaría del Hábitat, no con uno propio inexistente.

export interface Recurso {
  id: string;
  nombre: string;
  url: string;
  tipo: "colsubsidio" | "aliado_externo";
  /**
   * Para qué le sirve al lead, en lenguaje natural. Cuando el sistema NO puede
   * verificar la premisa (p.ej. si el lead tiene deudas), la redacción es
   * CONDICIONAL y autocalificante ("si tienes deudas…"), de modo que el lead lo
   * descarta solo y el sistema no afirma nada inverificable.
   */
  para_que: string;
  /** Requisito o límite real que el mensaje debe respetar. */
  caveat?: string;
}

/**
 * Los ids son estables: el mapeador (index.ts) y los tests los referencian.
 * No renombrar sin actualizar ambos.
 */
export const CATALOGO_RECURSOS = {
  afiliacion: {
    id: "afiliacion",
    nombre: "Afiliación a Colsubsidio como independiente",
    url: "https://www.colsubsidio.com/afiliaciones/modalidades/independiente",
    tipo: "colsubsidio",
    para_que:
      "Afiliarte te da acceso al ecosistema de vivienda de Colsubsidio (subsidio + crédito) y te saca de competir por el cupo del 10% de no afiliados.",
    caveat:
      "Requiere estar ya en EPS y fondo de pensiones como independiente y no estar en otra caja. Para postular al subsidio de vivienda se necesitan mínimo 6 meses de afiliación continua con aporte del 2% del IBC.",
  },
  subsidio: {
    id: "subsidio",
    nombre: "Subsidio de vivienda nueva de Colsubsidio",
    url: "https://www.colsubsidio.com/subsidios/vivienda/nueva",
    tipo: "colsubsidio",
    para_que:
      "El subsidio baja lo que tienes que pagar: hasta 30 SMMLV para vivienda nueva VIS, para hogares con ingresos de hasta 4 SMMLV.",
    caveat:
      "Requiere estar afiliado, no ser propietario y no haber recibido subsidios antes. Va en orden: primero la carta de crédito hipotecario preaprobado (vigencia ≤90 días) y luego la postulación — no se activa solo.",
  },
  compra_cartera: {
    id: "compra_cartera",
    nombre: "Compra de cartera de Colsubsidio",
    url: "https://www.colsubsidio.com/creditos/consumo",
    tipo: "colsubsidio",
    // Copy AUTOCALIFICANTE (corrección 2026-07-25): el conversador no captura
    // deudas, así que el texto se redacta condicional para que el lead lo
    // descarte solo si no aplica. El sistema no afirma que el lead tenga deudas.
    para_que:
      "Si tienes deudas con otras entidades, consolidarlas en un solo crédito puede bajar tu cuota mensual y mover directamente la aguja del 40%.",
    caveat:
      "Solo aplica si hoy pagas cuotas de otros créditos. Si no tienes deudas, este recurso no es para ti.",
  },
  guia_subsidios: {
    id: "guia_subsidios",
    nombre: "Guía para acceder a subsidios de Colsubsidio",
    url: "https://www.colsubsidio.com/subsidios/guia-para-acceder-subsidios",
    tipo: "colsubsidio",
    para_que:
      "Un punto de partida de bajo compromiso para entender, paso a paso, cómo funcionan los subsidios de vivienda si no sabes por dónde empezar.",
  },
  educacion_financiera_habitat: {
    id: "educacion_financiera_habitat",
    nombre: "Educación e Inclusión Financiera — Secretaría del Hábitat de Bogotá",
    url: "https://habitatbogota.gov.co/transparencia/tramites-servicios/acceso-vivienda/educacion-e-inclusion-financiera",
    tipo: "aliado_externo",
    para_que:
      "Programa gratuito (presencial y virtual) que enseña, entre otras cosas, cómo consultar tu reporte crediticio y sanearlo — el paso que mejora tu historial antes de pedir el crédito.",
    caveat:
      "Es un programa de la Secretaría del Hábitat de Bogotá, aliado externo, no de Colsubsidio.",
  },
  ahorro_para_mi_casa: {
    id: "ahorro_para_mi_casa",
    nombre: "Ahorro para mi Casa — Secretaría del Hábitat de Bogotá",
    url: "https://habitatbogota.gov.co/transparencia/tramites-servicios/acceso-vivienda/ahorro-para-mi-casa",
    tipo: "aliado_externo",
    para_que:
      "Complemento de ahorro de hasta $13.026.733 (2026) en 12 cuotas, para hogares de hasta 2 SMMLV, condicionado a que ahorres cada mes.",
    caveat:
      "Es un programa de la Secretaría del Hábitat de Bogotá, aliado externo, no de Colsubsidio.",
  },
} as const satisfies Record<string, Recurso>;

export type RecursoId = keyof typeof CATALOGO_RECURSOS;
