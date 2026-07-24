import { describe, expect, it } from "vitest";
import { calcularScore } from "./index";
import { CONFIG_SCORING } from "./config";
import { afiliadoListo, noAfiliadoListo, nutricion } from "../fixtures/leads";
import { proyectoBosqueDeTurpial, proyectoInari } from "../fixtures/proyectos";
import type { Lead } from "../types";

describe("calcularScore — las 3 salidas del corte (spec §4)", () => {
  it("afiliada + pasa el corte -> listo", () => {
    const score = calcularScore(afiliadoListo, proyectoInari);
    expect(score.salida).toBe("listo");
    expect(score.regla_fallida).toBeUndefined();
    expect(score.trigger_nutricion).toBeUndefined();
  });

  it("no afiliado + pasa el corte -> listo_restriccion_cupo", () => {
    const score = calcularScore(noAfiliadoListo, proyectoInari);
    expect(score.salida).toBe("listo_restriccion_cupo");
  });

  it("no pasa el tope del 40% -> nutricion, con regla_fallida y trigger no vacíos", () => {
    const score = calcularScore(nutricion, proyectoBosqueDeTurpial);
    expect(score.salida).toBe("nutricion");
    expect(score.regla_fallida).toBe("cuota_ingreso_40");
    expect(score.trigger_nutricion).toBeTruthy();
  });
});

describe("calcularScore — criterio de aceptación 2: cero caja negra", () => {
  it("expone todos los factores evaluados, en las 3 salidas", () => {
    const nombresEsperados = [
      "afiliacion",
      "cuota_ingreso_40",
      "subsidio_aplicable",
      "ya_tiene_vivienda",
      "situacion_crediticia",
      "similitud_compradores_reales",
      "cupo_90_10",
    ];
    for (const [lead, proyecto] of [
      [afiliadoListo, proyectoInari],
      [noAfiliadoListo, proyectoInari],
      [nutricion, proyectoBosqueDeTurpial],
    ] as const) {
      const score = calcularScore(lead, proyecto);
      expect(score.factores.map((f) => f.nombre)).toEqual(nombresEsperados);
    }
  });
});

describe("calcularScore — borde exacto del tope del 40% (Decreto 583 de 2025)", () => {
  const cuotaEstimada = proyectoInari.precio_desde! * CONFIG_SCORING.PORCENTAJE_PRIMERA_CUOTA_ESTIMADA;

  function leadConRatio(ratio: number): Lead {
    return {
      ...afiliadoListo,
      respuestas: {
        ...afiliadoListo.respuestas,
        ingreso_hogar_mensual: cuotaEstimada / ratio,
      },
    };
  }

  it("39% de cuota/ingreso pasa", () => {
    const score = calcularScore(leadConRatio(0.39), proyectoInari);
    expect(score.factores.find((f) => f.nombre === "cuota_ingreso_40")?.cumple).toBe(true);
    expect(score.salida).not.toBe("nutricion");
  });

  it("41% de cuota/ingreso no pasa", () => {
    const score = calcularScore(leadConRatio(0.41), proyectoInari);
    expect(score.factores.find((f) => f.nombre === "cuota_ingreso_40")?.cumple).toBe(false);
    expect(score.salida).toBe("nutricion");
  });
});

describe("calcularScore — el subsidio puede meter la cuota bajo el 40%", () => {
  it("un lead que fallaría sin subsidio, pasa con el subsidio aplicado", () => {
    const cuotaEstimada = proyectoBosqueDeTurpial.precio_desde! * CONFIG_SCORING.PORCENTAJE_PRIMERA_CUOTA_ESTIMADA;
    const ingreso = 1_800_000;

    const sinSubsidio = calcularScore(nutricion, proyectoBosqueDeTurpial);
    expect(sinSubsidio.salida).toBe("nutricion");

    // Un subsidio que cubra lo suficiente para bajar la cuota neta al 30% del ingreso.
    const subsidioNecesario = cuotaEstimada - ingreso * 0.3;
    const leadConSubsidio: Lead = {
      ...nutricion,
      respuestas: {
        ...nutricion.respuestas,
        subsidios: ["Mi Casa Ya"],
        subsidio_monto_mensual: subsidioNecesario,
      },
    };

    const conSubsidio = calcularScore(leadConSubsidio, proyectoBosqueDeTurpial);
    expect(conSubsidio.salida).not.toBe("nutricion");
    expect(conSubsidio.factores.find((f) => f.nombre === "subsidio_aplicable")?.cumple).toBe(true);
  });
});
