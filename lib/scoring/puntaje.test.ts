import { describe, expect, it } from "vitest";
import { afiliadoEfectivo, calcularScore } from "./index.js";
import { calcularPuntaje, PESOS } from "./puntaje.js";
import { afiliadoListo, noAfiliadoListo, nutricion } from "../fixtures/leads.js";
import { proyectoBosqueDeTurpial, proyectoInari } from "../fixtures/proyectos.js";

const CASOS = [
  { lead: afiliadoListo, proyecto: proyectoInari },
  { lead: noAfiliadoListo, proyecto: proyectoInari },
  { lead: nutricion, proyecto: proyectoBosqueDeTurpial },
] as const;

function puntajeDe(lead: (typeof CASOS)[number]["lead"], proyecto: (typeof CASOS)[number]["proyecto"]) {
  return calcularPuntaje(calcularScore(lead, proyecto), afiliadoEfectivo(lead));
}

describe("PESOS — el canario del puntaje", () => {
  it("los pesos suman 100", () => {
    // similitud pesa 0 por diseño (spec §4) y el alias duplica esa entrada:
    // ninguno de los dos entra a la suma.
    const suma = Object.values(PESOS).reduce((a, b) => a + b, 0);
    expect(suma).toBe(100);
  });

  it("todo factor que emite el motor tiene un peso decidido", () => {
    for (const { lead, proyecto } of CASOS) {
      for (const factor of calcularScore(lead, proyecto).factores) {
        expect(
          PESOS[factor.nombre],
          `El motor emite el factor "${factor.nombre}" y nadie decidió cuánto pesa. ` +
            `Agrégalo a PESOS en lib/scoring/puntaje.ts (y reajusta para que sigan sumando 100). ` +
            `Peso 0 es una respuesta válida si es evidencia de respaldo y no criterio de corte.`,
        ).toBeDefined();
      }
    }
  });
});

describe("calcularPuntaje — cero caja negra", () => {
  it("el desglose tiene una línea por factor evaluado, ninguna menos", () => {
    for (const { lead, proyecto } of CASOS) {
      const score = calcularScore(lead, proyecto);
      const puntaje = calcularPuntaje(score, afiliadoEfectivo(lead));
      expect(puntaje.aportes).toHaveLength(score.factores.length);
      expect(puntaje.aportes.map((a) => a.nombre)).toEqual(
        score.factores.map((f) => f.nombre),
      );
    }
  });

  it("la aritmética cuadra: los aportes suman el obtenido, y el total es su normalización", () => {
    for (const { lead, proyecto } of CASOS) {
      const p = puntajeDe(lead, proyecto);
      expect(p.aportes.reduce((s, a) => s + a.obtenido, 0)).toBe(p.obtenido);
      expect(p.aportes.reduce((s, a) => s + a.maximo, 0)).toBe(p.posible);
      expect(p.total).toBe(Math.round((p.obtenido / p.posible) * 100));
    }
  });

  it("cada aporte cita lo que evaluó el motor, no un texto propio", () => {
    const score = calcularScore(afiliadoListo, proyectoInari);
    const p = calcularPuntaje(score, true);
    for (const factor of score.factores) {
      const aporte = p.aportes.find((a) => a.nombre === factor.nombre)!;
      expect(aporte.porque).toContain(factor.valor);
    }
  });

  it("un factor desconocido entra al desglose con 0 y lo dice, nunca se descarta", () => {
    const score = calcularScore(afiliadoListo, proyectoInari);
    score.factores.push({
      nombre: "factor_inventado",
      valor: "algo que el motor midió",
      cumple: true,
      fuente: "conversacion",
    });

    const p = calcularPuntaje(score, true);
    const aporte = p.aportes.find((a) => a.nombre === "factor_inventado")!;
    expect(aporte).toBeDefined();
    expect(aporte.obtenido).toBe(0);
    expect(aporte.maximo).toBe(0);
    expect(aporte.porque).toContain("sin peso asignado");
  });
});

describe("calcularPuntaje — el puntaje no contradice a la salida", () => {
  it("el lead de nutrición puntúa por debajo de los dos que pasaron el corte", () => {
    const listo = puntajeDe(afiliadoListo, proyectoInari).total;
    const cupo = puntajeDe(noAfiliadoListo, proyectoInari).total;
    const nutre = puntajeDe(nutricion, proyectoBosqueDeTurpial).total;

    expect(nutre).toBeLessThan(listo);
    expect(nutre).toBeLessThan(cupo);
  });

  it("la afiliación se decide con afiliadoEfectivo, no con el cumple del factor", () => {
    // El factor `afiliacion` del motor trae cumple=true SIEMPRE (es
    // informativo, no bloquea). Si el puntaje lo leyera de ahí, un no
    // afiliado se llevaría los 20 puntos.
    const score = calcularScore(noAfiliadoListo, proyectoInari);
    expect(score.factores.find((f) => f.nombre === "afiliacion")!.cumple).toBe(true);

    const aporte = calcularPuntaje(score, false).aportes.find(
      (a) => a.nombre === "afiliacion",
    )!;
    expect(aporte.obtenido).toBe(0);
    expect(aporte.maximo).toBe(PESOS.afiliacion);
  });

  it("el puntaje queda dentro de 0-100 en las 3 salidas", () => {
    for (const { lead, proyecto } of CASOS) {
      const total = puntajeDe(lead, proyecto).total;
      expect(total).toBeGreaterThanOrEqual(0);
      expect(total).toBeLessThanOrEqual(100);
    }
  });
});
