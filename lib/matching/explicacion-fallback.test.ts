import { describe, expect, it } from "vitest";
import type { Lead } from "@/lib/types";
import * as leads from "../fixtures/leads";
import { explicacionFallback } from "./explicacion-fallback";

// El fallback es el seguro del demo autogestionado: si el LLM cae, la ficha del
// asesor muestra igual la explicación de referencia del personaje (ticket 010).

describe("explicacionFallback", () => {
  it("devuelve la explicación de referencia de cada personaje canónico", () => {
    for (const lead of [leads.afiliadoListo, leads.noAfiliadoListo, leads.nutricion]) {
      const texto = explicacionFallback(lead);
      expect(texto).toBeTruthy();
      // Cita la norma textual: es lo que separa el estándar del "no te alcanza".
      expect(texto).toContain("Decreto 583 de 2025");
    }
  });

  it("devuelve null para un lead no canónico (el 'soy yo'): no inventa un guion", () => {
    const leadLibre: Lead = {
      ...leads.afiliadoListo,
      evento: { ...leads.afiliadoListo.evento, lead_id: "lead-libre-xyz" },
    };
    expect(explicacionFallback(leadLibre)).toBeNull();
  });
});
