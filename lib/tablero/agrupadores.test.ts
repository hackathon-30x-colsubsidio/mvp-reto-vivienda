import { describe, expect, it } from "vitest";
import { AGRUPADORES, AGRUPADOR_ACTIVO, POR_AFILIACION, puntajeDe } from "./agrupadores";
import { METRICAS } from "./metricas";
import { colaHistoricaSintetica } from "@/lib/fixtures/cola-historica";
import { afiliadoEfectivo } from "@/lib/scoring";
import type { DatosTablero } from "./tipos";

const HOY = new Date("2026-07-24T18:00:00-05:00");

const DATOS: DatosTablero = {
  leads: colaHistoricaSintetica(HOY),
  origen: "fixtures",
  hoy: HOY,
};

const VACIO: DatosTablero = { leads: [], origen: "fixtures", hoy: HOY };

describe("agrupadores — la invariante de que nadie se pierde", () => {
  // Un lead que no aparece en ningún grupo es un lead que el asesor
  // nunca va a llamar. Se verifica para TODO agrupador registrado, no
  // solo para el activo: el siguiente que alguien agregue queda cubierto
  // por este test sin escribir nada.
  for (const agrupador of AGRUPADORES) {
    it(`"${agrupador.id}" reparte todos los leads, sin perder ni duplicar`, () => {
      const repartidos = agrupador.grupos(DATOS).flatMap((g) => g.leads);

      expect(repartidos).toHaveLength(DATOS.leads.length);
      expect(new Set(repartidos.map((l) => l.curado.lead.evento.lead_id)).size).toBe(
        DATOS.leads.length,
      );
    });

    it(`"${agrupador.id}" ordena cada grupo por puntaje descendente`, () => {
      for (const grupo of agrupador.grupos(DATOS)) {
        const puntajes = grupo.leads.map(puntajeDe);
        expect(puntajes).toEqual([...puntajes].sort((a, b) => b - a));
      }
    });

    it(`"${agrupador.id}" no revienta con la cola vacía`, () => {
      for (const grupo of agrupador.grupos(VACIO)) {
        expect(grupo.leads).toEqual([]);
      }
    });
  }
});

describe("POR_AFILIACION — el eje que se pidió", () => {
  it("es el agrupador activo del tablero", () => {
    expect(AGRUPADOR_ACTIVO).toBe(POR_AFILIACION);
  });

  it("cada lead cae del lado que dice afiliadoEfectivo", () => {
    // La misma función que usa el puntaje para repartir sus 20 puntos.
    // Si aquí se dedujera la afiliación por otro lado, la pantalla
    // podría mostrar un lead en el grupo de afiliados y puntuarlo como
    // no afiliado.
    const [afiliados, noAfiliados] = POR_AFILIACION.grupos(DATOS);

    expect(afiliados.leads.every((l) => afiliadoEfectivo(l.curado.lead))).toBe(true);
    expect(noAfiliados.leads.every((l) => !afiliadoEfectivo(l.curado.lead))).toBe(true);
    expect(afiliados.leads.length).toBeGreaterThan(0);
    expect(noAfiliados.leads.length).toBeGreaterThan(0);
  });
});

describe("METRICAS — el contrato del registry", () => {
  it("cada métrica trae su fuente: sin descripción no entra", () => {
    for (const metrica of METRICAS) {
      expect(metrica.descripcion.trim().length, `${metrica.id} sin descripción`).toBeGreaterThan(
        10,
      );
    }
  });

  it("los ids no se repiten (son la key del render)", () => {
    const ids = METRICAS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todas calculan un valor no vacío con datos reales", () => {
    for (const metrica of METRICAS) {
      expect(metrica.calcular(DATOS).valor.trim(), `${metrica.id}`).not.toBe("");
    }
  });

  it("ninguna revienta ni divide por cero con la cola vacía", () => {
    // El tablero se abre por primera vez sin un solo lead: no puede
    // mostrar "NaN%" en la pantalla del jurado.
    for (const metrica of METRICAS) {
      const salida = metrica.calcular(VACIO);
      expect(salida.valor, `${metrica.id}`).not.toMatch(/NaN|Infinity|undefined/);
      expect(salida.detalle ?? "", `${metrica.id}`).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
});

describe("las dos métricas del mentor que ya se podían (ticket 025)", () => {
  const metrica = (id: string) => METRICAS.find((m) => m.id === id)!;

  it("el proyecto más pedido cuenta el interés declarado, no lo recomendado", () => {
    const salida = metrica("proyecto-mas-pedido").calcular(DATOS);
    const declarados = DATOS.leads
      .map((l) => l.curado.lead.evento.proyecto_interes)
      .filter(Boolean);

    // El valor es uno de los proyectos por los que alguien entró, y es el
    // más repetido: si contara recomendaciones, podría salir uno que nadie pidió.
    expect(declarados).toContain(salida.valor);
    const veces = declarados.filter((p) => p === salida.valor).length;
    for (const otro of new Set(declarados)) {
      expect(veces).toBeGreaterThanOrEqual(declarados.filter((p) => p === otro).length);
    }
  });

  // El mentor pidió atribución con campaña y QR, y eso NO existe. Mostrar
  // canal llamándolo atribución sería la caja negra que AGENTS.md prohíbe.
  it("el canal se declara como canal en grueso, nunca como atribución", () => {
    const canal = metrica("canal-ingreso");
    expect(canal.descripcion).toMatch(/NO atribución de campaña/i);
    expect(canal.calcular(DATOS).detalle).toMatch(/solo el canal/i);
  });
});
