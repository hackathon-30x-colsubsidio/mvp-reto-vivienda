// ¿Por qué Sara no hizo ninguna pregunta del banco?
// Correr:  npx tsx scripts/diagnostico-banco.ts
//
// El banco falla CERRADO por diseño: cuando no pregunta, no dice nada y la
// conversación termina como siempre. Eso es correcto para el lead y pésimo para
// depurar — desde afuera, "no está cableado" y "el selector dijo que ninguna
// valía la pena" se ven exactamente igual.
//
// Este script recorre las mismas puertas que `seleccionarDelBanco`, en orden, y
// dice en cuál se cerró. No toca la DB ni el navegador.

import { readFileSync } from "node:fs";

// ⚠️ Next.js carga `.env.local` solo; un script suelto de `tsx` NO. Sin esto el
// diagnóstico reporta "sin credencial" siempre y manda a buscar el problema
// donde no está — que es justo el error que este script existe para evitar.
try {
  for (const linea of readFileSync(".env.local", "utf8").split("\n")) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.log("(no hay .env.local — se usa el entorno tal cual)");
}

import { seleccionarDelBanco, dimensionesQueSeparan } from "../lib/conversacion/selector-banco";
import { bancoDisponible } from "../lib/conversacion/banco-preguntas";
import { hayKeyGemini, diagnosticoCredenciales } from "../lib/gemini";
import { curar } from "../lib/curar";
import { catalogo } from "../lib/matching/catalogo";
import { leadsCurados } from "../lib/fixtures";
import type { FichaProyecto } from "../lib/matching/tipos";

async function main() {
  for (const [nombre, curado] of Object.entries(leadsCurados)) {
    const lead = curado.lead;
    console.log(`\n━━ ${nombre} ━━`);
    console.log("  credencial:", hayKeyGemini() ? "✓" : "✗ " + diagnosticoCredenciales());

    const disponibles = bancoDisponible(lead.respuestas);
    console.log("  sin contestar:", disponibles.map((p) => p.id).join(", ") || "(ninguna)");

    const candidatos = curar(lead)
      .proyectos.map((r) => catalogo.find((f) => f.proyecto_id === r.proyecto_id))
      .filter((f): f is FichaProyecto => f !== undefined);
    console.log("  candidatos:", candidatos.map((c) => c.nombre).join(", ") || "(ninguno → NO pregunta)");

    if (candidatos.length > 0) {
      for (const o of dimensionesQueSeparan(disponibles, candidatos)) {
        console.log(`    ${o.pregunta.id.padEnd(11)} separa=${o.separa}  ${o.hecho.slice(0, 76)}`);
      }
    }

    const t = Date.now();
    const elegida = await seleccionarDelBanco(lead);
    console.log(`  → el selector respondió en ${Date.now() - t} ms:`, elegida ? `"${elegida.id}"` : "null (ninguna)");
    if (elegida) console.log(`     Sara preguntaría: ${elegida.pregunta.slice(0, 110)}…`);
  }
}

main();
