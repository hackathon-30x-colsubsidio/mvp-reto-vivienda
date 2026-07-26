import { describe, expect, it } from "vitest";
import {
  amenidadesEnTexto,
  aplicarRespuestaBanco,
  BANCO,
  bancoDisponible,
  IDS_BANCO,
  interpretarAlcobas,
  interpretarAmenidades,
  interpretarEspacio,
  interpretarMomento,
  MAX_PREGUNTAS_BANCO,
  preguntaDelBanco,
} from "./banco-preguntas";
import type { Lead } from "@/lib/types";

// =====================================================================
// El banco tiene que cumplir DOS cosas que ningún linter chequea:
//
//   1. las reglas de redacción del encabezado de `preguntas.ts` — el
//      chat no es un formulario y es fácil volverlo uno sin querer;
//   2. que el chip y el texto libre produzcan el MISMO dato. Es lo que
//      permite que `replayGuion` siga sirviendo cuando el banco entre.
//
// Lo que este archivo NO puede probar es el tono. Eso lo cuida quien
// escribe, y el copy está marcado como propuesta sin ratificar.
// =====================================================================

const SIN_RESPONDER: Lead["respuestas"] = {
  consentimiento: { otorgado: true, timestamp: "2026-07-25T10:00:00.000Z" },
};

describe("las reglas de redacción de preguntas.ts", () => {
  it.each(BANCO)("$id: dice para qué sirve antes de preguntar", (p) => {
    // La marca de "para qué": una subordinada explicativa antes del signo.
    expect(p.pregunta).toMatch(/porque|para que|te lo pregunto|con eso|es para|es por/i);
  });

  // Ojo: NO se exige que cierre con "?". Las de `preguntas.ts` tampoco lo hacen
  // —la del ingreso termina en "Un aproximado me sirve."— y esa coda es
  // justamente lo que baja la guardia de quien va a contestar algo incómodo.
  it.each(BANCO)("$id: hay una pregunta de verdad, con sus dos signos", (p) => {
    expect(p.pregunta).toMatch(/¿[^?]+\?/);
  });

  it.each(BANCO)("$id: acepta texto libre — el campo nunca desaparece", (p) => {
    expect(p.placeholder).toBeTruthy();
    expect(typeof p.interpretarTexto).toBe("function");
  });

  it.each(BANCO)("$id: cada chip trae su acuse", (p) => {
    expect(p.opciones?.length).toBeGreaterThan(1);
    for (const opcion of p.opciones ?? []) {
      expect(opcion.etiqueta, `${p.id} sin etiqueta`).toBeTruthy();
      expect(opcion.acuse, `${p.id}/${opcion.etiqueta} sin acuse`).toBeTruthy();
    }
  });

  it.each(BANCO)("$id: nada de jerga interna", (p) => {
    const todo = [p.pregunta, ...(p.opciones ?? []).map((o) => o.acuse ?? "")].join(" ");
    expect(todo).not.toMatch(/perfilamiento|scoring|SMMLV|puntaje|lead\b|matcher/i);
  });
});

describe("el chip y el texto libre valen lo mismo", () => {
  it.each([
    ["Una", "con una nos alcanza", { alcobas_deseadas: 1 }],
    ["Dos", "dos alcobas", { alcobas_deseadas: 2 }],
    ["Tres o más", "necesito 3", { alcobas_deseadas: 3 }],
  ])("alcobas · %s ≡ %s", (etiqueta, texto, patch) => {
    const chip = BANCO[0].opciones!.find((o) => o.etiqueta === etiqueta)!;
    expect(chip.patch).toEqual(patch);
    expect(interpretarAlcobas(texto).patch).toEqual(patch);
    // Y el acuse también es el mismo: tocar o escribir no cambia lo que oye.
    expect(interpretarAlcobas(texto).acuse).toBe(chip.acuse);
  });

  it("amenidades · el chip de mascotas ≡ escribirlo", () => {
    const chip = BANCO[1].opciones!.find((o) => o.etiqueta === "Que acepten mascotas")!;
    expect(interpretarAmenidades("que reciban perros").patch).toEqual(chip.patch);
  });

  it("momento · el chip de explorando ≡ escribirlo", () => {
    const chip = BANCO[3].opciones!.find((o) => o.etiqueta === "Todavía estoy mirando")!;
    expect(interpretarMomento("apenas estoy mirando").patch).toEqual(chip.patch);
  });
});

