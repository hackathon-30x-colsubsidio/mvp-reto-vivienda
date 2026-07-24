import type { LeadCurado, Score } from "@/lib/types";

// =====================================================================
// Tipos propios del Track D (vista asesor + DB).
//
// Viven APARTE de lib/types.ts a propósito: ese archivo es el contrato
// compartido entre los 4 tracks y tocarlo se avisa en el grupo. Lo de
// aquí es interno de D y nadie más lo consume.
// =====================================================================

/** Las 3 salidas del corte. Se deriva del contrato, no se redeclara. */
export type EstadoLead = Score["salida"];

/**
 * Un lead curado + la metadata que solo existe en la DB.
 *
 * `re_enganchado_en` NO es un cuarto estado: el lead sigue siendo de
 * nutrición, solo que ya se le disparó el trigger (ADR 0003).
 */
export interface LeadEnCola {
  curado: LeadCurado;
  re_enganchado_en: string | null;
  creado_en: string;
  /**
   * Marca los leads del telón de fondo del tablero
   * (`lib/fixtures/cola-historica.ts`), que existen para que las
   * métricas por día tengan serie.
   *
   * Opcional a propósito: un lead sin la marca es real. La UI está
   * obligada a avisarlo en pantalla — nunca se le presenta al jurado un
   * número sintético como si viniera de la operación.
   */
  sintetico?: boolean;
}

/**
 * Orden de la cola del asesor: quien puede comprar arriba, nutrición al final.
 *
 * ⚠️ `listo` y `listo_restriccion_cupo` comparten grupo a propósito (cambiado
 * el 2026-07-24). Antes el no afiliado tenía grupo propio DEBAJO del afiliado,
 * así que un no afiliado con 71 puntos aparecía debajo de un afiliado con 42 —
 * la afiliación decidía a quién llamar primero. El mentor lo puso al revés:
 * *"siempre va a ser la prioridad de los ingresos"*, y a Colsubsidio le
 * interesa cerrar la venta. Ahora dentro del grupo ordena el PUNTAJE, y la
 * afiliación ya solo pesa como desempate dentro de ese puntaje (0,05 en
 * `lib/scoring/config.ts`).
 *
 * Nutrición sigue de última, y eso NO es por afiliación: es que todavía no
 * puede comprar, así que llamarlo hoy no cierra nada.
 */
export const PRIORIDAD: Record<EstadoLead, number> = {
  listo: 1,
  listo_restriccion_cupo: 1,
  nutricion: 2,
};

/** Etiquetas legibles de cada salida, para la UI. */
export const ETIQUETA_ESTADO: Record<EstadoLead, string> = {
  listo: "Listo",
  listo_restriccion_cupo: "Listo · cupo 90/10",
  nutricion: "Nutrición",
};

/**
 * Ordena la cola del asesor: primero quien puede comprar, y dentro de ese
 * grupo **el puntaje manda** — no la afiliación.
 *
 * A igual puntaje, lo más reciente primero. Los re-enganchados NO se salen de
 * su grupo — se marcan con un badge, pero siguen siendo leads de nutrición.
 */
export function ordenarCola(leads: LeadEnCola[]): LeadEnCola[] {
  return [...leads].sort((a, b) => {
    const porPrioridad =
      PRIORIDAD[a.curado.score.salida] - PRIORIDAD[b.curado.score.salida];
    if (porPrioridad !== 0) return porPrioridad;

    const porPuntaje = b.curado.score.puntaje - a.curado.score.puntaje;
    if (porPuntaje !== 0) return porPuntaje;

    return b.creado_en.localeCompare(a.creado_en);
  });
}
