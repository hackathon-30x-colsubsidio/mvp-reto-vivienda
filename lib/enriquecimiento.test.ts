import { describe, expect, it } from "vitest";
import { enriquecerPorCedula, TOTAL_IDENTIDADES } from "./enriquecimiento";
import { construirPreguntas } from "./conversacion/preguntas";
import * as leadsEvento from "./fixtures/leads-evento";
import identidades from "@/data/sintetica/identidades.json";

// Costura S1 del plan (ticket 003) + criterio de aceptación 1.
//
// Antes el enriquecimiento resolvía SOLO 3 cédulas fixture y cualquier otra daba
// `match: false`, así que el "soy yo" del jurado nunca veía el momento de "ya
// sabemos quién eres" — que es justo el criterio 1.

describe("enriquecimiento por cédula", () => {
  it("resuelve las 303 identidades sintéticas, no solo los 3 personajes", () => {
    expect(TOTAL_IDENTIDADES).toBeGreaterThan(300);
  });

  it("los 3 personajes canónicos conservan su perfil del demo", () => {
    expect(enriquecerPorCedula(leadsEvento.afiliadoListo.cedula).afiliado).toBe(true);
    expect(enriquecerPorCedula(leadsEvento.noAfiliadoListo.cedula).afiliado).toBe(false);
    expect(enriquecerPorCedula(leadsEvento.nutricion.cedula).match).toBe(false);
  });

  it("una cédula cualquiera de la base trae ciudad y afiliación", () => {
    const alguien = identidades[0] as { cedula: string; ciudad: string };
    const perfil = enriquecerPorCedula(alguien.cedula);

    expect(perfil.match).toBe(true);
    expect(perfil.ciudad).toBe(alguien.ciudad);
  });

  it("un rango de ingreso 'no disponible' NO se toma como rango", () => {
    // Si se colara, el chat dejaría de preguntar el ingreso y el motor se
    // quedaría sin el número del gate del 40% — el lead caería a nutrición
    // por un dato que nunca existió.
    const noAfiliado = (identidades as { cedula: string; rango_ingreso: string }[]).find(
      (i) => /no disponible/i.test(i.rango_ingreso),
    )!;
    const perfil = enriquecerPorCedula(noAfiliado.cedula);

    expect(perfil.rango_ingreso).toBeUndefined();
    expect(construirPreguntas(perfil).map((p) => p.campo)).toContain("rango_ingreso_hogar");
  });

  it("una cédula desconocida no es un error: se pregunta todo", () => {
    const perfil = enriquecerPorCedula("9999999999");
    expect(perfil).toEqual({ match: false });

    const campos = construirPreguntas(perfil).map((p) => p.campo);
    expect(campos).toContain("rango_ingreso_hogar");
    expect(campos).toContain("zona_interes");
  });

  it("criterio 1: a quien ya conocemos NO se le repregunta lo conocido", () => {
    const conocida = (identidades as { cedula: string; rango_ingreso: string }[]).find(
      (i) => !/no disponible/i.test(i.rango_ingreso),
    )!;
    const perfil = enriquecerPorCedula(conocida.cedula);
    const campos = construirPreguntas(perfil).map((p) => p.campo);

    // La intersección entre lo preguntado y lo enriquecido tiene que ser vacía.
    expect(campos).not.toContain("rango_ingreso_hogar");
    expect(campos).not.toContain("zona_interes");
  });
});
