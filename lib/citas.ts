import slots from "@/data/sintetica/slots.json";

// =====================================================================
// El catálogo de franjas de sala de ventas (ticket 005).
//
// Vive en data/sintetica/slots.json y NO en Supabase: la regla del ADR 0002 es
// que a la DB va solo lo que muta, y un horario simulado no muta. Solo la franja
// ELEGIDA se persiste (tabla `citas`).
//
// El archivo se GENERA desde el catálogo real de proyectos
// (`npx tsx scripts/generar-slots.ts`), así que los `proyecto_id` son los mismos
// slugs que usa el matcher. Antes eran ids inventados y el chat pedía franjas de
// un proyecto real recibiendo una lista vacía, sin que nada fallara.
//
// Este módulo es el único lugar que aplana el catálogo: lo consumen la ruta
// /api/citas y las fixtures de los personajes, y con dos copias una se queda
// vieja.
// =====================================================================

export interface Franja {
  sala_ventas: string;
  proyecto_id: string;
  proyecto: string;
  ciudad: string;
  fecha: string;
}

/** Todas las franjas del catálogo, ordenadas por fecha. */
export function todasLasFranjas(): Franja[] {
  return slots.salas
    .flatMap((sala) =>
      sala.franjas.map((fecha) => ({
        sala_ventas: sala.sala_ventas,
        proyecto_id: sala.proyecto_id,
        proyecto: sala.proyecto,
        ciudad: sala.ciudad,
        fecha,
      })),
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Las franjas de un proyecto (o de todos si no se pasa), como máximo `limite`. */
export function franjasDe(proyectoId?: string | null, limite?: number): Franja[] {
  const franjas = proyectoId
    ? todasLasFranjas().filter((f) => f.proyecto_id === proyectoId)
    : todasLasFranjas();

  return limite && limite > 0 ? franjas.slice(0, limite) : franjas;
}

/** ¿Esta franja existe en el catálogo? Impide agendar una hora inventada. */
export function franjaExiste(fecha: string, salaVentas: string): boolean {
  return todasLasFranjas().some(
    (f) => f.fecha === fecha && f.sala_ventas === salaVentas,
  );
}