describe("ningún intérprete se queda mudo (hueco 2 del plan)", () => {
  it.each([
    ["alcobas", interpretarAlcobas, "las que sean, con tal de que haya luz"],
    ["amenidades", interpretarAmenidades, "que sea bonito"],
    ["espacio", interpretarEspacio, "me da igual"],
    ["momento", interpretarMomento, "depende del banco"],
  ])("%s: lo que no se entiende queda crudo en preferencias_libres", (_id, fn, texto) => {
    const r = fn(texto);
    expect(r.patch.preferencias_libres).toEqual([texto]);
    expect(r.acuse, "y siempre hay acuse: nadie contesta al vacío").toBeTruthy();
  });
});

describe("interpretar el texto de la gente", () => {
  it.each([
    ["prefiero algo pequeño pero bien ubicado", "compacto"],
    ["más amplio, aunque quede más lejos", "amplio"],
    ["que quepamos todos", "amplio"],
    ["compacto", "compacto"],
  ])("espacio · %s", (texto, esperado) => {
    expect(interpretarEspacio(texto).patch.espacio_preferido).toBe(esperado);
  });

  it.each([
    ["lo antes posible", "inmediato"],
    ["ya estoy mirando, sin afán", "explorando"],
    ["este año si se puede", "este_ano"],
    ["en unos meses", "este_ano"],
  ])("momento · %s", (texto, esperado) => {
    expect(interpretarMomento(texto).patch.momento_compra).toBe(esperado);
  });

  it("las amenidades salen del texto tal como la gente lo escribe", () => {
    expect(amenidadesEnTexto("que tenga gimnasio y zona para el perro")).toEqual([
      "mascotas",
      "gimnasio",
    ]);
    expect(amenidadesEnTexto("un lugar donde pueda teletrabajar")).toEqual(["coworking"]);
    expect(amenidadesEnTexto("con piscina")).toEqual(["deporte"]);
  });

  it("varias amenidades en una sola frase se guardan todas", () => {
    const r = interpretarAmenidades("gimnasio, piscina y que acepten mascotas");
    expect(r.patch.amenidades_interes).toEqual(["mascotas", "gimnasio", "deporte"]);
  });
});

describe("el contrato con el selector de la rama 4", () => {
  it("los ids son únicos y estables: el LLM escoge de aquí", () => {
    expect(new Set(IDS_BANCO).size).toBe(BANCO.length);
    expect(IDS_BANCO).toEqual(["alcobas", "amenidades", "espacio", "momento"]);
  });

  it("un id inventado no devuelve pregunta — la capa no se activa", () => {
    expect(preguntaDelBanco("presupuesto_maximo")).toBeUndefined();
    expect(preguntaDelBanco("alcobas")).toBeDefined();
  });

  it("solo se ofrece lo que falta: la versión banco del criterio 1", () => {
    expect(bancoDisponible(SIN_RESPONDER)).toHaveLength(4);
    const conAlgo = { ...SIN_RESPONDER, alcobas_deseadas: 2 as const };
    expect(bancoDisponible(conAlgo).map((p) => p.id)).not.toContain("alcobas");
  });

  it("cada pregunta le dice al selector para qué sirve, y si matchea o no", () => {
    for (const p of BANCO) expect(p.paraQueSirve.length).toBeGreaterThan(40);
    // `momento` es señal comercial: `estado` solo se conoce en 7 de 18 proyectos.
    expect(BANCO.filter((p) => p.matchea).map((p) => p.id)).toEqual([
      "alcobas",
      "amenidades",
      "espacio",
    ]);
  });

  it("máximo 2 por conversación (decisión cerrada del §3)", () => {
    expect(MAX_PREGUNTAS_BANCO).toBe(2);
  });
});

describe("aplicarRespuestaBanco no pierde el texto crudo de la primera", () => {
  it("acumula preferencias_libres en vez de reemplazarlas", () => {
    const uno = aplicarRespuestaBanco(SIN_RESPONDER, interpretarEspacio("me da igual").patch);
    const dos = aplicarRespuestaBanco(uno, interpretarAmenidades("que sea bonito").patch);
    expect(dos.preferencias_libres).toEqual(["me da igual", "que sea bonito"]);
  });

  it("un patch normal sigue comportándose como siempre", () => {
    const r = aplicarRespuestaBanco(SIN_RESPONDER, { alcobas_deseadas: 2 });
    expect(r.alcobas_deseadas).toBe(2);
    expect(r.preferencias_libres).toBeUndefined();
    expect(r.consentimiento).toEqual(SIN_RESPONDER.consentimiento);
  });
});
