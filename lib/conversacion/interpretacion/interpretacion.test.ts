import { describe, expect, it } from "vitest";
import { INTERPRETES } from "./index";
import { pareceCorreccion } from "./correccion";
import { interpretarVivienda } from "./vivienda";
import { interpretarComposicion } from "./composicion";
import { interpretarCrediticia } from "./crediticia";
import { interpretarEdad } from "./edad";
import { interpretarSubsidios } from "./subsidios";
import { clasificarZona } from "./zona";
import { plausible } from "./ingreso";
import { conversaciones } from "@/lib/fixtures/leads";

/** Lo que Diana, Carlos y Yuliana TECLEAN, sacado del hilo que se siembra. */
const TECLEADO_EN_EL_DEMO = Object.values(conversaciones).flatMap((c) =>
  c.hilo.filter((m) => m.rol === "lead").map((m) => m.mensaje),
);

// =====================================================================
// Los intérpretes, ahora que son funciones puras.
//
// Lo que este archivo cuida y `preguntas.test.ts` no puede: la frontera
// entre "entendí" y `undefined`. Es la frontera que el plan de
// arquitectura midió como hueco 2 — hasta ayer no existía, porque un
// `{patch:{}}` con acuse amable se ve igual que una respuesta buena.
// =====================================================================

describe("lo que se entiende, y sigue entendiéndose igual", () => {
  it.each([
    ["sería la primera", false],
    ["vivo en arriendo", false],
    ["No, sería la primera", false],
    ["ya tengo apartamento", true],
    ["la casa es mía", true],
  ])("vivienda: %s", (texto, esperado) => {
    expect(interpretarVivienda(texto)).toBe(esperado);
  });

  it.each([
    ["Con mi pareja", "pareja"],
    ["Con mi esposa y nuestros dos hijos", "familia_con_hijos"],
    ["Yo sola con mi hija", "monoparental"],
    ["solo yo", "solo"],
  ])("composición: %s", (texto, esperado) => {
    expect(interpretarComposicion(texto)).toBe(esperado);
  });

  it.each([
    ["Estoy al día con todo", "buena"],
    ["Al día, nunca me he atrasado", "buena"],
    ["Tuve una mora hace poco", "mala"],
    ["estoy saliendo de un reporte", "regular"],
    ["nunca he pedido crédito", "sin_info"],
  ])("crediticia: %s", (texto, esperado) => {
    expect(interpretarCrediticia(texto)).toBe(esperado);
  });

  it.each([
    ["38", "36_45"],
    ["Tengo 24 años", "20_35"],
    ["treinta", "20_35"],
    ["cuarenta y dos", "36_45"],
  ])("edad: %s", (texto, esperado) => {
    expect(interpretarEdad(texto)).toBe(esperado);
  });

  // ✅ ARREGLADO 2026-07-26. `^treinta\b` (que existe para el "treinta" pelado)
  // se comía "treinta y ocho" antes de que la segunda rama pudiera leerlo, así
  // que los 36-39 escritos en palabras caían en el tramo de abajo y movían la
  // similitud. El arreglo es el `(?! y)`.
  it("36-39 en palabras caen en su tramo, no en 20_35", () => {
    expect(interpretarEdad("treinta y seis")).toBe("36_45");
    expect(interpretarEdad("treinta y ocho")).toBe("36_45");
    // Y el "treinta" pelado, que es para lo que existe esa rama, no se movió.
    expect(interpretarEdad("treinta")).toBe("20_35");
    expect(interpretarEdad("treinta y cinco")).toBe("20_35");
  });

  // "Más de 45" es 46 en adelante. Escribir la etiqueta del chip tiene que
  // valer lo mismo que tocarlo (spec 02 D4); antes daba 36_45.
  it("'más de N' cuenta como N+1", () => {
    expect(interpretarEdad("Más de 45")).toBe("46_mas");
    expect(interpretarEdad("mas de 45")).toBe("46_mas");
    expect(interpretarEdad("más de 30")).toBe("20_35");
  });

  it("subsidios: la lista vacía es una respuesta, no un vacío", () => {
    expect(interpretarSubsidios("Ninguno")).toEqual([]);
    expect(interpretarSubsidios("no sé si aplico")).toEqual(["Por confirmar"]);
    expect(interpretarSubsidios("Mi Casa Ya")).toEqual(["Mi Casa Ya"]);
  });

  // ✅ ARREGLADO 2026-07-26 — las dos ramas que hablan de hijos no usaban el
  // mismo vocabulario, y por eso "niña" y "peques" caían en el cajón equivocado.
  it("composición: 'hijo' se nombra de muchas formas, y todas cuentan igual", () => {
    // "peques" faltaba: daba `pareja`, porque ganaba la rama de "señora".
    expect(interpretarComposicion("con mi señora y los peques")).toBe("familia_con_hijos");
    // La rama de monoparental exigía la raíz `hij`, que "niña" no tiene.
    expect(interpretarComposicion("me toca criar sola a mi niña")).toBe("monoparental");
    expect(interpretarComposicion("solo con mi peque")).toBe("monoparental");
  });

  it("composición: lo que ya funcionaba no se movió", () => {
    expect(interpretarComposicion("con mi señora")).toBe("pareja");
    expect(interpretarComposicion("solo yo")).toBe("solo");
    expect(interpretarComposicion("con mi esposa y los niños")).toBe("familia_con_hijos");
    expect(interpretarComposicion("yo con mis hijos")).toBe("monoparental");
    // "pequeño" habla del apartamento, no de un hijo: la `\b` de `peques?\b`
    // es lo que separa los dos casos.
    expect(interpretarComposicion("con mi señora, algo pequeño")).toBe("pareja");
  });

  // ✅ ARREGLADO 2026-07-26 — el peor de los seis.
  it("vivienda: decir que no se SABE no es decir que NO", () => {
    for (const duda of ["pues no sé", "no sé todavía", "no estoy seguro", "ni idea"]) {
      expect(interpretarVivienda(duda), duda).toBeUndefined();
    }
    // Negar de verdad sigue contando; si no, el arreglo se pasó de largo.
    for (const niega of ["no", "no tengo", "vivo en arriendo", "sería la primera"]) {
      expect(interpretarVivienda(niega), niega).toBe(false);
    }
    expect(interpretarVivienda("ya tengo casa")).toBe(true);
  });
});

