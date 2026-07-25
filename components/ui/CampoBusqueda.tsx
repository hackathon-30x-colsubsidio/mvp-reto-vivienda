import { Search } from "lucide-react";

// =====================================================================
// Puerto de `components/core/Input` del design system.
//
// Sin `useState` y sin `onChange`: este campo vive dentro de un
// <form method="get"> y su valor viaja por la querystring (ver
// app/asesor/_components/BarraFiltros.tsx). El panel del asesor no
// carga una sola línea de JS de cliente, y filtrar no era razón
// suficiente para romper eso.
// =====================================================================

export function CampoBusqueda({
  nombre,
  valor,
  etiqueta,
  placeholder,
}: {
  nombre: string;
  valor?: string;
  etiqueta: string;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1">
      <Search
        className="text-texto-tenue pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
        strokeWidth={2}
      />
      <input
        type="search"
        name={nombre}
        defaultValue={valor}
        placeholder={placeholder}
        aria-label={etiqueta}
        className="bg-surface-card border-borde text-texto placeholder:text-texto-tenue w-full rounded-sm border py-2.5 pr-3 pl-9 text-[15px]"
      />
    </div>
  );
}
