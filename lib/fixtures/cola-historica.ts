import type { Lead, LeadCurado, ProyectoCatalogo } from "@/lib/types";
import type { LeadEnCola } from "@/lib/types-asesor";
import { afiliadoEfectivo, calcularScore } from "@/lib/scoring";
import { matchear } from "@/lib/matching";
import { diaBogota } from "@/lib/formato";
import type { FichaProyecto } from "@/lib/matching/tipos";
import identidades from "@/data/sintetica/identidades.json";
import proyectosJson from "@/data/sintetica/proyectos.json";

// =====================================================================
// EL TELÓN DE FONDO DEL TABLERO — leads sintéticos, y lo dice en pantalla.
//
// El tablero del especialista mide ritmo de entrada por día. Con los 3
// personajes canónicos (todos del mismo día) esa métrica no existe: no
// hay serie, hay un punto. Este módulo genera el volumen que falta.
//
// TRES REGLAS QUE LO MANTIENEN HONESTO:
//
// 1. Las identidades NO se inventan: salen de `data/sintetica/
//    identidades.json`, que el Track B derivó de las distribuciones
//    reales y ya está anonimizado y versionado (AGENTS.md permite
//    exactamente esa data en el repo público).
// 2. Los veredictos NO se inventan: cada lead pasa por `calcularScore()`
//    y por `matchear()`, el motor y el matcher de verdad. Si mañana
//    cambia una regla, el tablero cambia con ella.
// 3. Cada lead va marcado `sintetico: true` y la pantalla lo avisa. El
//    jurado nunca ve un número sin saber de dónde salió.
//
// Determinista de punta a punta: PRNG con semilla fija y ninguna
// llamada a `Math.random()` ni a `new Date()`. Dos renders dan el mismo
// resultado — el video no puede cambiar entre tomas.
// =====================================================================

/** Los 3 personajes del demo. Salen del telón: ya vienen por la cola real. */
const CEDULAS_CANONICAS = new Set(["1000000001", "1000000002", "1000000003"]);

const SEMILLA = 0x5eed_1a17;
const DIAS_DE_HISTORIA = 14;
const LEADS_A_GENERAR = 57;

/**
 * SMMLV usado para traducir los rangos de ingreso de las identidades a
 * pesos, que es lo que el motor necesita para el tope del 40%.
 *
 * **$1.750.905 en 2026**, fijado por los Decretos 1469 y 1470 del 29 de
 * diciembre de 2025 (+23% sobre 2025). Ya no es supuesto: tiene fuente
 * (docs/credito-y-subsidios.md). Si cambia el año, cambia también en
 * `lib/conversacion/preguntas.ts` y en `scripts/generar_sintetica.py`.
 */
const SMMLV = 1_750_905;

/** Rango de ingreso mensual del hogar por banda, en múltiplos de SMMLV. */
const BANDAS_INGRESO: Record<string, [number, number]> = {
  "menos de 2 SMLV": [1, 2],
  "2 a 4 SMLV": [2, 4],
  "más de 4 SMLV": [4, 8],
  // El no afiliado no trae banda del enriquecimiento: la declara en el chat.
  "no disponible (no afiliado)": [1.5, 6],
};

// ── PRNG determinista (mulberry32) ───────────────────────────────────

