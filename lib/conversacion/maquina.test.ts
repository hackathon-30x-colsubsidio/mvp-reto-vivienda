import { describe, expect, it } from "vitest";
import { construirPreguntas } from "./preguntas";
import { conversaciones } from "@/lib/fixtures/leads";
import * as perfiles from "@/lib/fixtures/perfiles-conocidos";
import { RESPUESTA_CONSENTIMIENTO } from "./preguntas";
import {
  cifrasDe,
  decidirTurno,
  esPreguntaDeIdentidad,
  MAX_DESVIOS_SEGUIDOS,
  TEXTO_ES_IA,
  TEXTO_NO_ENTENDI,
  type ContextoTurno,
} from "./maquina";
import type { CampoPregunta } from "./acciones";

// =====================================================================
// La decisión del turno, fuera de React (rama 5).
//
// El riesgo de este módulo no es que clasifique de menos: es que
// clasifique de MÁS. Contestarle "de eso no sé nada" o "sí, soy una IA"
// a alguien que estaba respondiendo la pregunta rompe la conversación
// de una forma que el silencio de hoy no rompe. Por eso el corazón del
// archivo es el barrido de abajo, no los casos sueltos.
// =====================================================================

const CAMPO_INICIAL: ContextoTurno = { campo: "tiene_vivienda", yaRespondidos: [] };

const ctx = (campo: CampoPregunta, yaRespondidos: CampoPregunta[] = []): ContextoTurno => ({
  campo,
  yaRespondidos,
});

// ── el barrido: nada legítimo puede desviarse ──────────────

describe("BARRIDO — ninguna respuesta real se confunde con otra cosa", () => {
  /**
   * Lo que TECLEAN los 3 personajes del demo, sacado del hilo que produce
   * `replayGuion` — no de una lista escrita a mano, que envejecería aparte.
   * Se descarta el consentimiento, que es un botón y no una respuesta.
   */
  const PERSONAJES = (["afiliadoListo", "noAfiliadoListo", "nutricion"] as const).map(
    (id) => ({
      id,
      perfil: perfiles[id],
      tecleadas: conversaciones[id].hilo
        .filter((m) => m.rol === "lead" && m.mensaje !== RESPUESTA_CONSENTIMIENTO)
        .map((m) => m.mensaje),
    }),
  );

  /** Todo lo tecleado, más las etiquetas de los chips de los 7 pasos. */
  const REALES = [
    ...PERSONAJES.flatMap((p) => p.tecleadas),
    ...construirPreguntas({ match: false }).flatMap((p) =>
      (p.opciones ?? []).map((o) => o.etiqueta),
    ),
  ];

  it("hay material que barrer", () => {
    expect(REALES.length).toBeGreaterThan(15);
  });

  it.each(REALES)("«%s» no se lee como pregunta de identidad", (texto) => {
    expect(esPreguntaDeIdentidad(texto)).toBe(false);
  });

  // Cada respuesta real, contra el paso al que de verdad contesta. Si la
  // máquina clasifica de más, el demo se rompe aquí antes que en cámara.
  it.each(PERSONAJES)("$id sigue produciendo respuestas, no desvíos", ({ perfil, tecleadas }) => {
    const pasos = construirPreguntas(perfil);
    expect(tecleadas).toHaveLength(pasos.length);
    pasos.forEach((paso, i) => {
      const accion = decidirTurno(tecleadas[i], ctx(paso.campo));
      expect(
        accion.tipo,
        `"${tecleadas[i]}" → ${paso.campo} salió como ${accion.tipo}`,
      ).toBe("responder_paso");
    });
  });
});

// ── lo que sí debe desviarse ───────────────────────────────

