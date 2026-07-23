# Reparto inicial — 4 tracks en paralelo

> Cómo arranca cada quien **hoy**, con mínima dependencia entre sí. Deriva del [spec](spec.md) y del [ADR 0002](adr/0002-stack-mvp.md) (mapeo de tracks a superficies del código). Los tickets finos salen de `/plan`; esto es el arranque ordenado para no esperarse unos a otros.

## El principio: contratos, no dependencias

El producto es una cadena (lead → conversación → score → match → asesor), pero **nadie espera el código de nadie**: los cuatro acuerdan la forma de los datos que se pasan (`lib/types.ts`) y cada quien construye contra **fixtures** (ejemplos inventados con la forma correcta) en `lib/fixtures/`. Conectar las piezas de verdad es una tarea del sábado, no un prerequisito del jueves.

Reglas de trabajo:

- **Una rama por track:** `feature/conversacion`, `feature/scoring`, `feature/matching`, `feature/asesor`. Merge a `main` solo con typecheck en verde (`main` es el link del demo).
- **Cambiar `lib/types.ts` se avisa en el grupo** — es el único archivo que rompe a los demás.
- Cada track deja fixtures de lo que **produce**, para que el track siguiente las consuma sin pedir permiso.

## Paso 0 — Scaffold (una sola persona, ~1 hora, antes de todo)

Lo hace quien tome el **Track A** (o quien esté libre primero). Los demás arrancan en paralelo con trabajo que no necesita el repo (ver "mientras tanto" de cada track).

1. `create-next-app` (TypeScript, App Router) en la raíz del repo.
2. Crear `lib/types.ts` con los contratos de abajo y `lib/fixtures/` con un ejemplo de cada uno.
3. `.env.example` (sin valores): `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_KEY`.
4. Conectar el repo a Vercel (auto-deploy de `main`) y verificar que el deploy vacío carga.
5. Verificar los 3 feedback loops de [`AGENTS.md`](../AGENTS.md) y pushear. **Avisar al grupo: "scaffold listo".**

## Los contratos (borrador para `lib/types.ts` — el scaffold los crea, el kickoff los ratifica)

```ts
// ── Lo que entra (ingesta) ───────────────────────────────
export interface LeadEvento {
  lead_id: string;
  nombre: string;
  celular: string;
  cedula: string;              // llave del enriquecimiento (supuesto por validar, spec §7)
  proyecto_interes?: string;
  fuente: "meta" | "google" | "web";
}

export interface PerfilConocido {  // lo que devuelve el enriquecimiento
  match: boolean;              // ¿la cédula existe en la base de identidades?
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
    consentimiento: { otorgado: boolean; timestamp: string };  // habeas data, spec §6
    rango_ingreso_hogar?: string;
    tiene_vivienda?: boolean;
    subsidios?: string[];
    situacion_crediticia?: string;
    zona_interes?: string;
  };
}

// ── B → C: el veredicto del motor ────────────────────────
export interface FactorScore {
  nombre: string;              // p.ej. "cuota_ingreso_40"
  valor: string;               // lo evaluado, legible
  cumple: boolean;
  fuente: "enriquecimiento" | "conversacion" | "catalogo" | "historico";
}

export interface Score {
  lead_id: string;
  salida: "listo" | "listo_restriccion_cupo" | "nutricion";  // las 3 salidas, spec §4
  factores: FactorScore[];     // TODOS visibles — cero caja negra
  regla_fallida?: string;      // solo si salida = nutricion
  trigger_nutricion?: string;  // la inversa de la regla que falló
}

// ── C → D: lo que ve el asesor ───────────────────────────
export interface ProyectoRecomendado {
  proyecto_id: string;
  nombre: string;
  porque: string;              // en lenguaje natural, cita los factores
}

export interface LeadCurado {
  lead: Lead;
  score: Score;
  proyectos: ProyectoRecomendado[];   // 2-3, vacío si nutrición
  cita?: { fecha: string; sala_ventas: string };
  explicacion: string;         // el porqué global, redactado por el experto
}
```

---

## Track A — Conversación & entrada

**Superficie:** página `/` (chat estilo WhatsApp) + landing del jurado + `/api/chat`.
**Produce:** `Lead`. **Consume:** `PerfilConocido` (fixture — no espera la base de identidades real de B).

Arranque:
1. Paso 0 (el scaffold es tuyo).
2. UI del chat con estética WhatsApp + disclaimer "en producción corre sobre WhatsApp Business API", respondiendo con mensajes mock (sin LLM todavía).
3. Landing del jurado: 3 personajes pre-sembrados (afiliado listo / no afiliado listo / nutrición) + botón "soy yo" ([spec §4](spec.md)).
4. Diseñar la lógica adaptativa: dado un `PerfilConocido`, ¿qué se pregunta, en qué orden, con qué tono? Primer mensaje siempre = consentimiento habeas data. Luego conectar `/api/chat` a Claude (streaming).

