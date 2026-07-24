import type { ReactNode } from "react";

// =====================================================================
// Puerto de `components/core/Card` del design system.
//
// El bloque de contenido del panel del asesor: superficie de tarjeta,
// borde de 1px y sombra de reposo. La sombra es lo que separa a este
// sistema del anterior — antes la profundidad se hacía solo con reglado
// y capa tonal. `shadow-xs` en reposo; `shadow-sm` solo si la tarjeta
// es un destino clickeable.
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
      className={`bg-surface-card border-borde rounded-md border shadow-xs ${
        interactiva
          ? "hover:border-brand-azul/40 transition-shadow duration-200 hover:shadow-sm"
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
      <div className="border-borde border-b px-5 py-4">
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
