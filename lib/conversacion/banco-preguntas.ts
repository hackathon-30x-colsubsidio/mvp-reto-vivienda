import type { AmenidadInteres, Lead } from "@/lib/types";
import type { OpcionRespuesta, PasoPregunta, Respuesta } from "./preguntas";

// =====================================================================
// EL BANCO: lo que Sara puede preguntar DESPUÉS de las 7 base.
//
// Las 7 base las conduce el código y no se tocan (decisión 1 de la sala
// del sábado 25). Esto corre después, como máximo 2 veces, y el LLM
// escoge **un id de esta lista** — puede escoger, no puede escribir
// (§4 del plan). Si Gemini no contesta, la capa no se activa y la
// conversación termina exactamente como hoy.
//
// ── Por qué estas cuatro y no otras ──────────────────────────────────
//
// Cada pregunta tiene que poder cambiar una recomendación, o es
// decorado. Se midió `docs/proyectos/proyectos-colsubsidio.json`, los
// 18 proyectos, antes de escribir una sola:
//
//   · **alcobas** — 17/18 proyectos declaran tipologías. Discrimina
//     durísimo: solo 3 tienen una de 3 alcobas (Samán, Araucaria, Los
//     Nogales) y 5 tienen de 1. Es la pregunta más rentable del banco.
//   · **amenidades** — 18/18 listan zonas sociales, pero NO todas
//     separan: "zona de niños" está en 18/18 (preguntarla no cambia
//     nada) y mascotas solo en 4/18. Los chips son las que discriminan.
//   · **espacio** — 18/18 traen área privada, de 21,6 a 68,06 m². Se
//     pregunta como preferencia y no en metros cuadrados: nadie sabe de
//     memoria cuántos m² necesita, y una pregunta que la gente no puede
//     contestar es una pregunta que rompe la conversación.
//   · **momento** — no matchea nada y se sabe: `estado` solo está en
//     7/18. Prioriza la cola del asesor. Va con la justificación por
//     delante ("no es para apurarte") porque sin ella suena a vendedor.
//
// ── Se escriben con las reglas de `preguntas.ts` ─────────────────────
//
// Las tres que más se rompen, del encabezado de ese archivo: cada
// pregunta DICE PARA QUÉ SIRVE antes de preguntar, cada respuesta
// recibe un ACUSE antes de seguir, y el campo de texto nunca
// desaparece — los chips son atajo, jamás la única salida.
//
// ── Ningún intérprete se queda mudo ──────────────────────────────────
//
// Hueco 2 del plan: `interpretarComposicion` y compañía devuelven
// `{patch:{}}` con un acuse amable y la señal se pierde en silencio.
// Aquí no: lo que no se sabe clasificar entra a `preferencias_libres`
// y llega crudo a la ficha del asesor. Nadie contesta al vacío.
//
// ⚠️ 🔴 EL COPY DE LAS 4 PREGUNTAS Y SUS CHIPS ESTÁ SIN RATIFICAR
// (puntos 1, 2 y 3 del §7 del plan). Es texto que va a leer el lead:
// se puede reescribir entero sin tocar una línea de lógica, y esa es
// justamente la idea. Lo que sí está medido —y no es opinión— es
// CUÁLES dimensiones vale la pena preguntar, arriba.
// =====================================================================

export type IdPreguntaBanco = "alcobas" | "amenidades" | "espacio" | "momento";

/**
 * Los campos que llena el banco. Aparte de `CampoPregunta` a propósito.
 *
 * `CampoPregunta` es el enum de zod de `acciones.ts` (rama 2) y vale **solo
 * para las 7 base**: es lo que valida qué puede devolver el intérprete de IA.
 * Meter aquí los campos del banco lo ensancharía, y ese enum es de P2 — además
 * de que un intérprete autorizado a escribir en `momento_compra` sin que nadie
 * lo haya preguntado es exactamente lo que ese enum existe para impedir.
 */
export type CampoBanco =
  | "alcobas_deseadas"
  | "amenidades_interes"
  | "espacio_preferido"
  | "momento_compra";

/**
 * Todo lo de un paso normal menos el campo: una pregunta del banco se **pinta,
 * acusa e interpreta** igual que una de las 7 base, así que la rama 5 la cablea
 * sin adaptador. Lo único que cambia es en qué campo aterriza.
 */
