import { describe, expect, it } from "vitest";
import type { Lead, Score } from "@/lib/types";
import { matchear } from "./index";
import { catalogo as controlado } from "./fixtures";
import { catalogo } from "./catalogo";

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
    catalogo: controlado,
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
    catalogo: controlado,
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
      catalogo: controlado.filter((p) => p.nombre === "Ciudadela del Este"),
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

describe("cuando TODOS los proyectos tienen el cupo copado (el catálogo real de hoy)", () => {
  // Regresión de un sesgo que se comía la recomendación entera: con el cupo
  // agotado en los 18 proyectos, `total - usado` es negativo en todos, y ordenar
  // por "más cupo libre" pasaba a significar "el proyecto más pequeño" — un
  // proyecto con 1 cupo y 2 vendidos (−1) le ganaba a uno con 37 y 82 (−45)
  // aunque fuera mucho más caro. Como el cupo se compara antes que el precio, el
  // precio dejaba de contar y TODO no afiliado veía los mismos 3 proyectos.
  const copado = controlado.map((p) => ({
    ...p,
    cupo_no_afiliados: {
      total: p.precio_desde > 200_000_000 ? 1 : 40,
      // El caro se pasó por poco; el barato se pasó por mucho. Con el sesgo
      // viejo, el caro ganaba.
      usado: p.precio_desde > 200_000_000 ? 2 : 90,
    },
  }));

  const elegidos = matchear({
    lead: leadDe({ afiliado: false }),
    score: scoreDe("listo_restriccion_cupo"),
    catalogo: copado,
    precio_maximo: PRECIO_MAXIMO.holgado,
  });

  it("manda el precio, no cuál se pasó del cupo por menos unidades", () => {
    const precios = elegidos.map((e) => e.ficha.precio_desde);
    expect(precios).toEqual([...precios].sort((a, b) => a - b));
    expect(elegidos[0].ficha.precio_desde).toBeLessThanOrEqual(200_000_000);
  });

  it("y aun así a cada uno se le dice que el cupo está copado", () => {
    for (const { razones } of elegidos) {
      expect(razones.some((r) => /copado/.test(r))).toBe(true);
    }
  });
});

describe("la zona que el lead ESCRIBE, no la que encaja exacta", () => {
  // La pregunta del chat es "¿dónde te imaginas viviendo?" con texto libre y el
  // placeholder dice "Ej: Bogotá, por el norte". Con igualdad exacta, esa
  // respuesta no coincidía con la ciudad "Bogotá" y el lead perdía el filtro de
  // zona sin que nada fallara.
  function zonasDe(zona: string) {
    const lead = leadDe({ afiliado: true });
    lead.respuestas.zona_interes = zona;
    return matchear({
      lead,
      score: scoreDe("listo"),
      catalogo,
      precio_maximo: PRECIO_MAXIMO.holgado,
    }).map((e) => e.ficha.ciudad);
  }

  it.each([
    ["Bogotá", "la ciudad pelada"],
    ["bogota", "sin tilde y en minúsculas"],
    ["Bogotá, por el norte", "como lo escribe una persona"],
    ["quiero algo en Bogotá", "en una frase"],
  ])("'%s' (%s) recomienda en Bogotá", (zona) => {
    expect(zonasDe(zona).every((ciudad) => ciudad === "Bogotá")).toBe(true);
  });

  it("una respuesta demasiado corta no matchea todo el catálogo", () => {
    const ciudades = new Set(zonasDe("a"));
    expect(ciudades.size).toBeGreaterThan(0);
    // Si "a" contara como zona, coincidiría con cualquier ciudad y la traza
    // diría "queda en la zona que le interesa" a todo el mundo.
    const lead = leadDe({ afiliado: true });
    lead.respuestas.zona_interes = "a";
    const elegidos = matchear({
      lead,
      score: scoreDe("listo"),
      catalogo,
      precio_maximo: PRECIO_MAXIMO.holgado,
    });
    for (const { razones } of elegidos) {
      expect(razones.some((r) => r.includes("la zona que le interesa"))).toBe(false);
    }
  });

  it("un proyecto con la ubicación sin confirmar NUNCA cuenta como zona", () => {
    // El catálogo de HOY ya no tiene ninguno: la ambigüedad de VIBO ONCE y
    // KARAKALI la resolvió el brochure oficial (los dos son de Bogotá). El
    // proyecto dudoso se construye acá a propósito — la regla tiene que seguir
    // en pie para el próximo dato que llegue contradictorio, y un test que
    // dependa de que el catálogo traiga uno se muere con el dato.
    const dudoso = {
      ...catalogo[0],
      proyecto_id: "dudoso",
      nombre: "PROYECTO SIN UBICACIÓN CONFIRMADA",
      ciudad: "Ricaurte o Bogotá (contradictorio entre fuentes)",
      // Barato a propósito: lo que se prueba es la zona, y desde que el techo se
      // calcula por proyecto contra la capacidad real del lead, un proyecto caro
      // se cae por precio antes de llegar a la regla que interesa.
      precio_desde: 100_000_000,
      ubicacion_incierta: true,
    };

    const lead = leadDe({ afiliado: true });
    lead.respuestas.zona_interes = "Ricaurte";
    const elegidos = matchear({
      lead,
      score: scoreDe("listo"),
      catalogo: [dudoso],
      // Que quepa por precio: lo que se prueba es la zona, no el filtro.
      precio_maximo: dudoso.precio_desde,
    });

    const razones = elegidos[0].razones;
    expect(razones.some((r) => r.includes("la zona que le interesa"))).toBe(false);
    expect(razones.some((r) => /ubicación de este proyecto no está confirmada/.test(r))).toBe(
      true,
    );
  });
});

describe("lead en nutrición", () => {
  it("no recibe ningún proyecto: no se recomienda lo que no puede pagar", () => {
    const elegidos = matchear({
      lead: leadDe({ ciudad: "Bogotá" }),
      score: scoreDe("nutricion"),
      catalogo: controlado,
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
    catalogo: controlado,
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
