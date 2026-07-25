import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormularioSoyYo } from "./FormularioSoyYo";
import { catalogo } from "@/lib/matching/catalogo";
import { resolverProyectoDeReferencia } from "@/lib/curar";
import type { LeadEvento } from "@/lib/types";

// =====================================================================
// El proyecto de entrada se ELIGE, no se escribe.
//
// Era texto libre, y eso lo volvía una trampa silenciosa: el motor califica
// contra el proyecto por el que entró el lead y lo busca por nombre exacto. Un
// nombre mal escrito —o uno que no existe— no fallaba: caía al proyecto más
// económico del catálogo SIN decirlo, y la ficha quedaba calificada contra otra
// vivienda. Estos tests fijan que lo que el formulario ofrece siempre existe.
// =====================================================================

function abrirFormulario() {
  const onEnviar = vi.fn<(evento: LeadEvento) => void>();
  render(<FormularioSoyYo onEnviar={onEnviar} onCancelar={() => {}} />);
  return { onEnviar };
}

/** Llena lo obligatorio para poder enviar. */
function llenarDatosBasicos() {
  fireEvent.change(screen.getByLabelText(/nombre completo/i), {
    target: { value: "Persona de Prueba" },
  });
  fireEvent.change(screen.getByLabelText(/celular/i), {
    target: { value: "3000000000" },
  });
  fireEvent.change(screen.getByLabelText(/cédula/i), {
    target: { value: "1000000000" },
  });
}

describe("formulario 'soy yo' — proyecto de interés", () => {
  it("ofrece los 18 proyectos del catálogo real, más la opción de no elegir", () => {
    abrirFormulario();
    const opciones = screen.getByLabelText(/proyecto de interés/i).querySelectorAll("option");

    expect(opciones).toHaveLength(catalogo.length + 1);
    expect(opciones[0]).toHaveValue("");
  });

  it("cada opción vale un nombre que EXISTE en el catálogo", () => {
    abrirFormulario();
    const valores = [...screen.getByLabelText(/proyecto de interés/i).querySelectorAll("option")]
      .map((o) => (o as HTMLOptionElement).value)
      .filter(Boolean);

    const nombres = new Set(catalogo.map((p) => p.nombre));
    for (const valor of valores) {
      expect(nombres, `"${valor}" no está en el catálogo`).toContain(valor);
    }
  });

  it("lo que se elige es lo que el motor resuelve, sin caer al fallback", () => {
    const { onEnviar } = abrirFormulario();
    llenarDatosBasicos();

    const elegido = catalogo.find((p) => p.nombre === "LA ARBOLEDA")!;
    fireEvent.change(screen.getByLabelText(/proyecto de interés/i), {
      target: { value: elegido.nombre },
    });
    fireEvent.click(screen.getByRole("button", { name: /empezar/i }));

    expect(onEnviar).toHaveBeenCalledTimes(1);
    const evento = onEnviar.mock.calls[0][0];
    expect(evento.proyecto_interes).toBe(elegido.nombre);

    // La prueba de fondo: el motor encuentra ESE proyecto, no el más barato.
    const resuelto = resolverProyectoDeReferencia(
      { evento, perfil: { match: false }, respuestas: { consentimiento: { otorgado: true, timestamp: "t" } } },
      catalogo,
    );
    expect(resuelto?.nombre).toBe(elegido.nombre);
  });

  it("sin proyecto elegido, el lead viaja sin proyecto de interés", () => {
    const { onEnviar } = abrirFormulario();
    llenarDatosBasicos();
    fireEvent.click(screen.getByRole("button", { name: /empezar/i }));

    expect(onEnviar.mock.calls[0][0].proyecto_interes).toBeUndefined();
  });

  it("agrupa por ciudad, sin arrastrar las notas de la fuente a la etiqueta", () => {
    // La ciudad de un proyecto con la ubicación en duda es una frase entera
    // ("Ricaurte o Bogotá (ubicación contradictoria entre hojas…)"), y eso como
    // etiqueta de grupo es ilegible. Hoy el catálogo no tiene ninguno —la
    // ambigüedad de VIBO ONCE y KARAKALI la resolvió el brochure— pero la regla
    // sigue: el rótulo se corta antes del paréntesis y se marca "por confirmar".
    abrirFormulario();
    const grupos = [
      ...screen.getByLabelText(/proyecto de interés/i).querySelectorAll("optgroup"),
    ].map((g) => (g as HTMLOptGroupElement).label);

    expect(grupos.length).toBeGreaterThan(0);
    for (const grupo of grupos) {
      expect(grupo, "una etiqueta de grupo no debe traer la nota de la fuente").not.toMatch(
        /\(ubicación|contradictoria|sin confirmar\)/i,
      );
    }

    // Y cada proyecto aparece en exactamente un grupo.
    const opciones = [
      ...screen.getByLabelText(/proyecto de interés/i).querySelectorAll("option"),
    ].filter((o) => (o as HTMLOptionElement).value);
    expect(opciones).toHaveLength(catalogo.length);
  });
});
