import { describe, expect, it } from "vitest";
import type { PerfilConocido } from "@/lib/types";
import { replayEscenario, type Turno } from "./replay";

// =====================================================================
// LA RED, NIVEL 2 — conversaciones completas.
//
// Protege el refactor de la rama 5: cuando la lógica salga de
// `ChatWhatsApp.tsx` al reducer, estas afirmaciones tienen que seguir
// dando lo mismo. Lo que se fija aquí es la COMPOSICIÓN — quién gana
// entre el desvío y el paso, cuándo avanza el índice, qué llega al
// `Lead` al final — que es justo lo que hoy no se puede probar sin
// montar React.
//
// ⚠️ CONGELA EL COMPORTAMIENTO ACTUAL, NO EL DESEADO.
// =====================================================================

const SIN_DATOS: PerfilConocido = { match: false };
const CONOCIDO: PerfilConocido = {
  match: true,
  afiliado: true,
  ciudad: "Bogotá",
  rango_ingreso: "3-5 SMMLV",
  rango_edad: "36_45",
};

/** Las 7 respuestas que llenan todo, para el perfil sin datos. */
const LIMPIAS = [
  "sería la primera",
  "con mi pareja",
  "4.500.000",
  "ninguno",
  "tengo 29",
  "al día",
  "Bogotá, por el norte",
];

const tipos = (turnos: Turno[]) => turnos.map((t) => t.tipo);

// ── el camino feliz ────────────────────────────────────────

describe("conversación limpia", () => {
  const r = replayEscenario({ perfil: SIN_DATOS, tecleado: LIMPIAS });

  it("hace las 7 preguntas y las cierra todas", () => {
    expect(r.pasos).toHaveLength(7);
    expect(tipos(r.turnos)).toEqual(Array(7).fill("respondio"));
    expect(r.pasoPendiente).toBeNull();
    expect(r.camposVacios).toEqual([]);
  });

  it("deja el Lead que el motor necesita", () => {
    expect(r.respuestas).toMatchObject({
      tiene_vivienda: false,
      composicion_familiar: "pareja",
      ingreso_hogar_mensual: 4_500_000,
      subsidios: [],
      rango_edad: "20_35",
      situacion_crediticia: "buena",
      zona_interes: "Bogotá",
    });
  });

  it("cada respuesta recibe su acuse — es lo que separa conversar de encuestar", () => {
    for (const turno of r.turnos) {
      expect(turno.tipo).toBe("respondio");
      if (turno.tipo === "respondio") expect(turno.acuse).toBeTruthy();
    }
  });
});

// ── lo que ya funciona bien y hay que no romper ────────────

describe("desvíos: se atiende la duda y NO se pierde el paso", () => {
  const r = replayEscenario({
    perfil: SIN_DATOS,
    tecleado: ["¿cuánto cuesta ZARZAL?", "quiero hablar con alguien", ...LIMPIAS],
  });

  it("el desvío no consume la pregunta pendiente", () => {
    expect(tipos(r.turnos)).toEqual([
      "desvio_duda",
      "desvio_asesor",
      ...Array(7).fill("respondio"),
    ]);
  });

  it("el Lead sale igual de completo que sin desvíos", () => {
    expect(r.camposVacios).toEqual([]);
    expect(r.respuestas).toEqual(
      replayEscenario({ perfil: SIN_DATOS, tecleado: LIMPIAS }).respuestas,
    );
  });

  it("la duda de precio se responde con el catálogo real y su 'desde'", () => {
    const duda = r.turnos[0];
    expect(duda.tipo).toBe("desvio_duda");
    if (duda.tipo !== "desvio_duda") return;
    expect(duda.clase).toBe("precio");
    expect(duda.proyecto).toBe("ZARZAL");
    // Sin LLM la respuesta ya es correcta sola: el demo no depende de la IA.
    expect(duda.respuesta).toContain("ZARZAL");
    expect(duda.respuesta).toMatch(/desde/i);
  });
});

describe("el ingreso se confirma antes de calificar con él", () => {
  it("repregunta una vez y a la segunda sigue, sin inventar el monto", () => {
    const r = replayEscenario({
      perfil: SIN_DATOS,
      tecleado: [
        "sería la primera",
        "con mi pareja",
        "2+2",
        "2+2",
        "ninguno",
        "tengo 29",
        "al día",
        "Bogotá",
      ],
    });

    expect(tipos(r.turnos)).toEqual([
      "respondio",
      "respondio",
      "repregunta", // insistir una vez es cuidado
      "respondio", // insistir dos veces sería interrogar
      "respondio",
      "respondio",
      "respondio",
      "respondio",
    ]);
    // El texto crudo llega al asesor; el número NO se adivina.
    expect(r.respuestas.rango_ingreso_hogar).toBe("2+2");
    expect(r.respuestas.ingreso_hogar_mensual).toBeUndefined();
  });
});

