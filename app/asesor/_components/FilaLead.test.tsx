import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FilaLead } from "./FilaLead";
import { FichaLead } from "./FichaLead";
import { conteoFactores, type LeadEnCola } from "@/lib/types-asesor";
import { leadsCurados } from "@/lib/fixtures";
import type { LeadCurado } from "@/lib/types";

// =====================================================================
// El renglón de la bandeja y su coherencia con la ficha.
//
// El defecto que este archivo fija: la ficha contaba solo los factores
// evaluables ("4 de 4") y el renglón los contaba todos ("7/7"), así que
// el mismo lead mostraba dos números distintos según dónde se mirara.
// =====================================================================

const personajes = Object.entries(leadsCurados) as [string, LeadCurado][];

function enCola(curado: LeadCurado): LeadEnCola {
  return {
    curado,
    re_enganchado_en: null,
    creado_en: "2026-07-23T14:00:00-05:00",
  };
}

describe("el conteo de factores dice lo mismo en la lista y en la ficha", () => {
  it.each(personajes)("%s: mismo numerador y denominador en las dos pantallas", (_n, curado) => {
    const { cumplen, total } = conteoFactores(curado.score.factores);

    render(<FilaLead item={enCola(curado)} />);
    expect(screen.getByText(`${cumplen}/${total}`)).toBeInTheDocument();
    cleanup();

    render(<FichaLead item={enCola(curado)} />);
    expect(screen.getByText(`${cumplen} de ${total}`)).toBeInTheDocument();
  });

  it("los factores informativos no inflan el conteo", () => {
    const curado = leadsCurados.afiliadoListo;
    const informativos = curado.score.factores.filter((f) => f.informativo).length;

    expect(informativos, "el personaje ya no trae factores informativos").toBeGreaterThan(0);
    expect(conteoFactores(curado.score.factores).total).toBe(
      curado.score.factores.length - informativos,
    );
  });
});

describe("el renglón trae lo mínimo para decidir a quién llamar", () => {
  it("en nutrición muestra la regla que falló, no la explicación", () => {
    const { nutricion } = leadsCurados;
    render(<FilaLead item={enCola(nutricion)} />);
    expect(screen.getByText(nutricion.score.regla_fallida!)).toBeInTheDocument();
  });
});
