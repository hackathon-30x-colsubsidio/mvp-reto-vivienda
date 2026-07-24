import type {
  FactorScore,
  LeadCurado,
  PerfilConocido,
  ProyectoRecomendado,
} from "@/lib/types";
import type { EstadoLead, LeadEnCola } from "@/lib/types-asesor";
import { ordenarCola } from "@/lib/types-asesor";
import * as fixtures from "@/lib/fixtures/leads-curados";
import { getSupabase } from "@/lib/supabase";

/**
 * Los 3 personajes canónicos, en el orden en que entraron.
 *
 * Vienen de `lib/fixtures/` (ticket 001 / costura S6 del plan): son la
 * ÚNICA definición de los personajes en el repo. El Track D no inventa
 * los suyos — si los números no coinciden entre tracks, el demo se
 * contradice a sí mismo en pantalla.
 */
const leadsCurados: LeadCurado[] = [
  fixtures.afiliadoListo,
  fixtures.noAfiliadoListo,
  fixtures.nutricion,
];

// =====================================================================
// Repositorio de leads: el ÚNICO lugar que traduce entre el contrato
// compartido (LeadCurado) y las filas de Supabase.
//
// Existe para que lib/types.ts no tenga que parecerse a la DB ni la DB
// al contrato. Si mañana cambia una columna, cambia aquí y nada más.
//
// Esquema y porqué: docs/adr/0003-esquema-db-leads.md
// =====================================================================

/** Una fila de la tabla `leads` tal cual la devuelve Supabase. */
export interface FilaLead {
  lead_id: string;
  nombre: string;
  celular: string;
  cedula: string;
  proyecto_interes: string | null;
  fuente: string;
  perfil: PerfilConocido;
  respuestas: Record<string, unknown>;
  consentimiento_otorgado: boolean;
  consentimiento_ts: string | null;
  estado: EstadoLead | null;
  factores: FactorScore[];
  regla_fallida: string | null;
  trigger_nutricion: string | null;
  proyectos: ProyectoRecomendado[];
  explicacion: string | null;
  re_enganchado_en: string | null;
  creado_en: string;
  // Vienen del join con `citas` en la vista `cola_asesor`.
  cita_fecha?: string | null;
  cita_sala_ventas?: string | null;
}

/** De dónde salieron los datos. La UI lo avisa para no mentirle al jurado. */
export type OrigenDatos = "supabase" | "fixtures";

// ── Mapeo: contrato → fila ───────────────────────────────────────────

/**
 * Aplana un `LeadCurado` a las columnas de la tabla `leads`.
 *
 * Ojo con el consentimiento: en el contrato vive anidado dentro de
 * `respuestas`, pero en la DB sube a columna propia porque es evidencia
 * auditable de habeas data (Ley 1581 de 2012, spec §6). Se guarda en
 * los dos lados: la columna para consultar, el jsonb para no perder la
 * forma del contrato en el viaje de ida y vuelta.
 */
export function filaDesdeLeadCurado(curado: LeadCurado): Omit<FilaLead, "creado_en"> {
  const { lead, score } = curado;
  const consentimiento = lead.respuestas.consentimiento;

  return {
    lead_id: lead.evento.lead_id,
    nombre: lead.evento.nombre,
    celular: lead.evento.celular,
    cedula: lead.evento.cedula,
    proyecto_interes: lead.evento.proyecto_interes ?? null,
    fuente: lead.evento.fuente,
    perfil: lead.perfil,
    respuestas: lead.respuestas as unknown as Record<string, unknown>,
    consentimiento_otorgado: consentimiento?.otorgado ?? false,
    consentimiento_ts: consentimiento?.timestamp ?? null,
    estado: score.salida,
    factores: score.factores,
    regla_fallida: score.regla_fallida ?? null,
    trigger_nutricion: score.trigger_nutricion ?? null,
    proyectos: curado.proyectos,
    explicacion: curado.explicacion,
    re_enganchado_en: null,
  };
}

