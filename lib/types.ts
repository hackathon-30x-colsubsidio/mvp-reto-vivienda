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
  /**
   * Rango de edad, ya normalizado a los mismos tres tramos que usa el motor.
   *
   * La base de identidades lo trae para las 303 personas, y el enriquecimiento
   * lo estaba botando: al lead se le preguntaba la edad aunque ya la
   * supiéramos — justo lo que el criterio de aceptación 1 prohíbe.
   */
  rango_edad?: Lead["respuestas"]["rango_edad"];
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
    /** Rango de edad del titular — alimenta la similitud con compradores reales (ticket 016). */
    rango_edad?: "20_35" | "36_45" | "46_mas";
    /** Conformación del hogar (categorías del PPT de buyer personas) — alimenta la similitud. */
    composicion_familiar?: "solo" | "pareja" | "familia_con_hijos" | "monoparental";
    afiliado_autoreportado?: boolean; // solo se pregunta si perfil.match = false (spec §4 paso 2-3)

    // ── Lo que averigua el BANCO de preguntas (rama 7) ────
    // Todos opcionales y aditivos: la conversación de hoy no los llena y nada
    // existente se rompe. Solo se preguntan DESPUÉS de las 7 base y como
    // máximo 2 por conversación, así que un lead normal trae uno o ninguno.
    //
    // Salen de lo único que los 18 brochures cubren de verdad
    // (`docs/proyectos/proyectos-colsubsidio.json`), porque preguntar algo que
    // el catálogo no puede honrar es el mismo pecado de los brochures: una
    // pregunta bonita que no cambia ninguna recomendación.

    /** Cuántas alcobas necesita el hogar. `3` es "3 o más" (solo 3 de 18 proyectos las tienen). */
    alcobas_deseadas?: 1 | 2 | 3;
    /** Qué quiere encontrar en el conjunto, ya normalizado a las familias del catálogo. */
    amenidades_interes?: AmenidadInteres[];
    /** El área, preguntada como la gente sí la sabe contestar: no en m². */
    espacio_preferido?: "compacto" | "amplio";
    /**
     * Para cuándo se la imagina. **No matchea nada** y es a propósito: `estado`
     * (entrega) solo se conoce en 7 de los 18 proyectos. Es señal comercial —
     * ordena la cola del asesor, no la lista de proyectos.
     */
    momento_compra?: "inmediato" | "este_ano" | "explorando";
    /**
     * Lo que la persona dijo y el intérprete no supo clasificar.
     *
     * Existe para que el banco no repita el hueco 2 del plan: hoy
     * `interpretarComposicion` y compañía devuelven `{patch:{}}` con un acuse
     * amable y la señal se pierde en silencio. Aquí el texto crudo llega igual
     * a la ficha y el asesor lo lee tal cual lo escribió la persona.
     */
    preferencias_libres?: string[];
  };
}

/**
 * Las familias de amenidad del catálogo real.
 *
 * NO son las etiquetas de los brochures: esos traen 60+ variantes a mano
 * ("portería tipo lobby", "portería con lobby", "portería") que no se pueden
 * comparar entre proyectos. Estas son las familias en las que se agrupan, y se
 * escogieron por lo que DISCRIMINA: `ninos` aparece en 18/18 —preguntarlo no
 * cambia ninguna recomendación— mientras `mascotas` solo en 4/18.
 *
 * La derivación vive en el script de la rama 8 (P5), que es quien las cablea al
 * matcher; aquí solo viven los nombres, que son el contrato entre las dos.
 */
export type AmenidadInteres =
  | "mascotas"
  | "gimnasio"
  | "coworking"
  | "deporte"
  | "verdes"
  | "social"
  | "ninos";

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
   * Recursos recomendados al cerrar la conversación (capa ortogonal). Aditivo y
   * opcional: el chat los usa para mostrarle al lead su(s) siguiente(s) paso(s).
   * Vacío o ausente si ningún factor disparó recurso.
   */
  recursos?: RecursoRecomendado[];
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

/**
 * Un recurso recomendado al lead (capa ortogonal a `Score.salida`, ver ADR de
 * recursos). NO es una salida ni el premio de consolación de la nutrición: un
 * lead `listo` con cita agendada puede recibir uno igual, porque un factor
 * salió débil y le conviene fortalecerlo. La regla es "recurso + esperar al
 * asesor", nunca "recurso EN VEZ DE asesor".
 *
 * Se DERIVA de los factores que el motor ya emitió (cero caja negra): cada
 * recurso cita el factor que lo disparó. No se persiste — se recomputa desde
 * `Score.factores` (limitación conocida en el ADR: derivado, no histórico).
 */
export interface RecursoRecomendado {
  recurso_id: string;
  nombre: string;
  url: string;
  tipo: "colsubsidio" | "aliado_externo"; // los externos NUNCA se presentan como oferta propia
  factor_disparador: string; // el `nombre` del FactorScore que lo activó
  porque: string; // en lenguaje natural, cita el factor
}

export interface LeadCurado {
  lead: Lead;
  score: Score;
  proyectos: ProyectoRecomendado[]; // 2-3, vacío si nutrición
  cita?: { fecha: string; sala_ventas: string };
  explicacion: string; // el porqué global, redactado por el experto
  recursos?: RecursoRecomendado[]; // capa ortogonal, derivada de los factores. Aditivo/opcional.
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
