import { describe, it, expect } from "vitest";
import {
  listaParaPrompt,
  mensajeRecomendacionDeterminista,
  proyectosParaVerbalizar,
} from "./recomendacion";
import { promptRecomendacion } from "./prompt-maestro";
import { catalogo } from "@/lib/matching/catalogo";
import { curar } from "@/lib/curar";
import { frasesDe, MAX_FRASES, MAX_LINEAS, postGuard } from "./guardas";
import * as leads from "@/lib/fixtures/leads";

// =====================================================================
// La recomendación verbalizada. Lo que se prueba es que la lista sea
// CERRADA y que el veredicto no se filtre — no la redacción, que la
// mira una persona.
// =====================================================================

describe("la lista sale del motor, no del modelo", () => {
  it("los tres personajes listos traen proyectos, y todos son del catálogo", () => {
    for (const lead of [leads.afiliadoListo, leads.noAfiliadoListo]) {
      const proyectos = proyectosParaVerbalizar(lead);
      expect(proyectos.length).toBeGreaterThan(0);

      for (const p of proyectos) {
        expect(catalogo.some((f) => f.nombre === p.nombre)).toBe(true);
      }
    }
  });

  it("es exactamente lo que eligió `curar()`, en el mismo orden", () => {
    // Si esto se desincroniza, Sara le nombra al lead unos proyectos y el
    // asesor recibe otros en la ficha.
    const delMotor = curar(leads.afiliadoListo).proyectos;
    const paraDecir = proyectosParaVerbalizar(leads.afiliadoListo);

    expect(paraDecir.map((p) => p.nombre)).toEqual(delMotor.map((p) => p.nombre));
    expect(paraDecir.map((p) => p.porque)).toEqual(delMotor.map((p) => p.porque));
  });

  it("en nutrición devuelve vacío: no se recomienda lo que no puede pagar", () => {
    expect(proyectosParaVerbalizar(leads.nutricion)).toEqual([]);
  });

  it("el porqué que se dice es el que el matcher calculó, citable tal cual", () => {
    for (const p of proyectosParaVerbalizar(leads.afiliadoListo)) {
      expect(p.porque.trim()).toBeTruthy();
    }
  });
});

describe("el prompt no le deja al modelo forma de nombrar otra cosa", () => {
  const proyectos = proyectosParaVerbalizar(leads.afiliadoListo);
  const prompt = promptRecomendacion({ listaCerrada: listaParaPrompt(proyectos) });

  it("trae los proyectos elegidos con su precio y su porqué", () => {
    for (const p of proyectos) {
      expect(prompt).toContain(p.nombre);
      expect(prompt).toContain(p.porque);
    }
  });

  it("declara la lista como la única fuente de nombres", () => {
    expect(prompt).toMatch(/Solo puedes nombrar los proyectos de esta lista/i);
    expect(prompt).toMatch(/Ningún otro nombre existe/i);
  });

  it("NO trae el catálogo completo: nombrar los otros 15 sería recomendarlos", () => {
    const noElegidos = catalogo.filter((f) => !proyectos.some((p) => p.nombre === f.nombre));
    expect(noElegidos.length).toBeGreaterThan(0);
    for (const ficha of noElegidos) {
      expect(prompt, `${ficha.nombre} no debería estar en el prompt`).not.toContain(
        ficha.nombre,
      );
    }
  });

  it("no le pasa el puntaje ni la salida (spec 02 D2)", () => {
    expect(prompt).not.toMatch(/listo_restriccion_cupo|nutricion|puntaje \d/);
    expect(prompt).toMatch(/NUNCA menciones puntajes/i);
  });

  it("le prohíbe recitarle sus datos y le impone el 'desde'", () => {
    expect(prompt).toMatch(/NUNCA le recites sus propios datos/i);
    expect(prompt).toMatch(/Un precio es "desde"/i);
  });

  it("le pide 2 o 3 frases, que es lo que el guard tolera", () => {
    expect(prompt).toMatch(/2 o 3 frases/i);
  });
});

