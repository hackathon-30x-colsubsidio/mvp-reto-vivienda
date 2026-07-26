import { catalogo } from "@/lib/matching/catalogo";

// =====================================================================
// LO ÚLTIMO QUE PASA ANTES DE QUE EL LEAD LEA.
//
// Hoy `app/api/chat/route.ts` conecta el stream de Gemini directo al
// cliente: lo que el modelo devuelva es lo que la persona ve. El corte
// de 3 s de `ChatWhatsApp.agregarBot:275` es de LATENCIA, no de
// contenido, y las prohibiciones duras del agente viven solo como
// frases dentro de `prompt-maestro.ts` (:79-89 y :156-170) — es decir,
// como un ruego. Ningún código las hace cumplir.
//
// Este módulo las hace cumplir. Es el espejo de
// `src/agents/sales/guardrails.ts` de Motoko y cierra el patrón que
// este repo ya tenía a medias: código determinista decide si el agente
// habla → el LLM propone → **código determinista sanitiza** → sale.
//
// ── Función pura, y esta rama no cablea nada ─────────────────────────
//
// `postGuard` no conoce React, ni el hilo, ni la sesión: recibe dos
// strings y un contexto opcional, y devuelve qué hacer. La rama 5 la
// conecta en `agregarBot`, justo antes de `pintar(textoFinal)`. Se
// puede testear entera sin red y sin DOM, que es todo el punto.
//
// ── El sesgo de este archivo: fallar hacia el texto determinista ─────
//
// Cuando el guard bloquea, el lead NO ve un error ni un mensaje raro:
// ve el `textoBase` que TypeScript ya había redactado — el mismo camino
// del timeout, que ya existe y ya funciona. Perder el pulido del LLM en
// un mensaje cuesta tono; dejar pasar una cifra inventada en la compra
// que alguien hace una vez en la vida cuesta la confianza entera. Por
// eso los cuatro `bloquea` son deliberadamente severos y los cuatro
// `limpia` son deliberadamente conservadores.
//
// ── Lo que este guard NO puede hacer ─────────────────────────────────
//
// No detecta un proyecto INVENTADO ("Torres del Parque"): no está en el
// catálogo, así que no hay contra qué compararlo. Solo atrapa que Sara
// nombre uno de los 18 reales sin que el motor lo haya elegido. Un
// nombre inventado se cae por `cifra_inventada` solo si trae cifra.
// Queda anotado en la bitácora del plan como límite conocido.
// =====================================================================

export type SeveridadGuard = "bloquea" | "limpia" | "ok";

export type ReglaGuard =
  | "recita_datos_lead"
  | "cifra_inventada"
  | "recomienda_sin_motor"
  | "suplanta_humano"
  | "nombre_agregado"
  | "formato_whatsapp"
  | "exceso_lineas"
  | "exceso_emojis";

/**
 * Lo que el guard necesita saber del turno para no ser ni ciego ni paranoico.
 *
 * Todo es opcional a propósito: sin contexto el guard sigue siendo útil
 * (compara contra `textoBase` y contra el catálogo), solo un poco más ciego.
 * Así la rama 5 puede cablearlo en un sitio antes de tenerlo cableado en todos.
 */
export interface ContextoGuard {
  /** El nombre del lead. Sin esto, `nombre_agregado` no puede opinar. */
  nombre?: string;
  /**
   * Los proyectos que el motor eligió para este lead, o el que la persona
   * nombró en su duda. Nombrar cualquier otro de los 18 es recomendar sin
   * motor. Vacío/ausente = solo vale lo que ya esté en `textoBase`.
   */
  proyectosPermitidos?: string[];
  /**
   * Cifras que Sara sí puede decir aunque no estén en `textoBase`. Los precios
   * del catálogo entran solos (el prompt de duda se lo da para consultar); esto
   * es para lo que traiga el turno, como el precio máximo ya calculado.
   */
  cifrasPermitidas?: number[];
}

