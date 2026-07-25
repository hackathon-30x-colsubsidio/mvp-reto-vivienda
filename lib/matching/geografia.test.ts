import { describe, expect, it } from "vitest";
import { coincideBarrio, coincideCiudad, coincideZona, normalizarZona } from "./geografia";
import type { FichaProyecto } from "./tipos";

// El bug que motivó este módulo: el chat guarda el texto crudo ("Bogotá, por
// el sur") y el matcher comparaba con ===, así que un bogotano no matcheaba
// NADA en Bogotá y el fallback lo mandaba a Girardot en silencio.

const fichaDe = (ciudad: string, zona?: string): FichaProyecto => ({
  proyecto_id: "p-test",
  nombre: "Proyecto de Prueba",
  ciudad,
  zona,
  precio_desde: 150_000_000,
  vis: true,
  cupo_no_afiliados: { usado: 0, total: 10 },
});

describe("normalizarZona", () => {
  it("minúsculas, sin tildes, sin espacios sobrantes", () => {
    expect(normalizarZona("  BOGOTÁ ")).toBe("bogota");
    expect(normalizarZona("Maiporé")).toBe("maipore");
  });
});

describe("coincideZona — lo que la gente escribe de verdad", () => {
  const bogota = fichaDe("Bogotá", "Ciudadela Calle 80");

  it("'Bogotá, por el norte' encuentra Bogotá (el caso del guion de Yuliana)", () => {
    expect(coincideZona(bogota, "Bogotá, por el sur")).toBe(true);
    expect(coincideZona(bogota, "bogota, por el norte")).toBe(true);
  });

  it("nombrar el sector cuenta como barrio, más fino que la ciudad", () => {
    expect(coincideBarrio(bogota, "por la calle 80")).toBe(true);
    expect(coincideBarrio(bogota, "Bogotá")).toBe(false);
    expect(coincideCiudad(bogota, "Bogotá")).toBe(true);
  });

  it("'Ricaurte o Bogotá' (ciudad ambigua del catálogo real) matchea ambas", () => {
    const ambigua = fichaDe("Ricaurte o Bogotá");
    expect(coincideZona(ambigua, "vivo en Bogotá")).toBe(true);
    expect(coincideZona(ambigua, "Ricaurte")).toBe(true);
    expect(coincideZona(ambigua, "Girardot")).toBe(false);
  });

  it("las palabras que no localizan no matchean solas", () => {
    // "una ciudadela" no puede matchear las dos Ciudadelas del catálogo a la vez.
    expect(coincideZona(bogota, "una ciudadela")).toBe(false);
    expect(coincideZona(bogota, "por el norte")).toBe(false);
    expect(coincideZona(bogota, undefined)).toBe(false);
  });

  it("otra ciudad no matchea", () => {
    expect(coincideZona(bogota, "Medellín")).toBe(false);
  });
});
