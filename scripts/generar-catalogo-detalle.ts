// GENERADO → data/sintetica/proyectos-detalle.json
// Correr:  npx tsx scripts/generar-catalogo-detalle.ts
//
// ⚠️ El JSON de salida NO se edita a mano. Es el quinto archivo generado del
// repo y vale la misma regla que los otros cuatro (AGENTS.md): un espejo que se
// copia a mano es una segunda fuente y termina viejo sin que nadie se entere.
//
// ── Qué hace ─────────────────────────────────────────────────────────
//
// `docs/proyectos/proyectos-colsubsidio.json` tiene el material de los 18
// brochures públicos —tipologías con alcobas, zonas sociales, área privada— y
// hasta hoy **no lo leía ni una línea de código** (hueco 4 del plan). Este
// script lo destila a lo que el matcher puede usar y lo deja en
// `data/sintetica/`, que es donde vive la data derivada que sí se versiona.
//
// Solo saca tres cosas, y son las tres que el banco de preguntas averigua:
// alcobas, familias de amenidad y área privada. Lo demás del brochure (torres,
// EDGE, sala de ventas) se queda afuera a propósito: nada que el lead no haya
// podido pedir entra al ranking.
//
// ── Lo que NO hace, y es deliberado ──────────────────────────────────
//
// **No toca la ciudad ni la zona.** El brochure y el catálogo que corre se
// contradicen en al menos un caso (Versalles: el brochure dice Soacha, el
// catálogo dice Bogotá), y la ubicación gobierna el filtro de zona, o sea a
// quién se le recomienda qué. Cambiarla desde aquí movería el demo entero por
// un dato sin arbitrar. Queda anotado en la bitácora para que alguien lo
// resuelva con la fuente en la mano.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AmenidadInteres } from "../lib/types";

const RAIZ = join(import.meta.dirname, "..");

interface Tipologia {
  alcobas?: number;
}

interface ProyectoBrochure {
  nombre: string;
  area_privada_desde_m2?: number | null;
  tipologias?: Tipologia[];
  zonas_sociales?: string[];
}

interface ProyectoCatalogo {
  proyecto_id: string;
  nombre: string;
}

/** Lo que este script produce por proyecto. Todo opcional aguas abajo. */
export interface DetalleProyecto {
  alcobas: number[];
  area_privada_desde_m2?: number;
  amenidades: AmenidadInteres[];
}

/**
 * Cómo se agrupan las 60+ etiquetas escritas a mano de los brochures.
 *
 * ⚠️ **Este mapa y el de `lib/conversacion/banco-preguntas.ts` tienen que
 * coincidir en los IDS.** Son dos vocabularios distintos —aquí "zona pet", allá
 * "que reciban perros"— pero aterrizan en el mismo `AmenidadInteres`. Si se
 * separan, el bono no se activa nunca y nadie se entera, porque no falla: solo
 * deja de sumar. Hay un test que lo vigila (`catalogo-detalle.test.ts`).
 */
const FAMILIA: Record<AmenidadInteres, RegExp> = {
  mascotas: /mascota|zona pet/i,
  gimnasio: /gimnasio|ecogym|zona fitness|biosaludable/i,
  coworking: /coworking|juntas|reuniones|sala de lectura|social living/i,
  deporte: /cancha|piscina|pista de trote|yoga/i,
  verdes: /zonas verdes|sendero/i,
  social: /sal[óo]n social|sal[óo]n comunal|edificio comunal|terraza comunal|bbq|fogata/i,
  ninos: /infantil|kids|arenero|teatrino|zona de juegos|sal[óo]n de juegos/i,
};

const IDS = Object.keys(FAMILIA) as AmenidadInteres[];

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/**
 * Los nombres que NO casan entre las dos fuentes ni normalizando.
 *
 * Se enumeran a mano y con su motivo, en vez de casar por parecido: un match
 * difuso que se equivoque le pega las alcobas de un proyecto a otro, y eso no
 * falla — recomienda mal, en silencio.
 */
const ALIAS: Record<string, string> = {
  // El catálogo que corre dice AGUAYACÁN y el brochure dice Guayacán. El árbol
  // se llama guayacán; la `a` es del catálogo. No se corrige ninguna de las dos
  // fuentes desde aquí, solo se declara que son el mismo proyecto.
  "reserva de guayacan": "reserva de aguayacan",
};

const clave = (nombre: string) => {
  const n = normalizar(nombre);
  return ALIAS[n] ?? n;
};

function amenidadesDe(zonas: string[]): AmenidadInteres[] {
  const texto = zonas.join(" | ");
  return IDS.filter((id) => FAMILIA[id].test(texto));
}

function alcobasDe(tipologias: Tipologia[]): number[] {
  const vistas = new Set<number>();
  for (const t of tipologias) {
    if (typeof t.alcobas === "number") vistas.add(t.alcobas);
  }
  return [...vistas].sort((a, b) => a - b);
}

// ── Correr ───────────────────────────────────────────────

const brochures = (
  JSON.parse(
    readFileSync(join(RAIZ, "docs/proyectos/proyectos-colsubsidio.json"), "utf8"),
  ) as { proyectos: ProyectoBrochure[] }
).proyectos;

const catalogo = JSON.parse(
  readFileSync(join(RAIZ, "data/sintetica/proyectos.json"), "utf8"),
) as ProyectoCatalogo[];

const porNombre = new Map(brochures.map((b) => [clave(b.nombre), b]));

const detalle: Record<string, DetalleProyecto> = {};
const sinBrochure: string[] = [];

for (const p of catalogo) {
  const b = porNombre.get(clave(p.nombre));
  if (!b) {
    sinBrochure.push(p.nombre);
    continue;
  }
  detalle[p.proyecto_id] = {
    alcobas: alcobasDe(b.tipologias ?? []),
    ...(typeof b.area_privada_desde_m2 === "number"
      ? { area_privada_desde_m2: b.area_privada_desde_m2 }
      : {}),
    amenidades: amenidadesDe(b.zonas_sociales ?? []),
  };
}

// Falla RUIDOSAMENTE. Un proyecto que se cae del mapeo no se nota nunca: el
// matcher simplemente deja de darle bonos y sigue recomendando. Es el mismo
// error que hizo que `slots.json` colgara de ids inexistentes y que pedir
// franjas devolviera lista vacía sin fallar (AGENTS.md).
if (sinBrochure.length > 0) {
  console.error(
    `\n❌ ${sinBrochure.length} proyecto(s) del catálogo no encontraron su brochure:\n   ${sinBrochure.join(
      ", ",
    )}\n   Agrega el alias en ALIAS o arregla el nombre en la fuente. No se escribió nada.\n`,
  );
  process.exit(1);
}

const salida = join(RAIZ, "data/sintetica/proyectos-detalle.json");
writeFileSync(salida, `${JSON.stringify(detalle, null, 2)}\n`, "utf8");

const con3 = Object.values(detalle).filter((d) => d.alcobas.includes(3)).length;
const conArea = Object.values(detalle).filter((d) => d.area_privada_desde_m2).length;
console.log(`✅ ${salida} — ${Object.keys(detalle).length} proyectos`);
console.log(`   con tipología de 3 alcobas: ${con3}  ·  con área privada: ${conArea}`);
for (const id of IDS) {
  const n = Object.values(detalle).filter((d) => d.amenidades.includes(id)).length;
  console.log(`   ${id.padEnd(10)} ${String(n).padStart(2)} / ${Object.keys(detalle).length}`);
}
