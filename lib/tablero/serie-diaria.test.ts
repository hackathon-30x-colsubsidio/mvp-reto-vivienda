import { describe, expect, it } from "vitest";
import { diaBogota, serieDiaria } from "./serie-diaria";
import type { LeadEnCola } from "@/lib/types-asesor";
import { afiliadoListo, noAfiliadoListo } from "@/lib/fixtures/leads-curados";

const HOY = new Date("2026-07-24T12:00:00-05:00");

function enFecha(iso: string, afiliado = true): LeadEnCola {
  return {
    curado: afiliado ? afiliadoListo : noAfiliadoListo,
    re_enganchado_en: null,
    creado_en: iso,
  };
}

describe("diaBogota — la zona va fija", () => {
  it("un lead de las 11 p.m. en Bogotá cuenta ese día, no el siguiente", () => {
    // En UTC ya es el 25. Si la zona no fuera fija, la barra saltaría de día.
    expect(diaBogota("2026-07-24T23:30:00-05:00")).toBe("2026-07-24");
  });

  it("un lead de la medianoche en Bogotá cuenta el día que empieza", () => {
    expect(diaBogota("2026-07-24T00:05:00-05:00")).toBe("2026-07-24");
  });
});

describe("serieDiaria — la ventana", () => {
  it("devuelve exactamente `dias` casillas, en orden cronológico", () => {
    const serie = serieDiaria([], 14, HOY);
    expect(serie).toHaveLength(14);
    expect(serie[0].dia).toBe("2026-07-11");
    expect(serie.at(-1)!.dia).toBe("2026-07-24");
    expect([...serie].sort((a, b) => a.dia.localeCompare(b.dia))).toEqual(serie);
  });

  it("los días sin leads salen en 0, no se omiten", () => {
    // Un hueco es información: ese día la pauta no trajo a nadie. Una
    // gráfica que salta de un día al otro miente sobre el ritmo.
    const serie = serieDiaria([enFecha("2026-07-24T09:00:00-05:00")], 3, HOY);
    expect(serie.map((d) => d.total)).toEqual([0, 0, 1]);
  });

  it("ignora lo que cae fuera de la ventana, sin reventar", () => {
    const serie = serieDiaria(
      [enFecha("2026-01-01T09:00:00-05:00"), enFecha("2026-07-24T09:00:00-05:00")],
      7,
      HOY,
    );
    expect(serie.reduce((s, d) => s + d.total, 0)).toBe(1);
  });
});

describe("serieDiaria — el conteo", () => {
  it("afiliados + no afiliados siempre da el total del día", () => {
    const serie = serieDiaria(
      [
        enFecha("2026-07-24T09:00:00-05:00", true),
        enFecha("2026-07-24T10:00:00-05:00", false),
        enFecha("2026-07-23T10:00:00-05:00", false),
      ],
      3,
      HOY,
    );
    for (const dia of serie) {
      expect(dia.afiliados + dia.noAfiliados).toBe(dia.total);
    }
  });

  it("parte el día por afiliación con la misma definición del motor", () => {
    const serie = serieDiaria(
      [
        enFecha("2026-07-24T09:00:00-05:00", true),
        enFecha("2026-07-24T10:00:00-05:00", false),
      ],
      1,
      HOY,
    );
    expect(serie[0]).toMatchObject({ total: 2, afiliados: 1, noAfiliados: 1 });
  });
});
