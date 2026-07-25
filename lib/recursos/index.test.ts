import { describe, expect, it } from "vitest";
import { recursosPara, MAX_RECURSOS } from "./index";
import { calcularScore } from "../scoring";
import { afiliadoListo, noAfiliadoListo, nutricion } from "../fixtures/leads";
import { proyectoBosqueDeTurpial, proyectoInari } from "../fixtures/proyectos";
import type { Lead } from "../types";

// La salida depende de (lead, proyecto): se fija el ingreso a mano para no
// depender de cuánto gana un personaje del demo (mismo patrón que scoring).
const conIngreso = (base: Lead, ingreso: number): Lead => ({
  ...base,
  respuestas: { ...base.respuestas, ingreso_hogar_mensual: ingreso },
});

const idsDe = (lead: Lead, proyecto = proyectoInari, ingreso = 8_000_000) =>
  recursosPara(conIngreso(lead, ingreso), calcularScore(conIngreso(lead, ingreso), proyecto)).map(
    (r) => r.recurso_id,
  );

describe("recursosPara — capa ortogonal a Score.salida", () => {
  it("un no afiliado recibe el recurso de afiliación como primario", () => {
    const recursos = recursosPara(
      conIngreso(noAfiliadoListo, 8_000_000),
      calcularScore(conIngreso(noAfiliadoListo, 8_000_000), proyectoInari),
    );
    expect(recursos[0]?.recurso_id).toBe("afiliacion");
    expect(recursos[0]?.factor_disparador).toBe("afiliacion");
  });

  it("un listo (no afiliado) recibe recurso IGUAL — la ortogonalidad", () => {
    const score = calcularScore(conIngreso(noAfiliadoListo, 8_000_000), proyectoInari);
    // Pasa el gate (es listo/listo_restriccion_cupo) Y recibe recurso.
    expect(score.salida).not.toBe("nutricion");
    expect(idsDe(noAfiliadoListo)).toContain("afiliacion");
  });

  it("un afiliado sin subsidio declarado y sin vivienda recibe el subsidio, no afiliación", () => {
    const afiliadoElegible: Lead = {
      ...afiliadoListo,
      perfil: { ...afiliadoListo.perfil, afiliado: true },
      respuestas: {
        ...afiliadoListo.respuestas,
        subsidios: [],
        subsidio_monto_mensual: undefined,
        tiene_vivienda: false,
      },
    };
    const ids = idsDe(afiliadoElegible);
    expect(ids).toContain("subsidio");
    expect(ids).not.toContain("afiliacion");
  });

  it("GUARD anti-absurdo: a quien ya declaró un subsidio NO se le ofrece subsidio", () => {
    const yaTieneSubsidio: Lead = {
      ...afiliadoListo,
      perfil: { ...afiliadoListo.perfil, afiliado: true },
      respuestas: {
        ...afiliadoListo.respuestas,
        subsidios: ["Mi Casa Ya"],
        tiene_vivienda: false,
      },
    };
    expect(idsDe(yaTieneSubsidio)).not.toContain("subsidio");
  });

  it("un gate fallado (nutrición) dispara compra de cartera", () => {
    // Afiliado, propietario (sin subsidio) y al día: así ningún recurso de
    // mayor prioridad (afiliación, subsidio, crediticia) desplaza a la cartera,
    // y se ve limpio que el gate fallado la dispara.
    const afiliadoJusto: Lead = {
      ...afiliadoListo,
      perfil: { ...afiliadoListo.perfil, afiliado: true },
      respuestas: {
        ...afiliadoListo.respuestas,
        subsidios: [],
        subsidio_monto_mensual: undefined,
        tiene_vivienda: true,
        situacion_crediticia: "buena",
      },
    };
    const score = calcularScore(conIngreso(afiliadoJusto, 1_200_000), proyectoBosqueDeTurpial);
    expect(score.salida).toBe("nutricion");
    expect(idsDe(afiliadoJusto, proyectoBosqueDeTurpial, 1_200_000)).toContain("compra_cartera");
  });

  it("crediticia mala/regular dispara el recurso EXTERNO de educación financiera", () => {
    const conMora: Lead = {
      ...afiliadoListo,
      respuestas: { ...afiliadoListo.respuestas, situacion_crediticia: "mala" },
    };
    const recursos = recursosPara(
      conIngreso(conMora, 8_000_000),
      calcularScore(conIngreso(conMora, 8_000_000), proyectoInari),
    );
    const edu = recursos.find((r) => r.recurso_id === "educacion_financiera_habitat");
    expect(edu).toBeDefined();
    expect(edu?.tipo).toBe("aliado_externo"); // nunca se presenta como oferta propia
    expect(edu?.factor_disparador).toBe("situacion_crediticia");
  });

  it("nunca muestra más de MAX_RECURSOS", () => {
    // Un no afiliado, gate fallado y crediticia mala: varios candidatos, tope 2.
    const cargado: Lead = {
      ...nutricion,
      respuestas: { ...nutricion.respuestas, situacion_crediticia: "mala" },
    };
    const recursos = recursosPara(
      conIngreso(cargado, 1_200_000),
      calcularScore(conIngreso(cargado, 1_200_000), proyectoBosqueDeTurpial),
    );
    expect(recursos.length).toBeLessThanOrEqual(MAX_RECURSOS);
  });

  it("cero caja negra: todo recurso cita un factor que el motor realmente emitió", () => {
    const score = calcularScore(conIngreso(nutricion, 1_200_000), proyectoBosqueDeTurpial);
    const nombresFactor = new Set(score.factores.map((f) => f.nombre));
    for (const r of recursosPara(conIngreso(nutricion, 1_200_000), score)) {
      expect(nombresFactor.has(r.factor_disparador)).toBe(true);
      expect(r.porque.trim()).not.toBe("");
    }
  });

  it("es determinista: dos corridas dan el mismo resultado", () => {
    const a = idsDe(noAfiliadoListo);
    const b = idsDe(noAfiliadoListo);
    expect(a).toEqual(b);
  });

  it("un afiliado sin factores débiles no recibe recursos (el sistema no spamea)", () => {
    const impecable: Lead = {
      ...afiliadoListo,
      perfil: { ...afiliadoListo.perfil, afiliado: true },
      respuestas: {
        ...afiliadoListo.respuestas,
        subsidios: ["Mi Casa Ya"], // ya lo tiene
        tiene_vivienda: false,
        situacion_crediticia: "buena",
      },
    };
    expect(idsDe(impecable)).toEqual([]);
  });
});