// ── Mapeo: fila → contrato ───────────────────────────────────────────

/** Reconstruye un `LeadCurado` desde una fila de la DB. */
export function leadCuradoDesdeFila(fila: FilaLead): LeadCurado {
  const respuestas = (fila.respuestas ?? {}) as LeadCurado["lead"]["respuestas"];

  return {
    lead: {
      evento: {
        lead_id: fila.lead_id,
        nombre: fila.nombre,
        celular: fila.celular,
        cedula: fila.cedula,
        ...(fila.proyecto_interes ? { proyecto_interes: fila.proyecto_interes } : {}),
        fuente: fila.fuente as LeadCurado["lead"]["evento"]["fuente"],
      },
      perfil: fila.perfil ?? { match: false },
      respuestas: {
        ...respuestas,
        // La columna manda sobre el jsonb: es la que la DB garantiza.
        consentimiento: {
          otorgado: fila.consentimiento_otorgado,
          timestamp: fila.consentimiento_ts ?? "",
        },
      },
    },
    score: {
      lead_id: fila.lead_id,
      // La vista `cola_asesor` ya filtra estado not null, así que llegar
      // aquí con null significaría un lead aún en conversación.
      salida: (fila.estado ?? "nutricion") as EstadoLead,
      factores: fila.factores ?? [],
      ...(fila.regla_fallida ? { regla_fallida: fila.regla_fallida } : {}),
      ...(fila.trigger_nutricion ? { trigger_nutricion: fila.trigger_nutricion } : {}),
    },
    proyectos: fila.proyectos ?? [],
    ...(fila.cita_fecha && fila.cita_sala_ventas
      ? { cita: { fecha: fila.cita_fecha, sala_ventas: fila.cita_sala_ventas } }
      : {}),
    explicacion: fila.explicacion ?? "",
  };
}

// ── Fallback a fixtures ──────────────────────────────────────────────

/**
 * Los 3 personajes como si vinieran de la DB.
 *
 * Decisión consciente del ADR 0003: si Supabase no responde o está
 * vacío, la pantalla del clímax del demo se ve igual. La UI avisa que
 * está en modo fixture — feo pero honesto, nunca falso.
 */
function colaDesdeFixtures(): LeadEnCola[] {
  const base = Date.parse("2026-07-23T09:00:00-05:00");
  return ordenarCola(
    leadsCurados.map((curado, i) => ({
      curado,
      re_enganchado_en: reEnganchesEnMemoria.get(curado.lead.evento.lead_id) ?? null,
      creado_en: new Date(base + i * 60 * 60 * 1000).toISOString(),
    })),
  );
}

/**
 * Re-enganches cuando no hay DB.
 *
 * Sin esto, el botón "simular trigger" reventaría en modo fixture —
 * justo el criterio de aceptación que ese botón defiende. Es efímero
 * (se pierde al reiniciar el server), pero deja el demo completo
 * aunque Supabase no esté configurado.
 *
 * Va en globalThis y no en un `const` de módulo porque las API routes
 * y los Server Components se empaquetan por separado: con una variable
 * de módulo, el PATCH escribía en una instancia y la página leía otra,
 * y el re-enganche se perdía. Es el mismo patrón del singleton de
 * Prisma en Next.
 */
const almacen = globalThis as typeof globalThis & {
  __reEnganches?: Map<string, string>;
};
const reEnganchesEnMemoria = (almacen.__reEnganches ??= new Map<string, string>());

// ── Lectura ──────────────────────────────────────────────────────────

