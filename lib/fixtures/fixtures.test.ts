import { describe, expect, it } from "vitest";
import { leadsCurados } from "./index";

// Smoke test: los fixtures de los 3 personajes cumplen los criterios de
// aceptación 3 y 4 del spec (docs/spec.md §5) en su propia forma.

describe("fixtures de los 3 personajes", () => {
  it("listo trae 2-3 proyectos y cita", () => {
    expect(leadsCurados.afiliadoListo.score.salida).toBe("listo");
    expect(leadsCurados.afiliadoListo.proyectos.length).toBeGreaterThanOrEqual(2);
    expect(leadsCurados.afiliadoListo.proyectos.length).toBeLessThanOrEqual(3);
    expect(leadsCurados.afiliadoListo.cita).toBeDefined();
  });

  it("listo_restriccion_cupo trae 2-3 proyectos y cita", () => {
    expect(leadsCurados.noAfiliadoListo.score.salida).toBe(
      "listo_restriccion_cupo",
    );
    expect(leadsCurados.noAfiliadoListo.proyectos.length).toBeGreaterThanOrEqual(2);
    expect(leadsCurados.noAfiliadoListo.cita).toBeDefined();
  });

  it("nutrición no se descarta: tiene razón y trigger, sin proyectos", () => {
    const { score, proyectos, cita } = leadsCurados.nutricion;
    expect(score.salida).toBe("nutricion");
    expect(score.regla_fallida).toBeTruthy();
    expect(score.trigger_nutricion).toBeTruthy();
    expect(proyectos).toHaveLength(0);
    expect(cita).toBeUndefined();
  });

  it("el consentimiento de habeas data está registrado en los 3 personajes", () => {
    for (const persona of Object.values(leadsCurados)) {
      expect(persona.lead.respuestas.consentimiento.otorgado).toBe(true);
      expect(persona.lead.respuestas.consentimiento.timestamp).toBeTruthy();
    }
  });
});
