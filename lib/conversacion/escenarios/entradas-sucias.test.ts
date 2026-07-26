import { describe, expect, it } from "vitest";
import type { PerfilConocido } from "@/lib/types";
import { construirPreguntas } from "../preguntas";
import { interpretarUno } from "./replay";

// =====================================================================
// LA RED, NIVEL 1 — qué deja en el lead cada respuesta sucia.
//
// Protege la extracción de intérpretes de la rama 2: si mover
// `interpretarComposicion` a su propio archivo cambia lo que entiende,
// esto lo grita.
//
// ⚠️ CONGELA EL COMPORTAMIENTO ACTUAL, NO EL DESEADO. Los casos
// marcados `BUG CONGELADO` están mal y están anotados en la bitácora
// del plan. Se arreglan en su rama, con su dueño, no aquí.
// =====================================================================

const SIN_DATOS: PerfilConocido = { match: false };

// ── composición del hogar ──────────────────────────────────

describe("composición del hogar", () => {
  it.each([
    ["con mi esposa y los niños", "familia_con_hijos"],
    ["solo yo", "solo"],
    ["yo con mis hijos", "monoparental"],
    ["con mi pareja", "pareja"],
    // El orden de los if importa: lo más específico primero.
    ["yo sola con mi hija", "monoparental"],
  ])("entiende %s", (texto, esperado) => {
    const r = interpretarUno(SIN_DATOS, "composicion_familiar", texto);
    expect(r.patch.composicion_familiar).toBe(esperado);
  });

  // ⚠️ BUG CONGELADO — hueco 2 del plan. Ninguna de estas tres deja
  // dato, y las tres reciben un acuse amable ("Listo, lo tengo presente
  // para buscarte lo que mejor te quede"). La persona cree que
  // contestó, el motor pierde la señal de similitud y el asesor no ve
  // nada. Es el caso que motivó todo el plan.
  it.each([
    ["vivo con mi mamá y mi hermana"], // un hogar real, muy común
    ["somos 4"],
    ["con mi perro"],
  ])("HOY pierde en silencio: %s", (texto) => {
    const r = interpretarUno(SIN_DATOS, "composicion_familiar", texto);
    expect(r.patch).toEqual({});
    // Y lo peor: acusa recibo igual, así que nadie se entera.
    expect(r.acuse).toBeTruthy();
    expect(r.repreguntar).toBeUndefined();
  });
});

// ── vivienda ───────────────────────────────────────────────

describe("primera vivienda o ya tiene", () => {
  it.each([
    ["sería la primera", false],
    ["vivo en arriendo", false],
    ["ya tengo casa pero quiero otra", true],
    ["tengo apartamento", true],
  ])("entiende %s", (texto, esperado) => {
    const r = interpretarUno(SIN_DATOS, "tiene_vivienda", texto);
    expect(r.patch.tiene_vivienda).toBe(esperado);
  });

  // ⚠️ BUG CONGELADO — peor que perder el dato: se lo INVENTA. `NIEGA`
  // atrapa el "no" de "no sé" y lo lee como "no tengo vivienda", que
  // habilita los subsidios de primera vivienda. Un lead que dijo que no
  // sabía queda declarado como primer comprador ante el motor.
  // Anotado en la bitácora del plan para P2.
  it.each([["pues no sé"], ["no sé todavía"], ["no estoy seguro"]])(
    "HOY inventa 'primera vivienda' cuando la persona dice %s",
    (texto) => {
      const r = interpretarUno(SIN_DATOS, "tiene_vivienda", texto);
      expect(r.patch.tiene_vivienda).toBe(false);
    },
  );

  // Esta sí cae al vacío, porque no trae la palabra "no".
  it("con 'ni idea' no deja dato", () => {
    expect(interpretarUno(SIN_DATOS, "tiene_vivienda", "ni idea").patch).toEqual({});
  });
});

// ── ingreso — el único con red de verdad ───────────────────

describe("ingreso", () => {
  it.each([
    ["2 palos", 2_000_000],
    ["entre 3 y 5", 4_000_000],
    ["como 4 millones más o menos", 4_000_000],
  ])("entiende %s", (texto, esperado) => {
    const r = interpretarUno(SIN_DATOS, "rango_ingreso_hogar", texto);
    expect(r.patch.ingreso_hogar_mensual).toBe(esperado);
  });

  // Es el único campo que repregunta en vez de seguir, porque de él
  // sale el gate del 40% (Decreto 583). El texto crudo se guarda igual
  // para que el asesor lo vea tal cual.
  it.each([["2+2"], ["no tngo nada"], ["depende del mes"]])(
    "repregunta una vez cuando no logra leer %s",
    (texto) => {
      const r = interpretarUno(SIN_DATOS, "rango_ingreso_hogar", texto);
      expect(r.repreguntar).toBe(true);
      expect(r.patch.ingreso_hogar_mensual).toBeUndefined();
      expect(r.patch.rango_ingreso_hogar).toBe(texto);
      expect(r.acuseSiInsiste).toBeTruthy();
    },
  );

  it("le devuelve el número entendido para que lo corrija", () => {
    const r = interpretarUno(SIN_DATOS, "rango_ingreso_hogar", "4.500.000");
    expect(r.acuse).toContain("4.500.000");
  });
});

