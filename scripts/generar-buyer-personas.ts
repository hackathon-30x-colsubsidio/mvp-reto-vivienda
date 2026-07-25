// Genera data/sintetica/buyer_personas.json — distribuciones de compradores
// históricos POR PROYECTO, derivadas de data/buyer-personas-vivienda.md
// (transcripción del PPT oficial, corte 15/01/2026). Ticket 016.
// Correr:  npx tsx scripts/generar-buyer-personas.ts
//
// POR QUÉ SE GENERA Y NO SE ESCRIBE A MANO:
// el factor "similitud con compradores reales" (lib/scoring/similitud.ts)
// consume estos números y los CITA en la ficha del asesor. Un % copiado a mano
// que derive del md es una segunda fuente — la clase de espejo que ya se rompió
// dos veces en este repo (ver AGENTS.md, convención de archivos generados).
//
// REGLAS DEL TICKET 016 QUE ESTE SCRIPT RESPETA:
// - Género se EXCLUYE por completo: el md lo marca no confiable (arrastra
//   etiquetas del gráfico vecino).
// - Cero nombres de empresas: solo agregados %. (El md ya viene saneado por el
//   ticket 022; este script además solo lee las dimensiones listadas abajo.)
// - Los slides con muestras diminutas o escalas cruzadas quedan marcados
//   `confiable: false` y la similitud los trata como señal neutra (0.5).
// - Los slides agregados (Total, Maipore, Bogota, Municipios norte/sur) no se
//   emiten: la similitud es POR PROYECTO o no es.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(import.meta.dirname, "..");

/**
 * Nombre del slide en el md → proyecto_id del catálogo real
 * (data/sintetica/proyectos.json). Mapa manual porque los nombres difieren
 * ("Bosques de Arrayan" vs "BOSQUE DE ARRAYÁN"). Zarzal no tiene slide en el
 * PPT: queda fuera del JSON y la similitud lo puntúa neutro, no se inventa.
 */
const SLIDE_A_PROYECTO_ID: Record<string, string> = {
  "Bosques de Arrayan": "bosque-de-arrayan",
  "Bosques de Turpial": "bosque-de-turpial",
  "La Macarena": "la-macarena",
  "Monguí": "mongui",
  "Pamplona": "pamplona",
  "Reserva de Guayacán": "reserva-de-aguayacan",
  "Reserva de Saman": "saman",
  "INARI": "inari",
  "La arboleda": "la-arboleda",
  "Los Nogales": "los-nogales",
  "karakali": "karakali",
  "Versalles": "versalles",
  "Abeto": "abeto",
  "Payande": "payande",
  "Araucaria": "araucaria",
  "Vibonce": "vibo-once",
  "Verde Esperanza": "verde-esperanza",
};

/**
 * Slides que la "Nota sobre la extracción" del propio md manda a tratar con
 * pinzas: rangos salariales en otra escala (Araucaria, Los Nogales, Abeto,
 * Karakali) o muestra diminuta con puros 0%/50%/100% (Abeto, Vibonce).
 * Se emiten igual —para que se vea QUÉ se descartó y por qué— pero con
 * `confiable: false`, y la similitud no los usa.
 */
const NO_CONFIABLES = new Set(["abeto", "vibo-once", "araucaria", "los-nogales", "karakali"]);

export interface DistribucionProyecto {
  confiable: boolean;
  /** % de compradores históricos afiliados a Colsubsidio. */
  afiliado_pct?: number;
  /** % por banda de ingreso en SMLV. */
  salario?: { hasta_2_smlv?: number; mas_2_smlv?: number };
  /** % por rango de edad del titular. */
  edad?: { "20_35"?: number; "36_45"?: number };
  /** % por conformación del hogar (categorías DANE del PPT). */
  familia?: { monoparental?: number; nuclear?: number; pareja?: number; sin_grupo?: number };
  /** % por estrato (1–6). */
  estrato?: Record<string, number>;
}

