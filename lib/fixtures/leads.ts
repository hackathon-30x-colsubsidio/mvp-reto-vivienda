import type { Lead } from "@/lib/types";
import * as eventos from "./leads-evento";
import * as perfiles from "./perfiles-conocidos";

export const afiliadoListo: Lead = {
  evento: eventos.afiliadoListo,
  perfil: perfiles.afiliadoListo,
  respuestas: {
    consentimiento: { otorgado: true, timestamp: "2026-07-23T14:32:10-05:00" },
    // rango_ingreso_hogar no se pregunta: ya lo trajo el enriquecimiento (criterio de aceptación 1)
    tiene_vivienda: false,
    subsidios: ["Mi Casa Ya"],
    situacion_crediticia: "buena, sin mora reportada",
    // zona_interes no se pregunta: la ciudad ya vino del enriquecimiento
  },
};

export const noAfiliadoListo: Lead = {
  evento: eventos.noAfiliadoListo,
  perfil: perfiles.noAfiliadoListo,
  respuestas: {
    consentimiento: { otorgado: true, timestamp: "2026-07-23T15:05:41-05:00" },
    tiene_vivienda: false,
    subsidios: [],
    situacion_crediticia: "buena, sin mora reportada",
  },
};

export const nutricion: Lead = {
  evento: eventos.nutricion,
  perfil: perfiles.nutricion,
  respuestas: {
    consentimiento: { otorgado: true, timestamp: "2026-07-23T16:20:03-05:00" },
    // sin match de enriquecimiento: se pregunta todo el set del spec §6
    rango_ingreso_hogar: "1-2 SMMLV",
    tiene_vivienda: false,
    subsidios: [],
    situacion_crediticia: "con mora reciente autorreportada",
    zona_interes: "Bogotá",
  },
};
