import { describe, expect, it } from "vitest";
import { curar, resolverProyectoDeReferencia } from "./curar";
import { catalogo } from "./matching/catalogo";
import { precioMaximoDe, cuotaEstimada } from "./scoring/capacidad";
import { CONFIG_SCORING } from "./scoring/config";
import * as leads from "./fixtures/leads";
import type { Lead } from "./types";

const CANONICOS: Lead[] = [leads.afiliadoListo, leads.noAfiliadoListo, leads.nutricion];

describe("precioMaximoDe", () => {
  // Es el gate del 40% despejado al revés: en el precio máximo, la cuota tiene
  // que dar exactamente el tope legal. Si esto se desincroniza del motor, el
  // matcher recomendaría proyectos que el gate rechaza.
  it("deja la cuota justo en el tope del 40%", () => {
    const lead = leads.afiliadoListo;
    const ingreso = lead.respuestas.ingreso_hogar_mensual!;
    const maximo = precioMaximoDe(lead);

    const ratio = cuotaEstimada(maximo) / ingreso;
    expect(ratio).toBeLessThanOrEqual(CONFIG_SCORING.TOPE_CUOTA_SOBRE_INGRESO);
    expect(ratio).toBeCloseTo(CONFIG_SCORING.TOPE_CUOTA_SOBRE_INGRESO, 4);
  });

  it("sin ingreso declarado no le presta capacidad a nadie", () => {
    const sinIngreso: Lead = {
      ...leads.afiliadoListo,
      respuestas: { ...leads.afiliadoListo.respuestas, ingreso_hogar_mensual: undefined },
    };
    expect(precioMaximoDe(sinIngreso)).toBe(0);
  });
});

describe("resolverProyectoDeReferencia", () => {
  it("califica contra el proyecto por el que entró, si existe en el catálogo", () => {
    const real = catalogo[0];
    const lead: Lead = {
      ...leads.afiliadoListo,
      evento: { ...leads.afiliadoListo.evento, proyecto_interes: real.nombre },
    };
    expect(resolverProyectoDeReferencia(lead, catalogo)?.proyecto_id).toBe(real.proyecto_id);
  });

  // Los 3 personajes canónicos entran con proyectos inventados (ticket 001),
  // así que este fallback es el que corre hoy en el demo.
  it("cae al más económico cuando el proyecto de entrada no está", () => {
    const masBarato = [...catalogo].sort((a, b) => a.precio_desde - b.precio_desde)[0];
    const lead: Lead = {
      ...leads.afiliadoListo,
      evento: { ...leads.afiliadoListo.evento, proyecto_interes: "Proyecto Que No Existe" },
    };
    expect(resolverProyectoDeReferencia(lead, catalogo)?.proyecto_id).toBe(
      masBarato.proyecto_id,
    );
  });

  it("devuelve null con catálogo vacío en vez de reventar", () => {
    expect(resolverProyectoDeReferencia(leads.afiliadoListo, [])).toBeNull();
  });
});

describe("curar", () => {
  it("cada personaje sale con la salida que su historia promete", () => {
    expect(curar(leads.afiliadoListo).score.salida).toBe("listo");
    expect(curar(leads.noAfiliadoListo).score.salida).toBe("listo_restriccion_cupo");
    expect(curar(leads.nutricion).score.salida).toBe("nutricion");
  });

  it("nunca devuelve un LeadCurado sin factores — cero caja negra", () => {
    for (const lead of CANONICOS) {
      expect(curar(lead).score.factores.length).toBeGreaterThan(0);
    }
  });

  // El CHECK vigente es `listo_tiene_hasta_3_proyectos` (db/migracion-001,
  // punto 2): acepta 0–3, incluido el 1 — con la zona estricta (2026-07-25) un
  // lead cuya zona solo tiene un proyecto que le alcance recibe exactamente ese.
  it("no produce leads que la DB vaya a rechazar por cantidad de proyectos", () => {
    for (const lead of CANONICOS) {
      const { proyectos } = curar(lead);
      expect(proyectos.length).toBeLessThanOrEqual(3);
    }
  });

  it("el que no pasa el gate no se lleva recomendaciones", () => {
    const curado = curar(leads.nutricion);
    expect(curado.proyectos).toHaveLength(0);
    expect(curado.score.regla_fallida).toBeTruthy();
    expect(curado.score.trigger_nutricion).toBeTruthy();
  });

  it("cada proyecto recomendado llega con su porqué citable", () => {
    for (const { porque } of curar(leads.afiliadoListo).proyectos) {
      expect(porque.length).toBeGreaterThan(20);
      expect(porque).toMatch(/40%|Decreto 583/);
    }
  });
});

describe("explicacionDeterminista", () => {
  it("cita la norma y no queda vacía para ninguna salida", () => {
    for (const lead of CANONICOS) {
      const { score, proyectos, explicacion } = curar(lead);
      expect(explicacion).toMatch(/40%|Decreto 583/);
      expect(explicacion.length).toBeGreaterThan(60);
      if (score.salida === "nutricion") {
        // Criterio 3: la razón exacta que falló y el camino de vuelta.
        expect(explicacion).toContain(score.trigger_nutricion!);
        expect(proyectos).toHaveLength(0);
      } else {
        // Cero caja negra: dice cuántos factores hay detrás del puntaje.
        expect(explicacion).toContain(String(score.factores.length));
        expect(explicacion).toContain(String(score.puntaje));
      }
    }
  });

  it("al de nutrición no lo da por perdido", () => {
    expect(curar(leads.nutricion).explicacion).toMatch(/no se descarta/i);
  });
});
