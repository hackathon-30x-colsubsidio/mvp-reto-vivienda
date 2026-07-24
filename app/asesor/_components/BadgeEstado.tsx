import type { EstadoLead } from "@/lib/types-asesor";
import { ETIQUETA_ESTADO } from "@/lib/types-asesor";

// Los 3 colores del demo. Nutrición es ÁMBAR, no rojo: no es un
// rechazo, es un lead que todavía no puede (spec §2 — no existe
// el estado "descartado").
const ESTILO: Record<EstadoLead, string> = {
  listo: "bg-green-100 text-green-900 ring-green-600/30",
  listo_restriccion_cupo: "bg-amber-100 text-amber-900 ring-amber-600/30",
  nutricion: "bg-sky-100 text-sky-900 ring-sky-600/30",
};

export function BadgeEstado({ estado }: { estado: EstadoLead }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ring-1 ${ESTILO[estado]}`}
    >
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

export function BadgeReEnganchado() {
  return (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-900 ring-1 ring-violet-600/30">
      Re-enganchado
    </span>
  );
}
