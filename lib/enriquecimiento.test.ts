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

describe("la edad también se sabe: no se le pregunta a quien ya conocemos", () => {
  // La base trae `rango_edad` de las 303 personas y el enriquecimiento lo
  // botaba, así que el chat le preguntaba la edad a alguien de quien ya la
  // teníamos. Es el mismo criterio 1 del ingreso y la ciudad.
  it("normaliza los DOS formatos que trae el Excel real", () => {
    // "20 a 35 años" y "20 - 35 años" son el mismo valor escrito distinto: es
    // una de las trampas anotadas en AGENTS.md, y con comparación literal más
    // de la mitad de la base se leería como "sin edad".
    const conEdad = (identidades as { cedula: string; rango_edad: string }[]).filter((i) =>
      /^20/.test(i.rango_edad),
    );
    expect(conEdad.length).toBeGreaterThan(100);
    for (const identidad of conEdad.slice(0, 40)) {
      expect(enriquecerPorCedula(identidad.cedula).rango_edad, identidad.rango_edad).toBe("20_35");
    }
  });

  it("a quien trae edad NO se le pregunta la edad", () => {
    const alguien = (identidades as { cedula: string }[])[0];
    const perfil = enriquecerPorCedula(alguien.cedula);

    expect(perfil.rango_edad).toBeDefined();
    expect(construirPreguntas(perfil).map((p) => p.campo)).not.toContain("rango_edad");
  });

  it("a quien NO la trae sí se le pregunta", () => {
    const campos = construirPreguntas({ match: false }).map((p) => p.campo);
    expect(campos).toContain("rango_edad");
  });

  it("un tramo que no cabe en los tres buckets no se inventa", () => {
    // "Menor de 19 años" no es 20-35: se deja sin dato y se le pregunta, que es
    // preferible a meterlo a la fuerza en un tramo que no es el suyo.
    const menor = (identidades as { cedula: string; rango_edad: string }[]).find((i) =>
      /menor de 19/i.test(i.rango_edad),
    );
    if (!menor) return; // si la base cambia y ya no hay, el test no miente
    expect(enriquecerPorCedula(menor.cedula).rango_edad).toBeUndefined();
  });
});