**Mientras el scaffold no existe:** redactar en papel/doc los guiones de conversación de los 3 personajes — es insumo directo del punto 4 y del video.

## Track B — Scoring & datos

**Superficie:** `scripts/` (Python offline) + `data/sintetica/` + `lib/scoring/` + `/api/score`.
**Produce:** `Score` + todos los JSON de `data/sintetica/`. **Consume:** `Lead` (fixture).

Arranque:
1. **Script de limpieza del Excel real** (no necesita el scaffold — arranca ya): `VLR_VIVIENDA` ÷10.000, normalizar `RANGO_EDAD`/`ETAPA`, inferir afiliado de `PERIODO_AFILIADO`, resolver la ubicación contradictoria de VIBO ONCE/KARAKALI, decidir clusters griegos (o dejarlos anónimos v1).
2. Generar los JSON: **base sintética de identidades** (cédulas ficticias con distribuciones reales), **fichas de los 18 proyectos** (precio, ubicación, links de brochure/360), distribuciones de compradores por proyecto.
3. Motor de reglas en `lib/scoring/` (TS puro, con tests vitest): factores del [spec §4](spec.md) — afiliación/90-10, cuota ≤ 40% (Decreto 583 de 2025), subsidio, ya-tiene-vivienda, crediticio autorreportado, similitud como evidencia. Salida = uno de los 3 cortes + trigger de nutrición.
4. `/api/score`: recibe `Lead`, devuelve `Score`.

**Nota:** el umbral del corte y los pesos están abiertos ([spec §7](spec.md)) — construir el motor con umbrales parametrizados y proponer valores con fundamento para ratificar en el kickoff.

## Track C — Matching & explicación

**Superficie:** `/api/match` + `/api/explicacion` + prompts del "experto vivienda".
**Produce:** `LeadCurado` (sin cita — la agrega D o A al agendar). **Consume:** `Score` (fixture) + fichas de proyectos (fixture propia hasta que B publique las reales).

Arranque:
1. **Redactar a mano 3 explicaciones de referencia** (una por personaje del demo) — no necesita el scaffold; define el estándar de calidad del "porqué" y sirve para evaluar los prompts.
2. Lógica del matcher: dado un `Score` + el catálogo, elegir 2-3 proyectos (precio vs capacidad, zona, cupo 90/10 del proyecto). Determinista donde se pueda; el LLM justifica, no elige a ciegas.
3. Prompt del "experto vivienda Colsubsidio": grounded en las fichas de proyectos y los factores del score. La explicación **cita cada factor** (criterio de aceptación 2 del spec) y el tope del 40% con su decreto.
4. `/api/match` y `/api/explicacion` con streaming.

## Track D — Vista asesor, DB & nutrición

**Superficie:** página `/asesor` + Supabase + `/api/leads` + workflow de nutrición.
**Produce:** el esquema de la DB (→ **ADR 0003**, está abierto en el spec). **Consume:** `LeadCurado` (fixture).

Arranque:
1. **Crear el proyecto de Supabase** (no necesita el scaffold): tablas `leads` (con estado: listo / restriccion_cupo / nutricion), `conversaciones`, `citas`. Proponer el esquema como ADR 0003.
2. Vista `/asesor`: cola priorizada + ficha del lead al abrirlo — score desglosado factor por factor, porqué, proyectos, cita o (en nutrición) razón + trigger. Construida contra fixtures de `LeadCurado`.
3. Botón **"simular trigger"** en los leads de nutrición: dispara el re-enganche (criterio de aceptación 3).
4. `/api/leads`: guardar y leer contra Supabase. Compartir las credenciales por el canal del equipo (nunca al repo).

---

## Puntos de sincronización (los únicos)

| Cuándo | Qué | Quién |
|---|---|---|
| Hoy, ~1h después de arrancar | "Scaffold listo" → todos hacen rebase y trabajan dentro del repo | A |
| Hoy en la noche | B publica `data/sintetica/` real → C reemplaza sus fixtures de proyectos | B → C |
| Kickoff | Ratificar contratos, umbrales del corte, esquema DB (ADR 0003) | todos |
| Sábado a.m. | **Integración**: reemplazar fixtures por llamadas reales, recorrer los 3 personajes de punta a punta | lidera A, todos presentes |

Después de la integración del sábado aplica la regla de congelamiento de [`AGENTS.md`](../AGENTS.md): solo se termina lo que se ve en el demo.
