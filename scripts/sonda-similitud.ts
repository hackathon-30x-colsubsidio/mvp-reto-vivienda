// Sonda de 1.200 perfiles sobre `curar()` — mide a QUIÉN le está saliendo el
// proyecto #1, que es el que se lleva la cita.
//
// Correr:  npx tsx scripts/sonda-similitud.ts
// No toca datos ni red ni la DB: construye leads en memoria y llama al motor.
//
// ── Por qué existe ───────────────────────────────────────────────────
//
// El plan de arquitectura afirma que "ZARZAL se lleva el 55% de las citas" y
// pide, como definición de listo de la rama 6, "la sonda de 1.200 perfiles
// corrida, con el antes y el después de la concentración del #1". Esa sonda no
// existía: el 55% venía de un análisis que nadie podía repetir.
//
// Sin un número reproducible, elegir entre las dos correcciones del punto 13
// (mediana vs. normalizar) es una preferencia. Con esto es una medición, y
// cualquiera la puede volver a correr después de tocar el motor.
//
// ── La malla ─────────────────────────────────────────────────────────
//
// 5 ingresos × 6 zonas × 4 composiciones × 3 edades × afiliado × subsidio.
// Eran los 1.200 del plan con 5 zonas; con Soacha son 1.440. No pretende ser la distribución real de la
// demanda —es un barrido uniforme— y por eso el número que importa es el
// CONTRASTE antes/después, no la cifra absoluta.

import { curar } from "../lib/curar";
import { similitudCon, SIMILITUD_NEUTRA } from "../lib/scoring/similitud";
import { catalogo } from "../lib/matching/catalogo";
import distribuciones from "../data/sintetica/buyer_personas.json";
import type { Lead } from "../lib/types";

/** Los que devuelven NEUTRA pase lo que pase: no hay con qué compararlos. */
const SIN_DATOS = new Set(
  catalogo
    .filter((p) => {
      const d = (
        distribuciones as { distribuciones: Record<string, { confiable: boolean }> }
      ).distribuciones[p.proyecto_id];
      return !d || !d.confiable;
    })
    .map((p) => p.nombre),
);

const INGRESOS = [1_500_000, 2_500_000, 4_000_000, 6_000_000, 9_000_000];
// Las 6 ciudades con proyecto. **Soacha entró el 2026-07-26**, cuando se
// corrigió que Ciudadela Maiporé no es Bogotá: son 5 de los 18 proyectos, y una
// sonda que no la muestree deja de representar al catálogo. La malla pasó de
// 1.200 a 1.440 perfiles, así que las cifras de antes de esa fecha se comparan
// entre ellas, no contra estas.
const ZONAS = ["Bogotá", "Soacha", "Tocancipá", "Chía", "Ricaurte", "Girardot"];
const COMPOSICIONES = [
  "solo",
  "pareja",
  "familia_con_hijos",
  "monoparental",
] as const;
const EDADES = ["20_35", "36_45", "46_mas"] as const;

function construirLead(
  i: number,
  ingreso: number,
  zona: string,
  composicion: (typeof COMPOSICIONES)[number],
  rangoEdad: (typeof EDADES)[number],
  afiliado: boolean,
  conSubsidio: boolean,
): Lead {
  return {
    evento: {
      lead_id: `sonda-${i}`,
      nombre: `Sonda ${i}`,
      celular: "3000000000",
      cedula: `${1_000_000_000 + i}`,
      fuente: "meta",
    },
    perfil: { match: true, afiliado, ciudad: zona },
    respuestas: {
      consentimiento: { otorgado: true, timestamp: "2026-07-26T08:00:00.000Z" },
      rango_ingreso_hogar: String(ingreso),
      ingreso_hogar_mensual: ingreso,
      tiene_vivienda: false,
      subsidios: conSubsidio ? ["Mi Casa Ya"] : [],
      situacion_crediticia: "buena",
      zona_interes: zona,
      rango_edad: rangoEdad,
      composicion_familiar: composicion,
    },
  };
}

/**
 * Las respuestas del banco que ese lead habría dado (rama 8).
 *
 * Deterministas y derivadas del perfil, para que la comparación sea limpia: la
 * misma malla con y sin banco. Son **dos**, que es el máximo por conversación
 * (§3), y las dos que matchean: alcobas y amenidades.
 */
function respuestasDelBanco(lead: Lead): Partial<Lead["respuestas"]> {
  const composicion = lead.respuestas.composicion_familiar;
  const alcobas = composicion === "solo" ? 1 : composicion === "familia_con_hijos" ? 3 : 2;
  const amenidad =
    composicion === "familia_con_hijos" || composicion === "monoparental"
      ? "ninos"
      : composicion === "solo"
        ? "coworking"
        : "gimnasio";
  return { alcobas_deseadas: alcobas as 1 | 2 | 3, amenidades_interes: [amenidad] };
}

const CON_BANCO = process.argv.includes("--banco");

function* malla(): Generator<Lead> {
  let i = 0;
  for (const ingreso of INGRESOS)
    for (const zona of ZONAS)
      for (const composicion of COMPOSICIONES)
        for (const rangoEdad of EDADES)
          for (const afiliado of [true, false])
            for (const conSubsidio of [true, false])
              yield construirLead(
                i++,
                ingreso,
                zona,
                composicion,
                rangoEdad,
                afiliado,
                conSubsidio,
              );
}