export interface ResultadoGuard {
  /** `false` solo cuando bloquea. Limpiar no es reprobar. */
  aprobado: boolean;
  /** Lo que se debe pintar. Con `bloquea`, es `textoBase` intacto. */
  textoFinal: string;
  violaciones: ReglaGuard[];
  severidad: SeveridadGuard;
}

/**
 * El máximo que se hace cumplir: 3 líneas **y** 4 frases.
 *
 * Consultado y cerrado el 2026-07-25 (punto 11 del plan). Las dos cotas juntas
 * porque ninguna sola sirve: **ningún mensaje real de `preguntas.ts` trae un
 * salto de línea**, así que contar solo líneas no atraparía el desborde típico
 * de Gemini (cinco frases seguidas en un renglón). Y 4 y no 3 porque
 * `mensajeReenganche` tiene exactamente 4 frases: con 3 el guard truncaría un
 * texto que el equipo escribió a mano.
 */
export const MAX_LINEAS = 3;
export const MAX_FRASES = 4;

// ── Utilidades de texto ──────────────────────────────────

const sinTildes = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const escaparRegExp = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Un emoji, incluidas las secuencias con ZWJ y los selectores de variación:
 * 👨‍👩‍👧 es UN emoji, no tres.
 */
const EMOJI = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*/gu;

const contarEmojis = (t: string) => (t.match(EMOJI) ?? []).length;

/**
 * Parte un texto en frases conservando su espaciado, para que `join("")` lo
 * reconstruya exacto.
 *
 * El corte exige que después del terminador venga espacio o el final: así
 * "4.500.000" y "$4.500.000 al mes" NO se parten en tres frases, que es el
 * error obvio de un `split(/[.!?]/)` en un chat donde casi todos los mensajes
 * llevan cifras en pesos colombianos.
 */
