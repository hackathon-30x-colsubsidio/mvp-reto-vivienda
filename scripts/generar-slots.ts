// Genera data/sintetica/slots.json — el catálogo de franjas de sala de ventas.
// Correr:  npx tsx scripts/generar-slots.ts
//
// POR QUÉ SE GENERA Y NO SE ESCRIBE A MANO:
// slots.json arrancó con ids inventados ("torres-bellavista"), después con
// `p-03`/`p-07`/`p-09`/`p-12`, y el catálogo real usa slugs (`la-macarena`…).
// El chat pedía franjas de un proyecto real y recibía una lista VACÍA sin que
// nada fallara: la cita del criterio de aceptación 4 simplemente no existía.
// Dos de las salas eran de Medellín, ciudad que el catálogo real no tiene.
//
// Generándolo desde proyectos.json, los ids no pueden volver a desalinearse:
// hay una sala por proyecto real y `data/sintetica/slots.test.ts` lo verifica.
//
// LAS FRANJAS SON SIMULADAS y así se declara: el reto excluye la integración de
// calendario (spec §2). Lo que NO es simulado es el proyecto ni la ciudad.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import proyectos from "../data/sintetica/proyectos.json";

/** Días de visita ofrecidos. Posteriores al deadline del reto a propósito:
 *  una franja en el pasado se lee como un demo desactualizado. */
const DIAS = ["2026-07-27", "2026-07-28", "2026-07-29"];
const HORAS = ["09:00", "11:00", "15:00"];

const salas = proyectos.map((proyecto, i) => ({
  proyecto_id: proyecto.proyecto_id,
  proyecto: proyecto.nombre,
  ciudad: proyecto.ciudad,
  sala_ventas: `Sala de ventas ${proyecto.nombre}`,
  // La rotación por índice evita que las 18 salas ofrezcan exactamente lo mismo
  // sin inventar disponibilidad: sigue siendo determinista y reproducible.
  franjas: DIAS.map((dia, j) => `${dia}T${HORAS[(i + j) % HORAS.length]}:00-05:00`),
}));

const salida = {
  _nota:
    "Catálogo de franjas simuladas de sala de ventas (ticket 005). NO es data real de Colsubsidio: los horarios son inventados y el reto excluye la integración de calendario (spec §2). Lo que sí es real es el proyecto y su ciudad: salen de data/sintetica/proyectos.json.",
  _generado:
    "ARCHIVO GENERADO — no editar a mano. Se regenera con `npx tsx scripts/generar-slots.ts` a partir de data/sintetica/proyectos.json.",
  _ids: "Un sala por proyecto del catálogo real, con su MISMO proyecto_id (slug). Antes eran ids inventados que no existían en el catálogo, y el chat recibía listas vacías sin que nada fallara.",
  _duenos:
    "El chat ofrece estas franjas al cerrar la conversación de un lead listo (GET /api/citas) y persiste la elegida (POST /api/citas). Fuera de alcance del ticket 005: disponibilidad real, conflictos y cancelación — un slot elegido no se bloquea para otros.",
  salas,
};

const destino = join(process.cwd(), "data", "sintetica", "slots.json");
writeFileSync(destino, `${JSON.stringify(salida, null, 2)}\n`, "utf-8");
console.log(`✅ ${destino}: ${salas.length} salas × ${DIAS.length} franjas`);
