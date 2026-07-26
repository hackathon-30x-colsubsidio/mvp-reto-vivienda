import { z } from "zod";
import type { Lead } from "@/lib/types";
import type { FichaProyecto } from "@/lib/matching/tipos";

// =====================================================================
// QUÉ PASÓ EN ESTE TURNO.
//
// Hasta hoy, lo que el lead teclea sale de `interpretarTexto` como un
// `Respuesta` con un `patch`, y cuando el patch viene vacío nadie se
// entera: "vivo con mi mamá y mi hermana" recibe un acuse amable y el
// dato se pierde en silencio (hueco 2 del plan de arquitectura).
//
// `AccionTurno` es el vocabulario que hace visible lo que pasó. NO es un
// mecanismo nuevo: es el mismo turno de siempre, nombrado. Quien decide
// qué hacer con cada acción es la máquina de conversación (rama 5).
//
// ── Dónde está zod, y dónde no ───────────────────────────────────────
//
// El borde de este sistema es la salida del LLM, no esta unión: una
// `AccionTurno` la construye TypeScript y la consume TypeScript, en el
// mismo proceso. Lo que sí cruza es lo que devuelve el modelo cuando el
// regex no entendió, y para eso está `INTERPRETACION_POR_CAMPO`: el
// menú cerrado de valores que el código ya produce. Validar contra él
// es lo que impide que el modelo invente una categoría que el motor no
// sabe puntuar (rama 4, `/api/interpretar`).
//
// Es el patrón de Motoko: el modelo escoge del menú; no escribe el menú.
// =====================================================================

/**
 * Los campos que la conversación base pregunta.
 *
 * `satisfies` los amarra al contrato compartido: si `lib/types.ts` cambia el
 * nombre de un campo, esto no compila. Es a propósito — la rama 4 valida la
 * salida del modelo contra esta lista, y un nombre viejo aquí significa un dato
 * que se guarda donde nadie lo lee.
 */
export const CAMPOS_PREGUNTA = [
  "tiene_vivienda",
  "composicion_familiar",
  "rango_ingreso_hogar",
  "subsidios",
  "rango_edad",
  "situacion_crediticia",
  "zona_interes",
] as const satisfies readonly Exclude<keyof Lead["respuestas"], "consentimiento">[];

export const CampoSchema = z.enum(CAMPOS_PREGUNTA);
export type CampoPregunta = z.infer<typeof CampoSchema>;

/** Lo que una respuesta deja en el lead. Nunca reemplaza: se mezcla encima. */
export type Patch = Partial<Lead["respuestas"]>;

/**
 * El menú cerrado de cada campo: **qué tiene que devolver quien lo interprete**,
 * sea el regex de `interpretacion/` o el modelo de la rama 4.
 *
 * Ojo con `rango_ingreso_hogar`: lo que hay que interpretar ahí es el MONTO
 * mensual, no el texto (el texto crudo ya lo tenemos y se guarda igual). El
 * monto que salga de aquí pasa después por `plausible()` de
 * `interpretacion/ingreso.ts` — zod dice "es un número", `plausible()` dice "es
 * un número que una persona puede tener de verdad", y del segundo depende el
 * único gate legal del sistema (40%, Decreto 583 de 2025).
 */
export const INTERPRETACION_POR_CAMPO = {
  tiene_vivienda: z.boolean(),
  composicion_familiar: z.enum(["solo", "pareja", "familia_con_hijos", "monoparental"]),
  rango_ingreso_hogar: z.number().int().positive(),
  subsidios: z.array(z.string().min(1)),
  rango_edad: z.enum(["20_35", "36_45", "46_mas"]),
  situacion_crediticia: z.enum(["buena", "regular", "mala", "sin_info"]),
  zona_interes: z.string().min(1),
} as const satisfies Record<CampoPregunta, z.ZodType>;

/**
 * El valor que le corresponde a un campo, sacado del menú.
 *
 * Los intérpretes de `interpretacion/` devuelven esto (o `undefined`), así que
 * el enum del regex y el enum que valida al modelo son literalmente el mismo.
 */
export type ValorDe<C extends CampoPregunta> = z.infer<(typeof INTERPRETACION_POR_CAMPO)[C]>;

/** De qué es la duda. Vive aquí y no en `desvio.ts` porque la acción la nombra. */
export type ClaseDuda = "precio" | "ubicacion" | "subsidio" | "general";

/**
 * Todo lo que puede pasar en un turno del lead.
 *
 * Las tres primeras existen hoy con otro nombre; las tres siguientes son lo que
 * hoy no tiene nombre y por eso se pierde:
 *
 *   · `responder_paso`  — hoy: un `Respuesta` con patch lleno.
 *   · `confirmar_dato`  — hoy: `respuesta.repreguntar` (solo el ingreso lo usa).
 *   · `responder_duda` / `handoff_asesor` — hoy: `detectarDesvio`.
 *   · `no_entendido`    — hoy: un `{patch:{}}` mudo con acuse amable. ⚠️ Que
 *     exista NO cambia el comportamiento: la rama 5 decide qué hacer con él.
 *   · `corregir_dato`   — nuevo: el lead cambia algo que ya había dicho.
 *   · `fuera_de_tema`   — nuevo: no es respuesta, ni duda, ni corrección.
 */
export type AccionTurno =
  | {
      tipo: "responder_paso";
      campo: CampoPregunta;
      patch: Patch;
      /** Lo que el agente contesta antes de seguir. Separa conversar de encuestar. */
      acuse?: string;
      /** El acuse pasa por el LLM para que no suene a plantilla (hoy: la zona). */
      pulir?: boolean;
    }
  | { tipo: "no_entendido"; campo: CampoPregunta; textoCrudo: string }
  | {
      tipo: "confirmar_dato";
      campo: CampoPregunta;
      /** Lo que sí se pudo guardar mientras se confirma (hoy: el texto crudo del ingreso). */
      patch: Patch;
      acuse: string;
      /** Qué decir cuando ya se repreguntó una vez y toca seguir de todos modos. */
      acuseSiInsiste: string;
    }
  | { tipo: "corregir_dato"; campo: CampoPregunta; patch: Patch; acuse: string }
  | {
      tipo: "responder_duda";
      clase: ClaseDuda;
      proyecto?: FichaProyecto;
      textoCrudo: string;
    }
  | { tipo: "fuera_de_tema"; textoCrudo: string }
  | { tipo: "handoff_asesor" };