export function frasesDe(texto: string): string[] {
  const frases: string[] = [];
  let actual = "";

  for (let i = 0; i < texto.length; i++) {
    actual += texto[i];
    if (!/[.!?…]/.test(texto[i])) continue;

    // Se absorben los cierres pegados al terminador: «...». ) " ”
    let j = i + 1;
    while (j < texto.length && /[.!?…»”"')\]]/.test(texto[j])) {
      actual += texto[j];
      j++;
    }
    if (j < texto.length && !/\s/.test(texto[j])) {
      i = j - 1;
      continue;
    }
    // El espacio que separa se queda con la frase que termina.
    while (j < texto.length && /\s/.test(texto[j])) {
      actual += texto[j];
      j++;
    }
    frases.push(actual);
    actual = "";
    i = j - 1;
  }

  if (actual.trim()) frases.push(actual);
  return frases;
}

/** ¿La frase cierra en pregunta? Es la que nunca se trunca. */
const esPregunta = (frase: string) => /\?[\s"»”')\]]*$/.test(frase.trim());

// ── Las cuatro reglas que BLOQUEAN ───────────────────────

/**
 * Los tres datos que suenan a expediente cuando se leen de vuelta.
 *
 * Son exactamente los que `prompt-maestro.ts:83` prohíbe y los que
 * `mensajeYaSabemos:691` explica por qué no se recitan: "saber sus datos y
 * leérselos de vuelta son cosas distintas".
 *
 * ⚠️ **La ciudad NO está aquí, y es deliberado.** Consultado y cerrado el
 * 2026-07-25 (punto de consulta del §6): `mensajeYaSabemos:723` dice "busco
 * opciones en Bogotá" A PROPÓSITO —demuestra que la conocemos sin sonar a base
 * de datos hablando— y hay un test que lo fija (`preguntas.test.ts:153`).
 * Bloquearla castigaría al modelo justo por hacer bien su trabajo.
 */
const RECITA: Record<string, RegExp> = {
  ingreso:
    /\btus?\s+ingresos?\b|\bganas\b|\bdevengas\b|\btu\s+(sueldo|salario)\b|lo que ganas|\btus\s+entradas\b|tu capacidad de pago/i,
  afiliacion:
    /\b(?:no\s+)?(?:eres|est[áa]s)\s+afiliad[oa]\b|\btu afiliaci[óo]n\b|\btu caja de compensaci[óo]n\b/i,
  deuda:
    /\btus?\s+deudas?\b|est[áa]s\s+reportad|\btu\s+(mora|reporte)\b|\btu vida crediticia\b|\btu historial\s+(crediticio|de cr[ée]dito)\b|en datacr[ée]dito/i,
};

/**
 * Reconoce que se está hablando de una categoría sensible, no de un valor.
 *
 * Se compara CATEGORÍA contra `textoBase` y no el dato literal porque el LLM
 * parafrasea: si la base pregunta "¿cómo va tu vida crediticia?", la versión
 * pulida puede decir "tu historial de crédito" y sigue siendo el mismo permiso.
 */
function recitaDatosLead(texto: string, textoBase: string): boolean {
  return Object.values(RECITA).some(
    (re) => re.test(texto) && !re.test(textoBase),
  );
}

const SUPLANTA =
  /\bno soy (?:un |una )?(?:bot|robot|m[áa]quina|ia\b|inteligencia artificial|programa)|\bsoy (?:una )?persona (?:real|de verdad)\b|\bsoy human[ao]\b|\bsoy de carne y hueso\b|\bsoy real\b/i;

/**
 * ⚠️ Exige primera persona a propósito. `mensajeHandoffAsesor:194` dice "un
 * asesor de carne y hueso" —y eso es verdad, y es de los mejores momentos de la
 * conversación—. Lo prohibido es que Sara lo diga **de sí misma**.
 */
const suplantaHumano = (texto: string, textoBase: string) =>
  SUPLANTA.test(texto) && !SUPLANTA.test(textoBase);

/** Los 18 nombres reales, del más largo al más corto (`desvio.ts:71`). */
const NOMBRES_CATALOGO = [...catalogo]
  .map((p) => p.nombre)
  .sort((a, b) => b.length - a.length);

/**
 * Nombrar un proyecto que el motor no eligió es recomendar sin motor, aunque
 * suene a comentario al pasar. Recomendar es del matcher determinista, que lo
 * hace con reglas auditables (`prompt-maestro.ts:157`).
 */
function recomiendaSinMotor(
  texto: string,
  textoBase: string,
  permitidos: string[],
): boolean {
  const plano = sinTildes(texto);
  const base = sinTildes(textoBase);
  const autorizados = permitidos.map(sinTildes);

  return NOMBRES_CATALOGO.some((nombre) => {
    const llano = sinTildes(nombre);
    const re = new RegExp(`\\b${escaparRegExp(llano)}\\b`);
    if (!re.test(plano)) return false;
    return !re.test(base) && !autorizados.some((a) => re.test(a));
  });
}

// ── Cifras: la regla más delicada de calibrar ────────────

const MESES =
  "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre";

/**
 * Las cifras que importan. Un número suelto y pequeño ("2 alcobas", "3
 * cositas") NO cuenta: bloquear por eso sería apagar la capa de IA entera.
 * Cuenta lo que puede volverse una promesa — plata, porcentajes y fechas.
 */
function figurasDe(texto: string): Set<string> {
  const figuras = new Set<string>();

  // Fechas escritas: "el 15 de marzo", "15/03", "15/03/2026".
  for (const m of texto.matchAll(new RegExp(`\\b(\\d{1,2})\\s+de\\s+(${MESES})\\b`, "gi"))) {
    figuras.add(`fecha:${m[1]}-${sinTildes(m[2])}`);
  }
  for (const m of texto.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g)) {
    figuras.add(`fecha:${m[1]}-${m[2]}`);
  }

  // Porcentajes: "40%", "el 40 por ciento".
  for (const m of texto.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:%|por ciento)/gi)) {
    figuras.add(`pct:${normalizarNumero(m[1])}`);
  }

  // Montos: con $, con magnitud escrita, o con 4+ dígitos / separador de miles.
  const MONTO =
    /\$\s*\d[\d.,'\s]*|\b\d+(?:[.,]\d+)*\s*(?:mill[oó]n(?:es)?|mil)\b(?:\s+y\s+medio)?|\b\d[\d.,']{3,}\b|\b\d{4,}\b/gi;
  for (const m of texto.matchAll(MONTO)) {
    const valor = valorEnPesos(m[0]);
    if (valor !== undefined) figuras.add(`monto:${valor}`);
  }

  return figuras;
}