/** "Afiliado 63% · No Afilado 37%" → [["Afiliado", 63], ["No Afilado", 37]] */
function paresDe(linea: string): [string, number][] {
  return linea
    .split("·")
    .map((parte) => parte.trim().match(/^(.*?)\s*(\d+)%$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => [m[1].trim(), Number(m[2])]);
}

function buscar(pares: [string, number][], etiqueta: string): number | undefined {
  const hit = pares.find(([e]) => e.toLowerCase() === etiqueta.toLowerCase());
  return hit?.[1];
}

const ESTRATOS: Record<string, string> = {
  Uno: "1",
  Dos: "2",
  Tres: "3",
  Cuatro: "4",
  Cinco: "5",
  Seis: "6",
};

function parsearSlide(cuerpo: string): DistribucionProyecto {
  const d: DistribucionProyecto = { confiable: true };

  for (const linea of cuerpo.split("\n")) {
    const m = linea.match(/^\*\*(.+?):\*\*\s*(.+)$/);
    if (!m) continue;
    const [, dimension, resto] = m;
    const pares = paresDe(resto);

    switch (dimension) {
      case "Afiliación":
        d.afiliado_pct = buscar(pares, "Afiliado");
        break;
      case "Rango Salario": {
        const hasta2 = buscar(pares, "Hasta 2 smlv");
        const mas2 = buscar(pares, "Mas de 2 smlv");
        if (hasta2 !== undefined || mas2 !== undefined) {
          d.salario = { hasta_2_smlv: hasta2, mas_2_smlv: mas2 };
        }
        break;
      }
      case "Rango Edad": {
        const joven = buscar(pares, "20 a 35 años");
        const medio = buscar(pares, "36 a 45 años");
        if (joven !== undefined || medio !== undefined) {
          d.edad = { "20_35": joven, "36_45": medio };
        }
        break;
      }
      case "Segmento Familia": {
        const familia: DistribucionProyecto["familia"] = {};
        const mono = buscar(pares, "Monoparental");
        const nuclear = buscar(pares, "Nuclear Integrada");
        const pareja = buscar(pares, "Pareja Conyugal");
        const sinGrupo = buscar(pares, "Sin Grupo");
        if (mono !== undefined) familia.monoparental = mono;
        if (nuclear !== undefined) familia.nuclear = nuclear;
        if (pareja !== undefined) familia.pareja = pareja;
        if (sinGrupo !== undefined) familia.sin_grupo = sinGrupo;
        if (Object.keys(familia).length > 0) d.familia = familia;
        break;
      }
      case "Estrato": {
        const estrato: Record<string, number> = {};
        for (const [etiqueta, pct] of pares) {
          const num = ESTRATOS[etiqueta];
          if (num) estrato[num] = pct;
        }
        if (Object.keys(estrato).length > 0) d.estrato = estrato;
        break;
      }
      // Género: excluido a propósito (no confiable según el md).
      // PAC / Entidad / Empresas / Localidad / Departamento: fuera del alcance
      // de la similitud — dimensiones que el chat no puede preguntar hoy.
    }
  }

  return d;
}

const md = readFileSync(join(RAIZ, "data", "buyer-personas-vivienda.md"), "utf8");

// Cada slide: "### Slide N — Nombre" hasta el siguiente "###" (o el final).
const slides = [...md.matchAll(/^### Slide \d+ — (.+?)$\n([\s\S]*?)(?=^### |\n*$(?![\s\S]))/gm)];

const distribuciones: Record<string, DistribucionProyecto> = {};
for (const [, nombre, cuerpo] of slides) {
  const proyectoId = SLIDE_A_PROYECTO_ID[nombre.trim()];
  if (!proyectoId) continue; // slides agregados (Total, Maipore, Bogota, Municipios)
  distribuciones[proyectoId] = {
    ...parsearSlide(cuerpo),
    confiable: !NO_CONFIABLES.has(proyectoId),
  };
}

const esperados = Object.values(SLIDE_A_PROYECTO_ID);
const faltantes = esperados.filter((id) => !distribuciones[id]);
if (faltantes.length > 0) {
  throw new Error(`El md no trajo slide para: ${faltantes.join(", ")} — ¿cambió el formato?`);
}

const salida = {
  _meta: {
    nota: "[derivado] Distribuciones de compradores históricos por proyecto, agregados % del PPT Buyer_Person (corte 15/01/2026) vía data/buyer-personas-vivienda.md. NO es data cruda de Colsubsidio: solo porcentajes agregados y anónimos. Género excluido (extracción no confiable) y cero nombres de empresas (ticket 022).",
    generado:
      "ARCHIVO GENERADO — no editar a mano. Se regenera con `npx tsx scripts/generar-buyer-personas.ts` a partir de data/buyer-personas-vivienda.md.",
    confiable_false:
      "Slides con escala cruzada o muestra diminuta según la nota de extracción del md: la similitud los trata como señal neutra.",
  },
  distribuciones,
};

const destino = join(RAIZ, "data", "sintetica", "buyer_personas.json");
writeFileSync(destino, JSON.stringify(salida, null, 2) + "\n");
console.log(
  `✔ ${destino}: ${Object.keys(distribuciones).length} proyectos (${[...NO_CONFIABLES].length} marcados no confiables)`,
);