describe("criterio de aceptación 1 — no se repregunta lo que ya sabemos", () => {
  const r = replayEscenario({
    perfil: CONOCIDO,
    tecleado: ["sería la primera", "con mi pareja", "ninguno", "al día"],
  });

  it("a quien reconocimos por su cédula se le pregunta menos", () => {
    expect(r.pasos.map((p) => p.campo)).toEqual([
      "tiene_vivienda",
      "composicion_familiar",
      "subsidios",
      "situacion_crediticia",
    ]);
  });

  it("el motor igual recibe ingreso y edad, desde el perfil", () => {
    // Punto medio de "3-5 SMMLV" — la conversación nunca los preguntó.
    expect(r.respuestas.ingreso_hogar_mensual).toBe(4 * 1_750_905);
    expect(r.respuestas.rango_edad).toBe("36_45");
  });

  // El completado desde el perfil pasa en `terminar()`, o sea SOLO al
  // consumir el último paso. Quien abandona a mitad no tiene ingreso,
  // aunque su cédula lo trajera. Si esto se relaja, un escenario de
  // abandono mentiría sobre qué se alcanzó a saber del lead.
  it("pero solo al terminar: quien abandona a mitad no lo recibe", () => {
    const aMedias = replayEscenario({
      perfil: CONOCIDO,
      tecleado: ["sería la primera", "con mi pareja"],
    });
    expect(aMedias.pasoPendiente).toBe("subsidios");
    expect(aMedias.respuestas.ingreso_hogar_mensual).toBeUndefined();
    expect(aMedias.respuestas.rango_edad).toBeUndefined();
  });
});

describe("el campo vacío no hace nada", () => {
  it("ni avanza el paso ni ensucia el hilo", () => {
    const r = replayEscenario({ perfil: SIN_DATOS, tecleado: ["", "   ", "sería la primera"] });
    expect(tipos(r.turnos)).toEqual(["ignorado", "ignorado", "respondio"]);
    expect(r.pasoPendiente).toBe("composicion_familiar");
  });
});

// ── los huecos, medidos ────────────────────────────────────

describe("HOY una conversación sucia termina normal y pierde datos", () => {
  // Todas las respuestas son plausibles: así contesta la gente de
  // verdad. Ninguna es un sabotaje.
  const r = replayEscenario({
    perfil: SIN_DATOS,
    tecleado: [
      "pues no sé", // ya NO se lee como "primera vivienda"
      "vivo con mi mamá y mi hermana", // ⚠️ se pierde
      "2 palos",
      "no tngo nada",
      "jajaja", // ⚠️ se pierde
      "jajaja", // ⚠️ queda como "nunca pidió crédito"
      "cerca al colegio de los niños", // ⚠️ entra al matcher como ubicación
    ],
  });

  // ✅ VOLTEADO 2026-07-26 (la red pasó a correr el reducer real). Este test
  // afirmaba que la conversación se completaba con 7 "respondio" y sin una sola
  // señal de alarma. Ya no: donde no se entiende, se REPREGUNTA. Tres de las
  // siete entradas no se entienden, así que la persona gasta esos turnos en
  // volver a contestar y la conversación **queda a mitad** en vez de terminar
  // fingiendo que se supo todo.
  //
  // El precio de perder el silencio es que una persona que escribe sucio
  // conversa más: son 7 mensajes para 4 preguntas.
  it("ya NO se completa en silencio: repregunta donde no entendió", () => {
    expect(tipos(r.turnos)).toEqual([
      "repregunta", // "pues no sé" a tiene_vivienda
      "respondio",
      "repregunta", // "2 palos" a composicion_familiar
      "respondio",
      "repregunta", // "jajaja" al ingreso
      "respondio",
      "respondio",
    ]);
    // Se quedó preguntando la edad: nunca llegó al final.
    expect(r.pasoPendiente).toBe("rango_edad");
  });

  // El rastro que el asesor lee en su ficha. Antes de la rama 5 el dato se
  // perdía con un acuse amable y **nadie** se enteraba: ni la persona, ni el
  // motor, ni el asesor.
  it("y lo que no se entendió queda DICHO en el hilo, no en silencio", () => {
    expect(r.notasSistema.length).toBeGreaterThan(0);
    expect(r.notasSistema.join(" ")).toMatch(/No se pudo interpretar/);
  });

  // Los campos vacíos ya no son "el dato que se perdió en silencio": son los
  // que la conversación todavía no alcanzó a preguntar, porque se quedó a
  // mitad. `situacion_crediticia` es el que importa de esta lista — antes
  // guardaba `sin_info`, que en la ficha se lee como "nunca ha pedido
  // crédito", o sea un hecho sobre la vida financiera de alguien inventado a
  // partir de un "jajaja".
  it("los campos sin dato se declaran vacíos, no se rellenan", () => {
    expect(r.camposVacios).toEqual([
      "composicion_familiar",
      "rango_edad",
      "situacion_crediticia",
      "zona_interes",
    ]);
  });

  // ⚠️ BUG VIVO, y esta red es la que lo destapó (2026-07-26).
  //
  // `tiene_vivienda` vuelve a quedar en `false` — la misma afirmación falsa
  // que el bug 1 arregló, por otro camino. Ya no la causa "pues no sé": la
  // causa la regla de "a la segunda se sigue". Al repreguntar por la vivienda,
  // el siguiente mensaje se consume para ESE campo aunque esté claramente
  // contestando otra cosa, y `interpretarVivienda("vivo con mi mamá y mi
  // hermana")` devuelve `false` (medido; también con "vivo con mi pareja").
  //
  // Cuesta lo mismo que costaba el bug 1: 5 puntos de 100 en el factor
  // `ya_tiene_vivienda` y un "No tiene vivienda propia" afirmado en la ficha
  // del asesor donde la verdad es "No informado".
  //
  // Se congela en vez de arreglarse porque arreglarlo mueve el puntaje de los
  // leads sembrados, y eso se ratifica antes de escribirlo (§0 del plan).
  // El día que se arregle, este test falla — y esa falla es la señal.
  it("⚠️ BUG CONGELADO — todavía afirma una vivienda que nadie declaró", () => {
    expect(r.respuestas.tiene_vivienda).toBe(false);
  });
});

