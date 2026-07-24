import Link from "next/link";
import { LockupBlanco } from "@/components/ui/Marca";
import { BotonTema } from "@/components/ui/BotonTema";
import { NavAsesor } from "./_components/NavAsesor";

// =====================================================================
// EL SHELL DE LA CONSOLA DEL ASESOR
//
// Puerto de `ui_kits/advisor-panel/index.html` del design system.
// Envuelve a las tres superficies del asesor —bandeja, ficha y
// tablero— y con eso mata el riel azul que estaba duplicado literal
// entre app/asesor/page.tsx y app/asesor/tablero/page.tsx.
//
// El lockup blanco es el primer sitio de la consola donde aparece la
// marca. Va sobre el azul porque es la única variante que se recibió
// para fondo de color.
//
// En escritorio el shell NO hace scroll: la barra lateral y la topbar
// quedan fijas y cada panel se desplaza por dentro (así la bandeja y la
// ficha se mueven independientes). En móvil se desarma a scroll normal
// del documento, que es lo que un teléfono espera.
// =====================================================================

export default function LayoutAsesor({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-page flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside className="bg-brand-azul flex shrink-0 items-center gap-4 px-5 py-3 lg:w-[220px] lg:flex-col lg:items-stretch lg:gap-5 lg:py-5">
        <Link href="/asesor" className="shrink-0" aria-label="Colsubsidio Vivienda">
          <LockupBlanco className="h-6 w-auto" priority />
        </Link>
        <NavAsesor />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <header className="border-borde bg-surface-page flex shrink-0 items-center justify-between gap-4 border-b px-5 py-2.5 lg:px-6">
          <p className="rotulo">Consola del especialista</p>
          <BotonTema className="border-borde text-texto-suave hover:bg-surface-sunken shrink-0 cursor-pointer rounded-sm border px-3 py-1.5 text-[13px] font-semibold" />
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
