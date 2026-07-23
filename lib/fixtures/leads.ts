// Los 3 personajes del demo (spec §4 "Cómo entra el jurado"), con las
// mismas cédulas fijas que data/sintetica/identidades.json.
import type { Lead } from "../types.js";

const timestampConsentimiento = "2026-07-23T15:00:00-05:00";

// Personaje 1 — María González: afiliada, categoría B, pasa el corte -> "listo"
export const leadMariaAfiliadaLista: Lead = {
  evento: {
    lead_id: "demo-maria-afiliada-lista",
    nombre: "María González",
    celular: "3001234567",
    cedula: "1000000001",
    proyecto_interes: "inari",
    fuente: "meta",
  },
  perfil: {
    match: true,
    afiliado: true,
    ciudad: "Chía",
    segmento: "Adultos maduros / familias consolidadas [inferido]",
    rango_ingreso: "2 a 4 SMLV",
  },
  respuestas: {
    consentimiento: { otorgado: true, timestamp: timestampConsentimiento },
    ingreso_hogar_mensual: 6_000_000,
    tiene_vivienda: false,
    subsidios: [],
    situacion_crediticia: "buena",
    zona_interes: "Chía",
  },
};

// Personaje 2 — Carlos Ramírez: no afiliado, pasa el corte -> "listo_restriccion_cupo"
export const leadCarlosNoAfiliadoListo: Lead = {
  evento: {
    lead_id: "demo-carlos-no-afiliado-listo",
    nombre: "Carlos Ramírez",
    celular: "3007654321",
    cedula: "1000000002",
    proyecto_interes: "inari",
    fuente: "google",
  },
  perfil: {
    match: true,
    afiliado: false,
    ciudad: "Tocancipá",
    segmento: "No afiliado / sin segmentar",
    rango_ingreso: "no disponible (no afiliado)",
  },
  respuestas: {
    consentimiento: { otorgado: true, timestamp: timestampConsentimiento },
    ingreso_hogar_mensual: 5_500_000,
    tiene_vivienda: false,
    subsidios: [],
    situacion_crediticia: "regular",
    zona_interes: "Chía",
  },
};

// Personaje 3 — Laura Martínez: afiliada, ingreso bajo -> "nutricion" (cuota > 40%)
export const leadLauraNutricion: Lead = {
  evento: {
    lead_id: "demo-laura-nutricion",
    nombre: "Laura Martínez",
    celular: "3009876543",
    cedula: "1000000003",
    proyecto_interes: "bosque-de-turpial",
    fuente: "web",
  },
  perfil: {
    match: true,
    afiliado: true,
    ciudad: "Ricaurte",
    segmento: "Jóvenes solteros, sin personas a cargo [inferido]",
    rango_ingreso: "menos de 2 SMLV",
  },
  respuestas: {
    consentimiento: { otorgado: true, timestamp: timestampConsentimiento },
    ingreso_hogar_mensual: 1_800_000,
    tiene_vivienda: false,
    subsidios: [],
    situacion_crediticia: "sin_info",
    zona_interes: "Tocancipá",
  },
};
