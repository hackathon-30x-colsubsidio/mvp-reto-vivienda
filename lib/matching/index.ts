import type { Lead } from "@/lib/types";
import type { EntradaMatch, FichaProyecto, ProyectoElegido } from "./tipos";

// El matcher es determinista y sin LLM: elige y deja la traza de por qué.
// El experto (prompt-experto.ts) solo redacta el porqué de lo ya elegido.

const MAXIMO_RECOMENDADOS = 3;

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

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
 * Orden de las reglas (las dos primeras descartan, las demás rankean):
 * 1. Fuera todo proyecto por encima del `precio_maximo` que calculó el motor
 *    con el tope del 40% (Decreto 583 de 2025). El Track C no recalcula la norma.
 * 2. Si el lead es no afiliado, fuera todo proyecto sin cupo 90/10 disponible.
 * 3. Primero el proyecto por el que preguntó, luego los de su zona, luego
 *    (si es no afiliado) los de más cupo libre, y al final los de cuota más holgada.
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

  const candidatos = catalogo
    .filter((p) => p.precio_desde <= precio_maximo)
    .filter((p) => !noAfiliado || cupoLibre(p) > 0);

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
      `tiene ${cupoLibre(proyecto)} de ${proyecto.cupo_no_afiliados.total} cupos de no afiliado disponibles (regla 90/10)`,
    );
  }
  if (proyecto.vis) {
    razones.push("es VIS, así que admite los subsidios de vivienda de interés social");
  }

  return razones;
}
