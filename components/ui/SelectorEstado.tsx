import { ChevronDown } from "lucide-react";

// =====================================================================
// Puerto de `components/core/Select` del design system.
//
// Mismo trato que CampoBusqueda: sin estado de cliente, el valor viaja
// por la querystring.
// =====================================================================

export function SelectorEstado({
  nombre,
  valor,
  etiqueta,
  opciones,
}: {
  nombre: string;
  valor?: string;
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
}) {
  return (
    <div className="relative">
      <select
        name={nombre}
        defaultValue={valor}
        aria-label={etiqueta}
        className="bg-surface-card border-borde text-texto w-full appearance-none rounded-sm border py-2.5 pr-9 pl-3 text-[15px]"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      <ChevronDown
        className="text-texto-tenue pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        aria-hidden="true"
        strokeWidth={2}
      />
    </div>
  );
}
