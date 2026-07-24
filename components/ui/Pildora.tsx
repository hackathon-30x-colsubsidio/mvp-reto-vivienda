import type { EstadoLead } from "@/lib/types-asesor";
import { ETIQUETA_ESTADO } from "@/lib/types-asesor";

// =====================================================================
// El sello de salida — puerto de `components/status/StatusPill` del
// design system.
//
// El COLOR sale del zip; el TEXTO sale del repo. El zip rotula esta
// salida "Listo · cupo restringido"; aquí dice "Listo · cupo 90/10"
// porque el 90/10 es la regla concreta que el asesor tiene que validar,
// y así está aserto en FichaLead.test.tsx.
//
// Los tres colores vienen de la paleta de ESTADOS, que el design system
// mantiene deliberadamente separada de la de marca: si el cupo se
// pintara con el amarillo corporativo, un acento decorativo y un estado
// se leerían igual. En este producto un chip amarillo nunca es un
// estado.
//
// Nutrición es azul, no rojo ni gris muerto: no es un rechazo, es un
// lead que todavía no puede (spec §2 — no existe "descartado").
// =====================================================================

const ESTILO: Record<EstadoLead, string> = {
  listo: "bg-estado-listo-bg text-estado-listo-on",
  listo_restriccion_cupo: "bg-estado-cupo-bg text-estado-cupo-on",
  nutricion: "bg-estado-nutricion-bg text-estado-nutricion-on",
};

export function Pildora({ estado }: { estado: EstadoLead }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-pill px-2.5 py-0.5 text-[12px] font-semibold ${ESTILO[estado]}`}
    >
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

/** Sello añadido después del re-enganche: sin relleno, solo contorno. */
export function PildoraReEnganchado() {
  return (
    <span className="border-borde text-texto-suave inline-flex shrink-0 items-center rounded-pill border px-2.5 py-0.5 text-[12px] font-semibold">
      Re-enganchado
    </span>
  );
}
