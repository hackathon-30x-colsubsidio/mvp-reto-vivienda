import { afiliadoEfectivo } from "@/lib/scoring";
import distribuciones from "@/data/sintetica/distribuciones.json";
import type { Metrica } from "./tipos";
import { puntajeDe } from "./agrupadores";
import { diaBogota, serieDiaria } from "./serie-diaria";

// =====================================================================
// REGISTRY DE MÉTRICAS — la franja superior del tablero.
//
// ➕ PARA AGREGAR UNA MÉTRICA: escribe un objeto y mételo al array
//    METRICAS de abajo. La pantalla no hay que tocarla.
//
// Dos reglas para que una métrica entre:
//   1. `descripcion` dice de dónde sale el número. Se imprime debajo de
//      la cifra. Sin fuente no entra (cero caja negra, AGENTS.md).
//   2. `calcular` es puro y solo lee `datos`. Nada de `new Date()` ni
//      de fetch: el "ahora" llega en `datos.hoy`.
// =====================================================================

const porcentaje = (parte: number, total: number): string =>
  total === 0 ? "—" : `${Math.round((parte / total) * 100)}%`;

const LEADS_HOY: Metrica = {
  id: "leads-hoy",
  titulo: "Leads que entraron hoy",
  descripcion: "Conteo de leads con fecha de creación de hoy, hora de Bogotá.",
  calcular({ leads, hoy }) {
    const dia = diaBogota(hoy);
    const deHoy = leads.filter((l) => diaBogota(l.creado_en) === dia).length;

    const serie = serieDiaria(leads, 14, hoy);
    const previos = serie.slice(0, -1);
    const promedio =
      previos.length === 0
        ? 0
        : previos.reduce((s, d) => s + d.total, 0) / previos.length;

    return {
      valor: String(deHoy),
      detalle: `Promedio de los 13 días anteriores: ${promedio.toFixed(1)} por día.`,
    };
  },
};

const LEADS_SEMANA: Metrica = {
  id: "leads-semana",
  titulo: "Leads de los últimos 7 días",
  descripcion: "Suma de la serie diaria de la última semana.",
  calcular({ leads, hoy }) {
    const semana = serieDiaria(leads, 7, hoy).reduce((s, d) => s + d.total, 0);
    const anterior =
      serieDiaria(leads, 14, hoy)
        .slice(0, 7)
        .reduce((s, d) => s + d.total, 0);

    const delta = semana - anterior;
    return {
      valor: String(semana),
      detalle:
        anterior === 0
          ? "Sin semana anterior con la que comparar."
          : `${delta >= 0 ? "+" : ""}${delta} frente a los 7 días previos (${anterior}).`,
    };
  },
};

const PASAN_EL_CORTE: Metrica = {
  id: "pasan-corte",
  titulo: "Pasan el corte",
  descripcion:
    "Leads cuya cuota estimada cabe bajo el tope legal del 40% (Decreto 583 de 2025). El resto no se descarta: va a nutrición.",
  calcular({ leads }) {
    const listos = leads.filter((l) => l.curado.score.salida !== "nutricion").length;
    return {
      valor: porcentaje(listos, leads.length),
      detalle: `${listos} de ${leads.length} leads. Los otros ${leads.length - listos} quedan en nutrición con su trigger.`,
    };
  },
};

const NO_AFILIADOS: Metrica = {
  id: "no-afiliados",
  titulo: "Leads no afiliados",
  // La única marcada como principal, y no es capricho de diseño: el
  // spec 06 la llama "la más valiosa del tablero — la munición del reto
  // hecha operación". Es la que enfrenta la realidad medida contra el
  // límite que fija la norma.
  principal: true,
  descripcion: `Contra el ${distribuciones.pct_no_afiliado_global}% de los ${distribuciones.n_compradores_historico_total.toLocaleString("es-CO")} compradores históricos reales, y contra el 10% que permite la regla 90/10.`,
  calcular({ leads }) {
    const noAfiliados = leads.filter((l) => !afiliadoEfectivo(l.curado.lead)).length;
    return {
      valor: porcentaje(noAfiliados, leads.length),
      detalle: `Histórico real: ${distribuciones.pct_no_afiliado_global}%. Cupo que permite la regla: 10%.`,
    };
  },
};

const PUNTAJE_PROMEDIO: Metrica = {
  id: "puntaje-promedio",
  titulo: "Puntaje promedio",
  descripcion:
    "Promedio del puntaje 0-100, que se arma sumando los factores del motor con su peso. El desglose de cada lead está en su ficha.",
  calcular({ leads }) {
    if (leads.length === 0) return { valor: "—" };

    const puntajes = leads.map(puntajeDe);
    const promedio = puntajes.reduce((s, p) => s + p, 0) / puntajes.length;

    return {
      valor: `${Math.round(promedio)}`,
      detalle: `Rango de la cola: ${Math.min(...puntajes)} a ${Math.max(...puntajes)}.`,
    };
  },
};

