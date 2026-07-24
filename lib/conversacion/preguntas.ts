import type { Lead, PerfilConocido } from "@/lib/types";

// Set de preguntas del spec §6: los 4 que el brief lista como capacidad de
// compra + la zona de interés para el matcher. NUNCA se pregunta lo que el
// enriquecimiento ya trajo (criterio de aceptación 1, spec §5).
//
// TONO — la conversación tiene que ENAMORAR, no encuestar. Es la obligación 4
// del spec 02 y son palabras del mentor: comprar vivienda "es algo que haces
// una vez en tu vida y probablemente al lado de otra persona". Reglas de
// redacción que se derivan de eso y que ningún linter chequea:
//
//   1. Cada pregunta dice PARA QUÉ sirve antes de preguntar. Nadie entrega su
//      ingreso por chat sin saber qué van a hacer con él.
//   2. Cada respuesta recibe un acuse (`acuse`) antes de la siguiente pregunta.
//      Sin acuse el chat se siente formulario: pregunta, respuesta, pregunta.
//   3. Nada de jerga interna: no se dice "perfilamiento", "scoring" ni "SMMLV".
//   4. Se habla de la casa, no del trámite.
//
// HÍBRIDO — D4 del spec 02, cerrado por el mentor: hay que tener las dos
// opciones porque unas personas prefieren escoger y otras escribir. Aquí eso
// significa que TODO paso acepta texto libre (`interpretarTexto`); los chips
// (`opciones`) son un atajo, nunca la única salida. Ingreso y zona van sin
// chips a propósito: ahí la lista sesga ("si tú dices que ganas 500.000, el
// listado no tiene esa opción").

/** El agente tiene nombre: un chat sin nombre al otro lado se siente máquina. */
export const NOMBRE_AGENTE = "Sara";

/**
 * ⚠️ SUPUESTO POR VALIDAR: salario mínimo de 2025 ($1.423.500). Se duplica a
 * propósito el valor de `lib/fixtures/cola-historica.ts` — este módulo lo
 * carga el cliente y no debe arrastrar las fixtures al bundle. Si cambia el
 * año, cambian los dos.
 */
const SMMLV_SUPUESTO = 1_423_500;

export type CampoPregunta = Exclude<keyof Lead["respuestas"], "consentimiento">;

/** Lo que una respuesta deja en el lead, más cómo reacciona el agente a ella. */
export interface Respuesta {
  patch: Partial<Lead["respuestas"]>;
  /** Lo que el agente contesta antes de seguir. Es lo que separa conversar de encuestar. */
  acuse?: string;
}

/** Un chip del footer. Lleva su valor, así el texto puede ser humano y el dato exacto. */
export interface OpcionRespuesta extends Respuesta {
  etiqueta: string;
}

export interface PasoPregunta {
  /** Qué dato llena. Se usa para saber qué falta, no para guardar (eso lo hace el patch). */
  campo: CampoPregunta;
  pregunta: string;
  placeholder: string;
  /** Atajos. Si no hay, el paso es de texto libre puro (ingreso y zona). */
  opciones?: OpcionRespuesta[];
  /** Siempre existe: el lead puede escribir en cualquier paso, haya chips o no. */
  interpretarTexto: (texto: string) => Respuesta;
}

// ── Interpretación de texto libre ────────────────────────

const NIEGA =
  /\b(no|nop|nunca|jam[áa]s|ninguno|ninguna|negativo|todav[íi]a\s+no|a[úu]n\s+no|aun\s+no)\b/i;

/**
 * Saca los números de una frase escrita por una persona real: "4.500.000",
 * "4'500.000", "4,5", "entre 3 y 5". Los puntos son separadores de miles
 * cuando cierran en 3 dígitos y decimales cuando no ("4.5 millones").
 */
