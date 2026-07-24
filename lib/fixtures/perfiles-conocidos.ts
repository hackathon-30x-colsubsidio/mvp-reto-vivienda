import type { PerfilConocido } from "@/lib/types";

// segmento usa clusters anonimizados con letras griegas (dato real del Excel,
// ver AGENTS.md "Datos del reto"); el mapeo a categorías del brief sigue abierto (spec §7).

export const afiliadoListo: PerfilConocido = {
  match: true,
  afiliado: true,
  ciudad: "Bogotá",
  segmento: "Beta",
  rango_ingreso: "3-5 SMMLV",
};

export const noAfiliadoListo: PerfilConocido = {
  match: true,
  afiliado: false,
  ciudad: "Medellín",
  segmento: "Gamma",
  rango_ingreso: "1-3 SMMLV",
};

export const nutricion: PerfilConocido = {
  match: false, // cédula sin match: no sabemos nada, se pregunta todo
};
