import type { LeadEnCola } from "@/lib/types-asesor";
import { afiliadoEfectivo } from "@/lib/scoring";
import { diaBogota } from "@/lib/formato";

// Serie de entrada de leads por día. TS puro, sin dependencias de UI:
// la pantalla decide cómo dibujarla, esto solo cuenta.
//
// El día calendario lo define `diaBogota` en `lib/formato.ts`, con la
// zona FIJA: un lead que entró a las 11 p.m. del martes en Bogotá
// cuenta el martes, lo abra quien lo abra y desde donde lo abra. Con la
// zona del sistema, el mismo dato daría barras distintas según la
// máquina, y el demo se graba en video.

export { diaBogota };

export interface DiaDeSerie {
  /** `YYYY-MM-DD` en Bogotá. */
  dia: string;
  total: number;
  afiliados: number;
  noAfiliados: number;
}

/**
 * Cuántos leads entraron cada día de la ventana.
 *
 * Los días sin leads salen en 0 y NO se omiten: un hueco en la serie es
 * información (ese día la pauta no trajo a nadie), y una gráfica que
 * salta de un día al otro miente sobre el ritmo.
 *
 * @param leads Toda la cola. Los de fuera de la ventana se ignoran.
 * @param dias Cuántos días hacia atrás, contando hoy.
 * @param hoy Ancla temporal, inyectada (nunca `new Date()` aquí dentro).
 */
export function serieDiaria(
  leads: LeadEnCola[],
  dias: number,
  hoy: Date,
): DiaDeSerie[] {
  const serie = new Map<string, DiaDeSerie>();

  // Se construye la ventana primero, con ceros, y después se llena: así
  // los días vacíos existen aunque ningún lead los mencione.
  for (let i = dias - 1; i >= 0; i--) {
    const dia = diaBogota(new Date(hoy.getTime() - i * 86_400_000));
    serie.set(dia, { dia, total: 0, afiliados: 0, noAfiliados: 0 });
  }

  for (const lead of leads) {
    const casilla = serie.get(diaBogota(lead.creado_en));
    if (!casilla) continue; // fuera de la ventana

    casilla.total++;
    if (afiliadoEfectivo(lead.curado.lead)) casilla.afiliados++;
    else casilla.noAfiliados++;
  }

  return [...serie.values()];
}
