import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  CAMPOS_IA,
  entradaInterprete,
  esquemaJSONDe,
  promptInterprete,
  validarInterpretacion,
} from "./interprete-ia";
import { INTERPRETACION_POR_CAMPO } from "./acciones";
import { INTERPRETES, type CampoInterpretable } from "./interpretacion";
import {
  INGRESO_MAXIMO_PLAUSIBLE,
  INGRESO_MINIMO_PLAUSIBLE,
} from "./interpretacion/ingreso";

// =====================================================================
// El intérprete de respaldo. Sin red: lo que se prueba es el BORDE —
// qué se le pide al modelo y qué se acepta de vuelta. Que Gemini
// clasifique bien no lo puede afirmar un test unitario; que una
// respuesta inventada NO entre al motor, sí.
// =====================================================================

describe("qué campos puede interpretar la IA", () => {
  it("son exactamente los que pueden fallar: los de INTERPRETES", () => {
    // Si la rama 2 agrega un intérprete, este test obliga a que la IA también
    // sepa reintentarlo, en vez de dejarlo mudo para siempre.
    expect([...CAMPOS_IA].sort()).toEqual(Object.keys(INTERPRETES).sort());
  });

  it("la zona NO está: su intérprete nunca falla, así que no hay qué reintentar", () => {
    expect(CAMPOS_IA).not.toContain("zona_interes");
  });
});

describe("el prompt le da al modelo el mismo menú que produce el regex", () => {
  it.each(CAMPOS_IA)("%s: toda opción del enum aparece descrita en el prompt", (campo) => {
    const schema = INTERPRETACION_POR_CAMPO[campo];
    // Solo los enums tienen opciones cerradas que describir; los demás campos
    // (número, booleano, lista) se explican en prosa.
    if (!(schema instanceof z.ZodEnum)) return;

    const prompt = promptInterprete(campo);
    for (const opcion of Object.values(schema.enum)) {
      expect(prompt, `falta describir "${opcion}" en ${campo}`).toContain(String(opcion));
    }
  });

  it("pide null en voz alta: es la regla que evita el peor bug del repo", () => {
    // `"no sé"` → `tiene_vivienda: false` es una AFIRMACIÓN FALSA que habilita
    // los subsidios de primera vivienda. La IA no puede repetir ese pecado.
    const prompt = promptInterprete("tiene_vivienda");
    expect(prompt).toMatch(/devuelve null/i);
    expect(prompt).toMatch(/"No sé"[\s\S]*son null/i);
  });

  it("le prohíbe conversar: clasifica y ya", () => {
    const prompt = promptInterprete("composicion_familiar");
    expect(prompt).toMatch(/NO conversas/);
    expect(prompt).toMatch(/NO haces preguntas/);
  });

  it("al ingreso le prohíbe adivinar el orden de magnitud", () => {
    expect(promptInterprete("rango_ingreso_hogar")).toMatch(
      /Nunca adivines el orden de magnitud/i,
    );
  });
});

describe("la entrada del modelo es UN mensaje, nunca el historial", () => {
  it("lleva el texto del turno y, si se le pasa, la pregunta que se hizo", () => {
    const entrada = entradaInterprete("vivo con mi mamá y mi hermana", "¿Con quién vas a vivir?");
    expect(entrada).toContain("vivo con mi mamá y mi hermana");
    expect(entrada).toContain("¿Con quién vas a vivir?");
  });

  it("sin pregunta sigue siendo válida: el menú del campo alcanza", () => {
    expect(entradaInterprete("2 palos")).toContain("2 palos");
  });

  it("no hay forma de colarle turnos anteriores: solo recibe dos strings", () => {
    // La firma es la garantía. Si alguien le agrega un parámetro de historial,
    // este test no compila y la decisión vuelve a la mesa.
    const entrada = entradaInterprete("no sé");
    expect(entrada.split("\n")).toHaveLength(1);
  });
});

