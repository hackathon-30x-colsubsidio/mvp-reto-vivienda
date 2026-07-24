import type { ButtonHTMLAttributes, ReactNode } from "react";

// =====================================================================
// Puerto de `components/core/Button` del design system.
//
// Se exporta `clasesBoton()` además del componente porque la mitad de
// los "botones" de esta app son enlaces (`next/link`), y forzarlos a
// pasar por un <button> solo para heredar el estilo obliga a un
// onClick y a volver cliente un Server Component.
//
// La variante `amarillo` es la única acción que usa el amarillo
// corporativo de relleno, y encima va tinta oscura: el amarillo no
// alcanza contraste con blanco.
// =====================================================================

type Variante = "primario" | "secundario" | "fantasma" | "amarillo";
type Tamano = "sm" | "md" | "lg";

const VARIANTE: Record<Variante, string> = {
  primario:
    "bg-brand-azul text-sobre-campo border border-transparent hover:bg-campo-hover",
  secundario:
    "bg-transparent text-brand-azul border border-brand-azul hover:bg-surface-sunken",
  fantasma:
    "bg-transparent text-texto border border-transparent hover:bg-surface-sunken",
  amarillo:
    "bg-brand-amarillo text-sobre-amarillo border border-transparent hover:bg-amarillo-80",
};

const TAMANO: Record<Tamano, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-[18px] py-2.5 text-[15px]",
  lg: "px-6 py-3 text-[16px]",
};

export function clasesBoton(
  variante: Variante = "primario",
  tamano: Tamano = "md",
) {
  return `inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTE[variante]} ${TAMANO[tamano]}`;
}

export function Boton({
  variante = "primario",
  tamano = "md",
  children,
  className = "",
  ...resto
}: {
  variante?: Variante;
  tamano?: Tamano;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${clasesBoton(variante, tamano)} ${className}`} {...resto}>
      {children}
    </button>
  );
}
