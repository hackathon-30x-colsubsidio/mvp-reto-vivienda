// Contratos compartidos entre los 4 tracks (ver docs/reparto-inicial.md).
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
    ingreso_hogar_mensual?: number; // monto declarado, usado por el motor para el tope del 40%
    tiene_vivienda?: boolean;
    subsidios?: string[];
    subsidio_monto_mensual?: number; // cuánto baja la cuota mensual estimada, si aplica
    situacion_crediticia?: "buena" | "regular" | "mala" | "sin_info";
    zona_interes?: string;
    afiliado_autoreportado?: boolean; // solo se pregunta si perfil.match = false (spec §4 paso 2-3)
  };
}

// ── El hilo de la conversación (tabla `conversaciones`, ADR 0003) ────────
// Una fila por mensaje. `sistema` no es de nadie: marca eventos (ingesta,
// consentimiento, trigger de nutrición) que hacen auditable el hilo.
export interface MensajeConversacion {
  rol: "lead" | "asistente" | "sistema";
  mensaje: string;
}

/** Lo que devuelve `/api/curar` cuando la conversación termina. */
export interface ResultadoCurado {
  ok?: boolean;
  /** Si es `false`, el lead se calificó pero NO quedó en la DB. Se dice en voz alta. */
  guardado: boolean;
  lead_id?: string;
  salida?: Score["salida"];
  puntaje?: number;
  proyectos?: number;
  explicacion?: string;
  error?: string;
  /** Se guardó, pero con una salvedad que hay que decir en voz alta. */
  advertencia?: string;
  /**
   * El proyecto sobre el que se ofrece la cita: el #1 del match (criterio de
   * aceptación 4, ticket 005). Viene vacío si el lead cayó en nutrición o si no
   * le quedó ningún proyecto — ahí no hay nada que agendar.
   */
  proyecto_cita?: { proyecto_id: string; nombre: string };
  /**
   * Si es `false`, al cerrar se le ofrece **afiliarse** (spec 04 D3): con Mi
   * Casa Ya sin presupuesto en 2026, el subsidio de la caja es solo para
   * afiliados, y además saldría de la fila del 10% de la regla 90/10.
   */
  afiliado?: boolean;
}

// ── B → C: el veredicto del motor ────────────────────────
export interface FactorScore {
  nombre: string; // p.ej. "cuota_ingreso_40"
  valor: string; // lo evaluado, legible
  cumple: boolean;
  /**
   * De dónde salió el dato. `supuesto` NO es un dato: es lo que el motor asumió
   * a falta de uno, y por eso se muestra distinto — decir "lo dijo en el chat"
   * de algo que nadie preguntó le atribuye a la persona algo que no dijo.
   */
  fuente: "enriquecimiento" | "conversacion" | "catalogo" | "historico" | "supuesto";
  /**
   * El factor NO tiene sentido de cumple / no cumple: solo informa.
   *
   * Sin esto, la ficha pintaba un "✓ Cumple" verde junto a "No afiliado a
   * Colsubsidio" —porque `cumple` estaba en `true` para decir "no bloquea"— y
   * eso se lee como una contradicción justo en la pantalla que sostiene la
   * restricción de cero caja negra.
   */
  informativo?: boolean;
  // Puntaje ponderado (spec §4, capa 2). Additivo: los factores que solo son
  // gate legal o señal informativa los dejan sin definir. Cuando están, el
  // aporte del factor al puntaje total es peso * valor_norm * 100.
  peso?: number; // 0–1, cuánto pesa este factor en el puntaje de prioridad
  valor_norm?: number; // 0–1, la señal del factor normalizada
  aporte?: number; // puntos que este factor suma al puntaje (0–100)
}

export interface Score {
  lead_id: string;
  salida: "listo" | "listo_restriccion_cupo" | "nutricion"; // las 3 salidas, spec §4
  puntaje: number; // 0–100, prioridad en la cola del asesor (0 si cae en nutrición)
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

// ── Data sintética que el motor consume (data/sintetica/proyectos.json) ──
// Forma acordada con el Track C (matcher): la definición formal vive en su
// lib/matching/tipos.ts como `FichaProyecto`. Esta es una copia estructural
// para que lib/scoring/ no dependa del código de otro track (regla del
// reparto). Cambiar esta forma se avisa a C — rompe su matcher.
export interface ProyectoCatalogo {
  proyecto_id: string;
  nombre: string;
  ciudad: string;
  zona?: string | null;
  precio_desde: number | null;
  vis: boolean | null;
  cupo_no_afiliados: { usado: number; total: number };
  brochure?: string | null;
  recorrido_360?: string | null;
  // Extras informativos de B, no forman parte del contrato con C:
  ciudad_inferida?: boolean;
  ubicacion_incierta?: boolean;
  ubicacion_nota?: string | null;
}
