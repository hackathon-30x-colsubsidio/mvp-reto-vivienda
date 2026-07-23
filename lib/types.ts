// Contratos compartidos entre los 4 tracks — ver docs/reparto-inicial.md.
// Cambiar este archivo se avisa en el grupo: es el único que rompe a los demás.

// ── Lo que entra (ingesta) ───────────────────────────────
export interface LeadEvento {
  lead_id: string;
  nombre: string;
  celular: string;
  cedula: string; // llave del enriquecimiento (supuesto por validar, spec §7)
  proyecto_interes?: string;
  fuente: "meta" | "google" | "web";
}

export interface PerfilConocido {
  // lo que devuelve el enriquecimiento
  match: boolean; // ¿la cédula existe en la base de identidades?
  afiliado?: boolean;
  ciudad?: string;
  segmento?: string;
  rango_ingreso?: string;
}

// ── A → B: el lead con su conversación terminada ─────────
export interface Lead {
  evento: LeadEvento;
  perfil: PerfilConocido;
  respuestas: {
    consentimiento: { otorgado: boolean; timestamp: string }; // habeas data, spec §6
    rango_ingreso_hogar?: string;
    tiene_vivienda?: boolean;
    subsidios?: string[];
    situacion_crediticia?: string;
    zona_interes?: string;
  };
}

// ── B → C: el veredicto del motor ────────────────────────
export interface FactorScore {
  nombre: string; // p.ej. "cuota_ingreso_40"
  valor: string; // lo evaluado, legible
  cumple: boolean;
  fuente: "enriquecimiento" | "conversacion" | "catalogo" | "historico";
}

export interface Score {
  lead_id: string;
  salida: "listo" | "listo_restriccion_cupo" | "nutricion"; // las 3 salidas, spec §4
  factores: FactorScore[]; // TODOS visibles — cero caja negra
  regla_fallida?: string; // solo si salida = nutricion
  trigger_nutricion?: string; // la inversa de la regla que falló
}

// ── C → D: lo que ve el asesor ───────────────────────────
export interface ProyectoRecomendado {
  proyecto_id: string;
  nombre: string;
  porque: string; // en lenguaje natural, cita los factores
}

export interface LeadCurado {
  lead: Lead;
  score: Score;
  proyectos: ProyectoRecomendado[]; // 2-3, vacío si nutrición
  cita?: { fecha: string; sala_ventas: string };
  explicacion: string; // el porqué global, redactado por el experto
}
