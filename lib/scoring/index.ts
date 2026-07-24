// Motor de scoring — TS puro, determinista, sin LLM (regla "cero caja negra" de AGENTS.md).
// Recibe un Lead + la ficha del proyecto de interés, devuelve un Score con
// TODOS los factores visibles (criterio de aceptación 2 del spec).

import { CONFIG_SCORING } from "./config.js";
import type { FactorScore, Lead, ProyectoCatalogo, Score } from "../types.js";

function afiliadoEfectivo(lead: Lead): boolean {
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
  };
}

function factorCuotaIngreso40(lead: Lead, proyecto: ProyectoCatalogo): FactorScore {
  const ingreso = lead.respuestas.ingreso_hogar_mensual;
  const precio = proyecto.precio_desde;

  if (!ingreso || !precio) {
    return {
      nombre: "cuota_ingreso_40",
      valor: "No se puede evaluar: falta el ingreso del hogar o el precio del proyecto",
      cumple: false,
      fuente: "conversacion",
    };
  }

  const primeraCuotaEstimada = precio * CONFIG_SCORING.PORCENTAJE_PRIMERA_CUOTA_ESTIMADA;
  const subsidio = lead.respuestas.subsidio_monto_mensual ?? 0;
  const cuotaNeta = Math.max(0, primeraCuotaEstimada - subsidio);
  const ratio = cuotaNeta / ingreso;
  const cumple = ratio <= CONFIG_SCORING.TOPE_CUOTA_SOBRE_INGRESO;

  return {
    nombre: "cuota_ingreso_40",
    valor: `Cuota estimada $${Math.round(cuotaNeta).toLocaleString("es-CO")} = ${(ratio * 100).toFixed(1)}% del ingreso ($${ingreso.toLocaleString("es-CO")}). Tope legal: 40% (Decreto 583 de 2025)`,
    cumple,
    fuente: "conversacion",
  };
}

function factorSubsidio(lead: Lead): FactorScore {
  const subsidios = lead.respuestas.subsidios ?? [];
  const monto = lead.respuestas.subsidio_monto_mensual ?? 0;
  const aplica = subsidios.length > 0 || monto > 0;
  return {
    nombre: "subsidio_aplicable",
    valor: aplica
      ? `Aplica: ${subsidios.length ? subsidios.join(", ") : "subsidio declarado"}${monto ? ` (baja la cuota ~$${monto.toLocaleString("es-CO")}/mes)` : ""}`
      : "Sin subsidio declarado",
    cumple: aplica,
    fuente: "conversacion",
  };
}

function factorYaTieneVivienda(lead: Lead): FactorScore {
  const tiene = lead.respuestas.tiene_vivienda;
  return {
    nombre: "ya_tiene_vivienda",
    valor: tiene === undefined ? "No informado" : tiene ? "Ya tiene vivienda" : "No tiene vivienda propia",
    cumple: tiene !== true, // favorable (no bloquea): no tener vivienda prioriza subsidio
    fuente: "conversacion",
  };
}

function factorSituacionCrediticia(lead: Lead): FactorScore {
  const situacion = lead.respuestas.situacion_crediticia ?? "sin_info";
  return {
    nombre: "situacion_crediticia",
    valor: `Autorreportada: ${situacion} (señal, no verificación — DataCrédito fuera de alcance)`,
    cumple: situacion === "buena" || situacion === "regular",
    fuente: "conversacion",
  };
}

function factorSimilitudCompradores(proyecto: ProyectoCatalogo): FactorScore {
  const { usado, total } = proyecto.cupo_no_afiliados;
  // total = 10% del volumen histórico del proyecto (proxy de "cuántos compradores tiene").
  const nAproximado = total * 10;
  return {
    nombre: "similitud_compradores_reales",
    valor:
      nAproximado > 0
        ? `~${nAproximado} compradores históricos en ${proyecto.nombre} — evidencia de respaldo, no criterio de corte`
        : "Sin histórico de compradores para este proyecto",
    cumple: true, // nunca bloquea (spec §4)
    fuente: "historico",
  };
}

function factorCupo90_10(proyecto: ProyectoCatalogo, afiliado: boolean): FactorScore {
  if (afiliado) {
    return {
      nombre: "cupo_90_10",
      valor: "No aplica: el lead es afiliado",
      cumple: true,
      fuente: "catalogo",
    };
  }
  const { usado, total } = proyecto.cupo_no_afiliados;
  const quedan = total - usado;
  return {
    nombre: "cupo_90_10",
    valor:
      quedan > 0
        ? `Quedan ${quedan} de ${total} cupos para no afiliados en ${proyecto.nombre} (regla: máx. 10%)`
        : `Cupo de no afiliados superado en ${proyecto.nombre}: ${usado} de ${total} permitidos (regla: máx. 10%)`,
    cumple: true, // se marca, no bloquea (el reto ya opera con 27,1% no afiliados por encima del 10% regulatorio)
    fuente: "catalogo",
  };
}

export function calcularScore(lead: Lead, proyecto: ProyectoCatalogo): Score {
  const afiliado = afiliadoEfectivo(lead);

  const factorCuota = factorCuotaIngreso40(lead, proyecto);
  const factores: FactorScore[] = [
    factorAfiliacion(lead),
    factorCuota,
    factorSubsidio(lead),
    factorYaTieneVivienda(lead),
    factorSituacionCrediticia(lead),
    factorSimilitudCompradores(proyecto),
    factorCupo90_10(proyecto, afiliado),
  ];

  // Única regla que bloquea: el tope legal del 40% (Decreto 583 de 2025).
  // El resto son señales visibles, nunca criterio de corte (spec §4).
  if (!factorCuota.cumple) {
    return {
      lead_id: lead.evento.lead_id,
      salida: "nutricion",
      factores,
      regla_fallida: factorCuota.nombre,
      trigger_nutricion:
        "La primera cuota estimada supera el 40% del ingreso del hogar declarado. Vuelve a calificar si: sube el ingreso declarado, aplica un subsidio que baje la cuota, o cambia a un proyecto de menor precio.",
    };
  }

  return {
    lead_id: lead.evento.lead_id,
    salida: afiliado ? "listo" : "listo_restriccion_cupo",
    factores,
  };
}
