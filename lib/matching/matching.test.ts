import { describe, expect, it } from "vitest";
import type { Lead, Score } from "@/lib/types";
import { matchear } from "./index";
import { catalogo } from "./fixtures";

// Un caso por forma de lead + el que llega sin nada. Lo que se prueba son las
// invariantes del criterio de aceptación 4: que el lead listo reciba 2-3
// proyectos que de verdad puede pagar, y que la regla 90/10 se haga VISIBLE
// (ya no descarta — spec 04 D3, cerrada el 2026-07-24).
//
// ⚠️ Los leads se construyen acá y NO se importan de `lib/fixtures/`: estos
// tests prueban el MATCHER contra un catálogo controlado (con la trampa de
// "Ciudadela del Este"), no la identidad de los personajes del demo. Cuando los
// personajes se alinearon al catálogo real (ticket 001) esta suite se rompió
// entera sin que el matcher hubiera cambiado una línea — señal de que estaba
// probando dos cosas a la vez.

const nombres = (elegidos: ReturnType<typeof matchear>) => elegidos.map((e) => e.ficha.nombre);

/** Precio máximo de cada caso. En producción sale de `precioMaximoDe(lead)`. */
const PRECIO_MAXIMO = {
  holgado: 230_000_000,
  ajustado: 190_000_000,
  insuficiente: 95_000_000,
};

function leadDe(overrides: {
  proyecto_interes?: string;
  ciudad?: string;
  afiliado?: boolean;
}): Lead {
  return {
    evento: {
      lead_id: "lead-test",
      nombre: "Persona de Prueba",
      celular: "3000000000",
      cedula: "1000000000",
      ...(overrides.proyecto_interes ? { proyecto_interes: overrides.proyecto_interes } : {}),
      fuente: "web",
    },
    perfil:
      overrides.ciudad || overrides.afiliado !== undefined
        ? { match: true, afiliado: overrides.afiliado, ciudad: overrides.ciudad }
        : { match: false },
    respuestas: {
      consentimiento: { otorgado: true, timestamp: "2026-07-23T18:00:00-05:00" },
      ingreso_hogar_mensual: 5_000_000,
      tiene_vivienda: false,
      subsidios: [],
      situacion_crediticia: "buena",
    },
  };
}

function scoreDe(salida: Score["salida"]): Score {
  return {
    lead_id: "lead-test",
    salida,
    puntaje: salida === "nutricion" ? 0 : 70,
    factores: [],
    ...(salida === "nutricion"
      ? { regla_fallida: "Tope del 40%", trigger_nutricion: "sube el ingreso" }
      : {}),
  };
}

describe("afiliado que pasa el corte", () => {
  const elegidos = matchear({
    lead: leadDe({ proyecto_interes: "Torres de Bellavista", ciudad: "Bogotá", afiliado: true }),
    score: scoreDe("listo"),
    catalogo,
    precio_maximo: PRECIO_MAXIMO.holgado,
  });

  it("recomienda entre 2 y 3 proyectos", () => {
    expect(elegidos.length).toBeGreaterThanOrEqual(2);
    expect(elegidos.length).toBeLessThanOrEqual(3);
  });

  it("ninguno supera su precio máximo", () => {
    for (const { ficha } of elegidos) {
      expect(ficha.precio_desde).toBeLessThanOrEqual(PRECIO_MAXIMO.holgado);
    }
  });

  it("arranca por el proyecto que preguntó y no lo saca de su ciudad", () => {
    expect(nombres(elegidos)[0]).toBe("Torres de Bellavista");
    expect(elegidos.every((e) => e.ficha.ciudad === "Bogotá")).toBe(true);
  });

  it("cada proyecto trae su traza para que el experto la cite", () => {
    for (const { razones } of elegidos) {
      expect(razones.length).toBeGreaterThan(0);
      expect(razones[0]).toContain("Decreto 583 de 2025");
    }
  });
});

describe("no afiliado que pasa el corte", () => {
  const lead = leadDe({
    proyecto_interes: "Reserva del Poblado",
    ciudad: "Medellín",
    afiliado: false,
  });
  const elegidos = matchear({
    lead,
    score: scoreDe("listo_restriccion_cupo"),
    catalogo,
    precio_maximo: PRECIO_MAXIMO.ajustado,
  });

  // El cupo 90/10 dejó de descartar (2026-07-24): con el catálogo real los 18
  // proyectos lo tienen copado, así que descartar dejaba con las manos vacías a
  // un lead que SÍ pasa el corte financiero. El mentor lo puso al revés — a
  // Colsubsidio le interesa cerrar la venta. Ahora se muestran, ordenados por
  // cupo y con la advertencia encima.
  it("el proyecto con el cupo copado queda de último, no de primero", () => {
    expect(nombres(elegidos)).toContain("Ciudadela del Este");
    expect(nombres(elegidos).at(-1)).toBe("Ciudadela del Este");
  });

  it("le dice cuánto cupo queda, que es la razón para moverse rápido", () => {
    for (const { razones } of elegidos) {
      expect(razones.some((r) => r.includes("regla 90/10"))).toBe(true);
    }
  });

  it("si el proyecto no tiene cupo, se lo muestra CON la advertencia, no lo esconde", () => {
    const sinCupo = matchear({
      lead,
      score: scoreDe("listo_restriccion_cupo"),
      // Solo queda en pie la trampa: el más barato del catálogo, con el cupo copado.
      catalogo: catalogo.filter((p) => p.nombre === "Ciudadela del Este"),
      precio_maximo: PRECIO_MAXIMO.ajustado,
    });

    expect(nombres(sinCupo)).toEqual(["Ciudadela del Este"]);
    expect(sinCupo[0].razones.some((r) => /copado/.test(r))).toBe(true);
    // No le promete la unidad: dice quién tiene que validar antes de separar.
    expect(sinCupo[0].razones.some((r) => /validar cupo/.test(r))).toBe(true);
  });

  it("arranca por el que preguntó y se queda en su ciudad", () => {
    expect(nombres(elegidos)[0]).toBe("Reserva del Poblado");
    expect(elegidos.every((e) => e.ficha.ciudad === "Medellín")).toBe(true);
  });
});

describe("lead en nutrición", () => {
  it("no recibe ningún proyecto: no se recomienda lo que no puede pagar", () => {
    const elegidos = matchear({
      lead: leadDe({ ciudad: "Bogotá" }),
      score: scoreDe("nutricion"),
      catalogo,
      precio_maximo: PRECIO_MAXIMO.insuficiente,
    });
    expect(elegidos).toEqual([]);
  });
});

describe("lead que llega sin nada (el 'soy yo' sin match de enriquecimiento)", () => {
  // Sin perfil, sin ciudad, sin zona de interés y sin proyecto de interés:
  // el peor caso del formulario libre. El matcher tiene que degradar, no caerse.
  const elegidos = matchear({
    lead: leadDe({}),
    score: scoreDe("listo"),
    catalogo,
    precio_maximo: PRECIO_MAXIMO.holgado,
  });

  it("igual recomienda 2-3 proyectos, sin inventarse una zona", () => {
    expect(elegidos.length).toBeGreaterThanOrEqual(2);
    expect(elegidos.length).toBeLessThanOrEqual(3);
    for (const { razones } of elegidos) {
      expect(razones.some((r) => r.includes("la zona que le interesa"))).toBe(false);
    }
  });

  it("prioriza la cuota más holgada cuando no hay nada que lo desempate", () => {
    expect(nombres(elegidos)[0]).toBe("Ciudadela del Este");
  });
});
