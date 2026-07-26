import { describe, expect, it } from "vitest";
import {
  accionDeDesvio,
  detectarDesvio,
  esFueraDeTema,
  mensajeFueraDeTema,
  mensajeHandoffAsesor,
  repreguntar,
  respuestaDeterministaDuda,
} from "./desvio";
import { catalogo } from "@/lib/matching/catalogo";
import { pesos } from "@/lib/formato";
import { construirPreguntas } from "./preguntas";

// =====================================================================
// El desvío tiene DOS obligaciones, y la segunda pesa más que la primera:
//
//   1. atrapar la duda y la petición de asesor (spec 02 D6);
//   2. NO tocar nada de lo que hoy funciona.
//
// Por eso los contraejemplos son el corazón de este archivo: incluyen
// las respuestas que los 3 personajes del demo TECLEAN de verdad
// (lib/fixtures/leads.ts). Si una de ellas empieza a desviar, el
// personaje sembrado y el conversado dejan de coincidir y el demo se
// parte por la mitad.
// =====================================================================

describe("detectarDesvio — lo que SÍ se sale del guion", () => {
  it.each([
    "quiero hablar con un asesor",
    "me pueden llamar?",
    "prefiero hablar con una persona",
    "¿hay alguien humano ahí?",
  ])("pedir un humano se detecta: %s", (texto) => {
    expect(detectarDesvio(texto)).toEqual({ tipo: "asesor" });
  });

  it.each([
    ["¿cuánto vale?", "precio"],
    ["cuanto cuesta la arboleda", "precio"],
    ["¿dónde queda ABETO?", "ubicacion"],
    ["¿cuánto me dan de subsidio?", "subsidio"],
    ["¿y eso cuándo lo sabré?", "general"],
  ])("la duda se detecta y se clasifica: %s", (texto, clase) => {
    expect(detectarDesvio(texto)).toMatchObject({ tipo: "duda", clase });
  });

  it("reconoce el proyecto que la persona nombró", () => {
    const desvio = detectarDesvio("cuanto cuesta la arboleda");
    expect(desvio).toMatchObject({ tipo: "duda" });
    expect(desvio && "proyecto" in desvio && desvio.proyecto?.nombre).toBe("LA ARBOLEDA");
  });
});

describe("detectarDesvio — lo que NO se puede tocar", () => {
  // Las de arriba son respuestas legítimas a los pasos de hoy; las de abajo
  // son, textualmente, lo que teclean Diana, Carlos y Yuliana en el demo.
  it.each([
    "sería la primera",
    "4.500.000",
    "2 millones y medio",
    "Bogotá, por el norte",
    "no sé si aplico",
    "no sé",
    "espero que tenga excelentes zonas comunes",
    "tengo una cuota del carro que estoy pagando",
    "como te dije, estoy al día con el crédito",
    // Guion de los personajes (lib/fixtures/leads.ts):
    "Sería la primera",
    "Mi Casa Ya",
    "Estoy al día con todo",
    "No, sería la primera",
    "4.000.000 entre mi esposa y yo",
    "Ninguno todavía",
    "Al día, nunca me he atrasado",
    "No, vivo en arriendo",
    "Entre 1 y 2 salarios mínimos",
    "Ninguno",
    "Tuve una mora hace poco",
    "Bogotá, por el sur",
  ])("sigue siendo una respuesta, no un desvío: %s", (texto) => {
    expect(detectarDesvio(texto)).toBeNull();
  });
});

describe("la respuesta sin LLM ya es correcta por sí sola", () => {
  const arboleda = catalogo.find((p) => p.nombre === "LA ARBOLEDA")!;

  it("el precio sale del catálogo real, con su 'desde'", () => {
    const texto = respuestaDeterministaDuda({
      tipo: "duda",
      clase: "precio",
      proyecto: arboleda,
    });
    expect(texto).toContain(pesos(arboleda.precio_desde));
    expect(texto).toContain("desde");
  });

  it("sin proyecto nombrado, usa el proyecto por el que entró el lead", () => {
    const texto = respuestaDeterministaDuda(
      { tipo: "duda", clase: "precio" },
      "LA ARBOLEDA",
    );
    expect(texto).toContain(pesos(arboleda.precio_desde));
  });

  it("el subsidio se responde SIN cifras: las fuentes se contradicen", () => {
    const texto = respuestaDeterministaDuda({ tipo: "duda", clase: "subsidio" });
    expect(texto).not.toContain("$");
    expect(texto).toMatch(/cajas de compensaci/i);
    expect(texto).toMatch(/Mi Casa Ya/);
  });

  it("lo que no se sabe se dice, no se rellena", () => {
    const texto = respuestaDeterministaDuda({ tipo: "duda", clase: "general" });
    expect(texto).toMatch(/no.*inventarte nada/i);
  });
});

describe("esFueraDeTema — el refinamiento del `no_entendido`", () => {
  // Solo se pregunta sobre un `no_entendido`, y de último. Los contraejemplos
  // pesan más: contestarle "de eso no sé nada" a quien escribió "vivo con mi
  // mamá y mi hermana" sería peor que el silencio de hoy.
  it.each(["2+2", "jajaja", "jeje", "hahaha", "jjjj", "🙈", "  ", "...", "-3"])(
    "no era un intento de responder: %s",
    (texto) => {
      expect(esFueraDeTema(texto)).toBe(true);
    },
  );

  it.each([
    "vivo con mi mamá y mi hermana",
    "4.500.000",
    "2 millones y medio",
    "no tngo nada",
    "soy independiente",
    "q vale",
    "entre 3 y 5",
    "hijo",
    "hola",
  ])("SÍ era un intento de responder, aunque no se entienda: %s", (texto) => {
    expect(esFueraDeTema(texto)).toBe(false);
  });

  it("se reconoce en una línea y no regaña", () => {
    const mensaje = mensajeFueraDeTema();
    expect(mensaje).toMatch(/no s[ée]/i);
    expect(mensaje.split("\n")).toHaveLength(1);
  });
});

describe("el desvío en el vocabulario de AccionTurno", () => {
  it("pedir un humano es un handoff", () => {
    expect(accionDeDesvio({ tipo: "asesor" }, "quiero un asesor")).toEqual({
      tipo: "handoff_asesor",
    });
  });

  it("la duda viaja con su clase y su proyecto", () => {
    const desvio = detectarDesvio("cuanto cuesta la arboleda");
    expect(desvio).not.toBeNull();
    const accion = accionDeDesvio(desvio!, "cuanto cuesta la arboleda");
    expect(accion).toMatchObject({ tipo: "responder_duda", clase: "precio" });
    expect(accion.tipo === "responder_duda" && accion.proyecto?.nombre).toBe("LA ARBOLEDA");
  });
});

describe("los mensajes del desvío", () => {
  it("el handoff saluda por el primer nombre y no promete que se corta la charla", () => {
    expect(mensajeHandoffAsesor("Diana Marcela Ríos")).toMatch(/^Claro que sí, Diana\b/);
  });

  it("la repregunta trae la pregunta pendiente entera", () => {
    const paso = construirPreguntas({ match: false, ciudad: "Bogotá" })[0];
    expect(repreguntar(paso)).toContain(paso.pregunta);
  });
});
