import type { EstadoLead } from "@/lib/types-asesor";
import { ETIQUETA_ESTADO } from "@/lib/types-asesor";

// Los sellos de las 3 salidas, en la paleta corporativa.
//
// Nutrición es un TINTE DEL AZUL, no rojo ni gris muerto: no es un
// rechazo, es un lead que todavía no puede (spec §2 — no existe el
// estado "descartado"). Mismo sistema, otro momento.
//
// El amarillo se lo lleva la restricción de cupo porque es el único
// de los tres que le pide algo al asesor: validar el cupo 90/10 antes
// de prometer nada.
const ESTILO: Record<EstadoLead, string> = {
  listo: "bg-campo text-sobre-campo",
  listo_restriccion_cupo: "bg-amarillo text-sobre-amarillo",
  // El sello de nutrición mantiene el MISMO relleno en ambos temas
  // (azul-40) y su tinta oscura fija: en oscuro, `--azul-profundo` se
  // aclara para poder ser texto, así que usarlo de relleno con
  // `text-tinta` encima daba 1,56:1 — ilegible. Aquí la tinta es fija.
  nutricion: "bg-azul-40 text-[#00457a]",
};

export function BadgeEstado({ estado }: { estado: EstadoLead }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-sm font-bold ${ESTILO[estado]}`}
    >
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

// Sello añadido después: sin relleno, solo el contorno.
export function BadgeReEnganchado() {
  return (
    <span className="inline-flex items-center rounded-sm border-2 border-regla px-2.5 py-0.5 text-sm font-bold text-tinta-suave">
      Re-enganchado
    </span>
  );
}
