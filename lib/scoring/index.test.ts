import { describe, expect, it } from "vitest";
import { calcularScore } from "./index";
import { CONFIG_SCORING } from "./config";
import { afiliadoListo, noAfiliadoListo, nutricion } from "../fixtures/leads";
import { proyectoBosqueDeTurpial, proyectoInari } from "../fixtures/proyectos";
import type { Lead } from "../types";

describe("calcularScore — las 3 salidas del corte (spec §4)", () => {
  // La salida depende de la pareja (lead, proyecto), así que estos casos fijan
  // el ingreso a mano en vez de depender de cuánto gana un personaje del demo:
  // cambiarle el ingreso a Diana no debe reescribir las reglas del motor.
  const conIngreso = (base: Lead, ingreso: number): Lead => ({
    ...base,
    respuestas: { ...base.respuestas, ingreso_hogar_mensual: ingreso },
  });

  it("afiliada + pasa el corte -> listo", () => {
    const score = calcularScore(conIngreso(afiliadoListo, 8_000_000), proyectoInari);
    expect(score.salida).toBe("listo");
    expect(score.regla_fallida).toBeUndefined();
    expect(score.trigger_nutricion).toBeUndefined();
  });

  it("no afiliado + pasa el corte -> listo_restriccion_cupo", () => {
    const score = calcularScore(conIngreso(noAfiliadoListo, 8_000_000), proyectoInari);
    expect(score.salida).toBe("listo_restriccion_cupo");
  });

  it("no pasa el tope del 40% -> nutricion, con regla_fallida y trigger no vacíos", () => {
    const score = calcularScore(conIngreso(nutricion, 1_500_000), proyectoBosqueDeTurpial);
    expect(score.salida).toBe("nutricion");
    // La regla se guarda REDACTADA, no con su nombre técnico: es lo que el
    // asesor lee tal cual en la ficha bajo "la regla que no pasó".
    expect(score.regla_fallida).toMatch(/Decreto 583 de 2025/);
    expect(score.regla_fallida).toMatch(/40%/);
    // Y el trigger dice el número que la destraba, no una condición genérica.
    expect(score.trigger_nutricion).toMatch(/el ingreso del hogar llega a \$/);
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

describe("calcularScore — puntaje ponderado (capa 2)", () => {
  it("el que cae en nutrición tiene puntaje 0 (no entra a la cola priorizada)", () => {
    const score = calcularScore(nutricion, proyectoBosqueDeTurpial);
    expect(score.salida).toBe("nutricion");
    expect(score.puntaje).toBe(0);
  });

  it("el puntaje está entre 0 y 100 para quien pasa el gate", () => {
    const score = calcularScore(afiliadoListo, proyectoInari);
    expect(score.salida).not.toBe("nutricion");
    expect(score.puntaje).toBeGreaterThan(0);
    expect(score.puntaje).toBeLessThanOrEqual(100);
  });

  it("es additivo: el puntaje = suma de los aportes de los factores (±1 por redondeo)", () => {
    const score = calcularScore(afiliadoListo, proyectoInari);
    const sumaAportes = score.factores.reduce((acc, f) => acc + (f.aporte ?? 0), 0);
    expect(Math.abs(score.puntaje - sumaAportes)).toBeLessThanOrEqual(1);
  });

  it("es determinista: dos corridas del mismo lead dan el mismo puntaje", () => {
    const a = calcularScore(afiliadoListo, proyectoInari);
    const b = calcularScore(afiliadoListo, proyectoInari);
    expect(a.puntaje).toBe(b.puntaje);
  });

  it("es monótono en la holgura: más margen bajo el 40% -> más puntaje", () => {
    const cuota = proyectoInari.precio_desde! * CONFIG_SCORING.PORCENTAJE_PRIMERA_CUOTA_ESTIMADA;
    const conRatio = (ratio: number): Lead => ({
      ...afiliadoListo,
      respuestas: { ...afiliadoListo.respuestas, ingreso_hogar_mensual: cuota / ratio },
    });
    const holgado = calcularScore(conRatio(0.22), proyectoInari); // casi el máximo de holgura
    const justo = calcularScore(conRatio(0.39), proyectoInari); // apenas pasa
    expect(holgado.puntaje).toBeGreaterThan(justo.puntaje);
  });

  it("el afiliado listo puntúa por encima del no afiliado listo en el mismo proyecto", () => {
    // Mismo ingreso, mismo proyecto: la única diferencia es la afiliación/cupo.
    const base = { ...afiliadoListo.respuestas, ingreso_hogar_mensual: 6_000_000 };
    const af = calcularScore({ ...afiliadoListo, respuestas: base }, proyectoInari);
    const noAf = calcularScore(
      { ...afiliadoListo, perfil: { ...afiliadoListo.perfil, afiliado: false }, respuestas: base },
      proyectoInari,
    );
    expect(af.puntaje).toBeGreaterThan(noAf.puntaje);
  });
});
