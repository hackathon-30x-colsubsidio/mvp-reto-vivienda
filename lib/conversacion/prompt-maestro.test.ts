import { describe, it, expect } from "vitest";
import { PROMPT_TONO, promptDuda } from "./prompt-maestro";
import {
  SUBSIDIOS_GROUNDING,
  MARCO_CREDITO,
  tablaSubsidiosParaPrompt,
} from "./subsidios";
import { catalogo } from "@/lib/matching/catalogo";
import { pesos } from "@/lib/formato";

// =====================================================================
// El prompt maestro. Los tests no juzgan la redacción —eso lo mira una
// persona— sino las reglas que no se pueden perder en una edición:
// que el tono siga siendo el que se afinó, que el agente no recomiende,
// que no vea el puntaje, y que ninguna cifra sin fuente se cuele.
// =====================================================================

describe("modo tono — sigue siendo el prompt que se afinó el 2026-07-24", () => {
  it("conserva las reglas duras que impiden que el LLM conduzca", () => {
    // Si alguna de estas desaparece, el LLM puede inventar preguntas o
    // reordenar el perfilamiento — que es justo lo que la decisión 1 cerró.
    expect(PROMPT_TONO).toContain("NUNCA inventes una pregunta nueva");
    expect(PROMPT_TONO).toContain("NUNCA cambies el orden");
    expect(PROMPT_TONO).toContain("NUNCA pidas un dato que el mensaje ya dice que se conoce");
  });

  it("mantiene la prohibición de recitarle al lead sus propios datos", () => {
    expect(PROMPT_TONO).toMatch(/NUNCA le recites al lead sus propios datos/i);
  });

  it("sigue siendo Sara y sigue sonando a WhatsApp, no a formulario", () => {
    expect(PROMPT_TONO).toContain("Eres Sara");
    expect(PROMPT_TONO).toContain("1-3 frases");
  });
});

describe("modo duda — lo que el agente puede y no puede hacer", () => {
  // El prompt va envuelto a ~100 caracteres para que sea legible en el editor,
  // así que las frases se parten en varias líneas. Se compara sobre una versión
  // con los saltos aplanados: lo que se protege es la regla, no dónde corta.
  const prompt = promptDuda({}).replace(/\s+/g, " ");

  it("le prohíbe recomendar: recomendar es del matcher determinista", () => {
    expect(prompt).toMatch(/NUNCA recomiendes un proyecto/i);
    expect(prompt).toMatch(/ni compares dos/i);
  });

  it("le prohíbe inventar cualquier dato que no esté en el contexto", () => {
    expect(prompt).toMatch(/NUNCA inventes un dato/i);
    expect(prompt).toMatch(/Si no está, no existe/i);
  });

  it("no le da acceso al puntaje ni al veredicto (spec 02 D2)", () => {
    expect(prompt).toMatch(/NUNCA menciones puntajes/i);
    // Y de hecho el contexto no los trae: no hay forma de que se le escapen.
    expect(prompt).not.toMatch(/salida:|listo_restriccion_cupo|nutricion/);
  });

  it("trae la política de 'no sé' explícita, como respuesta válida", () => {
    expect(prompt).toMatch(/prefiero no inventarte nada/i);
    expect(prompt).toMatch(/Nunca rellenes/i);
  });

  it("le dice que no siga el perfilamiento: de eso se encarga el sistema", () => {
    expect(prompt).toMatch(/No hagas preguntas nuevas/i);
    expect(prompt).toMatch(/el sistema retoma/i);
  });

  it("trae el catálogo completo para consultar, con precios reales", () => {
    for (const proyecto of catalogo) {
      expect(prompt).toContain(proyecto.nombre);
    }
    expect(prompt).toContain(pesos(catalogo[0].precio_desde));
  });

  it("el catálogo se declara como consulta, nunca como lista para recomendar", () => {
    expect(prompt).toMatch(/NO para recomendar/i);
  });

  it("cuando el lead entró por un proyecto, ese proyecto va aparte con su ficha", () => {
    const proyecto = catalogo[0];
    const conEntrada = promptDuda({ proyecto_interes: proyecto.nombre }).replace(
      /\s+/g,
      " ",
    );

    expect(conEntrada).toMatch(/EL PROYECTO POR EL QUE ESCRIBIÓ/);
    expect(conEntrada).toContain(proyecto.ciudad);
    // El precio "desde" nunca se puede presentar como el valor de la vivienda.
    expect(conEntrada).toMatch(/no un precio cerrado/i);
  });

  it("un proyecto que no existe en el catálogo no inventa una ficha", () => {
    const conBasura = promptDuda({ proyecto_interes: "TORRES DEL NO EXISTE" });
    expect(conBasura).not.toMatch(/EL PROYECTO POR EL QUE ESCRIBIÓ/);
    expect(conBasura).not.toContain("TORRES DEL NO EXISTE");
  });
});

describe("grounding de subsidios — cero cifras sin fuente citable", () => {
  it("toda entrada trae al menos una fuente con URL verificable", () => {
    for (const subsidio of SUBSIDIOS_GROUNDING) {
      expect(subsidio.fuentes.length, `${subsidio.id} sin fuentes`).toBeGreaterThan(0);
      for (const fuente of subsidio.fuentes) {
        expect(fuente.url).toMatch(/^https:\/\//);
        expect(fuente.titulo.trim()).toBeTruthy();
      }
    }
  });

  it("el subsidio de la caja NO trae monto: las fuentes se contradicen", () => {
    const caja = SUBSIDIOS_GROUNDING.find((s) => s.id === "caja-compensacion")!;
    expect(caja.estado).toBe("vigente");
    expect(caja.monto).toBeNull();
    expect(caja.nota).toMatch(/lo confirma el asesor/i);
  });

  it("Mi Casa Ya se declara apagado en 2026, y no se promete", () => {
    const miCasaYa = SUBSIDIOS_GROUNDING.find((s) => s.id === "mi-casa-ya")!;
    expect(miCasaYa.estado).toBe("sin_presupuesto_2026");
    expect(miCasaYa.monto).toBeNull();
  });

  it("la tabla que ve el agente no contiene ningún monto de subsidio", () => {
    const tabla = tablaSubsidiosParaPrompt();
    const sinMarcoLegal = tabla.split("Reglas del crédito")[0];

    // Ni pesos ni SMMLV: si aparece una cifra de plata aquí, alguien metió un
    // monto sin fuente y el agente se lo va a prometer a una persona real.
    expect(sinMarcoLegal).not.toMatch(/\$/);
    expect(sinMarcoLegal).not.toMatch(/SMMLV|salarios? mínimos?/i);
  });

  it("la norma del crédito SÍ se cita, porque su fuente es única e inequívoca", () => {
    const tabla = tablaSubsidiosParaPrompt();
    expect(tabla).toContain("Decreto 583 de 2025");
    expect(tabla).toMatch(/40% de los ingresos/);
    expect(MARCO_CREDITO.fuente.url).toMatch(/^https:\/\//);
  });
});