const conteo = new Map<string, number>();
let total = 0;
let sinProyectos = 0;
let enNutricion = 0;
/** El #1 se lo llevó un proyecto sin distribución confiable. */
let ganaSinDatos = 0;
/** Lo mismo, pero solo en Bogotá: es donde los 6 sin datos compiten de verdad. */
let bogotaConCita = 0;
let bogotaGanaSinDatos = 0;

/** Cuántos leads reciben un #1 DISTINTO por haber contestado el banco. */
let cambiaronPorBanco = 0;

for (const base of malla()) {
  total++;
  const lead = CON_BANCO
    ? { ...base, respuestas: { ...base.respuestas, ...respuestasDelBanco(base) } }
    : base;
  const curado = curar(lead);
  if (CON_BANCO) {
    const sinBanco = curar(base).proyectos[0]?.nombre;
    if (sinBanco !== curado.proyectos[0]?.nombre) cambiaronPorBanco++;
  }
  if (curado.score.salida === "nutricion") enNutricion++;
  const primero = curado.proyectos[0];
  if (!primero) {
    sinProyectos++;
    continue;
  }
  conteo.set(primero.nombre, (conteo.get(primero.nombre) ?? 0) + 1);
  const esBogota = lead.respuestas.zona_interes === "Bogotá";
  if (esBogota) bogotaConCita++;
  if (SIN_DATOS.has(primero.nombre)) {
    ganaSinDatos++;
    if (esBogota) bogotaGanaSinDatos++;
  }
}

// La señal cruda, sin pasar por el matcher: qué valor de similitud sacan los
// proyectos CON evidencia real, contra el 0,5 que se llevan gratis los otros.
const muestra = [...malla()].filter((_, i) => i % 17 === 0);
const valores: number[] = [];
for (const lead of muestra) {
  for (const p of catalogo) {
    if (SIN_DATOS.has(p.nombre)) continue;
    const s = similitudCon(lead, p.proyecto_id, lead.perfil.afiliado ?? false);
    if (s.evidencias.length > 0) valores.push(s.valorNorm);
  }
}
valores.sort((a, b) => a - b);
const cuantil = (q: number) => valores[Math.floor(valores.length * q)];

const conCita = total - sinProyectos;
const ranking = [...conteo.entries()].sort((a, b) => b[1] - a[1]);
const pct = (n: number) => `${((n / conCita) * 100).toFixed(1)}%`;

console.log(
  `\n━━ SONDA DE SIMILITUD ━━  ${total} perfiles${CON_BANCO ? "  ·  CON respuestas del banco" : ""}`,
);
console.log(
  `   en nutrición: ${enNutricion}  ·  sin ningún proyecto: ${sinProyectos}  ·  con #1: ${conCita}`,
);
console.log(`\n   CONCENTRACIÓN DEL #1 (quién se lleva la cita)\n`);
console.log(`   proyecto                     veces   share    barra`);
for (const [nombre, veces] of ranking) {
  const barra = "█".repeat(Math.round((veces / conCita) * 50));
  console.log(
    `   ${nombre.padEnd(26)} ${String(veces).padStart(6)}  ${pct(veces).padStart(6)}   ${barra}`,
  );
}

const [lider, vecesLider] = ranking[0] ?? ["—", 0];
console.log(`\n   líder: ${lider} con ${pct(vecesLider)}`);
console.log(`   proyectos que alcanzan a ser #1 alguna vez: ${ranking.length} de 18`);
console.log(
  `   los 3 primeros concentran: ${pct(ranking.slice(0, 3).reduce((a, [, n]) => a + n, 0))}`,
);

if (CON_BANCO) {
  console.log(
    `\n   EL BANCO: a ${cambiaronPorBanco} de ${conCita} leads con cita (${(
      (cambiaronPorBanco / conCita) *
      100
    ).toFixed(1)}%) les cambió el proyecto #1 por haber contestado 2 preguntas del banco`,
  );
}

console.log(`\n   EL SESGO: ${SIN_DATOS.size} de 18 proyectos no tienen distribución confiable`);
console.log(`   (${[...SIN_DATOS].join(", ")})`);
console.log(
  `   se llevan el #1 en ${pct(ganaSinDatos)} de las citas — su peso por conteo sería ${(
    (SIN_DATOS.size / 18) *
    100
  ).toFixed(1)}%`,
);
console.log(
  `   solo en Bogotá, donde compiten los 6: ${(
    (bogotaGanaSinDatos / bogotaConCita) *
    100
  ).toFixed(1)}% de ${bogotaConCita} citas`,
);

console.log(`\n   LA SEÑAL CRUDA (${valores.length} similitudes con evidencia real)`);
console.log(
  `   mín ${valores[0].toFixed(3)}  ·  p25 ${cuantil(0.25).toFixed(3)}  ·  mediana ${cuantil(
    0.5,
  ).toFixed(3)}  ·  p75 ${cuantil(0.75).toFixed(3)}  ·  máx ${valores[valores.length - 1].toFixed(3)}`,
);
console.log(
  `   el neutro vigente es ${SIMILITUD_NEUTRA.toFixed(3)} → le gana al ${(
    (valores.filter((v) => v < SIMILITUD_NEUTRA).length / valores.length) *
    100
  ).toFixed(1)}% de los proyectos que SÍ tienen evidencia`,
);
console.log(
  `   (con el 0.500 de antes le ganaba al ${(
    (valores.filter((v) => v < 0.5).length / valores.length) *
    100
  ).toFixed(1)}%)\n`,
);
