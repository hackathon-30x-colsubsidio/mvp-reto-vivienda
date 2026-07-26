import type { AmenidadInteres, Lead } from "@/lib/types";
import { precioMaximoDe } from "@/lib/scoring/capacidad";
import { similitudCon } from "@/lib/scoring/similitud";
import { ETIQUETA_AMENIDAD } from "@/lib/conversacion/banco-preguntas";
import { catalogo as catalogoReal } from "./catalogo";
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

// ── Lo que pidió en el banco de preguntas (rama 8) ───────
//
// ⚠️ **BONOS, NUNCA FILTROS.** Ordenan y jamás descartan. Solo 3 de los 18
// proyectos tienen tipología de 3 alcobas: un filtro duro dejaría a las
// familias grandes sin NADA que ver, que es peor que mostrarles algo apretado
// diciéndoselo. Cada bono queda citable en el `porque` — cero caja negra.
//
// La escala está calibrada contra la similitud, que es 0–1 con mediana 0,385 y
// rango real 0,13–0,77 (medido con `scripts/sonda-similitud.ts`). Los tres van
// por DEBAJO del bono VIS+subsidio: ese es plata que le baja la cuota todos los
// meses, y pesa más que una preferencia. Entre ellos el orden es por cuánto
// separa el catálogo y cuánto le cuesta al lead equivocarse:
const BONO_ALCOBAS_SUFICIENTES = 0.12; // el más fuerte: es una necesidad, y solo 3 de 18 dan 3 alcobas
const BONO_AMENIDAD_PEDIDA = 0.08; // proporcional a cuántas de las que pidió tiene
const BONO_AREA_SUFICIENTE = 0.06; // el más suave: es gusto, no necesidad

/**
 * La mediana del área privada del catálogo, para partir "compacto" de "amplio".
 *
 * Se calcula del catálogo y no se escribe a mano: si mañana entra un proyecto,
 * el corte se mueve solo. Hoy da 40,55 m² sobre un rango de 21,6 a 68,06.
 */
const MEDIANA_AREA = (() => {
  const areas = catalogoReal
    .map((p) => p.area_privada_desde_m2)
    .filter((a): a is number => typeof a === "number")
    .sort((a, b) => a - b);
  return areas.length > 0 ? areas[Math.floor(areas.length / 2)] : 0;
})();

/** ¿Alguna tipología le da al hogar las alcobas que pidió? (`3` es "3 o más"). */
function alcanzanLasAlcobas(proyecto: FichaProyecto, pedidas: number): boolean {
  return (proyecto.alcobas ?? []).some((a) => a >= pedidas);
}

/** Qué fracción de lo que pidió en el conjunto tiene de verdad este proyecto. */
function fraccionDeAmenidades(proyecto: FichaProyecto, pedidas: AmenidadInteres[]): number {
  if (pedidas.length === 0) return 0;
  const tiene = proyecto.amenidades ?? [];
  return pedidas.filter((a) => tiene.includes(a)).length / pedidas.length;
}

/** El área del proyecto va con lo que dijo preferir. */
function calzaElEspacio(
  proyecto: FichaProyecto,
  preferencia: "compacto" | "amplio",
): boolean {
  const area = proyecto.area_privada_desde_m2;
  if (area === undefined) return false;
  return preferencia === "amplio" ? area >= MEDIANA_AREA : area < MEDIANA_AREA;
}

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

/**
 * Cupo que de verdad queda, para ORDENAR. Nunca negativo.
 *
 * ⚠️ Esto arregla un sesgo que se comía la recomendación entera. En el catálogo
 * real **los 18 proyectos tienen el cupo copado**, así que `cupoLibre` es
 * negativo en todos y ordenar por "el que tenga más cupo libre" degeneraba en
 * "el que se pasó por menos unidades" — que es solo otra forma de decir **el
 * proyecto más pequeño**: ZARZAL (1 permitido, 2 vendidos → −1) le ganaba a
 * LA MACARENA (37 permitidos, 82 vendidos → −45), aunque sea $77M más caro.
 * Como el cupo se compara ANTES que la similitud/precio, el resto dejaba de
 * contar y todo no afiliado terminaba viendo los mismos proyectos chicos.
 *
 * Con el tope en 0, todos los copados empatan y el desempate cae más abajo.
 * El cupo sigue desempatando **mientras haya cupo de verdad**, que es lo que
 * la regla 90/10 quiere decir.
 */
