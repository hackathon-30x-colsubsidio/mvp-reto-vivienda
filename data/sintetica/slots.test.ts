import { describe, it, expect } from "vitest";
import slots from "./slots.json";
import { leadsCurados, proyectosRecomendados } from "@/lib/fixtures";
import type { LeadCurado } from "@/lib/types";

// =====================================================================
// Ticket 005 — el catálogo de franjas tiene que hablar el mismo idioma
// que los personajes canónicos (ticket 001 / costura S6 del plan).
//
// Este test existe por un bug real: slots.json arrancó con ids
// inventados ("torres-bellavista") mientras las fixtures usaban "p-07".
// El chat pedía franjas de un proyecto y recibía una lista vacía, sin
// que nada fallara. Justo la contradicción entre tracks que la costura
// S6 advierte, y que solo se ve corriendo la app.
// =====================================================================

const franjasPlanas = slots.salas.flatMap((sala) =>
  sala.franjas.map((fecha) => ({ ...sala, fecha })),
);

describe("catálogo de franjas (ticket 005)", () => {
  it("cada proyecto recomendado a un lead listo tiene franjas ofrecibles", () => {
    const idsConFranjas = new Set(slots.salas.map((s) => s.proyecto_id));

    const idsRecomendados = [
      ...proyectosRecomendados.afiliadoListo,
      ...proyectosRecomendados.noAfiliadoListo,
    ].map((p) => p.proyecto_id);

    expect(idsRecomendados.length).toBeGreaterThan(0);
    for (const id of idsRecomendados) {
      expect(idsConFranjas, `el proyecto ${id} no tiene sala en slots.json`).toContain(
        id,
      );
    }
  });

  it("el nombre del proyecto coincide con el de las fixtures", () => {
    const nombrePorId = new Map(
      [
        ...proyectosRecomendados.afiliadoListo,
        ...proyectosRecomendados.noAfiliadoListo,
      ].map((p) => [p.proyecto_id, p.nombre]),
    );

    for (const sala of slots.salas) {
      const esperado = nombrePorId.get(sala.proyecto_id);
      if (esperado) expect(sala.proyecto).toBe(esperado);
    }
  });

  it("las citas ya agendadas de los personajes salen del catálogo", () => {
    const conCita = Object.values(leadsCurados).filter(
      (c): c is LeadCurado & { cita: NonNullable<LeadCurado["cita"]> } =>
        Boolean(c.cita),
    );
    expect(conCita.length).toBeGreaterThan(0);

    for (const { cita, lead } of conCita) {
      const existe = franjasPlanas.some(
        (f) => f.fecha === cita.fecha && f.sala_ventas === cita.sala_ventas,
      );
      expect(
        existe,
        `la cita de ${lead.evento.nombre} (${cita.fecha} en ${cita.sala_ventas}) no está en slots.json`,
      ).toBe(true);
    }
  });

  it("no hay franjas duplicadas en la misma sala", () => {
    for (const sala of slots.salas) {
      expect(new Set(sala.franjas).size).toBe(sala.franjas.length);
    }
  });

  it("todas las fechas son ISO parseables", () => {
    for (const f of franjasPlanas) {
      expect(Number.isNaN(Date.parse(f.fecha)), f.fecha).toBe(false);
    }
  });
});