export interface PreguntaBanco extends Omit<PasoPregunta, "campo"> {
  campo: CampoBanco;
  id: IdPreguntaBanco;
  /**
   * Una línea para el selector de la rama 4: qué gana el match si se pregunta
   * esto. Va en el prompt; por eso está escrita para un modelo, no para el lead.
   */
  paraQueSirve: string;
  /** `false` en `momento`: ordena la cola del asesor, no la lista de proyectos. */
  matchea: boolean;
}

/** Decisión cerrada del §3: máximo 2, después de las base. De 7 a 9 turnos. */
export const MAX_PREGUNTAS_BANCO = 2;

// ── Las familias de amenidad, con lo que la gente escribe ─

/**
 * Cómo se reconoce cada familia en texto libre. Es el mismo criterio del
 * catálogo (`AmenidadInteres` en `lib/types.ts`), del lado de la persona:
 * nadie escribe "zona pet", escribe "que reciban perros".
 */
const AMENIDAD_EN_TEXTO: Record<AmenidadInteres, RegExp> = {
  mascotas: /mascota|perr|gat|pet\b|animal/i,
  gimnasio: /gimnasio|gym|entrenar|pesas|biosaludable|fitness/i,
  coworking: /coworking|trabajar|teletrabaj|home ?office|oficina|estudiar|reuni/i,
  deporte: /piscina|cancha|deporte|f[úu]tbol|tenis|voleibol|nadar|trotar|yoga/i,
  verdes: /verde|[áa]rbol|naturaleza|parque|sendero|aire libre|caminar/i,
  social: /social|bbq|asado|sal[óo]n|terraza|fiesta|reunirme|amigos/i,
  ninos: /ni[ñn]|hij|infantil|beb[ée]|juegos|columpio|parque infantil/i,
};

/** Las que de verdad separan proyectos. `ninos` no está: es 18/18. */
const AMENIDADES: AmenidadInteres[] = [
  "mascotas",
  "gimnasio",
  "coworking",
  "deporte",
  "verdes",
  "social",
  "ninos",
];

export function amenidadesEnTexto(texto: string): AmenidadInteres[] {
  return AMENIDADES.filter((a) => AMENIDAD_EN_TEXTO[a].test(texto));
}

// ── Los intérpretes de texto libre ───────────────────────
//
// Puros y síncronos, como los de `preguntas.ts`: `guion-demo.ts` los llama de
// forma síncrona y de ahí salen el seed y las fixtures. La IA de respaldo vive
// afuera (rama 4) y solo se invoca cuando esto devuelve `no entendido`.

/** Lo que dijo, guardado tal cual, cuando no se pudo clasificar. */
function noSeEntendio(texto: string, acuse: string): Respuesta {
  return { patch: { preferencias_libres: [texto.trim()] }, acuse };
}

const PALABRA_NUMERO: Record<string, 1 | 2 | 3> = {
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 3,
  cinco: 3,
};

export function interpretarAlcobas(texto: string): Respuesta {
  const t = texto.toLowerCase();

  const digito = t.match(/\b([1-9])\b/)?.[1];
  const palabra = Object.keys(PALABRA_NUMERO).find((p) =>
    new RegExp(`\\b${p}\\b`).test(t),
  );

  let alcobas: 1 | 2 | 3 | undefined;
  if (digito) alcobas = Math.min(Number(digito), 3) as 1 | 2 | 3;
  else if (palabra) alcobas = PALABRA_NUMERO[palabra];
  else if (/sol[oa]\b|yo sol|una sola|apartaestudio|estudio\b/.test(t)) alcobas = 1;

  if (alcobas === undefined) {
    return noSeEntendio(
      texto,
      "Lo dejo anotado tal cual y el asesor lo afina contigo. Sigamos.",
    );
  }
  return { patch: { alcobas_deseadas: alcobas }, ...ACUSE_ALCOBAS[alcobas] };
}

export function interpretarAmenidades(texto: string): Respuesta {
  const encontradas = amenidadesEnTexto(texto);
  if (encontradas.length === 0) {
    return noSeEntendio(
      texto,
      "Lo tengo anotado con tus palabras para que el asesor lo tenga presente 🙌",
    );
  }
  return {
    patch: { amenidades_interes: encontradas },
    acuse: "Anotado 🙌 Con eso descarto los que no lo tienen y te ahorro la visita en vano.",
  };
}

