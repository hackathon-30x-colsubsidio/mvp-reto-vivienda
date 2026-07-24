// Demo del motor de scoring — imprime el desglose del puntaje ponderado.
// Correr:  npx tsx scripts/demo-motor.ts
// No toca datos ni red: solo llama a calcularScore con los 3 personajes.

import { calcularScore } from "../lib/scoring/index.js";
import { afiliadoListo, noAfiliadoListo, nutricion } from "../lib/fixtures/leads.js";
import { proyectoInari, proyectoBosqueDeTurpial } from "../lib/fixtures/proyectos.js";
import type { Lead, ProyectoCatalogo } from "../lib/types.js";

function imprimir(titulo: string, lead: Lead, proyecto: ProyectoCatalogo) {
  const s = calcularScore(lead, proyecto);
  console.log(`\n━━ ${titulo} ━━  (proyecto: ${proyecto.nombre})`);
  console.log(`   SALIDA:  ${s.salida}`);
  console.log(`   PUNTAJE: ${s.puntaje}/100`);
  console.log(`   factor                         peso   señal(0-1)  aporte`);
  for (const f of s.factores) {
    const peso = f.peso === undefined ? "  —  " : f.peso.toFixed(2);
    const norm = f.valor_norm === undefined ? "   — " : f.valor_norm.toFixed(2);
    const ap = f.aporte === undefined ? "  —" : f.aporte.toFixed(1);
    console.log(`   ${f.nombre.padEnd(28)}  ${peso}     ${norm}      ${ap}`);
  }
  const suma = s.factores.reduce((a, f) => a + (f.aporte ?? 0), 0);
  console.log(`   ── suma de aportes: ${suma.toFixed(1)}  →  puntaje redondeado: ${s.puntaje}`);
  if (s.regla_fallida) console.log(`   ✗ regla fallida: ${s.regla_fallida}`);
}

console.log("MOTOR DE SCORING — desglose del puntaje (2 capas)");
console.log("Capa 1 = gate legal 40% (bloquea). Capa 2 = puntaje ponderado 0-100.");

imprimir("María — afiliada, ingreso alto", afiliadoListo, proyectoInari);
imprimir("Carlos — NO afiliado, proyecto con cupo pasado", noAfiliadoListo, proyectoInari);
imprimir("Laura — ingreso bajo (falla el gate del 40%)", nutricion, proyectoBosqueDeTurpial);

// Prueba de monotonía en vivo: mismo lead, ingreso cada vez mayor → más holgura → más puntaje.
console.log("\n\n━━ PRUEBA: sube el ingreso, mira subir el puntaje ━━");
for (const ingreso of [3_500_000, 5_000_000, 8_000_000, 15_000_000]) {
  const lead: Lead = { ...afiliadoListo, respuestas: { ...afiliadoListo.respuestas, ingreso_hogar_mensual: ingreso } };
  const s = calcularScore(lead, proyectoInari);
  console.log(`   ingreso $${ingreso.toLocaleString("es-CO").padEnd(12)} → ${s.salida.padEnd(24)} puntaje ${s.puntaje}`);
}
