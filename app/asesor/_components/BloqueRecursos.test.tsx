import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BloqueRecursos } from "./BloqueRecursos";
import { ETIQUETA_FACTOR } from "./TablaFactores";
import { curar } from "@/lib/curar";
import { recursosPara } from "@/lib/recursos";
import { calcularScore } from "@/lib/scoring";
import { proyectoInari } from "@/lib/fixtures/proyectos";
import { afiliadoListo, noAfiliadoListo, nutricion } from "@/lib/fixtures/leads";
import type { Lead } from "@/lib/types";

describe("BloqueRecursos — capa ortogonal en la ficha del asesor", () => {
  it("un listo (Carlos) muestra su recurso: la ortogonalidad se ve en la ficha", () => {
    const carlos = curar(noAfiliadoListo);
    expect(carlos.score.salida).not.toBe("nutricion");
    render(<BloqueRecursos recursos={carlos.recursos} />);
    expect(screen.getAllByTestId("recurso").length).toBe(carlos.recursos!.length);
    // Cita el factor que lo disparó, con etiqueta legible (cero caja negra).
    expect(
      screen.getByText(`Disparado por: ${ETIQUETA_FACTOR["afiliacion"]}`),
    ).toBeInTheDocument();
  });

  it("un lead sin recursos (Diana) no renderiza el bloque", () => {
    const diana = curar(afiliadoListo);
    expect(diana.recursos ?? []).toHaveLength(0);
    const { container } = render(<BloqueRecursos recursos={diana.recursos} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/Recursos para el lead/)).not.toBeInTheDocument();
  });

  // La FECHA temporal (Q3) llega hasta la ficha del asesor. Sin este test podría
  // desaparecer en un refactor —de index.ts o de este bloque— sin que nadie se
  // entere, y como Q3 la sacó de trigger_nutricion, no viviría en ningún lado.
  it("el recurso de afiliación MUESTRA la fecha de elegibilidad en la ficha", () => {
    const lead: Lead = {
      ...noAfiliadoListo,
      respuestas: { ...noAfiliadoListo.respuestas, ingreso_hogar_mensual: 8_000_000 },
    };
    const hoy = new Date("2026-07-25T10:00:00-05:00"); // fecha fija → determinista
    const recursos = recursosPara(lead, calcularScore(lead, proyectoInari), hoy);
    render(<BloqueRecursos recursos={recursos} />);
    // 25 de julio + 6 meses = 25 de enero de 2027, visible en el DOM del bloque.
    expect(screen.getByText(/alrededor del 25 de enero de 2027/)).toBeInTheDocument();
    expect(screen.getByText(/6 meses continuos/)).toBeInTheDocument();
  });

  it("un recurso externo se rotula en TEXTO 'Aliado externo' (color no es el único portador)", () => {
    const yuliana = curar(nutricion);
    const tieneExterno = yuliana.recursos!.some((r) => r.tipo === "aliado_externo");
    expect(tieneExterno).toBe(true);
    render(<BloqueRecursos recursos={yuliana.recursos} />);
    expect(screen.getByTestId("recurso-externo")).toHaveTextContent(/aliado externo/i);
  });

  it("todo recurso mostrado trae su link", () => {
    const yuliana = curar(nutricion);
    render(<BloqueRecursos recursos={yuliana.recursos} />);
    for (const r of yuliana.recursos!) {
      const enlace = screen.getByText(r.url);
      expect(enlace).toHaveAttribute("href", r.url);
    }
  });
});
