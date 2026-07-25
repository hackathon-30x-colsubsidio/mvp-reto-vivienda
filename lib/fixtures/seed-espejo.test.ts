import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generarSeedSql } from "./seed-sql";
import { conversaciones } from "./leads";
import * as scores from "./scores";

// `db/seed.sql` se declara "un ESPEJO de lib/fixtures, no la fuente". Ese espejo
// se rompió DOS veces sin que nadie lo notara, porque se copiaba a mano y nada
// lo chequeaba: primero le faltó `ingreso_hogar_mensual` (el motor recibía un
// lead sin ingreso y lo mandaba a nutrición), después le faltó `puntaje` (la
// ficha del asesor mostraba 0/100 mientras la explicación decía otra cosa).
//
// Ahora el seed se GENERA desde las fixtures, y este test es el que impide que
// el archivo en disco quede viejo: si alguien cambia una fixture y no regenera,
// falla aquí y no delante del jurado.

const RUTA = join(process.cwd(), "db", "seed.sql");

/**
 * Lee el seed normalizando los saltos a `\n`.
 *
 * En Windows git deja `db/seed.sql` con CRLF en el working tree, y
 * `generarSeedSql()` produce `\n`: sin normalizar, la comparación de abajo
 * falla en las máquinas del equipo que corren Windows aunque el seed esté
 * perfecto, y el mensaje de error manda a regenerar un archivo que ya está
 * bien. Lo que difiere es el separador de línea, no el dato.
 */
function leerSeed(): string {
  return readFileSync(RUTA, "utf-8").replace(/\r\n/g, "\n");
}

describe("db/seed.sql espeja lib/fixtures", () => {
  const sql = generarSeedSql();

  it("el archivo en disco es exactamente lo que genera el script", () => {
    expect(
      leerSeed(),
      "db/seed.sql quedó viejo. Regenéralo con: npx tsx scripts/generar-seed.ts",
    ).toBe(sql);
  });

  it("siembra los números que el MOTOR calculó, no otros", () => {
    for (const [nombre, score] of Object.entries(scores)) {
      expect(sql, `${nombre}: falta su puntaje`).toContain(`\n  ${score.puntaje},\n`);
      expect(sql, `${nombre}: falta su salida`).toContain(`'${score.salida}',`);
    }
  });

  it("siembra el ingreso que necesita el gate del 40%", () => {
    for (const [nombre, { lead }] of Object.entries(conversaciones)) {
      const ingreso = lead.respuestas.ingreso_hogar_mensual;
      expect(
        ingreso,
        `${nombre} sin ingreso: el motor lo mandaría a nutrición por dato faltante`,
      ).toBeDefined();
      expect(sql).toContain(`"ingreso_hogar_mensual":${ingreso}`);
    }
  });

  it("siembra el hilo completo, con la evidencia de habeas data", () => {
    for (const [nombre, { hilo }] of Object.entries(conversaciones)) {
      expect(hilo.length, `${nombre}: el hilo quedó corto`).toBeGreaterThan(6);
      expect(hilo.some((m) => m.rol === "sistema")).toBe(true);
    }
    // Ley 1581 de 2012: el consentimiento se registra con marca de tiempo.
    expect(sql).toContain("Consentimiento habeas data otorgado (Ley 1581 de 2012)");
  });
});
