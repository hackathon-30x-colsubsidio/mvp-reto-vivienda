import type { Score } from "@/lib/types";

// Los 6 factores del spec §4, siempre visibles — cero caja negra.
// El umbral exacto del corte y el peso de cada factor están abiertos (spec §7);
// estos fixtures ilustran la FORMA del veredicto, no el motor real (eso es Track B).

export const afiliadoListo: Score = {
  lead_id: "lead-001",
  salida: "listo",
  factores: [
    {
      nombre: "afiliacion",
      valor: "afiliado",
      cumple: true,
      fuente: "enriquecimiento",
    },
    {
      nombre: "cuota_ingreso_40",
      valor:
        "cuota estimada 32% del ingreso del hogar (tope 40%, Decreto 583 de 2025)",
      cumple: true,
      fuente: "conversacion",
    },
    {
      nombre: "subsidio_aplicable",
      valor: "Mi Casa Ya aplica y baja la cuota estimada",
      cumple: true,
      fuente: "conversacion",
    },
    {
      nombre: "ya_tiene_vivienda",
      valor: "no tiene vivienda propia",
      cumple: true,
      fuente: "conversacion",
    },
    {
      nombre: "situacion_crediticia",
      valor: "autorreportada buena, sin mora",
      cumple: true,
      fuente: "conversacion",
    },
    {
      nombre: "similitud_compradores",
      valor: "84% similar a compradores históricos del proyecto",
      cumple: true,
      fuente: "historico",
    },
  ],
};

export const noAfiliadoListo: Score = {
  lead_id: "lead-002",
  salida: "listo_restriccion_cupo",
  factores: [
    {
      nombre: "afiliacion",
      valor: "no afiliado (marca contra el cupo 90/10 del proyecto)",
      cumple: false,
      fuente: "enriquecimiento",
    },
    {
      nombre: "cuota_ingreso_40",
      valor: "cuota estimada 35% del ingreso del hogar (tope 40%)",
      cumple: true,
      fuente: "conversacion",
    },
    {
      nombre: "subsidio_aplicable",
      valor: "sin subsidios aplicables (no afiliado)",
      cumple: false,
      fuente: "conversacion",
    },
    {
      nombre: "ya_tiene_vivienda",
      valor: "no tiene vivienda propia",
      cumple: true,
      fuente: "conversacion",
    },
    {
      nombre: "situacion_crediticia",
      valor: "autorreportada buena, sin mora",
      cumple: true,
      fuente: "conversacion",
    },
    {
      nombre: "similitud_compradores",
      valor: "61% similar a compradores históricos no afiliados de este proyecto",
      cumple: true,
      fuente: "historico",
    },
  ],
};

export const nutricion: Score = {
  lead_id: "lead-003",
  salida: "nutricion",
  factores: [
    {
      nombre: "afiliacion",
      valor:
        "sin match en la base de identidades: se asume no afiliado (supuesto por validar, spec §7)",
      cumple: false,
      fuente: "enriquecimiento",
    },
    {
      nombre: "cuota_ingreso_40",
      valor:
        "cuota estimada 52% del ingreso del hogar (tope 40%, Decreto 583 de 2025)",
      cumple: false,
      fuente: "conversacion",
    },
    {
      nombre: "subsidio_aplicable",
      valor: "sin subsidios aplicables declarados",
      cumple: false,
      fuente: "conversacion",
    },
    {
      nombre: "ya_tiene_vivienda",
      valor: "no tiene vivienda propia",
      cumple: true,
      fuente: "conversacion",
    },
    {
      nombre: "situacion_crediticia",
      valor: "autorreportada con mora reciente",
      cumple: false,
      fuente: "conversacion",
    },
    {
      nombre: "similitud_compradores",
      valor: "38% similar a compradores históricos del proyecto",
      cumple: false,
      fuente: "historico",
    },
  ],
  regla_fallida:
    "cuota_ingreso_40: la primera cuota estimada (52% del ingreso del hogar) supera el tope legal del 40% (Decreto 583 de 2025)",
  trigger_nutricion:
    "recontactar si el ingreso del hogar reportado sube lo suficiente para bajar la cuota estimada del 40%, o si aplica a un subsidio que la reduzca",
};
