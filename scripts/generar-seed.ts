// Regenera db/seed.sql desde las fixtures de los 3 personajes.
// Correr:  npx tsx scripts/generar-seed.ts
//
// El seed es un ESPEJO de lib/fixtures/, y las fixtures a su vez derivan del
// motor real. Copiarlo a mano fue la causa de dos bugs de demo (le faltó el
// ingreso, después el puntaje), así que ya no se copia: se emite.
// `lib/fixtures/seed-espejo.test.ts` falla si el archivo en disco quedó viejo.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { generarSeedSql } from "../lib/fixtures/seed-sql";

const destino = join(process.cwd(), "db", "seed.sql");
writeFileSync(destino, generarSeedSql(), "utf-8");
console.log(`✅ ${destino} regenerado desde lib/fixtures/`);