const EN_NUTRICION: Metrica = {
  id: "en-nutricion",
  titulo: "En nutrición, con trigger",
  descripcion:
    "Leads que no pueden comprar hoy pero tienen registrada la condición exacta que los volvería viables. Nadie se bota.",
  calcular({ leads }) {
    const enNutricion = leads.filter((l) => l.curado.score.salida === "nutricion");
    const conTrigger = enNutricion.filter((l) => l.curado.score.trigger_nutricion?.trim());
    const reEnganchados = enNutricion.filter((l) => l.re_enganchado_en).length;

    return {
      valor: String(enNutricion.length),
      detalle:
        conTrigger.length === enNutricion.length
          ? `Los ${enNutricion.length} tienen su trigger registrado. ${reEnganchados} ya re-enganchados.`
          : `⚠ ${enNutricion.length - conTrigger.length} sin trigger: revisar, viola el criterio 3.`,
    };
  },
};

/**
 * Cuenta cuántas veces aparece cada valor y devuelve el más repetido.
 * Empate: gana el primero que apareció, que es orden de llegada del lead.
 */
function masFrecuente(valores: string[]): { valor: string; veces: number } | null {
  const conteo = new Map<string, number>();
  for (const v of valores) conteo.set(v, (conteo.get(v) ?? 0) + 1);

  let lider: { valor: string; veces: number } | null = null;
  for (const [valor, veces] of conteo) {
    if (!lider || veces > lider.veces) lider = { valor, veces };
  }
  return lider;
}

/**
 * Métrica #4 de la lista del mentor: qué proyecto mueve más gente.
 *
 * Sale del `proyecto_interes` con el que el lead entró, que ya se persiste
 * en cada lead — por eso esta métrica costaba minutos y no un cambio de
 * contrato, a diferencia de las tres de abandono (ver el ticket 025).
 */
const PROYECTO_MAS_PEDIDO: Metrica = {
  id: "proyecto-mas-pedido",
  titulo: "Proyecto que más piden",
  descripcion:
    "Conteo del proyecto por el que el lead entró (su interés declarado en la pauta), no de lo que el motor le terminó recomendando.",
  calcular({ leads }) {
    const declarados = leads
      .map((l) => l.curado.lead.evento.proyecto_interes?.trim())
      .filter((p): p is string => Boolean(p));

    const lider = masFrecuente(declarados);
    if (!lider) return { valor: "—", detalle: "Ningún lead entró con un proyecto en mente." };

    const sinProyecto = leads.length - declarados.length;
    return {
      valor: lider.valor,
      detalle: `${lider.veces} de ${declarados.length} leads que llegaron con un proyecto en mente${
        sinProyecto > 0 ? ` (otros ${sinProyecto} llegaron sin ninguno)` : ""
      }.`,
    };
  },
};

/**
 * Métrica #5 del mentor, **en grueso y hay que decirlo así**.
 *
 * Él pidió atribución con campaña y QR (spec 01 D4); eso no existe y no se
 * va a insinuar que sí. Lo que hay es el canal por el que entró el lead, que
 * es un enum de tres valores. Prometer atribución mostrando canal sería
 * exactamente la caja negra que AGENTS.md prohíbe.
 */
const CANAL_DE_INGRESO: Metrica = {
  id: "canal-ingreso",
  titulo: "Canal que más trae",
  descripcion:
    "Reparto por el canal de entrada del lead. Es canal en grueso, NO atribución de campaña: la campaña y el QR no se capturan hoy.",
  calcular({ leads }) {
    const lider = masFrecuente(leads.map((l) => ETIQUETA_FUENTE[l.curado.lead.evento.fuente]));
    if (!lider) return { valor: "—" };

    return {
      valor: lider.valor,
      detalle: `${lider.veces} de ${leads.length} leads (${porcentaje(lider.veces, leads.length)}). Sin campaña ni pieza: solo el canal.`,
    };
  },
};

/** Los tres canales del enum `fuente`, con el nombre que usa el negocio. */
const ETIQUETA_FUENTE: Record<"meta" | "google" | "web", string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  web: "Formulario web",
};

/**
 * Las métricas que rinde la franja, en orden de aparición.
 *
 * El orden es el orden de lectura del especialista: primero cuánto
 * entra, después qué tan bueno es lo que entra, después qué pasa con lo
 * que no pasó, y al final de dónde vino.
 */
export const METRICAS: Metrica[] = [
  LEADS_HOY,
  LEADS_SEMANA,
  PASAN_EL_CORTE,
  NO_AFILIADOS,
  PUNTAJE_PROMEDIO,
  EN_NUTRICION,
  PROYECTO_MAS_PEDIDO,
  CANAL_DE_INGRESO,
];
