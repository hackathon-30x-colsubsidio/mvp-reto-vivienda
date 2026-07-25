"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, Users } from "lucide-react";

// =====================================================================
// La navegación de la consola.
//
// DOS vistas y nada más: Métricas y Leads. Antes decía "Bandeja" y
// "Tablero", que nombraban el mueble en vez del contenido; el jurado
// recorre esto solo y sin narración, así que el rótulo tiene que decir
// qué va a ver.
//
// Es el único cliente del shell además del conmutador de tema, y se
// paga por una sola cosa: marcar dónde está parado el asesor. Un layout
// de servidor no puede leer la ruta activa.
//
// El kit `ui_kits/advisor-panel/` trae también "Proyectos" y "Citas".
// No están porque no existen esas rutas, y un ítem que no lleva a
// ningún lado en un demo autogestionado es peor que no tenerlo.
// =====================================================================

const RUTAS = [
  { href: "/asesor/tablero", texto: "Métricas", Icono: ChartColumn },
  { href: "/asesor", texto: "Leads", Icono: Users },
] as const;

export function NavAsesor() {
  const ruta = usePathname();
  // Todo lo que cuelga de /asesor que no es el tablero es la ficha de un
  // lead, y la ficha se abre DESDE la lista: sigue siendo esa sección.
  const enMetricas = ruta.startsWith("/asesor/tablero");

  return (
    <nav className="flex gap-1.5 lg:flex-col">
      {RUTAS.map(({ href, texto, Icono }) => {
        const activa = href === "/asesor/tablero" ? enMetricas : !enMetricas;
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[15px] font-semibold transition-all duration-200 ${
              activa
                ? "bg-white/18 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22)]"
                : "text-white/75 hover:bg-white/10 hover:text-white"
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
