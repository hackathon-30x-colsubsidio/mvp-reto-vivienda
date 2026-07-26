// Similitud con los compradores REALES de cada proyecto (ticket 016).
// TS puro y determinista: lee las distribuciones derivadas del PPT de buyer
// personas (data/sintetica/buyer_personas.json, archivo GENERADO) y compara
// contra lo que el lead ya contó. Sin datos del proyecto o con el slide
// marcado no confiable, devuelve 0.5 NEUTRO — la señal falla suave, jamás
// castiga a un lead por un error de extracción del PPT.
//
// La consumen dos sitios: el factor `similitud_compradores_reales` del motor
// (lib/scoring/index.ts) y el ranking del matcher (lib/matching/index.ts).
// Una sola aritmética para ambos: si el puntaje y el orden difirieran, la
// pantalla se contradiría a sí misma.

import crudo from "@/data/sintetica/buyer_personas.json";
import type { Lead } from "../types";

/** La forma que emite scripts/generar-buyer-personas.ts. */
interface DistribucionProyecto {
  confiable: boolean;
  afiliado_pct?: number;
  salario?: { hasta_2_smlv?: number; mas_2_smlv?: number };
  edad?: { "20_35"?: number; "36_45"?: number };
  familia?: { monoparental?: number; nuclear?: number; pareja?: number; sin_grupo?: number };
  estrato?: Record<string, number>;
}

const DISTRIBUCIONES = (crudo as { distribuciones: Record<string, DistribucionProyecto> })
  .distribuciones;

/**
 * SMMLV 2026 ($1.750.905, calibrado 2026-07-25). Cuarta copia consciente (las
 * otras: lib/conversacion/preguntas.ts y lib/fixtures/cola-historica.ts, que
 * no pueden importarse entre sí porque preguntas.ts va al bundle del cliente).
 * Si cambia el año, cambian las tres o cuatro juntas.
 */
const SMMLV_SUPUESTO = 1_750_905;

export interface Similitud {
  /** 0–1: promedio del % de compradores del proyecto que caen en los mismos buckets que el lead. */
  valorNorm: number;
  /**
   * Los hechos que sostienen el número, uno por dimensión usada, con su %.
   * ÚNICO punto del repo que redacta estos porcentajes: si el equipo decide
   * que los % del PPT no son distribuibles, se vacía esta lista aquí y ninguna
   * pantalla ni prompt vuelve a citarlos.
   */
  evidencias: string[];
}

/**
 * Lo que vale un proyecto del que NO tenemos compradores.
 *
 * Era `0.5`, y ese número **no era neutro**. Medido con `scripts/sonda-similitud.ts`
 * sobre 852 similitudes con evidencia real: la mediana es 0,385 y el p75 es
 * 0,470, así que **0,5 le ganaba al 79,7% de los proyectos que SÍ conocemos**.
 * No saber nada de un proyecto lo ponía por encima de casi todos los demás.
 *
 * El costo estaba medido y era grande: los 6 sin distribución confiable (ABETO,
 * ARAUCARIA, KARAKALI, LOS NOGALES, VIBO ONCE, ZARZAL) son todos de Bogotá, y
 * **en Bogotá se llevaban el 54,2% de las citas** siendo un tercio del catálogo.
 * Es el 55% que el plan le atribuía a ZARZAL: era de Bogotá, no global.
 *
 * Ahora es la MEDIANA de los porcentajes que traen las distribuciones
 * confiables. Se deriva del dato y no se escribe a mano —igual que el resto de
 * los espejos del repo— así que si mañana el PPT trae otros proyectos, el
 * neutro se recalibra solo en vez de quedar viejo en silencio. Y dice
 * exactamente lo que queremos que diga: *de este no sabemos, va como uno del
 * montón*, ni premiado ni castigado.
 *
 * ⚠️ La otra opción del punto 13 —normalizar contra el máximo del catálogo para
 * ese lead— **no se puede hacer aquí**: `similitudCon` ve un proyecto a la vez y
 * el máximo depende del lead, así que exigiría cambiar la firma y con ella los
 * dos consumidores (`lib/scoring/index.ts` y `lib/matching/index.ts`). Deja de
 * ser el cambio de 3 líneas que la rama 6 declara y se mete en archivos de otra
 * rama. Queda anotado en la bitácora por si alguien lo quiere retomar.
 */
