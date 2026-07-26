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
//
// QUÉ HACER CUANDO UNO DE ESOS FALLE: significa que alguien arregló el
// bug, y esa falla es la señal, no un problema. El test se **voltea** a
// afirmar el arreglo —con su porqué y un caso de control de que lo que
// ya servía no se movió— y NO se borra: el caso sucio sigue valiendo.
// Ya pasó el 2026-07-26 con los 6 bugs de interpretación.
//
// Los que quedan marcados aquí siguen abiertos de verdad, y casi todos
// son del hueco 2, que cierra la rama 5.
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

  // ✅ ARREGLADO 2026-07-26 (era el peor de los seis: no perdía el dato,
  // se lo INVENTABA). `NIEGA` atrapaba el "no" de "no sé" y lo leía como
  // "no tengo vivienda", así que quien dijo que no sabía quedaba
  // declarado como primer comprador ante el motor: +5 puntos de 100 en
  // el factor `ya_tiene_vivienda` y un "No tiene vivienda propia" en la
  // ficha del asesor, sobre algo que nadie afirmó.
  it.each([["pues no sé"], ["no sé todavía"], ["no estoy seguro"], ["ni idea"]])(
    "no afirma nada cuando la persona dice %s",
    (texto) => {
      const r = interpretarUno(SIN_DATOS, "tiene_vivienda", texto);
      expect(r.patch.tiene_vivienda).toBeUndefined();
    },
  );

  // La otra mitad del arreglo: negar de verdad SÍ tiene que seguir
  // contando. Si esto se rompe, el arreglo se pasó de largo.
  it.each([["no"], ["no tengo"], ["todavía no"], ["nunca he tenido"]])(
    "una negación de verdad sigue siendo 'no tiene': %s",
    (texto) => {
      expect(interpretarUno(SIN_DATOS, "tiene_vivienda", texto).patch.tiene_vivienda).toBe(
        false,
      );
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

  // ✅ ARREGLADO 2026-07-26 con un `(?! y)`. La rama `^treinta\b` se
  // evaluaba ANTES que `treinta y (seis|siete|ocho|nueve)` y ganaba
  // siempre, así que los 36-39 escritos en letras caían en 20-35. La
  // edad alimenta la similitud con compradores reales, o sea que el
  // error llegaba hasta qué proyecto se recomienda.
  it.each([["treinta y seis"], ["treinta y siete"], ["treinta y ocho"], ["treinta y nueve"]])(
    "clasifica bien %s como 36-45",
    (texto) => {
      expect(interpretarUno(SIN_DATOS, "rango_edad", texto).patch.rango_edad).toBe("36_45");
    },
  );

  // Y los treinta de abajo no se movieron: sin esto, el `(?! y)` podría
  // haber roto el tramo que sí funcionaba.
  it.each([["treinta"], ["treinta y dos"], ["treinta y cinco"]])(
    "%s sigue siendo 20-35",
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

  // ✅ ARREGLADO 2026-07-26 aplicando `sinTildes`, el mismo que ya usaba
  // la zona. Antes, la MISMA frase escrita con su tilde daba un
  // veredicto PEOR: `/sali|.../` no atrapaba "salí", así que caía hasta
  // la rama de mora porque "reporte" contiene "report". Quien escribe
  // bien su español quedaba calificado peor que quien no.
  it("'ya salí de un reporte' vale lo mismo con tilde que sin ella", () => {
    expect(
      interpretarUno(SIN_DATOS, "situacion_crediticia", "ya salí de un reporte").patch
        .situacion_crediticia,
    ).toBe("regular");
    // La misma frase sin la tilde: mismo resultado. Ese es todo el punto.
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

  // ✅ ARREGLADO 2026-07-26. Escribir un subsidio que el chat nombra con
  // etiqueta propia guarda ESA etiqueta, no la frase cruda: el chip es un
  // atajo, no otra respuesta (spec 02 D4).
  it.each([
    ["mi casa ya", ["Mi Casa Ya"]],
    ["Mi Casa Ya", ["Mi Casa Ya"]],
    ["El de mi caja de compensación", ["Subsidio caja de compensación"]],
    ["el de la caja", ["Subsidio caja de compensación"]],
  ])("'%s' se guarda con la etiqueta del chip", (texto, esperado) => {
    expect(interpretarUno(SIN_DATOS, "subsidios", texto).patch.subsidios).toEqual(esperado);
  });

  // Y lo que NO conocemos se sigue guardando tal cual lo dijo: nombrar un
  // subsidio que no está en nuestra tabla no lo vuelve inválido.
  it("un subsidio que no conocemos se guarda crudo", () => {
    expect(interpretarUno(SIN_DATOS, "subsidios", "tengo el de fonvivienda").patch.subsidios).toEqual(
      ["tengo el de fonvivienda"],
    );
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

  // ✅ 2026-07-26 — la lista de excepciones quedó VACÍA. Tenía las dos
  // que divergían ("Más de 45", que daba 36_45 porque `numerosDe` saca
  // el 45 y `45 <= 45`; y "El de mi caja de compensación", que guardaba
  // la frase del lead en vez de la etiqueta canónica). Se arreglaron, y
  // la afirmación ahora vale para TODOS los chips sin excepción.
  //
  // Se conserva la constante, no por ceremonia: si mañana alguien agrega
  // un chip cuyo texto el intérprete no entiende, el sitio donde se
  // documenta la deuda ya existe y no hay que reinventar el patrón.
  const DIVERGEN_HOY = new Set<string>([]);

  it("hay chips que probar", () => {
    expect(conChips.length).toBeGreaterThan(10);
  });

  it("ningún chip diverge: la lista de excepciones está vacía", () => {
    expect([...DIVERGEN_HOY]).toEqual([]);
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
});