describe("el esquema que recibe el modelo sale del MISMO zod que valida después", () => {
  it.each(CAMPOS_IA)("%s: es un objeto con `valor` nullable", (campo) => {
    const esquema = esquemaJSONDe(campo) as {
      type: string;
      properties: Record<string, unknown>;
    };
    expect(esquema.type).toBe("object");
    expect(esquema.properties).toHaveProperty("valor");
  });
});

describe("validarInterpretacion — el borde de confianza", () => {
  it("acepta un valor del menú", () => {
    expect(validarInterpretacion("composicion_familiar", { valor: "monoparental" })).toBe(
      "monoparental",
    );
    expect(validarInterpretacion("rango_edad", { valor: "36_45" })).toBe("36_45");
    expect(validarInterpretacion("tiene_vivienda", { valor: false })).toBe(false);
  });

  it("RECHAZA una categoría inventada, aunque suene razonable", () => {
    // El caso que motiva toda la capa de validación: el modelo devuelve algo
    // plausible que el motor no sabe puntuar.
    expect(
      validarInterpretacion("composicion_familiar", { valor: "familia_extendida" }),
    ).toBeUndefined();
    expect(validarInterpretacion("rango_edad", { valor: "18_25" })).toBeUndefined();
    expect(
      validarInterpretacion("situacion_crediticia", { valor: "más o menos" }),
    ).toBeUndefined();
  });

  it("null es una respuesta válida del modelo y se traduce a `undefined`", () => {
    // `undefined` es lo mismo que ya devolvía el regex: la conversación repregunta.
    expect(validarInterpretacion("composicion_familiar", { valor: null })).toBeUndefined();
  });

  it("rechaza basura estructural sin lanzar", () => {
    for (const basura of [null, undefined, {}, { otro: 1 }, "monoparental", []]) {
      expect(validarInterpretacion("composicion_familiar", basura)).toBeUndefined();
    }
  });

  describe("el ingreso pasa por DOS puertas, no una", () => {
    it("un monto plausible entra", () => {
      expect(validarInterpretacion("rango_ingreso_hogar", { valor: 4_500_000 })).toBe(
        4_500_000,
      );
    });

    it("zod lo deja pasar por ser número, y plausible() lo frena igual", () => {
      // 42 es un entero positivo: para zod es válido. Pero nadie compra
      // vivienda con $42 al mes, y de este número sale el gate del 40%.
      expect(
        validarInterpretacion("rango_ingreso_hogar", { valor: 42 }),
      ).toBeUndefined();
      expect(
        validarInterpretacion("rango_ingreso_hogar", {
          valor: INGRESO_MINIMO_PLAUSIBLE - 1,
        }),
      ).toBeUndefined();
      expect(
        validarInterpretacion("rango_ingreso_hogar", {
          valor: INGRESO_MAXIMO_PLAUSIBLE + 1,
        }),
      ).toBeUndefined();
    });

    it("los bordes exactos del rango sí entran", () => {
      expect(
        validarInterpretacion("rango_ingreso_hogar", { valor: INGRESO_MINIMO_PLAUSIBLE }),
      ).toBe(INGRESO_MINIMO_PLAUSIBLE);
      expect(
        validarInterpretacion("rango_ingreso_hogar", { valor: INGRESO_MAXIMO_PLAUSIBLE }),
      ).toBe(INGRESO_MAXIMO_PLAUSIBLE);
    });
  });

  it("lo que la IA devuelve es del mismo tipo que devuelve el regex", () => {
    // La prueba de que el enum es literalmente uno solo: se toma lo que produjo
    // el regex y se valida como si viniera del modelo.
    const casos: [CampoInterpretable, string][] = [
      ["composicion_familiar", "vivo con mi esposa"],
      ["rango_edad", "tengo 29"],
      ["situacion_crediticia", "estoy al día"],
      ["tiene_vivienda", "vivo en arriendo"],
    ];

    for (const [campo, texto] of casos) {
      const delRegex = INTERPRETES[campo](texto);
      expect(delRegex, `el regex no entendió "${texto}"`).toBeDefined();
      expect(validarInterpretacion(campo, { valor: delRegex })).toEqual(delRegex);
    }
  });
});
