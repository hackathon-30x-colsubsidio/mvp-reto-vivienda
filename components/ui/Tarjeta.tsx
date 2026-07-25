import type { ReactNode } from "react";

// =====================================================================
// Puerto de `components/core/Card` del design system, con la capa de
// vidrio suave encima (2026-07-25).
//
// El bloque de contenido del panel del asesor. La clase `.vidrio` de
// globals.css hace el trabajo: gradiente, filo claro arriba y sombra
// difusa. No lleva `backdrop-filter` a propósito — detrás de una
// tarjeta hay cifras y factores, y ahí el contraste decide si el jurado
// puede leer.
// =====================================================================

export function Tarjeta({
  children,
  interactiva = false,
  className = "",
}: {
  children: ReactNode;
  interactiva?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`vidrio ${
        interactiva
          ? "hover:border-brand-azul/35 transition-all duration-200 hover:shadow-[inset_0_1px_0_0_var(--filo),var(--sombra-vidrio-alta)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Tarjeta con su título. El título va en Sora, que es lo que el sistema
 * reserva para display; el cuerpo queda en Work Sans por herencia.
 */
export function TarjetaConTitulo({
  titulo,
  descripcion,
  children,
  className = "",
}: {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tarjeta className={className}>
      <div className="border-filo-borde border-b px-5 py-4">
        <h3 className="text-texto font-display text-[16px] font-bold">
          {titulo}
        </h3>
        {descripcion && (
          <p className="text-texto-suave mt-1 text-[13px] leading-normal">
            {descripcion}
          </p>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </Tarjeta>
  );
}
