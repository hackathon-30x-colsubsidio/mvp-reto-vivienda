import { describe, expect, it } from "vitest";
import { catalogo } from "./catalogo";
import { matchear } from "./index";
import { BANCO } from "@/lib/conversacion/banco-preguntas";
import type { AmenidadInteres, Lead, Score } from "@/lib/types";

// =====================================================================
// Que las respuestas del banco SIGNIFIQUEN algo.
//
// Sin esto el banco es el mismo pecado de los brochures: cuatro
// preguntas bonitas que no cambian ninguna recomendación. Aquí se
// prueban las tres cosas que lo sostienen:
//
//   1. el detalle de los 18 brochures llegó al catálogo que corre;
//   2. los dos vocabularios de amenidad —el del lead y el del
//      brochure— aterrizan en los mismos ids, o el bono nunca suma;
//   3. los bonos ORDENAN y jamás descartan.
// =====================================================================

const BASE: Lead = {
  evento: {
    lead_id: "t-1",
    nombre: "Prueba Uno",
    celular: "3000000000",
    cedula: "1000000000",
    fuente: "meta",
  },
  perfil: { match: true, afiliado: true, ciudad: "Bogotá" },
  respuestas: {
    consentimiento: { otorgado: true, timestamp: "2026-07-26T08:00:00.000Z" },
    rango_ingreso_hogar: "6000000",
    ingreso_hogar_mensual: 6_000_000,
    tiene_vivienda: false,
    subsidios: [],
    situacion_crediticia: "buena",
    zona_interes: "Bogotá",
    rango_edad: "36_45",
    composicion_familiar: "familia_con_hijos",
  },
};

const SCORE: Score = {
  lead_id: "t-1",
  salida: "listo",
  puntaje: 70,
  factores: [],
};

const correr = (respuestas: Partial<Lead["respuestas"]> = {}) =>
  matchear({
    lead: { ...BASE, respuestas: { ...BASE.respuestas, ...respuestas } },
    score: SCORE,
    catalogo,
    precio_maximo: 400_000_000,
  });

describe("el detalle de los brochures llegó al catálogo que corre", () => {
  it("los 18 proyectos traen alcobas y área — antes no lo leía ni una línea", () => {
    const conArea = catalogo.filter((p) => p.area_privada_desde_m2 !== undefined);
    const conAmenidades = catalogo.filter((p) => (p.amenidades ?? []).length > 0);
    expect(catalogo).toHaveLength(18);
    expect(conArea).toHaveLength(18);
    expect(conAmenidades).toHaveLength(18);
  });

  it("solo 3 de 18 tienen tipología de 3 alcobas — por eso son bonos y no filtros", () => {
    const con3 = catalogo.filter((p) => (p.alcobas ?? []).some((a) => a >= 3));
    expect(con3).toHaveLength(3);
  });

  it("el área privada va de 21,6 a 68,06 m², no 'desde 40,58' como decía el plan", () => {
    const areas = catalogo
      .map((p) => p.area_privada_desde_m2!)
      .sort((a, b) => a - b);
    expect(areas[0]).toBeCloseTo(21.6, 1);
    expect(areas[areas.length - 1]).toBeCloseTo(68.06, 1);
  });
});

describe("los dos vocabularios de amenidad hablan el mismo idioma", () => {
  // Si el lead pide `mascotas` y el catálogo lo guardó como otra cosa, el bono
  // no se activa NUNCA y no falla nada: solo deja de sumar, en silencio.
  const pedibles = (BANCO.find((p) => p.id === "amenidades")?.opciones ?? []).flatMap(
    (o) => (o.patch.amenidades_interes ?? []) as AmenidadInteres[],
  );

  it("el banco ofrece chips de amenidad de verdad", () => {
    expect(pedibles.length).toBeGreaterThan(2);
  });

  it.each(pedibles)("lo que el lead puede pedir existe en el catálogo: %s", (amenidad) => {
    const cuantos = catalogo.filter((p) => (p.amenidades ?? []).includes(amenidad));
    // Un chip que ningún proyecto satisface es un callejón sin salida: la
    // persona lo pide, el bono nunca suma y nadie se entera.
    expect(cuantos.length, `ningún proyecto tiene ${amenidad}`).toBeGreaterThan(0);
  });
});

describe("los bonos ORDENAN, nunca descartan", () => {
  it("pedir 3 alcobas no deja a la familia grande sin opciones", () => {
    // Solo 3 proyectos del catálogo dan 3 alcobas, y ninguno tiene por qué
    // caber en su presupuesto. Un filtro duro la dejaría en cero.
    const sinPedir = correr();
    const pidiendo3 = correr({ alcobas_deseadas: 3 });
    expect(pidiendo3.length).toBe(sinPedir.length);
    expect(pidiendo3.length).toBeGreaterThan(0);
  });

  it("pedir una amenidad rarísima tampoco vacía la lista", () => {
    const solo4Proyectos = correr({ amenidades_interes: ["mascotas"] });
    expect(solo4Proyectos.length).toBeGreaterThan(0);
  });

  it("el banco SÍ cambia el orden: para eso existe", () => {
    // Amenidad que solo 4 de 18 tienen — es la que más separa el catálogo.
    const sinPedir = correr().map((p) => p.ficha.nombre);
    const pidiendo = correr({ amenidades_interes: ["mascotas"] }).map((p) => p.ficha.nombre);
    expect(pidiendo).not.toEqual(sinPedir);
  });
});

describe("el porqué dice también lo que NO calza", () => {
  // §7 punto 17: este texto ahora lo lee el LEAD. Un bono que solo habla
  // cuando suma es publicidad.
  it("si pidió 3 alcobas y el proyecto tiene 2, se dice con su advertencia", () => {
    const razones = correr({ alcobas_deseadas: 3 }).flatMap((p) => p.razones);
    const deAlcobas = razones.filter((r) => /alcoba/i.test(r));
    expect(deAlcobas.length).toBeGreaterThan(0);
    // Con este presupuesto en Bogotá no entra ninguno de los 3 de 3 alcobas.
    expect(deAlcobas.some((r) => r.startsWith("⚠️"))).toBe(true);
  });

  it("cuando sí calza, lo dice sin advertencia y citando la tipología", () => {
    const razones = correr({ alcobas_deseadas: 1 }).flatMap((p) => p.razones);
    const deAlcobas = razones.filter((r) => /alcoba/i.test(r));
    expect(deAlcobas.some((r) => !r.startsWith("⚠️") && /pidió/.test(r))).toBe(true);
  });

  it("la amenidad que falta se nombra, no se omite", () => {
    const razones = correr({ amenidades_interes: ["mascotas", "gimnasio"] }).flatMap(
      (p) => p.razones,
    );
    expect(
      razones.some((r) => /mascotas|gimnasio/i.test(r)),
      "ninguna razón menciona lo que pidió",
    ).toBe(true);
  });

  it("sin respuestas del banco, el porqué queda EXACTAMENTE como estaba", () => {
    // Los 3 personajes del demo no contestaron el banco: su ficha no cambia.
    const razones = correr().flatMap((p) => p.razones);
    expect(razones.some((r) => /alcoba|amenidad|área privada/i.test(r))).toBe(false);
  });
});