describe("el mensaje sin IA — el que se pinta si Gemini no responde", () => {
  it("nombra los proyectos elegidos con su precio 'desde'", () => {
    const proyectos = proyectosParaVerbalizar(leads.afiliadoListo);
    const mensaje = mensajeRecomendacionDeterminista(proyectos)!;

    for (const p of proyectos) {
      expect(mensaje).toContain(p.nombre);
    }
    expect(mensaje).toMatch(/desde \$/);
  });

  it("sin proyectos no dice nada: null, no una frase vacía", () => {
    expect(mensajeRecomendacionDeterminista([])).toBeNull();
    expect(mensajeRecomendacionDeterminista(proyectosParaVerbalizar(leads.nutricion))).toBeNull();
  });

  it("cabe en lo que el guard de la rama 3 tolera, sin truncarse", () => {
    // Si el fallback se pasara del tope, el guard le cortaría el final a un
    // texto que escribimos nosotros. Ya pasó una vez con `mensajeReenganche`.
    for (const lead of [leads.afiliadoListo, leads.noAfiliadoListo]) {
      const mensaje = mensajeRecomendacionDeterminista(proyectosParaVerbalizar(lead))!;
      expect(mensaje.split("\n").length).toBeLessThanOrEqual(MAX_LINEAS);
      expect(frasesDe(mensaje).length).toBeLessThanOrEqual(MAX_FRASES);
      expect(postGuard(mensaje, mensaje).severidad).toBe("ok");
    }
  });

  it("concuerda en singular y en plural", () => {
    const uno = mensajeRecomendacionDeterminista([
      { nombre: "ARAUCARIA", ciudad: "Bogotá", precio_desde: 200_000_000, vis: false, porque: "x" },
    ])!;
    expect(uno).toContain("este es el que te sirve");
    // Concordancia completa, no solo el encabezado: con un proyecto, "cada uno"
    // y "te los escogí" son errores que el lead lee.
    expect(uno).toContain("Te lo escogí");
    expect(uno).toContain("te cabe en el presupuesto");
    expect(uno).not.toMatch(/cada uno|te los escogí|todos te caben/);

    const dos = mensajeRecomendacionDeterminista([
      { nombre: "ARAUCARIA", ciudad: "Bogotá", precio_desde: 200_000_000, vis: false, porque: "x" },
      { nombre: "PAYANDÉ", ciudad: "Bogotá", precio_desde: 180_000_000, vis: true, porque: "y" },
    ])!;
    expect(dos).toContain("estos son los que te sirven");
    expect(dos).toMatch(/ARAUCARIA \(desde \$[\d.]+\) y PAYANDÉ/);
    expect(dos).toContain("Te los escogí");
    expect(dos).not.toMatch(/\bte lo escogí\b|te cabe en el presupuesto/);
  });

  // §7 punto 16, ratificado el 2026-07-26. Este es el mensaje que ve el lead
  // cuando el LLM no responde —el camino más probable en una demo— y antes
  // nombraba tres proyectos sin dar una sola razón. La restricción de cero caja
  // negra dice que la explicación pesa tanto como la recomendación.
  it("da una razón, no solo nombres", () => {
    const mensaje = mensajeRecomendacionDeterminista([
      { nombre: "ARAUCARIA", ciudad: "Bogotá", precio_desde: 200_000_000, vis: false, porque: "x" },
      { nombre: "PAYANDÉ", ciudad: "Bogotá", precio_desde: 180_000_000, vis: true, porque: "y" },
    ])!;
    expect(mensaje).toMatch(/porque/i);
    // El único hecho cierto para TODOS por construcción: pasaron el filtro de
    // precio. La zona no se promete: alguno pudo entrar fuera de zona.
    expect(mensaje).toMatch(/presupuesto/i);
    expect(mensaje).not.toMatch(/tu ciudad|tu zona/i);
  });
});