/**
 * ⚠️ El orden importa: lo compacto se descarta primero porque sus palabras son
 * más específicas. "Prefiero algo pequeño pero bien ubicado" trae las dos
 * familias y la que manda es la primera.
 *
 * Se acepta el falso negativo de "no necesito tanto espacio" — cae a
 * `preferencias_libres` en vez de clasificarse mal. Es exactamente para eso que
 * existe la IA de respaldo de la rama 4: regex primero, modelo después, y ante
 * la duda el texto crudo llega igual a la ficha.
 */
export function interpretarEspacio(texto: string): Respuesta {
  const t = texto.toLowerCase();
  if (/compact|peque|justo|cerca|ubicaci|bien ubicad|central/.test(t)) {
    return { patch: { espacio_preferido: "compacto" }, ...ACUSE_ESPACIO.compacto };
  }
  if (/amplio|amplia|grande|espacio|m[áa]s metros|que quepa|c[óo]modo/.test(t)) {
    return { patch: { espacio_preferido: "amplio" }, ...ACUSE_ESPACIO.amplio };
  }
  return noSeEntendio(texto, "Listo, lo tengo presente para escoger qué mostrarte.");
}

/** Explorar se descarta primero: "ya estoy mirando" no es urgencia, es lo contrario. */
export function interpretarMomento(texto: string): Respuesta {
  const t = texto.toLowerCase();
  if (/mirando|explor|calma|todav[íi]a|sin af[áa]n|no s[ée]|averigua|curios/.test(t)) {
    return { patch: { momento_compra: "explorando" }, ...ACUSE_MOMENTO.explorando };
  }
  if (/ya\b|inmediat|urgent|cuanto antes|lo antes|ahora|pronto|este mes/.test(t)) {
    return { patch: { momento_compra: "inmediato" }, ...ACUSE_MOMENTO.inmediato };
  }
  if (/este a[ñn]o|fin de a[ñn]o|meses|semestre|pr[óo]ximo a[ñn]o/.test(t)) {
    return { patch: { momento_compra: "este_ano" }, ...ACUSE_MOMENTO.este_ano };
  }
  return noSeEntendio(texto, "Listo, sin afán. Lo dejo anotado.");
}

// ── Los acuses ───────────────────────────────────────────
// Aparte, como en `preguntas.ts`: el chip y el texto libre tienen que valer
// exactamente lo mismo. Escribir "con dos nos alcanza" y tocar "Dos" producen
// el mismo `Lead`, y eso es lo que hace que `replayGuion` siga sirviendo.

const ACUSE_ALCOBAS: Record<1 | 2 | 3, Pick<Respuesta, "acuse">> = {
  1: {
    acuse:
      "Listo, una alcoba. Bien distribuida rinde muchísimo más de lo que parece en el plano.",
  },
  2: {
    acuse:
      "Perfecto, dos. Es la tipología más común en lo que tenemos, así que vas a tener de dónde escoger.",
  },
  3: {
    // Honestidad temprana, como el acuse de la zona sin proyectos: solo 3 de los
    // 18 tienen tipología de 3 alcobas. Vale más decirlo aquí que en la visita.
    acuse:
      "Anotado, tres o más. Te soy honesta: de esas tenemos pocas, así que te voy a mostrar las que de verdad existen y no una lista larga que no sirve.",
  },
};

const ACUSE_ESPACIO: Record<"compacto" | "amplio", Pick<Respuesta, "acuse">> = {
  compacto: {
    acuse: "Entendido, algo bien aprovechado. Con eso ya sé por dónde empezar a buscar.",
  },
  amplio: {
    acuse: "Listo, espacio antes que nada. Anotado para no mostrarte nada apretado.",
  },
};

const ACUSE_MOMENTO: Record<
  "inmediato" | "este_ano" | "explorando",
  Pick<Respuesta, "acuse">
> = {
  inmediato: {
    acuse: "Perfecto, con eso le digo al asesor que te llame de primeras.",
  },
  este_ano: {
    acuse: "Buen plan, da tiempo de organizar el crédito con calma. Lo anoto.",
  },
  explorando: {
    acuse:
      "Y está perfecto que estés mirando 🙌 Lo dejo anotado para que nadie te presione: te acompañamos al ritmo que tú quieras.",
  },
};

