import type { Lead } from "@/lib/types";
import { similitudCon } from "@/lib/scoring/similitud";
import { coincideBarrio, coincideZona } from "./geografia";
import type { EntradaMatch, FichaProyecto, ProyectoElegido } from "./tipos";

// El matcher es determinista y sin LLM: elige y deja la traza de por qué.
// El experto (prompt-experto.ts) solo redacta el porqué de lo ya elegido —
// puede ordenar y enamorar, pero no puede colar un proyecto que las reglas
// duras no dejaron pasar.

const MAXIMO_RECOMENDADOS = 3;

/** Fuera de la zona del lead solo se muestran ALTERNATIVAS marcadas, y pocas. */
const MAXIMO_ALTERNATIVAS_FUERA_DE_ZONA = 2;

/**
 * Bonos del ranking (no del puntaje del motor): se suman a la similitud 0–1
 * para ordenar candidatos YA filtrados por precio y zona. Números visibles y
 * con nombre — el orden también es "cero caja negra".
 */
const BONO_VIS_CON_SUBSIDIO = 0.15; // proyecto VIS cuando el lead declaró subsidio
const BONO_BARRIO_EXACTO = 0.1; // nombró el sector del proyecto, no solo la ciudad

// "$194.023.050", sin el espacio duro que mete `style: "currency"`: es el mismo
// formato que usa el motor en el valor de sus factores, y el espacio duro además
// rompía las búsquedas de texto en los tests de la ficha.
const pesos = {
  format: (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`,
};

/** Lo que dijo en el chat manda; si no lo dijo, la ciudad del enriquecimiento. */
function zonaDeInteres(lead: Lead): string | undefined {
  return lead.respuestas.zona_interes ?? lead.perfil.ciudad;
}

function cupoLibre(proyecto: FichaProyecto): number {
  return proyecto.cupo_no_afiliados.total - proyecto.cupo_no_afiliados.usado;
}

function tieneSubsidio(lead: Lead): boolean {
  return (
    (lead.respuestas.subsidios ?? []).length > 0 ||
    (lead.respuestas.subsidio_monto_mensual ?? 0) > 0
  );
}

/**
 * Elige 2-3 proyectos del catálogo por reglas explícitas.
 *
 * FILTROS (descartan, en orden):
 * 1. Precio: fuera todo proyecto por encima del `precio_maximo` que calculó el
 *    motor con el tope del 40% (Decreto 583 de 2025). El matcher no recalcula
 *    la norma.
 * 2. Zona: si el lead dijo dónde quiere vivir (o el enriquecimiento trajo su
 *    ciudad), solo se recomienda AHÍ — aunque quede un solo proyecto. El match
 *    es por tokens normalizados (lib/matching/geografia.ts): "Bogotá, por el
 *    norte" sí encuentra Bogotá. Murió el fallback que, si la zona no daba
 *    2+ candidatos, recomendaba de todo el catálogo en silencio: un bogotano
 *    recibía Girardot sin que nadie se lo dijera (corregido 2026-07-25).
 *    · Si en su zona no hay NADA que le alcance, se devuelven hasta 2
 *      alternativas marcadas `fuera_de_zona: true` con la razón honesta —
 *      la decisión es del lead y del asesor, no del matcher.
 *    · Sin zona conocida no se inventa una: compite todo el catálogo.
 *
 * RANKING (ordena, nunca descarta): interés declarado primero; después
 * similitud con los compradores reales del proyecto (ticket 016) + bonos
 * visibles (VIS si declaró subsidio, barrio exacto); cupo libre para el no
 * afiliado; y el precio queda de ÚLTIMO desempate — antes era el criterio
 * dominante y todo el mundo recibía los 3 proyectos más baratos del catálogo,
 * ganara 3 o 15 millones.
 *
 * El cupo 90/10 NO descarta (spec 04 D3, 2026-07-24): se muestra con su
 * advertencia. En nutrición devuelve vacío: no se recomienda lo que el lead
 * no puede pagar.
 */
export function matchear({
  lead,
  score,
  catalogo,
  precio_maximo,
}: EntradaMatch): ProyectoElegido[] {
  if (score.salida === "nutricion") return [];

  const noAfiliado = score.salida === "listo_restriccion_cupo";
  const afiliado = !noAfiliado;
  const zona = zonaDeInteres(lead);
  const conSubsidio = tieneSubsidio(lead);
  const esInteres = (p: FichaProyecto) => p.nombre === lead.evento.proyecto_interes;

  // FILTRO 1 — precio: el único descarte financiero.
  const candidatos = catalogo.filter((p) => p.precio_desde <= precio_maximo);

  // FILTRO 2 — zona: si la conocemos, manda.
  const enZona = zona ? candidatos.filter((p) => coincideZona(p, zona)) : candidatos;
  const fueraDeZona = zona !== undefined && enZona.length === 0;
  const elegibles = fueraDeZona ? candidatos : enZona;
  const maximo = fueraDeZona ? MAXIMO_ALTERNATIVAS_FUERA_DE_ZONA : MAXIMO_RECOMENDADOS;

  // RANKING — puntos visibles por proyecto (similitud + bonos), calculados una
  // vez y no dentro del comparador.
  const puntosDe = new Map<string, number>(
    elegibles.map((p) => {
      const sim = similitudCon(lead, p.proyecto_id, afiliado).valorNorm;
      const bonoVis = conSubsidio && p.vis ? BONO_VIS_CON_SUBSIDIO : 0;
      const bonoBarrio = coincideBarrio(p, zona) ? BONO_BARRIO_EXACTO : 0;
      return [p.proyecto_id, sim + bonoVis + bonoBarrio];
    }),
  );

  return elegibles
    .sort(
      (a, b) =>
        Number(esInteres(b)) - Number(esInteres(a)) ||
        (puntosDe.get(b.proyecto_id) ?? 0) - (puntosDe.get(a.proyecto_id) ?? 0) ||
        (noAfiliado ? cupoLibre(b) - cupoLibre(a) : 0) ||
        a.precio_desde - b.precio_desde,
    )
    .slice(0, maximo)
    .map((ficha) => ({
      ficha,
      fuera_de_zona: fueraDeZona || undefined,
      razones: razonesDe(ficha, {
        lead,
        afiliado,
        precio_maximo,
        zona,
        noAfiliado,
        conSubsidio,
        esInteres: esInteres(ficha),
        fueraDeZona,
      }),
    }));
}

/**
 * La traza que el experto convierte en `ProyectoRecomendado.porque`.
 * Son hechos con su número, no adjetivos: el modelo redacta, no aporta datos.
 */
function razonesDe(
  proyecto: FichaProyecto,
  contexto: {
    lead: Lead;
    afiliado: boolean;
    precio_maximo: number;
    zona: string | undefined;
    noAfiliado: boolean;
    conSubsidio: boolean;
    esInteres: boolean;
    fueraDeZona: boolean;
  },
): string[] {
  const razones: string[] = [];

  if (contexto.fueraDeZona) {
    // La advertencia va PRIMERO: es una alternativa, no una recomendación normal.
    razones.push(
      `⚠️ fuera de tu zona: en ${contexto.zona} no hay proyectos del catálogo dentro de tu presupuesto — esta es una alternativa en ${proyecto.ciudad}`,
    );
  }

  razones.push(
    `precio desde ${pesos.format(proyecto.precio_desde)}, dentro del máximo de ${pesos.format(
      contexto.precio_maximo,
    )} que le permite el tope del 40% del ingreso (Decreto 583 de 2025)`,
  );

  if (contexto.esInteres) {
    razones.push("es el proyecto por el que preguntó al dejar sus datos");
  }
  if (coincideZona(proyecto, contexto.zona)) {
    razones.push(
      coincideBarrio(proyecto, contexto.zona) && proyecto.zona
        ? `queda en ${proyecto.zona} (${proyecto.ciudad}), el sector que nombró`
        : `queda en ${proyecto.ciudad}, la zona que le interesa`,
    );
  }

  // Similitud con compradores reales: las evidencias salen del ÚNICO punto que
  // redacta los % (lib/scoring/similitud.ts). Si el equipo decide no citar el
  // PPT, se vacían allá y esta razón desaparece sola.
  const { evidencias } = similitudCon(contexto.lead, proyecto.proyecto_id, contexto.afiliado);
  if (evidencias.length > 0) {
    razones.push(`gente como él ya compró aquí: ${evidencias.join("; ")}`);
  }

  if (contexto.noAfiliado) {
    razones.push(
      cupoLibre(proyecto) > 0
        ? `tiene ${cupoLibre(proyecto)} de ${proyecto.cupo_no_afiliados.total} cupos de no afiliado disponibles (regla 90/10)`
        : // No se le esconde al asesor ni se le promete la unidad al lead: el
          // proyecto ya vende por encima del 10% que permite la regla, y quien
          // valida el cupo es el asesor antes de separar.
          `⚠️ el cupo de no afiliados de este proyecto ya está copado: lleva ${proyecto.cupo_no_afiliados.usado} de ${proyecto.cupo_no_afiliados.total} permitidos (regla 90/10), así que el asesor tiene que validar cupo antes de separar`,
    );
  }
  if (proyecto.vis) {
    razones.push(
      contexto.conSubsidio
        ? `es VIS, así que el subsidio que declaró (${(contexto.lead.respuestas.subsidios ?? []).join(", ") || "por confirmar"}) aplica aquí`
        : "es VIS, así que admite los subsidios de vivienda de interés social",
    );
  }

  return razones;
}
