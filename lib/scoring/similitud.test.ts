import { describe, expect, it } from "vitest";
import { similitudCon } from "./similitud";
import type { Lead } from "../types";

// La similitud se prueba contra el JSON DERIVADO real (buyer_personas.json):
// si el generador cambia los números, estos tests avisan que el factor que la
// ficha cita cambió con ellos.

function leadDe(respuestas: Partial<Lead["respuestas"]> = {}): Lead {
  return {
    evento: {
      lead_id: "lead-test",
      nombre: "Persona de Prueba",
      celular: "3000000000",
      cedula: "1000000000",
      fuente: "web",
    },
    perfil: { match: false },
    respuestas: {
      consentimiento: { otorgado: true, timestamp: "2026-07-23T18:00:00-05:00" },
      ...respuestas,
    },
  };
}

describe("similitudCon", () => {
  it("es determinista: dos corridas idénticas dan lo mismo", () => {
    const lead = leadDe({ ingreso_hogar_mensual: 2_000_000 });
    expect(similitudCon(lead, "la-macarena", true)).toEqual(
      similitudCon(lead, "la-macarena", true),
    );
  });

  it("proyecto sin distribución (Zarzal no tiene slide) → 0.5 neutro, sin evidencias", () => {
    const s = similitudCon(leadDe({ ingreso_hogar_mensual: 2_000_000 }), "zarzal", true);
    expect(s.valorNorm).toBe(0.5);
    expect(s.evidencias).toHaveLength(0);
  });

  it("slide marcado no confiable (Abeto) → 0.5 neutro: no se castiga por un error del PPT", () => {
    const s = similitudCon(leadDe({ ingreso_hogar_mensual: 2_000_000 }), "abeto", true);
    expect(s.valorNorm).toBe(0.5);
    expect(s.evidencias).toHaveLength(0);
  });

  it("lead sin ninguna dimensión → 0.5 neutro (no se inventa un fit)", () => {
    // Sin afiliado_pct no hay señal de afiliación... pero afiliación siempre
    // existe como boolean, así que la única forma de quedar sin señales es un
    // proyecto sin datos. Con datos, la afiliación sola ya da señal:
    const s = similitudCon(leadDe(), "la-macarena", true);
    expect(s.evidencias.length).toBeGreaterThan(0);
  });

  it("cita los % REALES del proyecto (La Macarena: 56% afiliados, 91% hasta 2 SMLV)", () => {
    const s = similitudCon(leadDe({ ingreso_hogar_mensual: 2_000_000 }), "la-macarena", true);
    // (56 + 91) / 200 — promedio de las dos señales disponibles.
    expect(s.valorNorm).toBeCloseTo(0.735, 3);
    expect(s.evidencias.join(" ")).toContain("56%");
    expect(s.evidencias.join(" ")).toContain("91%");
  });

  it("edad y composición del hogar suman señales cuando existen", () => {
    const s = similitudCon(
      leadDe({
        ingreso_hogar_mensual: 2_000_000,
        rango_edad: "20_35",
        composicion_familiar: "solo",
      }),
      "la-macarena",
      true,
    );
    // (56 afiliado + 91 hasta2 + 54 edad 20-35 + 50 sin grupo) / 400
    expect(s.valorNorm).toBeCloseTo(0.6275, 3);
    expect(s.evidencias).toHaveLength(4);
  });

  it("el no afiliado puntúa con el complemento, no con el % de afiliados", () => {
    const afiliado = similitudCon(leadDe(), "la-macarena", true);
    const noAfiliado = similitudCon(leadDe(), "la-macarena", false);
    expect(afiliado.valorNorm).toBeCloseTo(0.56, 3);
    expect(noAfiliado.valorNorm).toBeCloseTo(0.44, 3);
  });
});