/** La cola priorizada del asesor. Cae a fixtures si la DB no responde. */
export async function listarCola(): Promise<{
  leads: LeadEnCola[];
  origen: OrigenDatos;
}> {
  const supabase = getSupabase();
  if (!supabase) return { leads: colaDesdeFixtures(), origen: "fixtures" };

  const { data, error } = await supabase
    .from("cola_asesor")
    .select("*")
    .order("orden_prioridad", { ascending: true })
    .order("creado_en", { ascending: false });

  if (error || !data || data.length === 0) {
    if (error) console.error("[leads-repo] cola:", error.message);
    return { leads: colaDesdeFixtures(), origen: "fixtures" };
  }

  const leads = (data as FilaLead[]).map((fila) => ({
    curado: leadCuradoDesdeFila(fila),
    re_enganchado_en: fila.re_enganchado_en,
    creado_en: fila.creado_en,
  }));

  return { leads: ordenarCola(leads), origen: "supabase" };
}

/** Un lead por su `lead_id`. Cae a fixtures si la DB no responde. */
export async function obtenerLead(leadId: string): Promise<{
  lead: LeadEnCola | null;
  origen: OrigenDatos;
}> {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("cola_asesor")
      .select("*")
      .eq("lead_id", leadId)
      .maybeSingle();

    if (!error && data) {
      const fila = data as FilaLead;
      return {
        lead: {
          curado: leadCuradoDesdeFila(fila),
          re_enganchado_en: fila.re_enganchado_en,
          creado_en: fila.creado_en,
        },
        origen: "supabase",
      };
    }
    if (error) console.error("[leads-repo] detalle:", error.message);
  }

  const desdeFixtures = colaDesdeFixtures().find(
    (l) => l.curado.lead.evento.lead_id === leadId,
  );
  return { lead: desdeFixtures ?? null, origen: "fixtures" };
}

// ── Escritura ────────────────────────────────────────────────────────

/**
 * Guarda (o pisa) un lead curado. Es lo que llaman los Tracks A y C
 * cuando terminan el flujo: nadie escribe a Supabase directo.
 */
export async function guardarLeadCurado(curado: LeadCurado): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase no está configurado (falta .env)");

  const { error } = await supabase
    .from("leads")
    .upsert(filaDesdeLeadCurado(curado), { onConflict: "lead_id" });

  // Los CHECK constraints del ADR 0003 defienden los criterios de
  // aceptación. Si esto revienta, es que el lead viola uno — y es
  // justo lo que queremos que pase en desarrollo y no en el demo.
  if (error) throw new Error(`No se pudo guardar el lead: ${error.message}`);
}

/**
 * Dispara el re-enganche de un lead de nutrición (criterio 3).
 *
 * NO cambia el estado: el lead sigue siendo de nutrición. Marca la
 * fecha y deja el evento en el hilo de la conversación con rol
 * 'sistema', que es el puente por el que el chat del Track A lo retoma.
 */
export async function marcarReEnganchado(leadId: string): Promise<string> {
  const ahora = new Date().toISOString();
  const supabase = getSupabase();

  // Sin DB, el demo sigue funcionando en memoria.
  if (!supabase) {
    const existe = leadsCurados.find(
      (l) => l.lead.evento.lead_id === leadId && l.score.salida === "nutricion",
    );
    if (!existe) throw new Error(`El lead ${leadId} no existe o no está en nutrición`);
    reEnganchesEnMemoria.set(leadId, ahora);
    return ahora;
  }

  const { data, error } = await supabase
    .from("leads")
    .update({ re_enganchado_en: ahora, actualizado_en: ahora })
    .eq("lead_id", leadId)
    .eq("estado", "nutricion")
    .select("trigger_nutricion")
    .maybeSingle();

  if (error) throw new Error(`No se pudo re-enganchar: ${error.message}`);
  if (!data) throw new Error(`El lead ${leadId} no existe o no está en nutrición`);

  // El evento queda en el hilo, después del último mensaje.
  const { data: ultimo } = await supabase
    .from("conversaciones")
    .select("orden")
    .eq("lead_id", leadId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("conversaciones").insert({
    lead_id: leadId,
    rol: "sistema",
    mensaje: `Trigger de nutrición disparado — se re-engancha la conversación. Motivo: ${data.trigger_nutricion}`,
    orden: ((ultimo?.orden as number | undefined) ?? 0) + 1,
  });

  return ahora;
}
