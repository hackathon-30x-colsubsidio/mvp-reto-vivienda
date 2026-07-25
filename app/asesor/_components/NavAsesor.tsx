"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, ChartColumn } from "lucide-react";

// =====================================================================
// La navegación de la consola.
//
// Es el único cliente que se agrega en el shell del asesor además del
// conmutador de tema, y se paga por una sola cosa: marcar dónde está
// parado el asesor. Un layout de servidor no puede leer la ruta activa.
//
// El kit `ui_kits/advisor-panel/` trae también "Proyectos" y "Citas".
// No están aquí porque no existen esas rutas, y un ítem que no lleva a
// ningún lado en un demo que el jurado recorre solo es peor que no
// tenerlo.
// =====================================================================

const RUTAS = [
  { href: "/asesor", texto: "Bandeja", Icono: Inbox },
  { href: "/asesor/tablero", texto: "Tablero", Icono: ChartColumn },
] as const;

export function NavAsesor() {
  const ruta = usePathname();
  // Todo lo que cuelga de /asesor que no es el tablero es la ficha de un
  // lead, y la ficha se abre DESDE la bandeja: sigue siendo su sección.
  const enTablero = ruta.startsWith("/asesor/tablero");

  return (
    <nav className="flex gap-1 lg:-mx-5 lg:flex-col lg:gap-0">
      {RUTAS.map(({ href, texto, Icono }) => {
        const activa = href === "/asesor/tablero" ? enTablero : !enTablero;
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-[15px] font-semibold text-white transition-colors duration-[120ms] lg:rounded-none lg:px-5 ${
              activa
                ? "bg-white/15 lg:border-r-[3px] lg:border-brand-amarillo"
                : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icono className="size-4 shrink-0" aria-hidden="true" strokeWidth={2} />
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
