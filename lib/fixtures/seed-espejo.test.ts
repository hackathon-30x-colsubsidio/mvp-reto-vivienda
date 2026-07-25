import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as leads from "./leads";
import * as scores from "./scores";

// `db/seed.sql` se declara a sí mismo "un ESPEJO de lib/fixtures, no la fuente".
// Ese espejo se rompió dos veces sin que nadie lo notara, porque nada lo
// chequeaba: primero le faltó `ingreso_hogar_mensual` (el motor recibía un lead
// sin ingreso y lo mandaba a nutrición), después le faltó `puntaje` (la ficha
// del asesor mostraba 0/100 mientras la explicación decía otra cosa).
//
// Esto no valida SQL: solo verifica que los números que el demo enseña en
// pantalla estén en los dos lados. Si cambias una fixture, cambia el seed.

// Los saltos se normalizan a `\n` porque las aserciones de abajo comparan
// contra strings con `\n` literal, y en Windows git deja el archivo con CRLF
// en el working tree: sin esto, los 3 tests del puntaje fallan en las máquinas
// del equipo que corren Windows aunque el seed esté perfecto. El dato estaba
// bien; lo que fallaba era el separador.
const SEED = readFileSync(join(process.cwd(), "db", "seed.sql"), "utf-8").replace(
  /\r\n/g,
  "\n",
);

const PERSONAJES = [
  { nombre: "lead-001 · afiliado listo", lead: leads.afiliadoListo, score: scores.afiliadoListo },
  { nombre: "lead-002 · no afiliado", lead: leads.noAfiliadoListo, score: scores.noAfiliadoListo },
  { nombre: "lead-003 · nutrición", lead: leads.nutricion, score: scores.nutricion },
] as const;

describe("db/seed.sql espeja lib/fixtures", () => {
  it.each(PERSONAJES)("$nombre — el puntaje de la cola", ({ score }) => {
    expect(SEED).toContain(`'${score.salida}',\n  ${score.puntaje},`);
  });

  it.each(PERSONAJES)("$nombre — el ingreso que necesita el motor", ({ lead }) => {
    const ingreso = lead.respuestas.ingreso_hogar_mensual;
    expect(ingreso).toBeDefined();
    expect(SEED).toContain(`'ingreso_hogar_mensual', ${ingreso}`);
  });

  it.each(PERSONAJES)("$nombre — la situación crediticia como enum", ({ lead }) => {
    expect(SEED).toContain(`'situacion_crediticia', '${lead.respuestas.situacion_crediticia}'`);
  });
});
