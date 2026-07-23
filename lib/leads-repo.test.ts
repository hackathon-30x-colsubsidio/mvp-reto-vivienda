import { describe, it, expect } from "vitest";
import {
  filaDesdeLeadCurado,
  leadCuradoDesdeFila,
  type FilaLead,
} from "@/lib/leads-repo";
import { ordenarCola, PRIORIDAD, type LeadEnCola } from "@/lib/types-asesor";
import { leadsCurados } from "@/lib/fixtures";
import type { LeadCurado } from "@/lib/types";

// =====================================================================
// El mapeo contrato <-> DB y el orden de la cola, contra los personajes
// CANÓNICOS de lib/fixtures (ticket 001). Sin red.
// =====================================================================

const { afiliadoListo, noAfiliadoListo, nutricion } = leadsCurados;
const personajes = Object.entries(leadsCurados) as [string, LeadCurado][];

/** Completa una fila con lo que agrega la vista `cola_asesor`. */
function comoFila(curado: LeadCurado, creado = "2026-07-23T14:00:00-05:00"): FilaLead {
  return {
    ...filaDesdeLeadCurado(curado),
    creado_en: creado,
    cita_fecha: curado.cita?.fecha ?? null,
    cita_sala_ventas: curado.cita?.sala_ventas ?? null,
  };
}

describe("criterio 3 — nadie se descarta", () => {
  it("todo lead en nutrición tiene regla_fallida y trigger no vacíos", () => {
    const enNutricion = personajes.filter(([, c]) => c.score.salida === "nutricion");
    expect(enNutricion.length).toBeGreaterThan(0);

    for (const [, curado] of enNutricion) {
      expect(curado.score.regla_fallida?.trim()).toBeTruthy();
      expect(curado.score.trigger_nutricion?.trim()).toBeTruthy();
    }
  });

  it("ningún personaje termina sin una de las 3 salidas", () => {
    for (const [, curado] of personajes) {
      expect(Object.keys(PRIORIDAD)).toContain(curado.score.salida);
    }
  });

  it("no existe el estado 'descartado' (spec §2)", () => {
    expect(Object.keys(PRIORIDAD)).not.toContain("descartado");
  });

  it("la regla y el trigger sobreviven el viaje a la DB", () => {
    const fila = filaDesdeLeadCurado(nutricion);
    expect(fila.regla_fallida).toBe(nutricion.score.regla_fallida);
    expect(fila.trigger_nutricion).toBe(nutricion.score.trigger_nutricion);
    expect(fila.proyectos).toHaveLength(0);
  });
});

describe("criterio 2 — el mapeo no pierde factores", () => {
  it.each(personajes)("%s: el round trip conserva todos los factores", (_n, curado) => {
    const vuelto = leadCuradoDesdeFila(comoFila(curado));

    expect(vuelto.score.factores).toHaveLength(curado.score.factores.length);
    expect(vuelto.score.factores).toEqual(curado.score.factores);
  });

  it("los factores que NO cumplen también viajan (no se filtran los malos)", () => {
    const fila = filaDesdeLeadCurado(noAfiliadoListo);
    const noCumplen = fila.factores.filter((f) => !f.cumple);
    expect(noCumplen.length).toBeGreaterThan(0);
    expect(noCumplen.length).toBe(
      noAfiliadoListo.score.factores.filter((f) => !f.cumple).length,
    );
  });
});

describe("habeas data (spec §6)", () => {
  it.each(personajes)("%s: el consentimiento sube a columna con timestamp", (_n, curado) => {
    const fila = filaDesdeLeadCurado(curado);
    expect(fila.consentimiento_otorgado).toBe(
      curado.lead.respuestas.consentimiento.otorgado,
    );
    expect(fila.consentimiento_ts).toBe(
      curado.lead.respuestas.consentimiento.timestamp,
    );
  });

  it("sobrevive el viaje de ida y vuelta a la DB", () => {
    const vuelto = leadCuradoDesdeFila(comoFila(afiliadoListo));
    expect(vuelto.lead.respuestas.consentimiento).toEqual(
      afiliadoListo.lead.respuestas.consentimiento,
    );
  });
});

describe("mapeo LeadCurado <-> fila", () => {
  it.each(personajes)("%s: el round trip conserva el lead completo", (_n, curado) => {
    expect(leadCuradoDesdeFila(comoFila(curado))).toEqual(curado);
  });

  it("la fuente del lead llega a la DB (narrativa multi-canal)", () => {
    for (const [, curado] of personajes) {
      expect(filaDesdeLeadCurado(curado).fuente).toBe(curado.lead.evento.fuente);
    }
  });

  it("un lead sin match de enriquecimiento sobrevive", () => {
    const vuelto = leadCuradoDesdeFila(comoFila(nutricion));
    expect(vuelto.lead.perfil.match).toBe(false);
  });
});

describe("orden de la cola del asesor", () => {
  const enCola = (curado: LeadCurado, creado: string): LeadEnCola => ({
    curado,
    re_enganchado_en: null,
    creado_en: creado,
  });

  it("listos arriba, luego restricción de cupo, nutrición al final", () => {
    const desordenada = [
      enCola(nutricion, "2026-07-23T16:20:03-05:00"),
      enCola(noAfiliadoListo, "2026-07-23T15:05:41-05:00"),
      enCola(afiliadoListo, "2026-07-23T14:32:10-05:00"),
    ];

    expect(ordenarCola(desordenada).map((l) => l.curado.score.salida)).toEqual([
      "listo",
      "listo_restriccion_cupo",
      "nutricion",
    ]);
  });

  it("no muta el array original", () => {
    const original = [
      enCola(nutricion, "2026-07-23T16:00:00-05:00"),
      enCola(afiliadoListo, "2026-07-23T14:00:00-05:00"),
    ];
    const copia = [...original];
    ordenarCola(original);
    expect(original).toEqual(copia);
  });

  it("dentro del mismo estado, lo más reciente primero", () => {
    const viejo = enCola(afiliadoListo, "2026-07-23T08:00:00-05:00");
    const nuevo = enCola(afiliadoListo, "2026-07-23T12:00:00-05:00");
    expect(ordenarCola([viejo, nuevo])[0].creado_en).toBe(nuevo.creado_en);
  });

  it("un lead re-enganchado NO se sale de su grupo de nutrición", () => {
    const reEnganchado: LeadEnCola = {
      curado: nutricion,
      re_enganchado_en: "2026-07-23T18:00:00-05:00",
      creado_en: "2026-07-23T16:00:00-05:00",
    };
    const ordenada = ordenarCola([
      reEnganchado,
      enCola(afiliadoListo, "2026-07-23T14:00:00-05:00"),
    ]);

    expect(ordenada[ordenada.length - 1].curado.score.salida).toBe("nutricion");
  });
});
