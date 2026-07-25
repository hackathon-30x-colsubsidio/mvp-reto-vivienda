import { describe, expect, it } from "vitest";
import { leadsCurados, leadsEvento, perfilesConocidos } from "./index";
import { conversaciones } from "./leads";
import { catalogo } from "@/lib/matching/catalogo";
import { construirPreguntas, ingresoDesdeRango } from "@/lib/conversacion/preguntas";
import { franjasDe } from "@/lib/citas";

// Smoke test de los 3 personajes canónicos (costura S6 del plan, ticket 001):
// cumplen los criterios de aceptación del spec (docs/spec.md §5) en su propia
// forma, y —lo que se rompió una vez— viven dentro del catálogo REAL.

describe("fixtures de los 3 personajes", () => {
  it("listo trae 2-3 proyectos y cita", () => {
    expect(leadsCurados.afiliadoListo.score.salida).toBe("listo");
    expect(leadsCurados.afiliadoListo.proyectos.length).toBeGreaterThanOrEqual(2);
    expect(leadsCurados.afiliadoListo.proyectos.length).toBeLessThanOrEqual(3);
    expect(leadsCurados.afiliadoListo.cita).toBeDefined();
  });

  it("listo_restriccion_cupo trae 1-3 proyectos y cita", () => {
    // Carlos es de Ricaurte y con la zona estricta (2026-07-25) solo Payandé
    // le queda en SU zona: 1 proyecto es el resultado honesto, no un bug. La
    // DB lo acepta (db/migracion-001, `listo_tiene_hasta_3_proyectos`).
    expect(leadsCurados.noAfiliadoListo.score.salida).toBe("listo_restriccion_cupo");
    expect(leadsCurados.noAfiliadoListo.proyectos.length).toBeGreaterThanOrEqual(1);
    expect(leadsCurados.noAfiliadoListo.proyectos.length).toBeLessThanOrEqual(3);
    expect(leadsCurados.noAfiliadoListo.cita).toBeDefined();
  });

  it("al no afiliado se le dice el cupo 90/10 en cada proyecto, no se le esconde", () => {
    // Spec 04 D3 (CERRADA): el cupo ya no descarta, marca. Si esto se rompe, o
    // volvió la regla dura (0 proyectos) o se está omitiendo el límite en
    // silencio — las dos cosas contradicen el pitch.
    for (const proyecto of leadsCurados.noAfiliadoListo.proyectos) {
      expect(proyecto.porque, proyecto.nombre).toMatch(/90\/10/);
    }
  });

  it("nutrición no se descarta: tiene razón y trigger, sin proyectos", () => {
    const { score, proyectos, cita } = leadsCurados.nutricion;
    expect(score.salida).toBe("nutricion");
    expect(score.regla_fallida).toBeTruthy();
    expect(score.trigger_nutricion).toBeTruthy();
    expect(proyectos).toHaveLength(0);
    expect(cita).toBeUndefined();
  });

  it("la regla que falló se guarda REDACTADA, no con su nombre técnico", () => {
    // El asesor lee esto tal cual bajo "la regla que no pasó": "cuota_ingreso_40"
    // a secas es jerga interna delante del jurado.
    const regla = leadsCurados.nutricion.score.regla_fallida!;
    expect(regla).not.toBe("cuota_ingreso_40");
    expect(regla).toMatch(/Decreto 583/);
  });

  it("el consentimiento de habeas data está registrado en los 3 personajes", () => {
    for (const persona of Object.values(leadsCurados)) {
      expect(persona.lead.respuestas.consentimiento.otorgado).toBe(true);
      expect(persona.lead.respuestas.consentimiento.timestamp).toBeTruthy();
    }
  });

  // ── Lo que se rompió una vez y no puede volver a pasar ──────────────

  it("el proyecto de entrada de cada personaje EXISTE en el catálogo real", () => {
    // Tenían proyectos inventados ("Torres de Bellavista") y ciudades que el
    // catálogo no tiene (Medellín): el motor no encontraba el proyecto de
    // entrada y calificaba contra otro, y la ficha prometía una ciudad
    // imposible de recomendar.
    const nombres = new Set(catalogo.map((p) => p.nombre));
    for (const [personaje, evento] of Object.entries(leadsEvento)) {
      expect(
        nombres,
        `${personaje}: "${evento.proyecto_interes}" no está en el catálogo real`,
      ).toContain(evento.proyecto_interes);
    }
  });

  it("la ciudad conocida de cada personaje existe en el catálogo real", () => {
    const ciudades = catalogo.map((p) => p.ciudad);
    for (const [personaje, perfil] of Object.entries(perfilesConocidos)) {
      if (!perfil.ciudad) continue;
      expect(
        ciudades.some((c) => c.includes(perfil.ciudad!)),
        `${personaje}: ${perfil.ciudad} no es la ciudad de ningún proyecto`,
      ).toBe(true);
    }
  });

  it("los proyectos recomendados tienen franjas de cita ofrecibles", () => {
    for (const persona of Object.values(leadsCurados)) {
      for (const proyecto of persona.proyectos) {
        expect(
          franjasDe(proyecto.proyecto_id).length,
          `${proyecto.nombre} no tiene sala en slots.json`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("a quien ya tiene rango de ingreso NO se le repregunta (criterio 1)", () => {
    const { perfil, respuestas } = leadsCurados.afiliadoListo.lead;
    const campos = construirPreguntas(perfil).map((p) => p.campo);

    expect(perfil.rango_ingreso).toBeTruthy();
    expect(campos).not.toContain("rango_ingreso_hogar");
    expect(campos).not.toContain("zona_interes");
    // Y aun así el motor recibe el número: el punto medio del rango conocido.
    expect(respuestas.ingreso_hogar_mensual).toBe(ingresoDesdeRango(perfil.rango_ingreso!));
  });

  it("el hilo sembrado es la conversación real, no una transcripción a mano", () => {
    const { hilo, lead } = conversaciones.afiliadoListo;
    for (const paso of construirPreguntas(lead.perfil)) {
      expect(
        hilo.some((m) => m.mensaje === paso.pregunta),
        `la pregunta de ${paso.campo} no quedó en el hilo`,
      ).toBe(true);
    }
  });
});
