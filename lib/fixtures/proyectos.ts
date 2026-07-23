// Fixtures de proyectos para tests del motor de scoring.
// Espejo de data/sintetica/proyectos.json (no se importa el JSON completo
// para que el test no dependa de que alguien vuelva a correr los scripts).
import type { ProyectoCatalogo } from "../types.js";

export const proyectoInari: ProyectoCatalogo = {
  proyecto_id: "inari",
  nombre: "INARI",
  ubicacion: "CHÍA",
  ubicacion_incierta: false,
  ubicacion_nota: null,
  precio_tipico: 280_800_000,
  precio_min: 200_000_000,
  precio_max: 350_000_000,
  n_compradores_historico: 304,
  pct_no_afiliado_historico: 30.6,
  cupo_90_10_disponible: false, // ya está por encima del 10% permitido (munición del pitch)
  link_brochure: "https://heyzine.com/flip-book/8b6615372f.html",
  link_360: "https://umbra3d.studio/recorridos/colsubsidio/inari/41.60mt/",
};

export const proyectoBosqueDeTurpial: ProyectoCatalogo = {
  proyecto_id: "bosque-de-turpial",
  nombre: "BOSQUE DE TURPIAL",
  ubicacion: "TOCANCIPÁ",
  ubicacion_incierta: false,
  ubicacion_nota: null,
  precio_tipico: 231_100_000,
  precio_min: 180_000_000,
  precio_max: 280_000_000,
  n_compradores_historico: 179,
  pct_no_afiliado_historico: 21.8,
  cupo_90_10_disponible: false,
  link_brochure: "https://heyzine.com/flip-book/5eec0a2afc.html",
  link_360: "https://salasdeventas.com/Turpial_Apto_B/",
};
