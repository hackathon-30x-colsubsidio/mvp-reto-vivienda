import { describe, expect, it } from "vitest";
import { colaHistoricaSintetica } from "./cola-historica";
import { afiliadoEfectivo } from "@/lib/scoring";
import * as canonicos from "./leads-curados";

const HOY = new Date("2026-07-24T18:00:00-05:00");

describe("colaHistoricaSintetica — determinismo", () => {
  it("dos llamadas con la misma fecha dan exactamente lo mismo", () => {
    // Sin esto el tablero cambiaría entre el render del servidor y el
    // siguiente, y el video no se podría grabar dos veces igual.
    expect(colaHistoricaSintetica(HOY)).toEqual(colaHistoricaSintetica(HOY));
  });

  it("los lead_id no se repiten", () => {
    const ids = colaHistoricaSintetica(HOY).map((l) => l.curado.lead.evento.lead_id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("colaHistoricaSintetica — no se mete con los personajes del demo", () => {
  it("ninguna cédula choca con las de los 3 canónicos", () => {
    const canonicas = new Set(Object.values(canonicos).map((c) => c.lead.evento.cedula));
    for (const item of colaHistoricaSintetica(HOY)) {
      expect(canonicas.has(item.curado.lead.evento.cedula)).toBe(false);
    }
  });

  it("ningún lead_id choca con los de los 3 canónicos", () => {
    const ids = new Set(Object.values(canonicos).map((c) => c.lead.evento.lead_id));
    for (const item of colaHistoricaSintetica(HOY)) {
      expect(ids.has(item.curado.lead.evento.lead_id)).toBe(false);
    }
  });
});

describe("colaHistoricaSintetica — honestidad", () => {
  it("TODOS van marcados como sintéticos", () => {
    // Es lo que obliga a la UI a avisarlo. Un lead del telón sin marca
    // se le presentaría al jurado como si viniera de la operación.
    const cola = colaHistoricaSintetica(HOY);
    expect(cola.length).toBeGreaterThan(0);
    expect(cola.every((l) => l.sintetico === true)).toBe(true);
  });
});

describe("colaHistoricaSintetica — sirve para lo que existe", () => {
  it("cubre los 14 días de la ventana, sin huecos y sin pasarse de hoy", () => {
    const cola = colaHistoricaSintetica(HOY);
    const dias = new Set(cola.map((l) => l.creado_en.slice(0, 10)));
    expect(dias.size).toBe(14);
    for (const item of cola) {
      expect(new Date(item.creado_en).getTime()).toBeLessThanOrEqual(HOY.getTime());
    }
  });

  it("las 3 salidas del corte están representadas", () => {
    const salidas = new Set(colaHistoricaSintetica(HOY).map((l) => l.curado.score.salida));
    expect(salidas).toEqual(new Set(["listo", "listo_restriccion_cupo", "nutricion"]));
  });

  it("hay leads de los dos lados de la afiliación", () => {
    const cola = colaHistoricaSintetica(HOY);
    const afiliados = cola.filter((l) => afiliadoEfectivo(l.curado.lead));
    expect(afiliados.length).toBeGreaterThan(0);
    expect(cola.length - afiliados.length).toBeGreaterThan(0);
  });
});

describe("colaHistoricaSintetica — respeta los criterios de aceptación", () => {
  it("todo lead trae factores: cero caja negra (criterio 2)", () => {
    for (const item of colaHistoricaSintetica(HOY)) {
      expect(item.curado.score.factores.length).toBeGreaterThan(0);
    }
  });

  it("todo lead de nutrición trae regla fallida y trigger (criterio 3)", () => {
    const nutricion = colaHistoricaSintetica(HOY).filter(
      (l) => l.curado.score.salida === "nutricion",
    );
    expect(nutricion.length).toBeGreaterThan(0);
    for (const item of nutricion) {
      expect(item.curado.score.regla_fallida?.trim()).toBeTruthy();
      expect(item.curado.score.trigger_nutricion?.trim()).toBeTruthy();
      expect(item.curado.proyectos).toHaveLength(0);
    }
  });

  it("un afiliado listo nunca sale con 1 solo proyecto (criterio 4)", () => {
    for (const item of colaHistoricaSintetica(HOY)) {
      if (item.curado.score.salida === "nutricion") continue;
      if (!afiliadoEfectivo(item.curado.lead)) continue;
      expect(item.curado.proyectos.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("el no afiliado sin cupo entra con 0 proyectos y la explicación lo dice", () => {
    // Los 18 proyectos del catálogo ya venden por encima del 10% que
    // permite la regla 90/10, así que el matcher no le deja ninguno.
    // Ese caso NO se esconde: es la munición del reto.
    const sinCupo = colaHistoricaSintetica(HOY).filter(
      (l) =>
        l.curado.score.salida === "listo_restriccion_cupo" &&
        l.curado.proyectos.length === 0,
    );
    expect(sinCupo.length).toBeGreaterThan(0);
    for (const item of sinCupo) {
      expect(item.curado.explicacion).toMatch(/cupo/i);
    }
  });
});