function numerosDe(texto: string): number[] {
  const crudos = texto.replace(/['`´]/g, ".").match(/\d+(?:[.,]\d+)*/g) ?? [];
  return crudos
    .map((crudo) => {
      const partes = crudo.replace(/,/g, ".").split(".");
      if (partes.length === 1) return Number(partes[0]);
      const ultima = partes[partes.length - 1];
      if (ultima.length === 3) return Number(partes.join(""));
      return Number(`${partes.slice(0, -1).join("")}.${ultima}`);
    })
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Convierte a pesos mensuales lo que la persona escribió. Acepta las formas en
 * que la gente responde de verdad: un monto, "2 millones y medio", "3 salarios
 * mínimos", "entre 2 y 3" (se toma el punto medio).
 *
 * Devuelve `undefined` cuando el número queda ambiguo (p. ej. un "800" pelado:
 * ¿ochocientos mil, u ochocientos?). Eso NO rompe la conversación: el texto
 * crudo se guarda igual en `rango_ingreso_hogar` y el asesor lo ve tal cual.
 */
export function parsearIngresoMensual(texto: string): number | undefined {
  const limpio = texto.toLowerCase();
  const numeros = numerosDe(limpio);
  if (numeros.length === 0) return undefined;

  // "entre 2 y 3", "2-3": punto medio del rango que la persona dio.
  const base = numeros.length >= 2 ? (numeros[0] + numeros[1]) / 2 : numeros[0];
  const conMedio = /\by\s+medio\b/.test(limpio) ? base + 0.5 : base;

  if (/mill|\bmm\b/.test(limpio)) return Math.round(conMedio * 1_000_000);
  if (/m[íi]nimo|salario|smmlv|smlv/.test(limpio)) {
    return Math.round(conMedio * SMMLV_SUPUESTO);
  }
  if (/\bmil\b/.test(limpio)) return Math.round(conMedio * 1_000);

  // Sin unidad: un monto completo se escribe con sus ceros; un número pequeño
  // es la forma corta de "millones" ("gano 3" tras preguntar cuánto entra al mes).
  if (conMedio >= 100_000) return Math.round(conMedio);
  if (conMedio <= 30) return Math.round(conMedio * 1_000_000);
  return undefined;
}

/** El rango del enriquecimiento ("3-5 SMMLV") llevado a un monto usable por el motor. */
export function ingresoDesdeRango(rango: string): number | undefined {
  return parsearIngresoMensual(rango);
}

function interpretarIngreso(texto: string): Respuesta {
  const monto = parsearIngresoMensual(texto);
  return {
    patch: {
      rango_ingreso_hogar: texto,
      ...(monto ? { ingreso_hogar_mensual: monto } : {}),
    },
    acuse: monto
      ? "Gracias por la confianza 🙏 Con eso ya puedo calcular con números reales y no ofrecerte algo que después te apriete."
      : "Gracias por contármelo 🙏 Lo dejo anotado tal cual me lo dijiste.",
  };
}

function interpretarVivienda(texto: string): Respuesta {
  const t = texto.toLowerCase();
  const primeraVez =
    /primera|no tengo|nunca|arriendo|arrendad|vivo con|de mis pap|alquil/.test(t) ||
    (NIEGA.test(t) && !/ya tengo|s[íi] tengo/.test(t));
  const yaTiene = /ya tengo|s[íi] tengo|tengo (una |mi )?(casa|apartamento|vivienda)|propia|es m[íi]a/.test(t);

  if (primeraVez && !yaTiene) return OPCION_PRIMERA_VIVIENDA;
  if (yaTiene) return OPCION_YA_TIENE_VIVIENDA;
  return { patch: {}, acuse: "Listo, lo tengo en cuenta." };
}

function interpretarSubsidios(texto: string): Respuesta {
  const t = texto.toLowerCase();
  if (/ninguno|ningun|no tengo|no he|nada|todav[íi]a no|a[úu]n no/.test(t) && !/mi casa ya/.test(t)) {
    return SIN_SUBSIDIO;
  }
  if (/no s[ée]|ni idea|no estoy segur|creo que|no entiendo/.test(t)) return SUBSIDIO_POR_CONFIRMAR;

  const subsidios = texto
    .split(/,| y /)
    .map((s) => s.trim())
    .filter(Boolean);
  return { patch: { subsidios }, acuse: ACUSE_SUBSIDIO };
}

function interpretarCrediticia(texto: string): Respuesta {
  const t = texto.toLowerCase();
  if (/al d[íi]a|bien|excelente|buena|sin deudas|limpio|impecable/.test(t)) return CREDITO_AL_DIA;
  if (/nunca|no he tenido|no tengo historial|sin historial|primera vez|no he pedido/.test(t)) {
    return CREDITO_SIN_HISTORIAL;
  }
  if (/sali|salir|me report|estuve|arregl|pagu[ée]|ya me quit|reciente/.test(t)) return CREDITO_SALIENDO;
  if (/mora|report|datacr|deb[oa]|atras|deuda|embarg|mal/.test(t)) return CREDITO_EN_MORA;
  return { patch: { situacion_crediticia: "sin_info" }, acuse: "Perfecto, gracias por decírmelo." };
}

function interpretarZona(texto: string): Respuesta {
  return {
    patch: { zona_interes: texto },
    acuse: "Anotado 📍 Esa zona la tengo bien mapeada, así que puedo ser concreta contigo.",
  };
}

// ── Las opciones, con su acuse ───────────────────────────
// Se declaran aparte porque los interpretadores de texto libre reusan las
// mismas respuestas: escribir "ya tengo casa" tiene que valer lo mismo que
// tocar el chip.

const OPCION_PRIMERA_VIVIENDA: Respuesta = {
  patch: { tiene_vivienda: false },
  acuse:
    "¡La primera! 🎉 Eso es enorme, y además te deja el camino despejado para los subsidios que solo aplican a primera vivienda.",
};

const OPCION_YA_TIENE_VIVIENDA: Respuesta = {
  patch: { tiene_vivienda: true },
  acuse:
    "Listo, eso cambia a qué subsidios puedes aplicar, así que mejor saberlo ahora y no cuando ya te ilusionaste con algo.",
};

const ACUSE_SUBSIDIO =
  "¡Eso suma! 🙌 Un subsidio baja la cuota mensual de verdad, no es letra chiquita. Lo meto en la cuenta.";

const SIN_SUBSIDIO: Respuesta = {
  patch: { subsidios: [] },
  acuse:
    "Tranquila, no pasa nada — la mayoría llega así. Si aplicas a alguno, el asesor te lo dice y se postula contigo.",
};

const SUBSIDIO_POR_CONFIRMAR: Respuesta = {
  patch: { subsidios: ["Por confirmar"] },
  acuse:
    "Ese es de los que más se dejan sobre la mesa por no preguntar. Lo dejo marcado para que el asesor lo revise contigo.",
};

const CREDITO_AL_DIA: Respuesta = {
  patch: { situacion_crediticia: "buena" },
  acuse: "Eso vale oro con el banco 💪 Te abre puertas que mucha gente no tiene.",
};

const CREDITO_SALIENDO: Respuesta = {
  patch: { situacion_crediticia: "regular" },
  acuse:
    "Gracias por la honestidad. Salir de un reporte cuenta a favor, no en contra: lo importante es que ya está en camino.",
};

const CREDITO_EN_MORA: Respuesta = {
  patch: { situacion_crediticia: "mala" },
  acuse:
    "Te agradezco que me lo digas de frente 🙏 No es un no: es saber hoy qué hay que ordenar, en vez de enterarte el día que pidas el crédito.",
};

const CREDITO_SIN_HISTORIAL: Respuesta = {
  patch: { situacion_crediticia: "sin_info" },
  acuse:
    "Sin historial también hay camino — se empieza a construir, y hay proyectos pensados justo para eso.",
};

/**
 * Dado un PerfilConocido, decide qué se pregunta y en qué orden.
 * El único guion fijo es la ausencia de guion: quien ya trajo el dato del
 * enriquecimiento, no lo repite en la conversación.
 *
 * El orden no es casual: primero lo que ilusiona (la casa, la primera vez),
 * después lo incómodo (ingreso, crédito). El ingreso va de segundo y no de
 * primero justo por eso.
 */
export function construirPreguntas(perfil: PerfilConocido): PasoPregunta[] {
  const pasos: PasoPregunta[] = [];

  pasos.push({
    campo: "tiene_vivienda",
    pregunta:
      "Cuéntame una cosa primero, que cambia todo lo demás: ¿esta sería tu primera vivienda, o ya tienes una?",
    placeholder: "Escríbeme cómo es tu caso...",
    opciones: [
      { etiqueta: "Sería la primera 🎉", ...OPCION_PRIMERA_VIVIENDA },
      { etiqueta: "Ya tengo vivienda", ...OPCION_YA_TIENE_VIVIENDA },
    ],
    interpretarTexto: interpretarVivienda,
  });

  if (!perfil.rango_ingreso) {
    pasos.push({
      campo: "rango_ingreso_hogar",
      // Sin chips a propósito (D4): la lista sesga y deja gente por fuera.
      pregunta:
        "Ahora la pregunta incómoda, y te digo para qué es: solo la uso para no mostrarte casas que después te aprieten el bolsillo. ¿Cuánto entra al mes en tu hogar, sumando todo lo que llega (tu sueldo, el de tu pareja, lo que sea)? Un aproximado me sirve.",
      placeholder: "Ej: 4.500.000 · 2 millones y medio · entre 3 y 4",
      interpretarTexto: interpretarIngreso,
    });
  }

  pasos.push({
    campo: "subsidios",
    pregunta:
      "Hablemos de plata a tu favor: el subsidio es lo que más gente deja sobre la mesa por no preguntar. ¿Tienes alguno, o todavía ninguno?",
    placeholder: "Cuéntame cuál, o escribe \"ninguno\"",
    opciones: [
      { etiqueta: "Mi Casa Ya", patch: { subsidios: ["Mi Casa Ya"] }, acuse: ACUSE_SUBSIDIO },
      {
        etiqueta: "El de mi caja de compensación",
        patch: { subsidios: ["Subsidio caja de compensación"] },
        acuse: ACUSE_SUBSIDIO,
      },
      { etiqueta: "Ninguno todavía", ...SIN_SUBSIDIO },
      { etiqueta: "No sé si aplico", ...SUBSIDIO_POR_CONFIRMAR },
    ],
    interpretarTexto: interpretarSubsidios,
  });

  pasos.push({
    campo: "situacion_crediticia",
    pregunta:
      "Última de las incómodas y te dejo en paz 🙏 ¿Cómo va tu vida crediticia hoy? Pregunto sin juzgar: si hay algo pendiente, es mil veces mejor saberlo ahora que el día que pidas el crédito.",
    placeholder: "Escríbeme cómo estás...",
    opciones: [
      { etiqueta: "Al día con todo", ...CREDITO_AL_DIA },
      { etiqueta: "Saliendo de un reporte", ...CREDITO_SALIENDO },
      { etiqueta: "Tengo algo en mora", ...CREDITO_EN_MORA },
      { etiqueta: "Nunca he pedido crédito", ...CREDITO_SIN_HISTORIAL },
    ],
    interpretarTexto: interpretarCrediticia,
  });

  if (!perfil.ciudad) {
    pasos.push({
      campo: "zona_interes",
      // Sin chips a propósito (D4): la zona es de las que se escriben.
      pregunta:
        "Y lo más rico: ¿dónde te imaginas viviendo? Piensa en el día a día — cerca del colegio, del trabajo, de tu mamá. Eso termina pesando más que el precio.",
      placeholder: "Ej: Bogotá, por el norte",
      interpretarTexto: interpretarZona,
    });
  }

  return pasos;
}

// ── Los mensajes del agente que no son preguntas ─────────

/** Bubble 1: llega instantánea, con nombre propio y el proyecto por el que entró. */
export function mensajeSaludo(nombre: string, proyecto?: string): string {
  const primerNombre = nombre.split(" ")[0];
  if (proyecto) {
    return `¡Hola, ${primerNombre}! 👋 Soy ${NOMBRE_AGENTE}, del equipo de Vivienda de Colsubsidio. Vi que te llamó la atención ${proyecto} 🏡`;
  }
  return `¡Hola, ${primerNombre}! 👋 Soy ${NOMBRE_AGENTE}, del equipo de Vivienda de Colsubsidio.`;
}

/**
 * La autorización de datos es el primer punto de fuga medido de la operación
 * real (charla-mentor.md #puntos-de-fuga). Por eso va con el "para qué" por
 * delante y en las palabras que el mentor dijo que están adoptando:
 * "compártenos la autorización" en vez de "¿autorizas?".
 */
export function mensajeAutorizacion(): string {
  return "Antes de mostrarte nada tengo que pedirte una formalidad, y te cuento para qué: para poder guardar lo que hablemos aquí y que un asesor te acompañe después sin que repitas tu historia. ¿Me compartes la autorización para tratar tus datos? (Ley 1581 de 2012)";
}

export function mensajeSinAutorizacion(nombre: string): string {
  const primerNombre = nombre.split(" ")[0];
  return `Todo bien, ${primerNombre} 🙏 Sin esa autorización no puedo guardar nada de lo que hablemos, así que lo dejamos hasta aquí. Cuando quieras retomarlo me escribes y seguimos — la casa te va a estar esperando.`;
}

/**
 * El mensaje que hace explícito lo que ya sabemos (criterio de aceptación 1):
 * se dice ANTES de preguntar nada más.
 *
 * ⚠️ NO se le recitan al lead sus propios datos, y esto no es un descuido:
 * leerle de vuelta su afiliación, su ciudad y su rango de ingresos suena a
 * expediente y asusta justo en el mensaje donde hay que generar confianza.
 * Lo que el criterio 1 exige es que el lead **sepa que no le vamos a hacer
 * repetir nada**, no que le enumeremos su ficha. Así que:
 *
 *   - se dice que sus datos ya están y que no se los vamos a repreguntar;
 *   - la ciudad se **usa** ("busco opciones en Bogotá") en vez de recitarse:
 *     demuestra que la conocemos sin sonar a base de datos hablando;
 *   - el ingreso NO se menciona nunca. Es el dato más sensible de todos y el
 *     que más incomoda oír de vuelta. Sigue usándose para calificar, y el
 *     asesor lo ve completo en su ficha.
 *
 * El criterio se sigue verificando igual: la intersección entre lo preguntado
 * y lo enriquecido es vacía (`construirPreguntas`), y hay un test que impide
 * que el rango de ingreso vuelva a colarse en este mensaje.
 */
export function mensajeYaSabemos(perfil: PerfilConocido, nombre: string): string {
  const primerNombre = nombre.split(" ")[0];

  if (!perfil.match) {
    return `Perfecto, ${primerNombre}, gracias 🙌 Todavía no te tengo en nuestra base, así que arrancamos de cero: son cuatro preguntas cortas, nada de formulario eterno. Te prometo que valen la pena.`;
  }

  const sabemosAlgo =
    perfil.afiliado !== undefined || Boolean(perfil.ciudad) || Boolean(perfil.rango_ingreso);

  if (!sabemosAlgo) {
    return `Gracias, ${primerNombre} 🙌 Te tengo registrado pero sin más datos, así que te pregunto lo que falta — es corto, prometido.`;
  }

  if (perfil.ciudad) {
    return `Gracias, ${primerNombre} 🙌 Lo que ya nos habías dado está acá conmigo, así que no te voy a hacer repetir nada. Empiezo por buscarte opciones en ${perfil.ciudad} y solo te pregunto lo que me falte.`;
  }

  return `Gracias, ${primerNombre} 🙌 Lo que ya nos habías dado está acá conmigo, así que no te voy a hacer repetir nada. Solo te pregunto lo que me falte.`;
}

export function mensajeCierre(nombre: string): string {
  const primerNombre = nombre.split(" ")[0];
  return `Eso era todo, ${primerNombre} 🙌 Con lo que me contaste ya puedo armarte algo que tenga sentido para ti, y no una lista genérica. Le paso tu historia completa a un asesor para que no tengas que repetirla — te escribe muy pronto.`;
}