// ── edad ───────────────────────────────────────────────────

describe("rango de edad", () => {
  it.each([
    ["tengo 29", "20_35"],
    ["45", "36_45"],
    ["tengo 52 años", "46_mas"],
    ["cuarenta", "36_45"],
    ["cincuenta", "46_mas"],
  ])("entiende %s", (texto, esperado) => {
    const r = interpretarUno(SIN_DATOS, "rango_edad", texto);
    expect(r.patch.rango_edad).toBe(esperado);
  });

  // ⚠️ BUG CONGELADO — quien escribe su edad en letras entre 36 y 39
  // queda clasificado como 20-35. Causa: en `interpretarEdad` la rama
  // `^treinta\b` se evalúa ANTES que `treinta y (seis|siete|ocho|
  // nueve)`, así que gana siempre. La edad alimenta la similitud con
  // compradores reales, o sea que el error llega hasta qué proyecto se
  // recomienda. Anotado en la bitácora para P2.
  it.each([["treinta y seis"], ["treinta y siete"], ["treinta y ocho"], ["treinta y nueve"]])(
    "HOY clasifica mal %s como 20-35",
    (texto) => {
      expect(interpretarUno(SIN_DATOS, "rango_edad", texto).patch.rango_edad).toBe("20_35");
    },
  );

  // ⚠️ BUG CONGELADO — mismo patrón que composición: sin dato y con
  // acuse amable ("Listo, gracias 🙏").
  it.each([["jajaja"], ["🎉"]])("HOY pierde en silencio: %s", (texto) => {
    const r = interpretarUno(SIN_DATOS, "rango_edad", texto);
    expect(r.patch).toEqual({});
    expect(r.acuse).toBeTruthy();
  });
});

// ── situación crediticia ───────────────────────────────────

describe("situación crediticia", () => {
  it.each([
    ["al día", "buena"],
    ["estoy en datacredito", "mala"],
    ["ya sali de un reporte", "regular"],
    ["estoy saliendo de un reporte", "regular"],
    ["nunca he pedido nada", "sin_info"],
  ])("entiende %s", (texto, esperado) => {
    const r = interpretarUno(SIN_DATOS, "situacion_crediticia", texto);
    expect(r.patch.situacion_crediticia).toBe(esperado);
  });

  // ⚠️ BUG CONGELADO — la MISMA frase, escrita con la tilde correcta,
  // da un veredicto peor. `interpretarCrediticia` compara contra un
  // regex sin normalizar tildes (`/sali|.../` no atrapa "salí"), así
  // que cae hasta la rama de mora porque "reporte" contiene "report".
  // Quien escribe bien su español queda calificado peor que quien no.
  // `interpretarZona` sí normaliza con `sinTildes` — la inconsistencia
  // entre intérpretes es justo lo que la rama 2 unifica.
  // Anotado en la bitácora para P2.
  it("HOY 'ya salí de un reporte' (con tilde) cae a mora, no a regular", () => {
    expect(
      interpretarUno(SIN_DATOS, "situacion_crediticia", "ya salí de un reporte").patch
        .situacion_crediticia,
    ).toBe("mala");
    // Sin la tilde, la misma frase da otro resultado.
    expect(
      interpretarUno(SIN_DATOS, "situacion_crediticia", "ya sali de un reporte").patch
        .situacion_crediticia,
    ).toBe("regular");
  });

  // ⚠️ BUG CONGELADO — a diferencia de composición y edad, este NO cae
  // al vacío: cae a `sin_info`, que en la ficha se lee como "nunca ha
  // pedido crédito". O sea que una risa queda registrada como un hecho
  // sobre su vida financiera. La inconsistencia entre intérpretes (unos
  // devuelven {}, otro afirma) es justo lo que la rama 2 unifica.
  it("HOY registra 'jajaja' como sin_info, no como dato faltante", () => {
    const r = interpretarUno(SIN_DATOS, "situacion_crediticia", "jajaja");
    expect(r.patch.situacion_crediticia).toBe("sin_info");
  });
});

// ── subsidios ──────────────────────────────────────────────