function cupoDisponible(proyecto: FichaProyecto): number {
  return Math.max(0, cupoLibre(proyecto));
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
 * 1. Precio: fuera todo proyecto por encima de su techo. El techo se calcula
 *    POR PROYECTO, no con un número plano: una VIS permite financiar el 80%
 *    en vez del 70% (Decreto 583 de 2025), así que a igual precio su cuota
 *    mensual es más alta y el máximo que el lead aguanta es más bajo. Con un
 *    solo número, una VIS cara se colaba con una cuota por encima del 40%.
 *    `precio_maximo` (el que calculó el motor, no-VIS) sigue mandando como
 *    techo del que llama; `techoDe` nunca lo supera, solo lo puede bajar.
 * 2. Zona: si el lead dijo dónde quiere vivir (o el enriquecimiento trajo su
 *    ciudad), solo se recomienda AHÍ — aunque quede un solo proyecto. El match
 *    es por tokens normalizados (lib/matching/geografia.ts): "Bogotá, por el
 *    norte" sí encuentra Bogotá. Un proyecto con `ubicacion_incierta` (la
 *    fuente original se contradice) NUNCA cuenta como coincidencia — se puede
 *    recomendar por precio, con la advertencia encima, nunca prometido por zona.
 *    Murió el fallback que, si la zona no daba 2+ candidatos, recomendaba de
 *    todo el catálogo en silencio: un bogotano recibía Girardot sin que nadie
 *    se lo dijera (corregido 2026-07-25).
 *    · Si en su zona no hay NADA que le alcance, se devuelven hasta 2
 *      alternativas marcadas `fuera_de_zona: true` con la razón honesta —
 *      la decisión es del lead y del asesor, no del matcher.
 *    · Sin zona conocida no se inventa una: compite todo el catálogo.
 *
 * RANKING (ordena, nunca descarta): interés declarado primero; después
 * similitud con los compradores reales del proyecto (ticket 016) + bonos
 * visibles (VIS si declaró subsidio, barrio exacto); cupo disponible para el
 * no afiliado (nunca negativo — ver `cupoDisponible`); y el precio queda de
 * ÚLTIMO desempate — antes era el criterio dominante y todo el mundo recibía
 * los 3 proyectos más baratos del catálogo, ganara 3 o 15 millones.
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

  // FILTRO 1 — precio: el único descarte financiero, techo por proyecto (VIS
  // financia más, así que su techo es más bajo a igual precio).
  const techoDe = (p: FichaProyecto) => Math.min(precio_maximo, precioMaximoDe(lead, p.vis));
  const candidatos = catalogo.filter((p) => p.precio_desde <= techoDe(p));

  // FILTRO 2 — zona: si la conocemos, manda.
  const enZona = zona ? candidatos.filter((p) => coincideZona(p, zona)) : candidatos;
  const fueraDeZona = zona !== undefined && enZona.length === 0;
  const elegibles = fueraDeZona ? candidatos : enZona;
  const maximo = fueraDeZona ? MAXIMO_ALTERNATIVAS_FUERA_DE_ZONA : MAXIMO_RECOMENDADOS;

  // RANKING — puntos visibles por proyecto (similitud + bonos), calculados una
  // vez y no dentro del comparador.
  const { alcobas_deseadas, amenidades_interes, espacio_preferido } = lead.respuestas;

  const puntosDe = new Map<string, number>(
    elegibles.map((p) => {
      const sim = similitudCon(lead, p.proyecto_id, afiliado).valorNorm;
      const bonoVis = conSubsidio && p.vis ? BONO_VIS_CON_SUBSIDIO : 0;
      const bonoBarrio = coincideBarrio(p, zona) ? BONO_BARRIO_EXACTO : 0;
      // Los tres del banco. Cada uno vale 0 si la persona no contestó esa
      // pregunta, que es el caso de casi todos: el banco pregunta máximo 2.
      const bonoAlcobas =
        alcobas_deseadas !== undefined && alcanzanLasAlcobas(p, alcobas_deseadas)
          ? BONO_ALCOBAS_SUFICIENTES
          : 0;
      const bonoAmenidad =
        BONO_AMENIDAD_PEDIDA * fraccionDeAmenidades(p, amenidades_interes ?? []);
      const bonoArea =
        espacio_preferido && calzaElEspacio(p, espacio_preferido) ? BONO_AREA_SUFICIENTE : 0;
      return [
        p.proyecto_id,
        sim + bonoVis + bonoBarrio + bonoAlcobas + bonoAmenidad + bonoArea,
      ];
    }),
  );

  return elegibles
    .sort(
      (a, b) =>
        Number(esInteres(b)) - Number(esInteres(a)) ||
        (puntosDe.get(b.proyecto_id) ?? 0) - (puntosDe.get(a.proyecto_id) ?? 0) ||
        // Solo desempata mientras quede cupo de verdad: si están todos copados
        // (hoy, los 18), esto da 0 y manda el precio. Ver `cupoDisponible`.
        (noAfiliado ? cupoDisponible(b) - cupoDisponible(a) : 0) ||
        a.precio_desde - b.precio_desde,
    )
    .slice(0, maximo)
    .map((ficha) => ({
      ficha,
      fuera_de_zona: fueraDeZona || undefined,
      razones: razonesDe(ficha, {
        lead,
        afiliado,
        precio_maximo: techoDe(ficha),
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
  if (proyecto.ubicacion_incierta) {
    // Entra por precio, nunca por zona (ver coincideZona en geografia.ts), y
    // el asesor tiene que saber por qué no se le promete una ciudad: la fuente
    // original dice dos.
    razones.push(
      `⚠️ la ubicación de este proyecto no está confirmada — el insumo original lo reporta en dos ciudades distintas (${proyecto.ciudad}), así que hay que verificarla antes de ofrecérsela`,
    );
  }

  // Similitud con compradores reales: las evidencias salen del ÚNICO punto que
  // redacta los % (lib/scoring/similitud.ts). Si el equipo decide no citar el
  // PPT, se vacían allá y esta razón desaparece sola.
  const { evidencias } = similitudCon(contexto.lead, proyecto.proyecto_id, contexto.afiliado);
  if (evidencias.length > 0) {
    // Sin género y sin "tú": este texto lo lee el asesor en la ficha Y viaja al
    // prompt que le habla al lead (§7 punto 17). Decía "gente como él ya compró
    // aquí" mientras las evidencias decían "como tu hogar" — tres personas en
    // una sola frase. El agente lo pasa a segunda persona al redactar; aquí se
    // deja impersonal, que es lo que sirve para los dos destinos.
    razones.push(`el histórico de compradores del proyecto coincide con su perfil: ${evidencias.join("; ")}`);
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

  razones.push(...razonesDelBanco(proyecto, contexto.lead));

  return razones;
}

/**
 * Lo que se le puede decir sobre lo que pidió en el banco de preguntas.
 *
 * ⚠️ **Estas frases las lee el LEAD**, no solo el asesor (§7 punto 17). Por eso
 * la parte incómoda también se dice: si pidió 3 alcobas y el proyecto tiene 2,
 * sale con su ⚠️ en vez de callarse. Un bono que solo habla cuando suma es
 * publicidad; el compromiso del repo es que el porqué pese tanto como la
 * recomendación, y eso incluye lo que no calza. Es la misma honestidad
 * temprana del acuse de la zona sin proyectos: vale más decirlo aquí que en la
 * visita.
 *
 * 🔴 El copy está SIN RATIFICAR (§7 punto 15).
 */
function razonesDelBanco(proyecto: FichaProyecto, lead: Lead): string[] {
  const razones: string[] = [];
  const { alcobas_deseadas, amenidades_interes, espacio_preferido } = lead.respuestas;

  if (alcobas_deseadas !== undefined && (proyecto.alcobas ?? []).length > 0) {
    const alcobas = proyecto.alcobas!;
    const lista = alcobas.join(" y ");
    const pedidas = alcobas_deseadas === 3 ? "3 o más" : String(alcobas_deseadas);
    razones.push(
      alcanzanLasAlcobas(proyecto, alcobas_deseadas)
        ? `tiene tipologías de ${lista} alcoba${alcobas.length > 1 || alcobas[0] > 1 ? "s" : ""}, y pidió ${pedidas}`
        : `⚠️ pidió ${pedidas} alcobas y aquí las tipologías son de ${lista} — entra por precio y zona, pero eso hay que decírselo`,
    );
  }

  if (amenidades_interes && amenidades_interes.length > 0) {
    const tiene = proyecto.amenidades ?? [];
    const si = amenidades_interes.filter((a) => tiene.includes(a));
    const no = amenidades_interes.filter((a) => !tiene.includes(a));
    const nombrar = (as: AmenidadInteres[]) => as.map((a) => ETIQUETA_AMENIDAD[a]).join(" y ");

    if (si.length > 0 && no.length === 0) razones.push(`tiene ${nombrar(si)}, que fue lo que pidió`);
    else if (si.length > 0) razones.push(`tiene ${nombrar(si)}, pero no ${nombrar(no)}, que también pidió`);
    else razones.push(`⚠️ no tiene ${nombrar(no)}, que fue lo que pidió`);
  }

  if (espacio_preferido && proyecto.area_privada_desde_m2 !== undefined) {
    const area = proyecto.area_privada_desde_m2.toLocaleString("es-CO");
    razones.push(
      calzaElEspacio(proyecto, espacio_preferido)
        ? espacio_preferido === "amplio"
          ? `el área privada arranca en ${area} m², de las más amplias del catálogo, que es lo que buscaba`
          : `el área privada arranca en ${area} m², compacta como la quería`
        : `⚠️ el área privada arranca en ${area} m², que no es el tipo de espacio que dijo buscar`,
    );
  }

  return razones;
}