describe("clasificación del turno", () => {
  it("una duda con proyecto es duda, y trae el proyecto", () => {
    const a = decidirTurno("¿cuánto cuesta ZARZAL?", CAMPO_INICIAL);
    expect(a.tipo).toBe("responder_duda");
    if (a.tipo !== "responder_duda") return;
    expect(a.clase).toBe("precio");
    expect(a.proyecto?.nombre).toBe("ZARZAL");
  });

  it("pedir un humano es handoff", () => {
    expect(decidirTurno("quiero hablar con un asesor", CAMPO_INICIAL).tipo).toBe(
      "handoff_asesor",
    );
  });

  it("una risa sobre un paso que no la entiende es fuera de tema", () => {
    expect(decidirTurno("jajaja", ctx("composicion_familiar")).tipo).toBe("fuera_de_tema");
  });

  it("un emoji suelto también", () => {
    expect(decidirTurno("🎉", ctx("composicion_familiar")).tipo).toBe("fuera_de_tema");
  });

  // El caso medido del hueco 2: NO es fuera de tema, es un hogar real que el
  // regex no supo leer. Que caiga aquí sería peor que el silencio de hoy.
  it("un hogar que el regex no entiende NO es fuera de tema", () => {
    const a = decidirTurno("vivo con mi mamá y mi hermana", ctx("composicion_familiar"));
    expect(a.tipo).toBe("no_entendido");
  });

  it("una corrección sobre algo ya dicho se reconoce", () => {
    const a = decidirTurno(
      "no, me equivoqué, son 3 millones",
      ctx("subsidios", ["rango_ingreso_hogar"]),
    );
    expect(a.tipo).toBe("corregir_dato");
    if (a.tipo !== "corregir_dato") return;
    expect(a.campo).toBe("rango_ingreso_hogar");
  });

  it("el ingreso ilegible pide confirmación, no se declara fuera de tema", () => {
    // "2+2" ES una cuenta, pero al paso del ingreso le toca repreguntar.
    expect(decidirTurno("2+2", ctx("rango_ingreso_hogar")).tipo).toBe("confirmar_dato");
  });
});

// ── la identidad ───────────────────────────────────────────

describe("¿eres un bot?", () => {
  it.each([
    ["¿eres un bot?"],
    ["eres un bot"],
    ["esto es una IA?"],
    ["¿eres humana?"],
    ["sos un robot?"],
    ["¿hablo con una persona?"],
    ["eres una máquina"],
  ])("%s se reconoce como pregunta de identidad", (texto) => {
    expect(esPreguntaDeIdentidad(texto)).toBe(true);
    expect(decidirTurno(texto, CAMPO_INICIAL).tipo).toBe("identidad");
  });

  it("y se responde diciendo la verdad, no una evasiva", () => {
    // Hasta esta rama caía en duda `general` y contestaba "esa no te la puedo
    // confirmar sin inventarte nada" — lo peor posible en esta pregunta.
    expect(TEXTO_ES_IA).toMatch(/asistente de IA/i);
    expect(TEXTO_ES_IA).toMatch(/asesor/i);
    expect(TEXTO_ES_IA).not.toMatch(/no te la puedo confirmar/i);
  });
});

// ── las constantes que la conversación usa ─────────────────

describe("cifrasDe — lo que Sara puede citar del porqué del motor", () => {
  it.each([
    ["Precio desde $194.023.050", [194023050]],
    ["el 64% de los compradores", [64]],
    ["dentro del máximo de $312.392.645", [312392645]],
    ["sin números", []],
  ])("saca las cifras de «%s»", (texto, esperado) => {
    expect(cifrasDe(texto)).toEqual(esperado);
  });

  // El caso que motivó la función: el `porque` real de un proyecto trae el
  // precio, el techo del 40% y los porcentajes de la similitud. Sin ellos el
  // guard leía la recomendación de Sara como inventada y el lead veía siempre
  // el texto determinista.
  it("de un porqué real saca el precio y el techo del gate", () => {
    const porque =
      "Precio desde $194.023.050, dentro del máximo de $312.392.645 que le permite el tope del 40% del ingreso (Decreto 583 de 2025); el 64% de los compradores de este proyecto es afiliado";
    expect(cifrasDe(porque)).toEqual(
      expect.arrayContaining([194023050, 312392645, 40, 583, 2025, 64]),
    );
  });
});

describe("los textos nuevos respetan las reglas de redacción del repo", () => {
  it("el 'no te entendí' se disculpa Sara, no culpa a la persona", () => {
    expect(TEXTO_NO_ENTENDI).toMatch(/perd[óo]name/i);
  });

  it.each([TEXTO_NO_ENTENDI, TEXTO_ES_IA])("«%s» cabe en una burbuja", (texto) => {
    // Las mismas cotas que hace cumplir el guard (guardas.ts): 3 líneas.
    expect(texto.split("\n").filter((l) => l.trim()).length).toBeLessThanOrEqual(3);
  });

  it("el tope de desvíos es un número, no una promesa vaga", () => {
    expect(MAX_DESVIOS_SEGUIDOS).toBe(3);
  });
});
