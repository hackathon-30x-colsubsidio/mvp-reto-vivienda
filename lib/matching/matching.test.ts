import { describe, expect, it } from "vitest";
import type { Lead, Score } from "@/lib/types";
// Imports relativos a propósito: el alias "@/" lo resuelve Next, no vitest,
// y estas fixtures se importan por valor (los tipos sí viajan por el alias).
import * as leads from "../fixtures/leads";
import * as scores from "../fixtures/scores";
import { matchear } from "./index";
import { catalogo, preciosMaximos } from "./fixtures";

// Un caso por personaje del demo (spec §4) + el lead que llega sin nada.
// Lo que se prueba son las invariantes del criterio de aceptación 4: que el lead
// listo reciba 2-3 proyectos que de verdad puede pagar, y que la regla 90/10 se
// respete sin excepciones.

const nombres = (elegidos: ReturnType<typeof matchear>) => elegidos.map((e) => e.ficha.nombre);

describe("afiliado listo (Diana)", () => {
  const elegidos = matchear({
    lead: leads.afiliadoListo,
    score: scores.afiliadoListo,
    catalogo,
    precio_maximo: preciosMaximos.afiliadoListo,
  });

  it("recomienda entre 2 y 3 proyectos", () => {
    expect(elegidos.length).toBeGreaterThanOrEqual(2);
    expect(elegidos.length).toBeLessThanOrEqual(3);
  });

  it("ninguno supera su precio máximo", () => {
    for (const { ficha } of elegidos) {
      expect(ficha.precio_desde).toBeLessThanOrEqual(preciosMaximos.afiliadoListo);
    }
  });

  it("arranca por el proyecto que preguntó y no la saca de su ciudad", () => {
    expect(nombres(elegidos)[0]).toBe("Torres de Bellavista");
    expect(elegidos.every((e) => e.ficha.ciudad === "Bogotá")).toBe(true);
  });

  it("cada proyecto trae su traza para que el experto la cite", () => {
    for (const { razones } of elegidos) {
      expect(razones.length).toBeGreaterThan(0);
      expect(razones[0]).toContain("Decreto 583 de 2025");
    }
  });
});

describe("no afiliado listo (Carlos)", () => {
  const elegidos = matchear({
    lead: leads.noAfiliadoListo,
    score: scores.noAfiliadoListo,
    catalogo,
    precio_maximo: preciosMaximos.noAfiliadoListo,
  });

  it("solo recibe proyectos con cupo 90/10 disponible", () => {
    for (const { ficha } of elegidos) {
      expect(ficha.cupo_no_afiliados.usado).toBeLessThan(ficha.cupo_no_afiliados.total);
    }
  });

  it("nunca ve el proyecto sin cupo, ni siendo el más barato del catálogo", () => {
    expect(nombres(elegidos)).not.toContain("Ciudadela del Este");
  });

  it("le dice cuánto cupo queda, que es la razón para moverse rápido", () => {
    for (const { razones } of elegidos) {
      expect(razones.some((r) => r.includes("regla 90/10"))).toBe(true);
    }
  });

  it("recomienda en Medellín y arranca por el que preguntó", () => {
    expect(nombres(elegidos)[0]).toBe("Reserva del Poblado");
    expect(elegidos.every((e) => e.ficha.ciudad === "Medellín")).toBe(true);
  });
});

describe("nutrición (Yuliana)", () => {
  it("no recibe ningún proyecto: no se recomienda lo que no puede pagar", () => {
    const elegidos = matchear({
      lead: leads.nutricion,
      score: scores.nutricion,
      catalogo,
      precio_maximo: preciosMaximos.nutricion,
    });
    expect(elegidos).toEqual([]);
  });
});

describe("lead que llega sin nada (el 'soy yo' sin match de enriquecimiento)", () => {
  // Sin perfil, sin ciudad, sin zona de interés y sin proyecto de interés:
  // el peor caso del formulario libre. El matcher tiene que degradar, no caerse.
  const leadDesnudo: Lead = {
    evento: { ...leads.nutricion.evento, proyecto_interes: undefined },
    perfil: { match: false },
    respuestas: {
      consentimiento: { otorgado: true, timestamp: "2026-07-23T18:00:00-05:00" },
      rango_ingreso_hogar: "3-5 SMMLV",
      tiene_vivienda: false,
      subsidios: [],
      situacion_crediticia: "buena, sin mora reportada",
    },
  };
  const scoreListo: Score = { ...scores.afiliadoListo, lead_id: leadDesnudo.evento.lead_id };

  const elegidos = matchear({
    lead: leadDesnudo,
    score: scoreListo,
    catalogo,
    precio_maximo: preciosMaximos.afiliadoListo,
  });

  it("igual recomienda 2-3 proyectos, sin inventarse una zona", () => {
    expect(elegidos.length).toBeGreaterThanOrEqual(2);
    expect(elegidos.length).toBeLessThanOrEqual(3);
    for (const { razones } of elegidos) {
      expect(razones.some((r) => r.includes("la zona que le interesa"))).toBe(false);
    }
  });

  it("prioriza la cuota más holgada cuando no hay nada que lo desempate", () => {
    expect(nombres(elegidos)[0]).toBe("Ciudadela del Este");
  });
});
