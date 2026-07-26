import { z } from "zod";
import { generarJSON } from "@/lib/gemini";
import { curar } from "@/lib/curar";
import { catalogo } from "@/lib/matching/catalogo";
import type { FichaProyecto } from "@/lib/matching/tipos";
import type { Lead } from "@/lib/types";
import {
  bancoDisponible,
  IDS_BANCO,
  type IdPreguntaBanco,
  type PreguntaBanco,
} from "./banco-preguntas";

// =====================================================================
// QUÉ PREGUNTA DEL BANCO VALE LA PENA HACER — si es que alguna.
//
// Cierra el §7 punto 9, que la rama 4 difirió porque el banco no existía.
//
// ── Qué le decimos al modelo que es "óptimo" ─────────────────────────
//
// Esta era LA pregunta abierta, y la respuesta no es "la que más
// información aporte": es **la pregunta cuya respuesta cambiaría lo que
// le vamos a recomendar.**
//
// Si a esta persona le quedan tres proyectos y los tres tienen gimnasio,
// preguntarle por el gimnasio no mueve nada: ya sabemos la respuesta del
// catálogo. Le cuesta un turno de su tiempo y no le compra nada. Si en
// cambio uno solo acepta mascotas, esa pregunta parte el conjunto.
//
// Por eso el código NO le pide al modelo que adivine qué discrimina: se
// lo **calcula y se lo entrega como hecho**, junto al `paraQueSirve` de
// cada pregunta. El modelo aporta lo que el número no sabe —si a esta
// persona, después de esta conversación, le cae bien esa pregunta— y
// escoge un id. Es el patrón de §4: el modelo escoge del set, no lo
// escribe.
//
// ── Las tres cosas que lo hacen seguro ───────────────────────────────
//
//  1. **Escoge un id, no escribe una pregunta.** Zod valida contra
//     `IDS_BANCO`. Un id inventado → `undefined` → la capa no se activa.
//  2. **Nunca ofrece lo ya contestado.** Solo entran las de
//     `bancoDisponible`, que es la versión banco del criterio 1.
//  3. **Falla cerrada.** Sin credencial, por timeout o por JSON ilegible
//     devuelve `undefined` y la conversación termina como hoy, con sus
//     7 preguntas. El banco es aditivo: si no se activa, no falta nada.
//
// ── Lo que este selector NO hace ─────────────────────────────────────
//
// La discriminación se mide sobre los proyectos que el lead **recibiría
// hoy** (hasta 3), no sobre todo el catálogo que le cabe. Es más barato y
// es la comparación honesta —son los que va a ver—, pero significa que no
// detecta una pregunta que promovería a un cuarto proyecto que hoy queda
// afuera. Queda anotado; si alguien lo necesita, el matcher tendría que
// exponer el pool antes de recortar a 3.
// =====================================================================

/** 3 s, el mismo corte que el resto de la capa de IA (§3). */
const LIMITE_SELECTOR_MS = 3000;

const RespuestaSchema = z.object({
  id: z.enum(IDS_BANCO as [IdPreguntaBanco, ...IdPreguntaBanco[]]),
});

/**
 * Cuánto separa una dimensión a los proyectos que el lead recibiría.
 *
 * 0 = todos iguales (preguntar no cambia nada) · 1 = partido por la mitad.
 * Se mide como la fracción del par más grande: si de 3 proyectos 2 tienen la
 * amenidad y 1 no, la dimensión separa 1/3 del conjunto.
 */
function discriminacion(valores: boolean[]): number {
  if (valores.length < 2) return 0;
  const conSi = valores.filter(Boolean).length;
  const conNo = valores.length - conSi;
  return Math.min(conSi, conNo) / valores.length;
}

/** Los hechos que el modelo recibe: qué separa a los candidatos y cuánto. */
export function dimensionesQueSeparan(
  disponibles: PreguntaBanco[],
  candidatos: FichaProyecto[],
): { pregunta: PreguntaBanco; separa: number; hecho: string }[] {
  return disponibles.map((pregunta) => {
    let separa = 0;
    let hecho = "";

    if (pregunta.id === "alcobas") {
      // Se mira si el conjunto ofrece tamaños distintos: preguntar cuántas
      // alcobas solo sirve si hay de dónde escoger.
      const tamanos = new Set(candidatos.flatMap((p) => p.alcobas ?? []));
      separa = tamanos.size > 1 ? 1 : 0;
      hecho =
        tamanos.size > 1
          ? `los proyectos que le quedan tienen tipologías de ${[...tamanos].sort().join(" y ")} alcobas: la respuesta cambia cuál va primero`
          : "todos los proyectos que le quedan ofrecen el mismo número de alcobas: preguntarlo no cambiaría el orden";
    } else if (pregunta.id === "amenidades") {
      const familias = new Set(candidatos.flatMap((p) => p.amenidades ?? []));
      const separadas = [...familias].filter((f) =>
        discriminacion(candidatos.map((p) => (p.amenidades ?? []).includes(f))) > 0,
      );
      separa = separadas.length > 0 ? 1 : 0;
      hecho =
        separadas.length > 0
          ? `los proyectos que le quedan se diferencian en ${separadas.length} tipo(s) de zona social: la respuesta cambia cuál va primero`
          : "los proyectos que le quedan tienen las mismas zonas sociales: preguntarlo no cambiaría el orden";
    } else if (pregunta.id === "espacio") {
      const areas = candidatos
        .map((p) => p.area_privada_desde_m2)
        .filter((a): a is number => typeof a === "number");
      separa = areas.length > 1 && Math.max(...areas) - Math.min(...areas) >= 5 ? 1 : 0;
      hecho =
        separa > 0
          ? `las áreas van de ${Math.min(...areas)} a ${Math.max(...areas)} m²: la respuesta cambia cuál va primero`
          : "los proyectos que le quedan tienen áreas parecidas: preguntarlo no cambiaría el orden";
    } else {
      // `momento` no matchea nada y se dice: prioriza la cola del asesor.
      separa = 0;
      hecho =
        "no cambia qué proyectos se recomiendan; sirve para que el asesor sepa con qué urgencia llamarlo";
    }

    return { pregunta, separa, hecho };
  });
}