describe("subsidios", () => {
  it.each([
    ["ninguno", []],
    ["no tngo nada", []], // el typo no importa: matchea "nada"
    ["no he pedido ninguno", []],
  ])("entiende que %s es no tener", (texto, esperado) => {
    expect(interpretarUno(SIN_DATOS, "subsidios", texto).patch.subsidios).toEqual(esperado);
  });

  it("marca por confirmar cuando no sabe", () => {
    const r = interpretarUno(SIN_DATOS, "subsidios", "no sé si aplico");
    expect(r.patch.subsidios).toEqual(["Por confirmar"]);
  });

  // ⚠️ BUG CONGELADO — escribir vale distinto que tocar el chip, y la
  // convención del repo dice que tienen que valer lo mismo (spec 02
  // D4). El chip guarda "Mi Casa Ya"; escribirlo guarda el texto crudo
  // en minúscula. Anotado en la bitácora para P2.
  it("HOY guarda el texto crudo en vez de la etiqueta del chip", () => {
    const r = interpretarUno(SIN_DATOS, "subsidios", "mi casa ya");
    expect(r.patch.subsidios).toEqual(["mi casa ya"]);
  });
});

// ── zona ───────────────────────────────────────────────────

describe("zona de interés", () => {
  it("con una ciudad del catálogo guarda la ciudad LIMPIA", () => {
    const r = interpretarUno(SIN_DATOS, "zona_interes", "Bogotá, por el norte");
    expect(r.patch.zona_interes).toBe("Bogotá");
    expect(r.pulir).toBe(true);
  });

  it("es honesto cuando en esa ciudad no hay proyectos", () => {
    const r = interpretarUno(SIN_DATOS, "zona_interes", "en medellin");
    expect(r.acuse).toContain("Medellín");
    expect(r.acuse).toMatch(/no tenemos/i);
  });

  // ⚠️ BUG CONGELADO — el acuse dice la verdad, pero el patch guarda la
  // frase entera y el matcher la trata como ubicación: filtra proyectos
  // buscando "en medellin". Mismo problema con un deseo o un emoji.
  it.each([
    ["en medellin"],
    ["cerca al colegio de los niños"],
    ["🎉"],
  ])("HOY mete el texto crudo en zona_interes: %s", (texto) => {
    expect(interpretarUno(SIN_DATOS, "zona_interes", texto).patch.zona_interes).toBe(texto);
  });
});

// ── el chip contra su propio texto ─────────────────────────
//
// La regla del repo (spec 02 D4, y el comentario de `preguntas.ts:407`)
// es que "escribir 'ya tengo casa' tiene que valer lo mismo que tocar
// el chip". Hoy eso solo se prueba para vivienda. Este bloque lo
// comprueba para TODOS los chips de TODOS los pasos, derivándolo del
// catálogo real en vez de una lista escrita a mano: si mañana alguien
// agrega un chip cuyo texto el intérprete no entiende, esto lo grita
// sin que nadie tenga que acordarse de escribir el caso.

describe("cada chip vale lo mismo que escribir su etiqueta", () => {
  const pasos = construirPreguntas(SIN_DATOS);
  const conChips = pasos.flatMap((paso) =>
    (paso.opciones ?? []).map((opcion) => ({ paso, opcion })),
  );

  // Las dos que HOY divergen. Están aquí, con nombre, en vez de
  // debilitar la afirmación para todas — así el día que se arreglen,
  // este test falla y obliga a sacarlas de la lista.
  const DIVERGEN_HOY = new Set([
    // ⚠️ `numerosDe("Más de 45")` saca el 45 y `45 <= 45` cae en el
    // rango de en medio. Quien teclee la etiqueta del chip tal cual
    // queda en 36-45 en vez de 46+. La edad alimenta la similitud, así
    // que el error llega hasta qué proyecto se recomienda.
    "Más de 45",
    // ⚠️ Cosmético pero de la misma clase: guarda la frase del lead en
    // vez de la etiqueta canónica que usa el chip.
    "El de mi caja de compensación",
  ]);

  it("hay chips que probar", () => {
    expect(conChips.length).toBeGreaterThan(10);
  });

  it.each(
    conChips
      .filter(({ opcion }) => !DIVERGEN_HOY.has(opcion.etiqueta))
      .map(({ paso, opcion }) => [paso.campo, opcion.etiqueta] as const),
  )("%s — '%s'", (campo, etiqueta) => {
    const { paso, opcion } = conChips.find(
      (c) => c.paso.campo === campo && c.opcion.etiqueta === etiqueta,
    )!;
    expect(paso.interpretarTexto(opcion.etiqueta).patch).toEqual(opcion.patch);
  });

  // ⚠️ BUG CONGELADO — anotados en la bitácora para P2.
  it("HOY 'Más de 45' escrito da 36_45, pero el chip da 46_mas", () => {
    expect(interpretarUno(SIN_DATOS, "rango_edad", "Más de 45").patch.rango_edad).toBe("36_45");
  });

  it("HOY el subsidio de la caja guarda la frase del lead, no la etiqueta", () => {
    expect(
      interpretarUno(SIN_DATOS, "subsidios", "El de mi caja de compensación").patch.subsidios,
    ).toEqual(["El de mi caja de compensación"]);
  });
});
