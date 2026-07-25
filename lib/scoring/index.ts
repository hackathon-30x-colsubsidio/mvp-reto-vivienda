// Motor de scoring — TS puro, determinista, sin LLM (regla "cero caja negra" de AGENTS.md).
// Dos capas (spec §4):
//   Capa 1 — GATE LEGAL: la cuota estimada / ingreso ≤ 40% (Decreto 583 de 2025).
//            Es lo único que bloquea. Si falla → nutrición, puntaje 0.
//   Capa 2 — PUNTAJE 0–100: para quien pasa el gate, un compuesto PONDERADO de
//            factores (pesos en config.ts) que ordena la cola del asesor. Cada
//            factor expone su peso, su señal normalizada y su aporte en puntos,
//            así el puntaje es 100% trazable: puntaje = Σ aportes.

import { CONFIG_SCORING } from "./config";
import type { FactorScore, Lead, ProyectoCatalogo, Score } from "../types";

/** Aporte en puntos (0–100) de un factor al puntaje total. */
function aporteDe(peso: number, valorNorm: number): number {
  return peso * clamp01(valorNorm) * 100;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * La ÚNICA definición de "este lead es afiliado" en el repo.
 *
 * Exportada a propósito: el tablero agrupa por afiliación y el puntaje
 * le asigna peso. Si cada uno lo dedujera por su lado, la pantalla
 * podría mostrar un lead en el grupo de afiliados y puntuarlo como no
 * afiliado — y el demo se contradiría a sí mismo.
 */
export function afiliadoEfectivo(lead: Lead): boolean {
  // Si el enriquecimiento no trajo match, se le pregunta en la conversación.
  // Sin ninguna de las dos fuentes, se asume no afiliado (caso conservador:
  // lo peor que pasa es que se le marque contra el cupo 90/10 de más, nunca
  // que se le trate como afiliado sin serlo). Documentado, no inventado en
  // silencio — a ratificar en el kickoff junto con el resto de umbrales.
  return lead.perfil.afiliado ?? lead.respuestas.afiliado_autoreportado ?? false;
}

function factorAfiliacion(lead: Lead): FactorScore {
  const afiliado = afiliadoEfectivo(lead);
  return {
    nombre: "afiliacion",
    valor: afiliado ? "Afiliado a Colsubsidio" : "No afiliado a Colsubsidio",
    cumple: true, // informativo: no bloquea, determina la salida (listo vs. restricción de cupo)
    fuente: lead.perfil.match ? "enriquecimiento" : "conversacion",
    // sin peso: el aporte de la afiliación al puntaje vive en el factor cupo_90_10.
  };
}

/**
 * Capa 1 (gate) + el factor de mayor peso de la capa 2. `cumple` es el gate
 * legal; `valor_norm` es la HOLGURA (qué tan por debajo del 40% cae la cuota).
 */
function factorCuotaIngreso40(lead: Lead, proyecto: ProyectoCatalogo): FactorScore {
  const ingreso = lead.respuestas.ingreso_hogar_mensual;
  const precio = proyecto.precio_desde;

  if (!ingreso || !precio) {
    return {
      nombre: "cuota_ingreso_40",
      valor: "No se puede evaluar: falta el ingreso del hogar o el precio del proyecto",
      cumple: false,
      fuente: "conversacion",
      peso: CONFIG_SCORING.PESOS.holgura_capacidad,
      valor_norm: 0,
      aporte: 0,
    };
  }

  const primeraCuotaEstimada = precio * CONFIG_SCORING.PORCENTAJE_PRIMERA_CUOTA_ESTIMADA;
  const subsidio = lead.respuestas.subsidio_monto_mensual ?? 0;
  const cuotaNeta = Math.max(0, primeraCuotaEstimada - subsidio);
  const ratio = cuotaNeta / ingreso;
  const cumple = ratio <= CONFIG_SCORING.TOPE_CUOTA_SOBRE_INGRESO;

  // Holgura: 0 en el tope (40%), 1 en RATIO_HOLGURA_PLENA (20%) o menos.
  const tope = CONFIG_SCORING.TOPE_CUOTA_SOBRE_INGRESO;
  const plena = CONFIG_SCORING.RATIO_HOLGURA_PLENA;
  const holgura = clamp01((tope - ratio) / (tope - plena));
  const peso = CONFIG_SCORING.PESOS.holgura_capacidad;

  return {
    nombre: "cuota_ingreso_40",
    valor: `Cuota estimada $${Math.round(cuotaNeta).toLocaleString("es-CO")} = ${(ratio * 100).toFixed(1)}% del ingreso ($${ingreso.toLocaleString("es-CO")}). Tope legal: 40% (Decreto 583 de 2025)`,
    cumple,
    fuente: "conversacion",
    peso,
    valor_norm: holgura,
    aporte: aporteDe(peso, holgura),
  };
}

function factorSubsidio(lead: Lead, proyecto: ProyectoCatalogo): FactorScore {
  const subsidios = lead.respuestas.subsidios ?? [];
  const monto = lead.respuestas.subsidio_monto_mensual ?? 0;
  const aplica = subsidios.length > 0 || monto > 0;

  // Señal: qué fracción de la primera cuota estimada cubre el subsidio.
  const precio = proyecto.precio_desde ?? 0;
  const cuotaBruta = precio * CONFIG_SCORING.PORCENTAJE_PRIMERA_CUOTA_ESTIMADA;
  const cobertura = cuotaBruta > 0 ? clamp01(monto / cuotaBruta) : aplica ? 0.5 : 0;
  const peso = CONFIG_SCORING.PESOS.subsidio;

  return {
    nombre: "subsidio_aplicable",
    valor: aplica
      ? `Aplica: ${subsidios.length ? subsidios.join(", ") : "subsidio declarado"}${monto ? ` (baja la cuota ~$${monto.toLocaleString("es-CO")}/mes)` : ""}`
      : "Sin subsidio declarado",
    cumple: aplica,
    fuente: "conversacion",
    peso,
    valor_norm: cobertura,
    aporte: aporteDe(peso, cobertura),
  };
}

function factorYaTieneVivienda(lead: Lead): FactorScore {
  const tiene = lead.respuestas.tiene_vivienda;
  // Propósito social: priorizar a quien no tiene vivienda. Sin info = neutro.
  const valorNorm = tiene === undefined ? 0.5 : tiene ? 0 : 1;
  const peso = CONFIG_SCORING.PESOS.sin_vivienda;
  return {
    nombre: "ya_tiene_vivienda",
    valor: tiene === undefined ? "No informado" : tiene ? "Ya tiene vivienda" : "No tiene vivienda propia",
    cumple: tiene !== true, // favorable (no bloquea): no tener vivienda prioriza subsidio
    fuente: "conversacion",
    peso,
    valor_norm: valorNorm,
    aporte: aporteDe(peso, valorNorm),
  };
}

function factorSituacionCrediticia(lead: Lead): FactorScore {
  const situacion = lead.respuestas.situacion_crediticia ?? "sin_info";
  const valorNorm = CONFIG_SCORING.PUNTOS_CREDITICIA[situacion];
  const peso = CONFIG_SCORING.PESOS.situacion_crediticia;
  return {
    nombre: "situacion_crediticia",
    valor: `Autorreportada: ${situacion} (señal, no verificación — DataCrédito fuera de alcance)`,
    cumple: situacion === "buena" || situacion === "regular",
    fuente: "conversacion",
    peso,
    valor_norm: valorNorm,
    aporte: aporteDe(peso, valorNorm),
  };
}

function factorSimilitudCompradores(proyecto: ProyectoCatalogo): FactorScore {
  const { total } = proyecto.cupo_no_afiliados;
  // total = 10% del volumen histórico del proyecto (proxy de "cuántos compradores tiene").
  const nAproximado = total * 10;
  // Señal PROVISIONAL: la similitud real (perfil del lead vs. distribución del
  // proyecto) llega con las distribuciones por proyecto (ticket 016). Hasta
  // entonces se puntúa 0.5 neutro para no inventar un fit por lead que no existe.
  const peso = CONFIG_SCORING.PESOS.similitud_compradores;
  const valorNorm = 0.5;
  return {
    nombre: "similitud_compradores_reales",
    valor:
      nAproximado > 0
        ? `~${nAproximado} compradores históricos en ${proyecto.nombre} — evidencia de respaldo (similitud por perfil llega con ticket 016)`
        : "Sin histórico de compradores para este proyecto",
    cumple: true, // nunca bloquea (spec §4)
    fuente: "historico",
    peso,
    valor_norm: valorNorm,
    aporte: aporteDe(peso, valorNorm),
  };
}

/**
 * El cupo 90/10 como DESEMPATE, no como criterio.
 *
 * Pesa 0,05 a propósito (ver `config.ts`): entre dos perfiles parecidos, el
 * afiliado queda arriba; frente a un no afiliado con mejor capacidad de pago,
 * no alcanza para adelantarlo. Es la traducción de lo que dijo el mentor —
 * *"la prioridad siempre son los afiliados, pero siempre va a ser la prioridad
 * de los ingresos"*— y de que a Colsubsidio le interesa cerrar la venta.
 *
 * El cupo sigue siendo un límite regulatorio real y por eso se MUESTRA con su
 * número; lo que ya no hace es hundir al lead en la cola.
 */
function factorCupo90_10(proyecto: ProyectoCatalogo, afiliado: boolean): FactorScore {
  const peso = CONFIG_SCORING.PESOS.afiliacion_cupo;
  if (afiliado) {
    // El afiliado no compite por el cupo 90/10: señal plena.
    return {
      nombre: "cupo_90_10",
      valor: "No aplica: el lead es afiliado",
      cumple: true,
      fuente: "catalogo",
      peso,
      valor_norm: 1,
      aporte: aporteDe(peso, 1),
    };
  }
  const { usado, total } = proyecto.cupo_no_afiliados;
  const quedan = total - usado;
  // No afiliado con cupo disponible: media señal escalada por cupo restante.
  // Sin cupo: señal mínima (no se descarta, pero baja en la cola).
  const valorNorm = quedan > 0 && total > 0 ? 0.5 * clamp01(quedan / total) : 0.1;
  return {
    nombre: "cupo_90_10",
    valor:
      quedan > 0
        ? `Quedan ${quedan} de ${total} cupos para no afiliados en ${proyecto.nombre} (regla: máx. 10%)`
        : `Cupo de no afiliados superado en ${proyecto.nombre}: ${usado} de ${total} permitidos (regla: máx. 10%)`,
    cumple: true, // se marca, no bloquea (el reto ya opera con 27,1% no afiliados por encima del 10% regulatorio)
    fuente: "catalogo",
    peso,
    valor_norm: valorNorm,
    aporte: aporteDe(peso, valorNorm),
  };
}

export function calcularScore(lead: Lead, proyecto: ProyectoCatalogo): Score {
  const afiliado = afiliadoEfectivo(lead);

  const factorCuota = factorCuotaIngreso40(lead, proyecto);
  const factores: FactorScore[] = [
    factorAfiliacion(lead),
    factorCuota,
    factorSubsidio(lead, proyecto),
    factorYaTieneVivienda(lead),
    factorSituacionCrediticia(lead),
    factorSimilitudCompradores(proyecto),
    factorCupo90_10(proyecto, afiliado),
  ];

  // Capa 1 — GATE LEGAL: el tope del 40% (Decreto 583 de 2025) es lo único que
  // bloquea. El resto son señales visibles, nunca criterio de corte (spec §4).
  if (!factorCuota.cumple) {
    return {
      lead_id: lead.evento.lead_id,
      salida: "nutricion",
      puntaje: 0, // no entra a la cola priorizada: primero tiene que pasar el gate
      factores,
      regla_fallida: factorCuota.nombre,
      trigger_nutricion:
        "La primera cuota estimada supera el 40% del ingreso del hogar declarado. Vuelve a calificar si: sube el ingreso declarado, aplica un subsidio que baje la cuota, o cambia a un proyecto de menor precio.",
    };
  }

  // Capa 2 — PUNTAJE: suma de los aportes de todos los factores ponderados.
  const puntaje = Math.round(factores.reduce((acc, f) => acc + (f.aporte ?? 0), 0));

  return {
    lead_id: lead.evento.lead_id,
    salida: afiliado ? "listo" : "listo_restriccion_cupo",
    puntaje,
    factores,
  };
}
