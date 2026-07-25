import type { PerfilConocido } from "@/lib/types";

// Lo que el enriquecimiento por cédula devuelve de cada personaje (spec §6).
//
// `segmento` usa los clusters anonimizados del Excel real (letras griegas, ver
// AGENTS.md "Datos del reto"); ante el jurado se tratan como clusters anónimos,
// nunca como las categorías del brief (spec §7, cerrado en el grilling).
//
// ⚠️ Las ciudades salen del catálogo real de 18 proyectos. Medellín NO existe
// ahí, y tenerla aquí hacía que la ficha prometiera una ciudad que el matcher
// nunca podía recomendar (ticket 001).
//
// El contraste entre los tres ES el criterio de aceptación 1:
//   · Diana   → afiliada, con ciudad y rango de ingreso → NO se le pregunta ninguno
//   · Carlos  → está en la base pero NO es afiliado: se sabe su ciudad y nada
//               más, así que a él SÍ se le pregunta el ingreso
//   · Yuliana → sin match → se le pregunta todo

export const afiliadoListo: PerfilConocido = {
  match: true,
  afiliado: true,
  ciudad: "Bogotá",
  segmento: "Beta",
  rango_ingreso: "3-5 SMMLV",
  // De una afiliada, Colsubsidio también sabe la edad: la base de identidades
  // la trae para las 303 personas. Por eso a Diana NO se le pregunta.
  rango_edad: "20_35",
};

export const noAfiliadoListo: PerfilConocido = {
  match: true,
  afiliado: false,
  ciudad: "Ricaurte",
  segmento: "No afiliado / sin segmentar",
  // Sin `rango_ingreso` a propósito: de un no afiliado, Colsubsidio no tiene la
  // información de ingresos (supuesto de trabajo del spec §7, y así lo refleja
  // data/sintetica/identidades.json: "no disponible (no afiliado)").
};

export const nutricion: PerfilConocido = {
  match: false, // cédula sin match: no sabemos nada, se pregunta todo
};