const opcionAlcobas = (etiqueta: string, n: 1 | 2 | 3): OpcionRespuesta => ({
  etiqueta,
  patch: { alcobas_deseadas: n },
  ...ACUSE_ALCOBAS[n],
});

const opcionAmenidad = (etiqueta: string, a: AmenidadInteres): OpcionRespuesta => ({
  etiqueta,
  patch: { amenidades_interes: [a] },
  acuse: "Anotado 🙌 Con eso descarto los que no lo tienen y te ahorro la visita en vano.",
});

// ── El banco ─────────────────────────────────────────────

export const BANCO: PreguntaBanco[] = [
  {
    id: "alcobas",
    campo: "alcobas_deseadas",
    matchea: true,
    paraQueSirve:
      "Cuántas alcobas necesita el hogar. Es la dimensión que más separa el catálogo: solo 3 de 18 proyectos tienen tipología de 3 alcobas y 5 tienen de 1.",
    pregunta:
      "Ya sé con quién la vas a compartir; ahora la parte concreta: ¿cuántas alcobas necesitas para estar cómodos? Te lo pregunto porque es lo que más cambia de un proyecto a otro.",
    placeholder: "Ej: con dos nos alcanza...",
    opciones: [
      opcionAlcobas("Una", 1),
      opcionAlcobas("Dos", 2),
      opcionAlcobas("Tres o más", 3),
    ],
    interpretarTexto: interpretarAlcobas,
  },
  {
    id: "amenidades",
    campo: "amenidades_interes",
    matchea: true,
    paraQueSirve:
      "Qué quiere encontrar en el conjunto. Discrimina desparejo: mascotas solo en 4 de 18 proyectos, coworking en 11, gimnasio en 14. Preguntar por zonas de niños NO sirve: están en 18 de 18.",
    pregunta:
      "Y además del apartamento, ¿qué te haría feliz tener en el conjunto? Pregunto porque en eso sí se diferencian bastante, y prefiero no mostrarte uno que justo no lo tenga.",
    placeholder: "Ej: que acepten mascotas...",
    opciones: [
      opcionAmenidad("Que acepten mascotas", "mascotas"),
      opcionAmenidad("Gimnasio", "gimnasio"),
      opcionAmenidad("Un espacio para trabajar", "coworking"),
      opcionAmenidad("Piscina o cancha", "deporte"),
    ],
    interpretarTexto: interpretarAmenidades,
  },
  {
    id: "espacio",
    campo: "espacio_preferido",
    matchea: true,
    paraQueSirve:
      "El área privada, preguntada como la gente sí la sabe contestar. El catálogo va de 21,6 a 68,06 m² (mediana 40,55), así que la preferencia ordena de verdad.",
    // ⚠️ NO ofrece "más amplio aunque quede más afuera", aunque suene mejor: el
    // filtro de zona es ESTRICTO (`coincideZona`, spec del matcher), así que
    // jamás vamos a darle algo más lejos a cambio de metros. Prometer un
    // intercambio que el motor se niega a hacer es el mismo pecado que la
    // recomendación fuera de zona en silencio que se corrigió el 2026-07-25.
    // El intercambio real ocurre DENTRO de lo que ya le cabe, y así se dice.
    pregunta:
      "Una de gusto, y no hay respuesta mala: dentro de lo que te cabe, ¿prefieres algo compacto y bien aprovechado, o ganar metros? Con eso sé por cuál empezar a mostrarte.",
    placeholder: "Ej: prefiero que sea amplio...",
    opciones: [
      { etiqueta: "Compacto y práctico", patch: { espacio_preferido: "compacto" }, ...ACUSE_ESPACIO.compacto },
      { etiqueta: "Con más espacio", patch: { espacio_preferido: "amplio" }, ...ACUSE_ESPACIO.amplio },
    ],
    interpretarTexto: interpretarEspacio,
  },
  {
    id: "momento",
    campo: "momento_compra",
    // NO matchea y es a propósito: `estado` (entrega) solo se conoce en 7 de los
    // 18 proyectos. Ordena la cola del asesor.
    matchea: false,
    paraQueSirve:
      "Para cuándo se la imagina. NO cambia qué proyectos se recomiendan (solo 7 de 18 declaran entrega): prioriza la cola del asesor.",
    // El "no es para apurarte" va POR DELANTE, con la contrapartida explícita
    // para quien contesta que está mirando: sin eso, esta pregunta suena a
    // vendedor cerrando y es lo único que el mentor rechazó por nombre.
    // ⚠️ NO promete "te busco lo que esté listo para entregar": `matchea` es
    // false y `estado` solo se conoce en 7 de los 18 proyectos. Lo que este
    // dato SÍ hace es ordenar la cola del asesor, y eso es lo que se ofrece.
    pregunta:
      "Y la última, que no es para apurarte sino al contrario: ¿para cuándo te la imaginas? Si es pronto le digo al asesor que te llame de primeras; si apenas estás mirando, lo anoto para que nadie te presione.",
    placeholder: "Ej: apenas estoy mirando...",
    opciones: [
      { etiqueta: "Lo antes posible", patch: { momento_compra: "inmediato" }, ...ACUSE_MOMENTO.inmediato },
      { etiqueta: "Este año", patch: { momento_compra: "este_ano" }, ...ACUSE_MOMENTO.este_ano },
      { etiqueta: "Todavía estoy mirando", patch: { momento_compra: "explorando" }, ...ACUSE_MOMENTO.explorando },
    ],
    interpretarTexto: interpretarMomento,
  },
];

