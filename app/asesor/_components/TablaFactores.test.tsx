import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TablaFactores, ETIQUETA_FACTOR, ETIQUETA_FUENTE } from "./TablaFactores";
import { leadsCurados } from "@/lib/fixtures";
import type { FactorScore, LeadCurado } from "@/lib/types";

// =====================================================================
// TICKET 012 — Test del criterio de aceptación 2 (cero caja negra).
// Dueño: B (el conteo) + D (el render).
//
// "Que sea imposible que el motor evalúe un factor que la ficha del
//  asesor no muestre."
//
// Los 3 personajes vienen de lib/fixtures (ticket 001): no se inventan
// aquí. Si B agrega un factor al motor, entra por las fixtures y estos
// tests son los que avisan.
// =====================================================================

const personajes = Object.entries(leadsCurados) as [string, LeadCurado][];

describe("ticket 012 — tantos factores visibles como evaluó el motor", () => {
  it.each(personajes)("%s: se renderiza un factor por cada uno del score", (_n, curado) => {
    render(<TablaFactores factores={curado.score.factores} />);

    expect(screen.getAllByTestId("factor")).toHaveLength(
      curado.score.factores.length,
    );
  });

  it.each(personajes)(
    "%s: cada factor muestra nombre, valor, cumple Y fuente — ninguno a medias",
    (_n, curado) => {
      render(<TablaFactores factores={curado.score.factores} />);

      const total = curado.score.factores.length;
      expect(screen.getAllByTestId("factor-nombre")).toHaveLength(total);
      expect(screen.getAllByTestId("factor-valor")).toHaveLength(total);
      expect(screen.getAllByTestId("factor-cumple")).toHaveLength(total);
      expect(screen.getAllByTestId("factor-fuente")).toHaveLength(total);

      for (const factor of curado.score.factores) {
        expect(screen.getByText(factor.valor)).toBeInTheDocument();
        expect(
          screen.getAllByText(ETIQUETA_FUENTE[factor.fuente]).length,
        ).toBeGreaterThan(0);
      }
    },
  );

  it("los factores que NO cumplen se muestran igual, no se esconden", () => {
    const { noAfiliadoListo } = leadsCurados;
    const noCumplen = noAfiliadoListo.score.factores.filter((f) => !f.cumple);
    expect(noCumplen.length).toBeGreaterThan(0);

    render(<TablaFactores factores={noAfiliadoListo.score.factores} />);

    expect(screen.getAllByText("✗ No")).toHaveLength(noCumplen.length);
    for (const factor of noCumplen) {
      expect(screen.getByText(factor.valor)).toBeInTheDocument();
    }
  });

  // ───────────────────────────────────────────────────────────────────
  // EL CANARIO del ticket 012:
  // "Agregar un factor nuevo al motor sin tocar la ficha debe ROMPER
  //  el test."
  //
  // El .map() de la tabla haría que un factor nuevo apareciera solo —
  // bien para "cero caja negra", pero saldría con su nombre técnico en
  // crudo (`estabilidad_laboral`) delante del jurado. Este test obliga
  // a que D le ponga etiqueta.
  // ───────────────────────────────────────────────────────────────────
  it("todo factor que produce el motor tiene etiqueta legible en la ficha", () => {
    const delMotor = new Set(
      personajes.flatMap(([, c]) => c.score.factores.map((f) => f.nombre)),
    );

    const sinEtiqueta = [...delMotor].filter((nombre) => !ETIQUETA_FACTOR[nombre]);

    expect(
      sinEtiqueta,
      `Factores nuevos sin etiqueta en la ficha: ${sinEtiqueta.join(", ")}. ` +
        "Agrégalos a ETIQUETA_FACTOR en TablaFactores.tsx (ticket 012).",
    ).toEqual([]);
  });

  it("el canario dispara cuando llega un factor que la ficha no conoce", () => {
    const inventado: FactorScore = {
      nombre: "estabilidad_laboral",
      valor: "3 años en la misma empresa",
      cumple: true,
      fuente: "conversacion",
    };

    // Se sigue mostrando (cero caja negra no se negocia)…
    render(<TablaFactores factores={[inventado]} />);
    expect(screen.getAllByTestId("factor")).toHaveLength(1);
    expect(screen.getByText(inventado.valor)).toBeInTheDocument();

    // …pero sin etiqueta, y eso es lo que el canario de arriba detecta.
    expect(ETIQUETA_FACTOR[inventado.nombre]).toBeUndefined();
    expect(screen.getByText("estabilidad laboral")).toBeInTheDocument();
  });

  it("la tabla avisa si un lead calificado llega sin factores", () => {
    render(<TablaFactores factores={[]} />);
    expect(screen.queryAllByTestId("factor")).toHaveLength(0);
    expect(screen.getByText(/no tiene factores registrados/i)).toBeInTheDocument();
  });
});
