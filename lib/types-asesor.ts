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
}

/** Orden de la cola del asesor: listos arriba, nutrición al final. */
export const PRIORIDAD: Record<EstadoLead, number> = {
  listo: 1,
  listo_restriccion_cupo: 2,
  nutricion: 3,
};

/** Etiquetas legibles de cada salida, para la UI. */
export const ETIQUETA_ESTADO: Record<EstadoLead, string> = {
  listo: "Listo",
  listo_restriccion_cupo: "Listo · cupo 90/10",
  nutricion: "Nutrición",
};

/**
 * Ordena la cola del asesor.
 *
 * Dentro de cada grupo, lo más reciente primero. Los re-enganchados NO
 * se salen de su grupo — se marcan con un badge, pero siguen siendo
 * leads de nutrición.
 */
export function ordenarCola(leads: LeadEnCola[]): LeadEnCola[] {
  return [...leads].sort((a, b) => {
    const porPrioridad =
      PRIORIDAD[a.curado.score.salida] - PRIORIDAD[b.curado.score.salida];
    if (porPrioridad !== 0) return porPrioridad;
    return b.creado_en.localeCompare(a.creado_en);
  });
}
