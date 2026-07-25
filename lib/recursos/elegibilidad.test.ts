import { describe, expect, it } from "vitest";
import {
  MESES_AFILIACION_SUBSIDIO,
  fechaElegibilidadSubsidio,
  fechaElegibilidadTexto,
} from "./elegibilidad";
import { recursosPara } from "./index";
import { calcularScore } from "../scoring";
import { noAfiliadoListo } from "../fixtures/leads";
import { proyectoInari } from "../fixtures/proyectos";
import type { Lead } from "../types";

describe("fechaElegibilidadSubsidio — la rama temporal (Q3, spec 05 D2)", () => {
  it("suma exactamente 6 meses a la fecha de afiliación", () => {
    const desde = new Date("2026-07-25T10:00:00-05:00");
    const elegible = fechaElegibilidadSubsidio(desde);
    // 25 de julio + 6 meses = 25 de enero del año siguiente.
    expect(elegible.getFullYear()).toBe(2027);
    expect(elegible.getMonth()).toBe(0); // enero (0-based)
    expect(MESES_AFILIACION_SUBSIDIO).toBe(6);
  });

  it("es determinista: misma fecha de entrada -> mismo texto", () => {
    const desde = new Date("2026-07-25T10:00:00-05:00");
    expect(fechaElegibilidadTexto(desde)).toBe(fechaElegibilidadTexto(desde));
    expect(fechaElegibilidadTexto(desde)).toMatch(/enero de 2027/);
  });
});

describe("la fecha temporal viaja DENTRO del recurso de afiliación", () => {
  const conIngreso = (base: Lead, ingreso: number): Lead => ({
    ...base,
    respuestas: { ...base.respuestas, ingreso_hogar_mensual: ingreso },
  });

  it("el porque del recurso de afiliación trae la fecha derivada del 'hoy' dado", () => {
    const lead = conIngreso(noAfiliadoListo, 8_000_000);
    const score = calcularScore(lead, proyectoInari);
    const hoy = new Date("2026-07-25T10:00:00-05:00");
    const recursos = recursosPara(lead, score, hoy);
    const afiliacion = recursos.find((r) => r.recurso_id === "afiliacion");
    expect(afiliacion?.porque).toMatch(/enero de 2027/);
    expect(afiliacion?.porque).toMatch(/6 meses/);
  });
});