export const IDS_BANCO = BANCO.map((p) => p.id);

// ── Cómo se leen estas respuestas en la ficha del asesor ─
//
// Viven aquí y no en `lib/formato.ts` por el mapa de propiedad: ese archivo no
// tiene dueña asignada y esto sí. Son `import type`-libres a propósito (puros
// datos), así que la ficha no arrastra nada del conversador al bundle.

export const ETIQUETA_ALCOBAS: Record<1 | 2 | 3, string> = {
  1: "Una",
  2: "Dos",
  3: "Tres o más",
};

export const ETIQUETA_AMENIDAD: Record<AmenidadInteres, string> = {
  mascotas: "que acepten mascotas",
  gimnasio: "gimnasio",
  coworking: "espacio para trabajar",
  deporte: "piscina o cancha",
  verdes: "zonas verdes",
  social: "salón social o BBQ",
  ninos: "zonas para niños",
};

export const ETIQUETA_ESPACIO: Record<"compacto" | "amplio", string> = {
  compacto: "Prefiere compacto y bien ubicado",
  amplio: "Prefiere más amplio, aunque quede más afuera",
};

export const ETIQUETA_MOMENTO: Record<"inmediato" | "este_ano" | "explorando", string> = {
  inmediato: "Lo antes posible",
  este_ano: "Este año",
  explorando: "Todavía está mirando (no presionar)",
};

/** El id que escogió el LLM → la pregunta. `undefined` si se lo inventó. */
export function preguntaDelBanco(id: string): PreguntaBanco | undefined {
  return BANCO.find((p) => p.id === id);
}

/**
 * Las que todavía tienen algo que averiguar.
 *
 * Es el insumo del selector de la rama 4: se le ofrecen SOLO estas, así el
 * modelo no puede escoger una pregunta cuyo dato ya está — que es la versión
 * banco del criterio de aceptación 1 (nunca se repregunta lo conocido).
 */
export function bancoDisponible(respuestas: Lead["respuestas"]): PreguntaBanco[] {
  return BANCO.filter((p) => respuestas[p.campo] === undefined);
}

/**
 * Aplica el patch de una respuesta del banco acumulando `preferencias_libres`.
 *
 * Existe porque el patch normal REEMPLAZA, y con dos preguntas del banco por
 * conversación se podría perder el texto crudo de la primera. Quien cablee el
 * banco (rama 5) usa esto en vez del spread pelado.
 */
export function aplicarRespuestaBanco(
  respuestas: Lead["respuestas"],
  patch: Partial<Lead["respuestas"]>,
): Lead["respuestas"] {
  const libres = [
    ...(respuestas.preferencias_libres ?? []),
    ...(patch.preferencias_libres ?? []),
  ];
  return {
    ...respuestas,
    ...patch,
    ...(libres.length > 0 ? { preferencias_libres: libres } : {}),
  };
}
