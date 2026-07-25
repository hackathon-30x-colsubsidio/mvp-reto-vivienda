import type { Lead } from "@/lib/types";
import type { EntradaMatch, FichaProyecto, ProyectoElegido } from "./tipos";

// El matcher es determinista y sin LLM: elige y deja la traza de por qué.
// El experto (prompt-experto.ts) solo redacta el porqué de lo ya elegido.

const MAXIMO_RECOMENDADOS = 3;

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

function coincideZona(proyecto: FichaProyecto, zona: string | undefined): boolean {
  if (!zona) return false;
  const normal = (t: string) => t.trim().toLowerCase();
  return [proyecto.ciudad, proyecto.zona].some(
    (campo) => campo !== undefined && normal(campo) === normal(zona),
  );
}

/**
 * Elige 2-3 proyectos del catálogo por reglas explícitas.
 *
 * Orden de las reglas (solo la primera descarta, las demás rankean):
 * 1. Fuera todo proyecto por encima del `precio_maximo` que calculó el motor
 *    con el tope del 40% (Decreto 583 de 2025). El Track C no recalcula la norma.
 *    **Es el ÚNICO descarte.**
 * 2. El cupo 90/10 ya NO descarta (cambiado el 2026-07-24, spec 04 D3): los
 *    proyectos con el cupo copado se muestran de últimos y con la advertencia
 *    encima. En el catálogo real los 18 lo tienen agotado, así que la regla dura
 *    dejaba al no afiliado con cero proyectos aunque pasara el corte financiero.
 *    El hallazgo no se pierde: se dice en cada recomendación (ver `razonesDe`) y
 *    se sigue midiendo en el tablero.
 * 3. Si hay 2+ candidatos en su zona, se recomienda solo dentro de la zona.
 * 4. Ranking: primero el proyecto por el que preguntó, luego los de su zona,
 *    luego (si es no afiliado) los de más cupo libre, y al final el más barato.
 *
 * En nutrición devuelve vacío: no se recomienda lo que el lead no puede pagar.
 */
export function matchear({
  lead,
  score,
  catalogo,
  precio_maximo,
}: EntradaMatch): ProyectoElegido[] {
  if (score.salida === "nutricion") return [];

  const noAfiliado = score.salida === "listo_restriccion_cupo";
  const zona = zonaDeInteres(lead);
  const esInteres = (p: FichaProyecto) => p.nombre === lead.evento.proyecto_interes;

  // El precio es el ÚNICO descarte. El cupo 90/10 no bota proyectos: los baja
  // en el orden y los marca (ver `razonesDe`).
  //
  // Antes sí botaba, y con el catálogo real eso dejaba al no afiliado con CERO
  // proyectos —los 18 tienen el cupo copado— aunque hubiera pasado el corte
  // financiero. El mentor fue claro en que a Colsubsidio le interesa cerrar la
  // venta y que la afiliación solo debe pesar entre perfiles parecidos, así que
  // castigar al lead con las manos vacías contradice la operación real: el
  // 27,1% de los compradores históricos NO son afiliados. El hallazgo del 90/10
  // no se pierde — sigue medido en el tablero y dicho en cada recomendación.
  const candidatos = catalogo.filter((p) => p.precio_desde <= precio_maximo);

  // Si en su zona hay con qué armar la recomendación, no se sale de la zona:
  // ofrecerle otra ciudad a quien ya dijo dónde quiere vivir quema el match.
  const enZona = candidatos.filter((p) => coincideZona(p, zona));

  return (enZona.length >= 2 ? enZona : candidatos)
    .sort(
      (a, b) =>
        Number(esInteres(b)) - Number(esInteres(a)) ||
        Number(coincideZona(b, zona)) - Number(coincideZona(a, zona)) ||
        (noAfiliado ? cupoLibre(b) - cupoLibre(a) : 0) ||
        a.precio_desde - b.precio_desde,
    )
    .slice(0, MAXIMO_RECOMENDADOS)
    .map((ficha) => ({
      ficha,
      razones: razonesDe(ficha, { precio_maximo, zona, noAfiliado, esInteres: esInteres(ficha) }),
    }));
}

/**
 * La traza que el experto convierte en `ProyectoRecomendado.porque`.
 * Son hechos con su número, no adjetivos: el modelo redacta, no aporta datos.
 */
function razonesDe(
  proyecto: FichaProyecto,
  contexto: {
    precio_maximo: number;
    zona: string | undefined;
    noAfiliado: boolean;
    esInteres: boolean;
  },
): string[] {
  const razones = [
    `precio desde ${pesos.format(proyecto.precio_desde)}, dentro del máximo de ${pesos.format(
      contexto.precio_maximo,
    )} que le permite el tope del 40% del ingreso (Decreto 583 de 2025)`,
  ];

  if (contexto.esInteres) {
    razones.push("es el proyecto por el que preguntó al dejar sus datos");
  }
  if (coincideZona(proyecto, contexto.zona)) {
    razones.push(`queda en ${proyecto.ciudad}, la zona que le interesa`);
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
    razones.push("es VIS, así que admite los subsidios de vivienda de interés social");
  }

  return razones;
}