describe("preguntar mucho ya no es un bucle: al tercero se ofrece un asesor", () => {
  // ✅ VOLTEADO 2026-07-26. Este test afirmaba que NO había tope y que se podía
  // preguntar indefinidamente sin que la conversación se moviera. La rama 5
  // puso el tope y la red no se había enterado.
  it("cuatro dudas seguidas: se atienden todas, y al tercer turno sin avanzar entra el ofrecimiento", () => {
    const r = replayEscenario({
      perfil: SIN_DATOS,
      tecleado: ["¿cuánto vale?", "¿y dónde queda?", "¿cuánto cuesta?", "¿cuánto vale eso?"],
    });

    // Atender no cambió: cada duda se responde y el paso NO avanza, para que
    // salirse del guion no le cueste el dato que estaba dando.
    expect(tipos(r.turnos)).toEqual(Array(4).fill("desvio_duda"));
    expect(r.pasoPendiente).toBe("tiene_vivienda");
    expect(r.camposVacios).toHaveLength(7);

    // Lo nuevo: queda el rastro de que se le ofreció un asesor. Ofrecer no es
    // cortar — la conversación sigue igual después.
    expect(r.notasSistema).toHaveLength(1);
    expect(r.notasSistema[0]).toMatch(/3 preguntas seguidas/);
    expect(r.notasSistema[0]).toMatch(/la conversación continúa/);
  });
});

describe("lo que no es una respuesta ya no se traga como si lo fuera", () => {
  // ✅ VOLTEADO 2026-07-26. Antes esto se consumía COMO SI FUERA el dato que se
  // pidió y el paso avanzaba: la persona creía que había contestado y el motor
  // se quedaba sin la señal. Ahora no se entiende, y no se entiende en voz
  // alta: se repregunta sin avanzar.
  it.each([["q vale"], ["cuentame un chiste"]])(
    "'%s' ya no avanza el paso: se repregunta",
    (texto) => {
      const r = replayEscenario({ perfil: SIN_DATOS, tecleado: [texto] });
      expect(tipos(r.turnos)).toEqual(["repregunta"]);
      // Sigue parado en la misma pregunta, no en la siguiente.
      expect(r.pasoPendiente).toBe("tiene_vivienda");
    },
  );

  // ✅ VOLTEADO 2026-07-26 — era el caso más caro. "eres un bot?" caía en duda
  // `general` y contestaba "esa no te la puedo confirmar sin inventarte nada":
  // una evasiva justo en la pregunta donde la honestidad es lo único que
  // importa. La rama 5 lo intercepta antes del desvío (punto 4 del plan,
  // consultado y aprobado) y Sara se declara IA.
  it("a '¿eres un bot?' ahora se le dice la verdad, y no le cuesta el paso", () => {
    const r = replayEscenario({ perfil: SIN_DATOS, tecleado: ["eres un bot?"] });
    expect(tipos(r.turnos)).toEqual(["identidad"]);
    expect(r.pasoPendiente).toBe("tiene_vivienda");
  });
});
