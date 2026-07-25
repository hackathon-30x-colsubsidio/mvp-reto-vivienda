import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HiloConversacion } from "./HiloConversacion";
import { conversaciones } from "@/lib/fixtures/leads";
import type { MensajeConversacion } from "@/lib/types";

// =====================================================================
// El hilo que el asesor puede leer (spec 06 D2).
//
// Se prueba contra el hilo REAL de un personaje canónico —el mismo que
// `replayGuion` produce y que `db/seed.sql` siembra—, no contra mensajes
// inventados aquí: si la conversación cambia, este test viaja con ella.
// =====================================================================

const hiloDeDiana = conversaciones.afiliadoListo.hilo;

describe("el hilo de la conversación en la ficha", () => {
  it("pinta todos los mensajes del hilo, en orden", () => {
    render(<HiloConversacion mensajes={hiloDeDiana} />);

    const filas = screen.getByTestId("hilo").querySelectorAll("li");
    expect(filas).toHaveLength(hiloDeDiana.length);
    expect(filas[0]).toHaveTextContent(hiloDeDiana[0].mensaje);
  });

  it("distingue los tres roles: lo que dijo el lead, lo que dijo el agente y los eventos del sistema", () => {
    render(<HiloConversacion mensajes={hiloDeDiana} />);
    const hilo = screen.getByTestId("hilo");

    for (const rol of ["lead", "asistente", "sistema"] as const) {
      expect(
        hilo.querySelectorAll(`[data-rol="${rol}"]`).length,
        `no hay ninguna fila con rol ${rol}`,
      ).toBeGreaterThan(0);
    }
  });

  it("el consentimiento con su hora queda visible: es la evidencia de habeas data", () => {
    render(<HiloConversacion mensajes={hiloDeDiana} />);
    const sistema = Array.from(
      screen.getByTestId("hilo").querySelectorAll('[data-rol="sistema"]'),
    ).map((n) => n.textContent ?? "");

    expect(sistema.some((t) => /Ley 1581 de 2012/.test(t))).toBe(true);
    // Y la ingesta, que es de dónde vino el lead antes de escribir una palabra.
    expect(sistema.some((t) => /enriquecimiento por cédula/i.test(t))).toBe(true);
  });

  it("sin hilo no pinta nada: mejor vacío que una conversación inventada", () => {
    const { container } = render(<HiloConversacion mensajes={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("un mensaje del lead nunca se presenta como del agente", () => {
    const mensajes: MensajeConversacion[] = [
      { rol: "lead", mensaje: "Sería la primera" },
      { rol: "asistente", mensaje: "¡La primera!" },
    ];
    render(<HiloConversacion mensajes={mensajes} />);

    const delLead = screen.getByTestId("hilo").querySelector('[data-rol="lead"]');
    expect(delLead).toHaveTextContent("Sería la primera");
    expect(delLead).not.toHaveTextContent("¡La primera!");
  });
});
