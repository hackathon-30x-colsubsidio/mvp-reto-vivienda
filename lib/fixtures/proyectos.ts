// Fixtures de proyectos para tests del motor de scoring.
// Espejo de data/sintetica/proyectos.json (no se importa el JSON completo
// para que el test no dependa de que alguien vuelva a correr los scripts).
// Forma acordada con Track C: lib/matching/tipos.ts → FichaProyecto.
import type { ProyectoCatalogo } from "../types.js";

export const proyectoInari: ProyectoCatalogo = {
  proyecto_id: "inari",
  nombre: "INARI",
  ciudad: "Chía",
  zona: null,
  precio_desde: 280_800_000,
  vis: false,
  cupo_no_afiliados: { usado: 93, total: 30 }, // ya superado — munición del pitch (27,1% no afiliados)
  brochure: "https://heyzine.com/flip-book/8b6615372f.html",
  recorrido_360: "https://umbra3d.studio/recorridos/colsubsidio/inari/41.60mt/",
};

export const proyectoBosqueDeTurpial: ProyectoCatalogo = {
  proyecto_id: "bosque-de-turpial",
  nombre: "BOSQUE DE TURPIAL",
  ciudad: "Tocancipá",
  zona: null,
  precio_desde: 231_100_000,
  vis: false,
  cupo_no_afiliados: { usado: 39, total: 18 },
  brochure: "https://heyzine.com/flip-book/5eec0a2afc.html",
  recorrido_360: "https://salasdeventas.com/Turpial_Apto_B/",
};