function promptSelector(): string {
  return `Eres el componente que decide QUÉ pregunta adicional vale la pena hacerle a una persona
que está comprando vivienda, al final de una conversación que ya le hizo las preguntas obligatorias.

Tu única salida es un JSON con el id de UNA pregunta de la lista que te dan. No escribes preguntas,
no las reformulas, no propones otras: escoges una de las que existen.

QUÉ ES UNA BUENA ELECCIÓN, en este orden:
1. Que la respuesta CAMBIE lo que le vamos a recomendar. Te decimos, para cada pregunta, si de
   verdad separa a los proyectos que le quedan a esta persona. Una pregunta que no separa nada le
   cuesta un turno de su tiempo y no le compra nada: no la escojas si hay otra que sí separe.
2. Que venga bien después de lo que la persona ya dijo. Acabas de leer sus respuestas: si sonó
   apurada o incómoda, una pregunta de gusto cae mejor que una que suene a trámite.

NO escojas por curiosidad ni por completar la ficha. Esta persona ya contestó lo obligatorio y nos
hizo el favor; lo que sigue tiene que servirle a ella, no a nosotros.`;
}

function entradaSelector(
  opciones: { pregunta: PreguntaBanco; separa: number; hecho: string }[],
  lead: Lead,
): string {
  const yaDijo = [
    lead.respuestas.composicion_familiar && `con quién viviría: ${lead.respuestas.composicion_familiar}`,
    lead.respuestas.zona_interes && `dónde quiere vivir: ${lead.respuestas.zona_interes}`,
    lead.respuestas.tiene_vivienda !== undefined &&
      (lead.respuestas.tiene_vivienda ? "ya tiene vivienda" : "sería su primera vivienda"),
  ]
    .filter(Boolean)
    .join(" · ");

  const lista = opciones
    .map(
      (o) =>
        `- id "${o.pregunta.id}": ${o.pregunta.paraQueSirve}\n  ¿separa a sus candidatos? ${
          o.separa > 0 ? "SÍ" : "NO"
        } — ${o.hecho}`,
    )
    .join("\n");

  return `LO QUE LA PERSONA YA CONTÓ: ${yaDijo || "poco más que lo obligatorio"}

PREGUNTAS DISPONIBLES (escoge el id de UNA):
${lista}`;
}

/**
 * Qué pregunta del banco hacer, o `undefined` para no hacer ninguna.
 *
 * `undefined` es una salida legítima y frecuente, no un error: sin credencial,
 * sin preguntas disponibles, por timeout o por un id inventado. La conversación
 * termina con sus 7 preguntas, exactamente como hoy.
 */
export async function seleccionarDelBanco(lead: Lead): Promise<PreguntaBanco | undefined> {
  const disponibles = bancoDisponible(lead.respuestas);
  if (disponibles.length === 0) return undefined;

  // Los que recibiría hoy: es contra ellos que se mide si preguntar cambia algo.
  const candidatos = curar(lead)
    .proyectos.map((r) => catalogo.find((f) => f.proyecto_id === r.proyecto_id))
    .filter((f): f is FichaProyecto => f !== undefined);

  // Sin candidatos no hay nada que reordenar: el lead cayó en nutrición o nada
  // le cabe. Preguntarle por alcobas ahí sería cruel y además inútil.
  if (candidatos.length === 0) return undefined;

  const opciones = dimensionesQueSeparan(disponibles, candidatos);

  const crudo = await generarJSON({
    system: promptSelector(),
    prompt: entradaSelector(opciones, lead),
    esquema: {
      type: "object",
      properties: { id: { type: "string", enum: IDS_BANCO } },
      required: ["id"],
    },
    // Un id cabe de sobra. El techo bajo es parte de que no se ponga a
    // justificar su elección.
    maxTokens: 60,
    signal: AbortSignal.timeout(LIMITE_SELECTOR_MS),
  });

  const validado = RespuestaSchema.safeParse(crudo);
  if (!validado.success) return undefined;

  // Doble red: el id existe (zod) y además sigue disponible. Un modelo que
  // devuelva una pregunta ya contestada no puede hacer que se repregunte.
  return disponibles.find((p) => p.id === validado.data.id);
}