/** Generador con semilla. Mismo `SEMILLA` → misma cola, siempre. */
function crearAzar(semilla: number): () => number {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Catálogo ─────────────────────────────────────────────────────────

const catalogo: ProyectoCatalogo[] = proyectosJson as ProyectoCatalogo[];

/** `ProyectoCatalogo` (nulos del JSON) → `FichaProyecto` (lo que espera el matcher). */
function aFicha(p: ProyectoCatalogo): FichaProyecto {
  return {
    proyecto_id: p.proyecto_id,
    nombre: p.nombre,
    ciudad: p.ciudad,
    ...(p.zona ? { zona: p.zona } : {}),
    precio_desde: p.precio_desde ?? 0,
    vis: p.vis ?? false,
    cupo_no_afiliados: p.cupo_no_afiliados,
  };
}

const catalogoFichas = catalogo.map(aFicha);

/**
 * El techo de precio que le permite el tope del 40%.
 *
 * NO reimplementa la norma: invierte la misma fórmula que ya usa
 * `lib/scoring/index.ts` (cuota estimada = precio × PORCENTAJE, tope =
 * 40% del ingreso). Vive aquí y no en el motor porque el ticket 004
 * ("capacidad compartida") todavía no aterrizó; cuando lo haga, esto se
 * reemplaza por su función.
 */
function precioMaximo(ingresoMensual: number): number {
  return (ingresoMensual * 0.4) / 0.006;
}

// ── Generación de un lead ────────────────────────────────────────────

type Identidad = (typeof identidades)[number];

/** Un entero en [min, max). */
function entero(azar: () => number, min: number, max: number): number {
  return min + Math.floor(azar() * (max - min));
}

function elegir<T>(azar: () => number, opciones: readonly T[]): T {
  return opciones[entero(azar, 0, opciones.length)];
}

/**
 * Fisher-Yates con el PRNG con semilla.
 *
 * Recorrer `identidades.json` en orden de archivo daba una cola casi sin
 * no afiliados (vienen agrupados al final), y el tablero agrupa
 * justamente por afiliación. Barajar deja la mezcla ~72/28 del archivo,
 * que es la proporción real del histórico.
 */
function barajar<T>(azar: () => number, items: readonly T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = entero(azar, 0, i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const FUENTES = ["meta", "meta", "meta", "google", "google", "web"] as const;

/**
 * Nombres para el telón.
 *
 * `identidades.json` trae `nombre_demo` en null para las 300 identidades
 * que no son personajes del demo — a propósito: son registros derivados
 * de compradores reales y **no llevan nombre**. Ponerles uno inventado
 * aquí es lo correcto (nunca se toca un nombre real) y por eso la
 * pantalla marca estos leads como sintéticos.
 */
const NOMBRES = [
  "Andrea", "Camilo", "Daniela", "Esteban", "Fernanda", "Gabriel", "Helena",
  "Iván", "Juliana", "Kevin", "Lorena", "Mateo", "Natalia", "Óscar", "Paula",
  "Quintín", "Rocío", "Santiago", "Tatiana", "Uriel", "Valentina", "Wilson",
] as const;

const APELLIDOS = [
  "Acosta", "Bermúdez", "Cárdenas", "Duarte", "Escobar", "Franco", "Gutiérrez",
  "Herrera", "Ibáñez", "Jaramillo", "Lozano", "Mejía", "Navarro", "Ortiz",
  "Peña", "Quiroga", "Rojas", "Suárez", "Torres", "Vargas",
] as const;

function nombreSintetico(azar: () => number): string {
  return `${elegir(azar, NOMBRES)} ${elegir(azar, APELLIDOS)}`;
}

function ingresoDe(azar: () => number, identidad: Identidad): number {
  const [min, max] = BANDAS_INGRESO[identidad.rango_ingreso] ?? [1, 3];
  const enSmmlv = min + azar() * (max - min);
  // Se redondea a la decena de miles: un ingreso declarado en un chat no
  // llega con centavos.
  return Math.round((enSmmlv * SMMLV) / 10_000) * 10_000;
}

/**
 * Por cuál proyecto pregunta.
 *
 * Dos tercios miran algo que su ingreso alcanza y un tercio pregunta por
 * lo que le gustó de la pauta, alcance o no. No es un truco para inflar
 * los "listos": es lo que hace que el grupo de nutrición exista y tenga
 * sentido — alguien que solo pregunta por lo que ya puede pagar nunca
 * entra a nutrición, y nutrición es medio producto.
 */
function proyectoDeInteres(azar: () => number, ingreso: number): ProyectoCatalogo {
  const techo = precioMaximo(ingreso);
  const alcanzables = catalogo.filter((p) => (p.precio_desde ?? 0) <= techo);
  return alcanzables.length > 0 && azar() < 0.66
    ? elegir(azar, alcanzables)
    : elegir(azar, catalogo);
}

function construirLead(
  azar: () => number,
  identidad: Identidad,
  indice: number,
): { lead: Lead; proyecto: ProyectoCatalogo; ingreso: number } {
  const ingreso = ingresoDe(azar, identidad);
  const proyecto = proyectoDeInteres(azar, ingreso);

  // Mi Casa Ya es de vivienda de interés social: solo se ofrece donde aplica.
  const aplicaSubsidio = proyecto.vis === true && azar() < 0.55;
  const situacion = azar();

  return {
    ingreso,
    proyecto,
    lead: {
      evento: {
        lead_id: `lead-sint-${String(indice + 1).padStart(3, "0")}`,
        nombre: identidad.nombre_demo ?? nombreSintetico(azar),
        celular: `3${entero(azar, 100000000, 199999999)}`,
        cedula: identidad.cedula,
        proyecto_interes: proyecto.nombre,
        fuente: elegir(azar, FUENTES),
      },
      perfil: {
        match: true,
        afiliado: identidad.afiliado,
        ciudad: identidad.ciudad,
        segmento: identidad.segmento,
        rango_ingreso: identidad.rango_ingreso,
      },
      respuestas: {
        // Sin consentimiento no hay lead: el chat no avanza hasta tenerlo
        // (spec §6). Por eso todos los del telón lo traen otorgado.
        consentimiento: { otorgado: true, timestamp: "" },
        ingreso_hogar_mensual: ingreso,
        tiene_vivienda: azar() < 0.12,
        subsidios: aplicaSubsidio ? ["Mi Casa Ya"] : [],
        ...(aplicaSubsidio
          ? { subsidio_monto_mensual: Math.round(entero(azar, 15, 35) * 10_000) }
          : {}),
        situacion_crediticia:
          situacion < 0.55 ? "buena" : situacion < 0.82 ? "regular" : "mala",
        zona_interes: identidad.ciudad,
      },
    },
  };
}

/**
 * La explicación del lead sintético, redactada por reglas.
 *
 * A propósito NO llama al LLM: `/api/explicacion` es para los leads
 * reales del demo y cuesta latencia y crédito. Esta cita los mismos
 * factores del motor, así que sigue siendo trazable — y el texto avisa
 * que el lead es del telón.
 */
function explicacionDe(
  lead: Lead,
  score: ReturnType<typeof calcularScore>,
  sinCupo: boolean,
): string {
  const cuota = score.factores.find((f) => f.nombre === "cuota_ingreso_40");
  const nombre = lead.evento.nombre.split(" ")[0];
  const afiliado = afiliadoEfectivo(lead);

  if (score.salida === "nutricion") {
    return `${nombre} no pasa el corte hoy: ${cuota?.valor ?? "la cuota estimada supera el tope legal"}. Queda en nutrición con su trigger de recontacto. Lead del histórico sintético del tablero.`;
  }

  if (!afiliado && sinCupo) {
    return `${nombre} pasa el corte financiero —${cuota?.valor ?? "su cuota cabe bajo el tope del 40%"}— pero no es afiliada/o y ningún proyecto del catálogo tiene cupo del 10% disponible: los 18 ya venden por encima de ese límite. Por eso no lleva proyectos recomendados: el bloqueo es de cupo, no del lead. Lead del histórico sintético del tablero.`;
  }

  return `${nombre} ${afiliado ? "es afiliada/o a Colsubsidio" : "no es afiliada/o, así que compite por el cupo del 10% (regla 90/10)"} y su cuota estimada cabe bajo el tope legal del 40% (Decreto 583 de 2025): ${cuota?.valor ?? "sin detalle"}. Lead del histórico sintético del tablero.`;
}

/**
 * Cuándo entró el lead.
 *
 * Se elige primero el DÍA y después la hora dentro de ese día, no un
 * offset en milisegundos: restar "13 días y 14 horas" hacía que el lead
 * cayera en el día 14 y se saliera de la ventana que dibuja la gráfica,
 * y la suma de las barras no cuadraba con el total de la cola.
 *
 * La hora cae en franja comercial (7 a.m. – 8 p.m. de Bogotá), que es
 * cuando la pauta trae gente. Si eso queda en el futuro —el día 0 es
 * hoy y todavía no son las 8 p.m.— se ancla un rato antes de `hoy`.
 */
function momentoDeEntrada(azar: () => number, hoy: Date): Date {
  const diasAtras = entero(azar, 0, DIAS_DE_HISTORIA);
  const dia = diaBogota(new Date(hoy.getTime() - diasAtras * 86_400_000));

  const hora = String(entero(azar, 7, 20)).padStart(2, "0");
  const minuto = String(entero(azar, 0, 60)).padStart(2, "0");

  // Bogotá es UTC-5 todo el año: no hay horario de verano que corregir.
  const creado = new Date(`${dia}T${hora}:${minuto}:00-05:00`);

  return creado.getTime() <= hoy.getTime()
    ? creado
    : new Date(hoy.getTime() - entero(azar, 5, 180) * 60_000);
}

// ── La cola ──────────────────────────────────────────────────────────

/**
 * Genera el histórico sintético que le da volumen al tablero.
 *
 * @param hoy Ancla temporal. Se inyecta (en vez de leer el reloj aquí)
 *   para que los tests puedan fijarla y para que el llamador decida si
 *   la serie termina hoy o en una fecha congelada del demo.
 */
export function colaHistoricaSintetica(hoy: Date): LeadEnCola[] {
  const azar = crearAzar(SEMILLA);
  const candidatos = barajar(
    azar,
    identidades.filter((i) => !CEDULAS_CANONICAS.has(i.cedula)),
  );
  const cola: LeadEnCola[] = [];

  for (let i = 0; i < candidatos.length && cola.length < LEADS_A_GENERAR; i++) {
    const identidad = candidatos[i];
    const { lead, proyecto, ingreso } = construirLead(azar, identidad, cola.length);
    const score = calcularScore(lead, proyecto);

    const elegidos = matchear({
      lead,
      score,
      catalogo: catalogoFichas,
      precio_maximo: precioMaximo(ingreso),
    });

    const afiliado = afiliadoEfectivo(lead);

    // Un AFILIADO "listo" con menos de 2 proyectos viola el criterio de
    // aceptación 4 (y el CHECK constraint del ADR 0003): si el catálogo
    // no da para dos, el telón lo salta antes que mostrar algo que la DB
    // rechazaría.
    //
    // El NO afiliado es otra historia y no se salta: los 18 proyectos ya
    // venden por encima del 10% permitido, así que el matcher no le deja
    // ninguno con cupo. Ese lead entra al tablero con 0 proyectos y la
    // explicación dice por qué. Es la munición del reto (27,1% de los
    // compradores históricos no son afiliados) apareciendo sola en la
    // operación, no un caso que convenga esconder.
    const sinCupo = !afiliado && elegidos.length === 0;
    if (score.salida !== "nutricion" && afiliado && elegidos.length < 2) continue;

    const creado = momentoDeEntrada(azar, hoy);

    const curado: LeadCurado = {
      lead: {
        ...lead,
        respuestas: {
          ...lead.respuestas,
          consentimiento: { otorgado: true, timestamp: creado.toISOString() },
        },
      },
      score,
      proyectos: elegidos.map((e) => ({
        proyecto_id: e.ficha.proyecto_id,
        nombre: e.ficha.nombre,
        porque: `${e.razones.join("; ")}.`,
      })),
      explicacion: explicacionDe(lead, score, sinCupo),
    };

    cola.push({ curado, re_enganchado_en: null, creado_en: creado.toISOString(), sintetico: true });
  }

  return cola;
}
