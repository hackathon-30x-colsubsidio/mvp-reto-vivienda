import { afiliadoEfectivo } from "@/lib/scoring";
import { calcularPuntaje } from "@/lib/scoring/puntaje";
import { ETIQUETA_ESTADO, PRIORIDAD, type EstadoLead } from "@/lib/types-asesor";
import { NOMBRE_FUENTE } from "@/lib/formato";
import type { Agrupador, DatosTablero, GrupoLeads } from "./tipos";
import type { LeadEnCola } from "@/lib/types-asesor";

// =====================================================================
// REGISTRY DE AGRUPADORES — los ejes por los que se puede partir la cola.
//
// El tablero muestra hoy la afiliación, que es lo que se pidió. Los
// otros dos están escritos y probados, sin usar: son la demostración de
// que cambiar el eje es una línea en la página, no un refactor. Cuando
// alguien quiera "y también por ciudad", el trabajo es un objeto más
// aquí abajo.
// =====================================================================

/** Puntaje del lead. Vive aquí porque es el orden de todos los grupos. */
export function puntajeDe(lead: LeadEnCola): number {
  return calcularPuntaje(lead.curado.score, afiliadoEfectivo(lead.curado.lead)).total;
}

/** Mejor puntaje primero; a igual puntaje, lo más reciente arriba. */
function porPuntaje(leads: LeadEnCola[]): LeadEnCola[] {
  return [...leads].sort(
    (a, b) => puntajeDe(b) - puntajeDe(a) || b.creado_en.localeCompare(a.creado_en),
  );
}

/**
 * EL EJE ACTIVO: afiliado vs. no afiliado.
 *
 * Es la partición que le importa al especialista porque decide la ruta
 * comercial: el afiliado va derecho, el no afiliado compite por el 10%
 * que permite la regla 90/10 y hay que validarle cupo antes de
 * prometerle nada.
 */
export const POR_AFILIACION: Agrupador = {
  id: "afiliacion",
  titulo: "Afiliación a Colsubsidio",
  grupos({ leads }) {
    const afiliados = leads.filter((l) => afiliadoEfectivo(l.curado.lead));
    const noAfiliados = leads.filter((l) => !afiliadoEfectivo(l.curado.lead));

    return [
      {
        clave: "afiliado",
        titulo: "Afiliados a Colsubsidio",
        subtitulo:
          "Ruta directa: no compiten por cupo. Ordenados por puntaje, el más listo para comprar arriba.",
        leads: porPuntaje(afiliados),
      },
      {
        clave: "no-afiliado",
        titulo: "No afiliados",
        subtitulo:
          "Compiten por el 10% de cupo que permite la regla 90/10. Validar cupo del proyecto antes de prometer.",
        leads: porPuntaje(noAfiliados),
      },
    ];
  },
};

/** El eje de la cola de `/asesor`, aquí como agrupador registrado. */
export const POR_ESTADO: Agrupador = {
  id: "estado",
  titulo: "Salida del motor",
  grupos({ leads }) {
    return (Object.keys(PRIORIDAD) as EstadoLead[]).map((estado) => ({
      clave: estado,
      titulo: ETIQUETA_ESTADO[estado],
      subtitulo:
        estado === "nutricion"
          ? "Nadie se descarta: cada uno tiene la regla que no pasó y el trigger que lo volvería viable."
          : "Pasaron el corte del 40% (Decreto 583 de 2025).",
      leads: porPuntaje(leads.filter((l) => l.curado.score.salida === estado)),
    }));
  },
};

/** Por dónde entró el lead. Sostiene la narrativa multi-canal del spec §4. */
export const POR_FUENTE: Agrupador = {
  id: "fuente",
  titulo: "Canal de entrada",
  grupos({ leads }) {
    const fuentes = [...new Set(leads.map((l) => l.curado.lead.evento.fuente))].sort();

    return fuentes.map(
      (fuente): GrupoLeads => ({
        clave: fuente,
        titulo: NOMBRE_FUENTE[fuente] ?? fuente,
        subtitulo: "Todos los canales emiten el mismo lead-evento (spec §4 paso 1).",
        leads: porPuntaje(leads.filter((l) => l.curado.lead.evento.fuente === fuente)),
      }),
    );
  },
};

/** Todo agrupador registrado. El test de invariantes recorre esta lista. */
export const AGRUPADORES: Agrupador[] = [POR_AFILIACION, POR_ESTADO, POR_FUENTE];

/** El que rinde la página hoy. Cambiar el eje del tablero es cambiar esto. */
export const AGRUPADOR_ACTIVO: Agrupador = POR_AFILIACION;

export type { DatosTablero };