/** "4.500.000" → 4500000 · "4,5" → 4.5. Los puntos son miles si cierran en 3. */
function normalizarNumero(crudo: string): number {
  const partes = crudo.replace(/['`´\s]/g, "").replace(/,/g, ".").split(".");
  if (partes.length === 1) return Number(partes[0]);
  const ultima = partes[partes.length - 1];
  if (ultima.length === 3) return Number(partes.join(""));
  return Number(`${partes.slice(0, -1).join("")}.${ultima}`);
}

/**
 * El valor en pesos de una cifra escrita como la escribe la gente.
 *
 * El "y medio" no es un lujo: el prompt de tono le pide a Sara que conserve las
 * cifras, pero **reescribir "$4.500.000" como "4 millones y medio" es lo que un
 * humano haría** y no es inventar nada. Sin esto, el guard bloquearía el pulido
 * honesto y la capa de IA se apagaría sola sin que nadie lo notara.
 *
 * Se duplica a propósito la aritmética de `parsearIngresoMensual` en vez de
 * importarla: ese archivo lo está partiendo la rama 2 hacia
 * `lib/conversacion/interpretacion/` en paralelo, y el guard no puede quedar
 * colgando de un import que se va a mover en las próximas horas. Son diez
 * líneas, no una segunda fuente de un dato.
 */
function valorEnPesos(crudo: string): number | undefined {
  const limpio = crudo.replace(/\$/g, "").trim();
  const numero = limpio.match(/\d[\d.,'\s]*/)?.[0];
  if (!numero) return undefined;
  const valor = normalizarNumero(numero);
  if (!Number.isFinite(valor)) return undefined;

  const magnitud = /mill[oó]n/i.test(limpio) ? 1_000_000 : /\bmil\b/i.test(limpio) ? 1_000 : 1;
  const medio = magnitud > 1 && /\by\s+medio\b/i.test(limpio) ? 0.5 : 0;
  return Math.round((valor + medio) * magnitud);
}

/**
 * Una cifra vale si estaba en el texto que TypeScript redactó, si es un precio
 * del catálogo (el prompt de duda se lo entrega para consultar) o si el turno
 * la autorizó. Lo demás, en un chat que vende vivienda, es una promesa
 * inventada.
 */
function cifraInventada(
  texto: string,
  textoBase: string,
  permitidas: number[],
): boolean {
  const permitidos = new Set<string>([
    ...figurasDe(textoBase),
    ...catalogo.map((p) => `monto:${p.precio_desde}`),
    ...permitidas.map((n) => `monto:${Math.round(n)}`),
  ]);
  return [...figurasDe(texto)].some((f) => !permitidos.has(f));
}

// ── Las cuatro reglas que LIMPIAN ────────────────────────

/** Markdown, viñetas, encabezados, comillas envolventes y meta-comentario. */
function limpiarFormato(texto: string): string {
  let t = texto;

  // "Aquí tienes el mensaje:" y familia. Anclado y corto a propósito: mensajes
  // reales arrancan con "Hablemos de plata a tu favor:" y no se pueden tocar.
  t = t.replace(
    /^\s*(?:claro,?\s+)?(?:aqu[íi] (?:tienes|est[áa]|va)|el mensaje|mensaje redactado|versi[óo]n redactada|respuesta)[^\n:]{0,30}:\s*/i,
    "",
  );

  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, ""); // encabezados
  t = t.replace(/^\s*[-*•–]\s+/gm, ""); // viñetas
  // `[\s\S]` en vez del flag `s`: el `target` del tsconfig es anterior a es2018
  // y `tsc` rechaza el dotAll (TS1501). Es el mismo comportamiento.
  t = t.replace(/\*\*([\s\S]+?)\*\*/g, "$1"); // **negrita**
  t = t.replace(/__([\s\S]+?)__/g, "$1");
  t = t.replace(/(?<!\*)\*(?!\s)([^*\n]+?)\*/g, "$1"); // *cursiva*

  // Comillas que envuelven TODO el mensaje. Solo eso: `respuestaDeterministaDuda`
  // trae comillas internas legítimas (el "desde" del precio).
  const envuelto = t.trim().match(/^["“«']([\s\S]+)["”»']$/);
  if (envuelto) t = envuelto[1];

  return t.trim();
}

const tieneFormato = (texto: string) => limpiarFormato(texto) !== texto.trim();

/**
 * Saca el nombre del lead sin dejar la puntuación coja.
 *
 * Se atacan las tres formas en que aparece un vocativo, en orden: después de
 * coma ("Perfecto, Diana, gracias"), antes de coma ("Diana, ¿cómo vas?") y
 * suelto ("Hola Diana!").
 */
function quitarNombre(texto: string, nombre: string): string {
  const primero = escaparRegExp(nombre.trim().split(/\s+/)[0]);
  if (!primero) return texto;

  return texto
    .replace(new RegExp(`\\s*,\\s*\\b${primero}\\b(?=[,.!?…:;]|\\s|$)`, "gi"), "")
    .replace(new RegExp(`\\b${primero}\\b\\s*,\\s*`, "gi"), "")
    .replace(new RegExp(`\\s*\\b${primero}\\b`, "gi"), "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?…:;])/g, "$1")
    .trim();
}

/** Deja los primeros `maximo` emojis y borra el resto. */
function recortarEmojis(texto: string, maximo: number): string {
  let vistos = 0;
  return texto
    .replace(EMOJI, (e) => (++vistos <= maximo ? e : ""))
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?…:;])/g, "$1")
    .trim();
}

/**
 * Trunca conservando la última frase si es pregunta.
 *
 * La excepción no es un capricho: la última frase del mensaje es, casi siempre,
 * LA pregunta del paso. Truncar hasta dejarla afuera convertiría el turno en un
 * comentario sin pregunta y el chat se quedaría esperando una respuesta que
 * nunca se pidió.
 */
function truncarFrases(texto: string, maximo: number): string {
  const frases = frasesDe(texto);
  if (frases.length <= maximo) return texto;

  const ultima = frases[frases.length - 1];
  const partes = esPregunta(ultima)
    ? [...frases.slice(0, maximo - 1), ultima]
    : frases.slice(0, maximo);

  return partes.join("").trim();
}

// ── El guard ─────────────────────────────────────────────

/**
 * Lo último que pasa antes de que el lead lea.
 *
 * @param texto     lo que devolvió el LLM.
 * @param textoBase lo que TypeScript había redactado. Es la vara: todo lo que
 *                  el modelo afirme de más se mide contra esto.
 *
 * Con `texto === textoBase` (o sea, cuando el LLM no contestó y ya se está
 * pintando el determinista) el resultado SIEMPRE es `ok`. Hay un test que
 * recorre todos los mensajes reales del repo para probarlo: un guard que
 * corrige los textos que el equipo escribió a mano estaría roto.
 */
export function postGuard(
  texto: string,
  textoBase: string,
  contexto: ContextoGuard = {},
): ResultadoGuard {
  const violaciones: ReglaGuard[] = [];
  const crudo = texto.trim();

  if (!crudo) {
    return {
      aprobado: true,
      textoFinal: textoBase,
      violaciones: [],
      severidad: "ok",
    };
  }

  // 1. Bloqueos. Se miran sobre el texto crudo: limpiar formato no puede
  //    convertir una cifra inventada en aceptable.
  if (recitaDatosLead(crudo, textoBase)) violaciones.push("recita_datos_lead");
  if (cifraInventada(crudo, textoBase, contexto.cifrasPermitidas ?? [])) {
    violaciones.push("cifra_inventada");
  }
  if (recomiendaSinMotor(crudo, textoBase, contexto.proyectosPermitidos ?? [])) {
    violaciones.push("recomienda_sin_motor");
  }
  if (suplantaHumano(crudo, textoBase)) violaciones.push("suplanta_humano");

  if (violaciones.length > 0) {
    return {
      aprobado: false,
      textoFinal: textoBase,
      violaciones,
      severidad: "bloquea",
    };
  }

  // 2. Limpieza. El orden importa: primero se le quita el disfraz de documento,
  //    después se cuenta lo que quedó.
  let limpio = crudo;

  if (tieneFormato(limpio)) {
    violaciones.push("formato_whatsapp");
    limpio = limpiarFormato(limpio);
  }

  const nombre = contexto.nombre?.trim();
  if (nombre) {
    const primero = nombre.split(/\s+/)[0];
    const enTexto = new RegExp(`\\b${escaparRegExp(primero)}\\b`, "i");
    if (enTexto.test(limpio) && !enTexto.test(textoBase)) {
      violaciones.push("nombre_agregado");
      limpio = quitarNombre(limpio, primero);
    }
  }

  // El tope de emojis es relativo a la base: `mensajeSaludo` trae 👋 y 🏡, y
  // pulirlo no puede costarle uno. Lo que se persigue es que Sara AGREGUE.
  const topeEmojis = Math.max(1, contarEmojis(textoBase));
  if (contarEmojis(limpio) > topeEmojis) {
    violaciones.push("exceso_emojis");
    limpio = recortarEmojis(limpio, topeEmojis);
  }

  const lineas = limpio.split("\n").filter((l) => l.trim()).length;
  if (frasesDe(limpio).length > MAX_FRASES || lineas > MAX_LINEAS) {
    violaciones.push("exceso_lineas");
    limpio = truncarFrases(limpio, MAX_FRASES)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ");
  }

  return {
    aprobado: true,
    textoFinal: limpio,
    violaciones,
    severidad: violaciones.length > 0 ? "limpia" : "ok",
  };
}

/**
 * Las que limpian pero **cambian el sentido**, no solo el formato.
 *
 * Truncar borra contenido y quitar el nombre cambia a quién le habla el
 * mensaje: eso el asesor tiene que poder verlo. Quitar un asterisco o un emoji
 * de más, no — eso va a log y ya (§3 del plan: "el aseo de formato puro va solo
 * a log").
 */
const CAMBIAN_EL_SENTIDO: ReglaGuard[] = ["exceso_lineas", "nombre_agregado"];

/**
 * La fila `sistema` que deja el rastro en el hilo (ADR 0003), o `null` cuando
 * el aseo fue puro formato y no merece ocupar el hilo del asesor.
 *
 * El texto del caso `bloquea` está consultado y cerrado (punto 12 del plan,
 * 2026-07-25). El del caso "cambia el sentido" es su derivado en el mismo
 * registro; queda anotado en la bitácora para ratificar.
 */
export function notaSistemaGuard(resultado: ResultadoGuard): string | null {
  const lista = (reglas: ReglaGuard[]) =>
    `${reglas.length === 1 ? "regla" : "reglas"}: ${reglas.join(", ")}`;

  if (resultado.severidad === "bloquea") {
    return (
      `El guard bloqueó la redacción del agente (${lista(resultado.violaciones)}). ` +
      "Se pintó el texto determinista del sistema; el lead nunca vio la versión bloqueada."
    );
  }

  const cambian = resultado.violaciones.filter((v) => CAMBIAN_EL_SENTIDO.includes(v));
  if (cambian.length === 0) return null;

  return (
    `El guard corrigió la redacción del agente (${lista(cambian)}). ` +
    "El lead vio el texto ya saneado."
  );
}
