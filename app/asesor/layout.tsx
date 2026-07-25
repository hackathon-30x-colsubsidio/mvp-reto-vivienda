import Link from "next/link";
import { LockupBlanco } from "@/components/ui/Marca";
import { BotonTema } from "@/components/ui/BotonTema";
import { NavAsesor } from "./_components/NavAsesor";

// =====================================================================
// EL SHELL DE LA CONSOLA DEL ASESOR
//
// Puerto de `ui_kits/advisor-panel/index.html`, con la capa de vidrio
// suave encima (2026-07-25). Envuelve a las tres superficies del asesor
// —métricas, lista y ficha— y con eso mata el riel azul que estaba
// duplicado entre páginas.
//
// ALTURA FIJA EN ESCRITORIO. `h-screen` + `overflow-hidden` es lo que
// permite que la vista de métricas quepa sin scroll: el shell no crece,
// y cada panel decide si se desplaza por dentro. En móvil se desarma a
// scroll normal del documento, que es lo que un teléfono espera.
//
// El fondo (`.halo`) es lo único que el vidrio refracta: dos manchas de
// marca muy diluidas y fijas. Sin eso, "glass" sobre gris plano se ve
// nada más que gris.
// =====================================================================

export default function LayoutAsesor({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="halo flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside className="bg-brand-azul flex shrink-0 items-center gap-4 px-4 py-3 lg:w-[228px] lg:flex-col lg:items-stretch lg:gap-6 lg:px-4 lg:py-5">
        <Link
          href="/asesor/tablero"
          className="shrink-0 lg:px-1"
          aria-label="Colsubsidio Vivienda"
        >
          <LockupBlanco className="h-6 w-auto" priority />
        </Link>
        <NavAsesor />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <header className="vidrio-cromo flex shrink-0 items-center justify-between gap-4 border-b px-5 py-2.5 lg:px-7">
          <p className="rotulo">Consola del especialista</p>
          <BotonTema className="border-filo-borde text-texto-suave hover:bg-surface-sunken shrink-0 cursor-pointer rounded-[10px] border px-3 py-1.5 text-[13px] font-semibold transition-colors" />
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