describe("la frontera del `undefined`: lo que hoy se perdía en silencio", () => {
  // El caso que el plan de arquitectura midió: la persona cree que contestó.
  it("«vivo con mi mamá y mi hermana» no cae en ninguna categoría del hogar", () => {
    expect(interpretarComposicion("vivo con mi mamá y mi hermana")).toBeUndefined();
  });

  it.each([
    ["depende", "situacion_crediticia"],
    ["más o menos", "situacion_crediticia"],
  ])("crediticia: «%s» no se entiende, y ya no se disfraza de sin_info", (texto) => {
    expect(interpretarCrediticia(texto)).toBeUndefined();
  });

  it("una edad fuera del rango humano no pasa", () => {
    expect(interpretarEdad("tengo 8 años")).toBeUndefined();
    expect(interpretarEdad("como sea")).toBeUndefined();
  });

  it("un «q vale» en el paso de vivienda tampoco es un sí ni un no", () => {
    expect(interpretarVivienda("q vale")).toBeUndefined();
  });

  // ⚠️ `undefined` ≠ dato ausente: "sin_info" es una RESPUESTA (nunca he pedido
  // crédito) y hasta hoy los dos terminaban en el mismo patch.
  it("«nunca he pedido crédito» es un dato, no un no-entendí", () => {
    expect(interpretarCrediticia("nunca he pedido crédito")).toBe("sin_info");
    expect(interpretarCrediticia("bla bla")).toBeUndefined();
  });
});

describe("la zona devuelve POR QUÉ reconoció, no solo el dato", () => {
  it("una ciudad del catálogo trae su conteo de proyectos", () => {
    const z = clasificarZona("Bogotá, por el norte");
    expect(z).toMatchObject({ tipo: "ciudad_con_proyectos", zona: "Bogotá" });
    expect(z.tipo === "ciudad_con_proyectos" && z.cuantos).toBeGreaterThan(0);
  });

  it("una ciudad sin proyectos se distingue de una con proyectos", () => {
    expect(clasificarZona("quiero algo en Medellín")).toMatchObject({
      tipo: "ciudad_sin_proyectos",
      ciudad: "Medellín",
    });
  });

  it("un deseo no es un lugar, y el texto crudo se conserva", () => {
    expect(clasificarZona("cerca al colegio de los niños")).toEqual({
      tipo: "deseo",
      zona: "cerca al colegio de los niños",
    });
  });

  it("nunca se queda sin nada: lo que no reconoce lo guarda tal cual", () => {
    expect(clasificarZona("por allá arribita")).toEqual({
      tipo: "sin_reconocer",
      zona: "por allá arribita",
    });
  });
});

describe("el monto solo cuenta si alguien lo puede tener de verdad", () => {
  // Es el gate por el que pasa TODO monto, venga del regex o de la IA (rama 4).
  it("acepta lo plausible y rechaza lo absurdo", () => {
    expect(plausible(4_500_000)).toBe(4_500_000);
    expect(plausible(400_000)).toBeUndefined();
    expect(plausible(999_999_999_999)).toBeUndefined();
  });
});

describe("la marca de corrección es corta a propósito", () => {
  it.each(["me equivoqué, son 3 millones", "corrijo: 2.500.000", "quise decir con mi pareja"])(
    "la reconoce: %s",
    (texto) => {
      expect(pareceCorreccion(texto)).toBe(true);
    },
  );

  // Los contraejemplos pesan más que los ejemplos: es, textualmente, lo que
  // teclean Diana, Carlos y Yuliana en el demo.
  it.each(TECLEADO_EN_EL_DEMO)(
    "no confunde una respuesta del demo con una corrección: %s",
    (texto) => {
      expect(pareceCorreccion(texto)).toBe(false);
    },
  );

  it.each(["en realidad no tengo nada", "perdón, no entendí", "no, ninguno todavía"])(
    "no dispara con lo que suena a corrección pero es respuesta: %s",
    (texto) => {
      expect(pareceCorreccion(texto)).toBe(false);
    },
  );
});

describe("el registro de intérpretes", () => {
  it("tiene uno por cada campo que puede quedarse sin entender", () => {
    // La zona no está: nunca falla, y su acuse depende de por qué reconoció.
    expect(Object.keys(INTERPRETES).sort()).toEqual([
      "composicion_familiar",
      "rango_edad",
      "rango_ingreso_hogar",
      "situacion_crediticia",
      "subsidios",
      "tiene_vivienda",
    ]);
  });
});