function medianaDeLasDistribuciones(): number {
  const pcts: number[] = [];

  for (const dist of Object.values(DISTRIBUCIONES)) {
    if (!dist.confiable) continue;
    // La afiliación entra por sus dos caras: el lead puede ser afiliado o no, y
    // la señal que recibe es el complemento en el segundo caso.
    if (dist.afiliado_pct !== undefined) {
      pcts.push(dist.afiliado_pct, 100 - dist.afiliado_pct);
    }
    for (const grupo of [dist.salario, dist.edad, dist.familia]) {
      if (!grupo) continue;
      for (const pct of Object.values(grupo)) {
        if (typeof pct === "number") pcts.push(pct);
      }
    }
  }

  if (pcts.length === 0) return 0.5;
  pcts.sort((a, b) => a - b);
  return pcts[Math.floor(pcts.length / 2)] / 100;
}

/** Expuesto para que el test pueda afirmar que sale del dato y no de la nada. */
export const SIMILITUD_NEUTRA = medianaDeLasDistribuciones();

const NEUTRA: Similitud = { valorNorm: SIMILITUD_NEUTRA, evidencias: [] };

/** Cómo se llama cada conformación del hogar en el PPT vs. en el chat. */
const FAMILIA_A_BUCKET: Record<
  NonNullable<Lead["respuestas"]["composicion_familiar"]>,
  { bucket: keyof NonNullable<DistribucionProyecto["familia"]>; texto: string }
> = {
  solo: { bucket: "sin_grupo", texto: "vive solo, como tú" },
  pareja: { bucket: "pareja", texto: "compra en pareja, como tú" },
  familia_con_hijos: { bucket: "nuclear", texto: "compra con su familia, como tú" },
  monoparental: { bucket: "monoparental", texto: "es hogar monoparental, como el tuyo" },
};

/**
 * Similitud del lead con la distribución de compradores históricos del
 * proyecto. Solo usa las dimensiones que el lead YA dio — nunca inventa un
 * bucket para una respuesta que no existe.
 *
 * `afiliado` viene resuelto de afuera (afiliadoEfectivo, lib/scoring/index.ts)
 * para no importar el motor desde aquí: el motor importa este módulo y el
 * ciclo rompería el build de Turbopack.
 */
export function similitudCon(lead: Lead, proyectoId: string, afiliado: boolean): Similitud {
  const dist = DISTRIBUCIONES[proyectoId];
  if (!dist || !dist.confiable) return NEUTRA;

  const senales: number[] = [];
  const evidencias: string[] = [];

  // 1. Afiliación: qué % de los compradores comparte la del lead.
  if (dist.afiliado_pct !== undefined) {
    const pct = afiliado ? dist.afiliado_pct : 100 - dist.afiliado_pct;
    senales.push(pct / 100);
    evidencias.push(
      `el ${pct}% de los compradores de este proyecto ${afiliado ? "es afiliado a Colsubsidio, como tú" : "tampoco es afiliado a Colsubsidio"}`,
    );
  }

  // 2. Banda de ingreso (SMLV): el dato que más separa los proyectos.
  const ingreso = lead.respuestas.ingreso_hogar_mensual;
  if (ingreso !== undefined && dist.salario) {
    const hasta2 = ingreso <= 2 * SMMLV_SUPUESTO;
    const pct = hasta2 ? dist.salario.hasta_2_smlv : dist.salario.mas_2_smlv;
    if (pct !== undefined) {
      senales.push(pct / 100);
      evidencias.push(
        `el ${pct}% gana ${hasta2 ? "hasta" : "más de"} 2 salarios mínimos, como tu hogar`,
      );
    }
  }

  // 3. Edad. El bucket 46+ no viene en el PPT: se deriva como el resto de 100.
  const rangoEdad = lead.respuestas.rango_edad;
  if (rangoEdad && dist.edad) {
    const pct =
      rangoEdad === "46_mas"
        ? Math.max(0, 100 - (dist.edad["20_35"] ?? 0) - (dist.edad["36_45"] ?? 0))
        : dist.edad[rangoEdad];
    if (pct !== undefined) {
      const texto =
        rangoEdad === "20_35"
          ? "tiene entre 20 y 35 años"
          : rangoEdad === "36_45"
            ? "tiene entre 36 y 45 años"
            : "tiene más de 45 años";
      senales.push(pct / 100);
      evidencias.push(`el ${pct}% ${texto}, como tú`);
    }
  }

  // 4. Conformación del hogar.
  const composicion = lead.respuestas.composicion_familiar;
  if (composicion && dist.familia) {
    const { bucket, texto } = FAMILIA_A_BUCKET[composicion];
    const pct = dist.familia[bucket];
    // Si el PPT no mostró ese bucket, no se inventa un 0: se omite la señal.
    if (pct !== undefined) {
      senales.push(pct / 100);
      evidencias.push(`el ${pct}% ${texto}`);
    }
  }

  if (senales.length === 0) return NEUTRA;

  return {
    valorNorm: senales.reduce((a, b) => a + b, 0) / senales.length,
    evidencias,
  };
}
