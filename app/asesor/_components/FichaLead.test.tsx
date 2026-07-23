import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FichaLead } from "./FichaLead";
import type { LeadEnCola } from "@/lib/types-asesor";
import { leadsCurados } from "@/lib/fixtures";
import type { LeadCurado } from "@/lib/types";

// =====================================================================
// La ficha del asesor contra los 3 personajes CANÓNICOS de
// lib/fixtures (ticket 001). Ningún personaje se inventa aquí.
//
// El conteo de factores vive en TablaFactores.test.tsx (ticket 012);
// aquí se verifica que la ficha completa arma los criterios 2, 3 y 4.
// =====================================================================

const { afiliadoListo, noAfiliadoListo, nutricion } = leadsCurados;
const personajes = Object.entries(leadsCurados) as [string, LeadCurado][];

function enCola(curado: LeadCurado, reEnganchado = false): LeadEnCola {
  return {
    curado,
    re_enganchado_en: reEnganchado ? "2026-07-23T18:00:00-05:00" : null,
    creado_en: "2026-07-23T14:00:00-05:00",
  };
}

describe("criterio 2 — cero caja negra en la ficha completa", () => {
  it.each(personajes)("%s: la ficha muestra todos los factores del score", (_n, curado) => {
    render(<FichaLead item={enCola(curado)} />);
    expect(screen.getAllByTestId("factor")).toHaveLength(curado.score.factores.length);
  });

  it("la explicación en lenguaje natural acompaña a la tabla", () => {
    render(<FichaLead item={enCola(afiliadoListo)} />);
    expect(screen.getByTestId("explicacion")).toHaveTextContent(
      afiliadoListo.explicacion,
    );
  });

  it("el encabezado dice cuántos factores se evaluaron", () => {
    render(<FichaLead item={enCola(afiliadoListo)} />);
    expect(
      screen.getByText(`(${afiliadoListo.score.factores.length} factores)`),
    ).toBeInTheDocument();
  });
});

describe("criterio 3 — nadie se descarta", () => {
  it("muestra la regla exacta que falló", () => {
    render(<FichaLead item={enCola(nutricion)} />);
    expect(screen.getByTestId("regla-fallida")).toHaveTextContent(
      nutricion.score.regla_fallida!,
    );
  });

  it("muestra el trigger de recontacto", () => {
    render(<FichaLead item={enCola(nutricion)} />);
    expect(screen.getByTestId("trigger-nutricion")).toHaveTextContent(
      nutricion.score.trigger_nutricion!,
    );
  });

  it("ofrece el botón para simular el trigger", () => {
    render(<FichaLead item={enCola(nutricion)} />);
    expect(screen.getByRole("button", { name: /simular trigger/i })).toBeInTheDocument();
  });

  // Ticket 007: la mitad de D es llevar al chat con el lead_id.
  it("una vez disparado, el enlace al chat lleva el lead_id", () => {
    render(<FichaLead item={enCola(nutricion, true)} />);

    expect(screen.getByTestId("re-enganche-hecho")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /volver a abrir la conversación/i });
    expect(link).toHaveAttribute(
      "href",
      `/?lead_id=${nutricion.lead.evento.lead_id}&reenganche=1`,
    );
  });

  it("los leads listos NO muestran el bloque de nutrición", () => {
    render(<FichaLead item={enCola(afiliadoListo)} />);
    expect(screen.queryByTestId("bloque-nutricion")).not.toBeInTheDocument();
  });
});

describe("criterio 4 — el lead listo llega cerrable", () => {
  it.each([
    ["afiliadoListo", afiliadoListo],
    ["noAfiliadoListo", noAfiliadoListo],
  ] as const)("%s: muestra 2-3 proyectos con su porqué", (_n, curado) => {
    render(<FichaLead item={enCola(curado)} />);

    const tarjetas = screen.getAllByTestId("proyecto");
    expect(tarjetas).toHaveLength(curado.proyectos.length);
    expect(tarjetas.length).toBeGreaterThanOrEqual(2);
    expect(tarjetas.length).toBeLessThanOrEqual(3);

    for (const proyecto of curado.proyectos) {
      expect(screen.getByText(proyecto.porque)).toBeInTheDocument();
    }
  });

  it("muestra la cita agendada con su sala de ventas (ticket 005)", () => {
    render(<FichaLead item={enCola(afiliadoListo)} />);
    expect(screen.getByTestId("cita")).toHaveTextContent(
      afiliadoListo.cita!.sala_ventas,
    );
  });

  it("el lead de nutrición no muestra proyectos ni cita", () => {
    render(<FichaLead item={enCola(nutricion)} />);
    expect(screen.queryAllByTestId("proyecto")).toHaveLength(0);
    expect(screen.queryByTestId("cita")).not.toBeInTheDocument();
  });
});

describe("fuente del lead — narrativa multi-canal (spec §4 paso 1)", () => {
  it.each([
    ["afiliadoListo", afiliadoListo, "Meta Ads"],
    ["noAfiliadoListo", noAfiliadoListo, "Google Ads"],
    ["nutricion", nutricion, "Formulario web"],
  ] as const)("%s: la ficha muestra por dónde entró el lead", (_n, curado, etiqueta) => {
    render(<FichaLead item={enCola(curado)} />);
    expect(screen.getByTestId("fuente-lead")).toHaveTextContent(etiqueta);
  });

  it("los 3 personajes cubren los 3 canales del contrato", () => {
    const canales = personajes.map(([, c]) => c.lead.evento.fuente);
    expect(new Set(canales)).toEqual(new Set(["meta", "google", "web"]));
  });
});

describe("habeas data y regla 90/10", () => {
  it("la ficha deja constancia del consentimiento con su fecha", () => {
    render(<FichaLead item={enCola(afiliadoListo)} />);
    expect(
      screen.getByText(/autorización de tratamiento de datos otorgada/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ley 1581 de 2012/)).toBeInTheDocument();
  });

  it("el no afiliado se marca contra el cupo 90/10", () => {
    render(<FichaLead item={enCola(noAfiliadoListo)} />);

    // El cupo se ve DOS veces, y las dos importan: en el badge de la
    // salida (lo que el asesor ve de un vistazo) y en el factor de
    // afiliación (el porqué auditable).
    expect(screen.getByText("Listo · cupo 90/10")).toBeInTheDocument();
    expect(
      screen.getByText(/no afiliado \(marca contra el cupo 90\/10/i),
    ).toBeInTheDocument();
    expect(screen.getByText("No afiliado")).toBeInTheDocument();
  });

  it("distingue al lead enriquecido del que se perfiló desde cero", () => {
    const { unmount } = render(<FichaLead item={enCola(afiliadoListo)} />);
    expect(screen.getByText(/estaba en la base de identidades/i)).toBeInTheDocument();
    unmount();

    render(<FichaLead item={enCola(nutricion)} />);
    expect(screen.getByText(/se perfiló desde cero/i)).toBeInTheDocument();
  });
});
