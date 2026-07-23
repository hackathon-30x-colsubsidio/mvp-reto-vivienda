import type { PerfilConocido } from "@/lib/types";
import { leadsEvento, perfilesConocidos } from "@/lib/fixtures";

// La base real de identidades es de Track B (spec §6: "base sintética de
// identidades"). Mientras no exista, el botón "soy yo" resuelve el
// enriquecimiento contra los mismos fixtures que ya usa el resto del track:
// si la cédula coincide con uno de los 3 personajes, se reutiliza su perfil;
// si no, es un lead sin match — el caso que hace visible la conversación
// adaptativa (spec §6).
const basePorCedula: Record<string, PerfilConocido> = {
  [leadsEvento.afiliadoListo.cedula]: perfilesConocidos.afiliadoListo,
  [leadsEvento.noAfiliadoListo.cedula]: perfilesConocidos.noAfiliadoListo,
  [leadsEvento.nutricion.cedula]: perfilesConocidos.nutricion,
};

export function enriquecerSimulado(cedula: string): PerfilConocido {
  return basePorCedula[cedula.trim()] ?? { match: false };
}
