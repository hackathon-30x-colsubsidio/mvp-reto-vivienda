import type { ProyectoRecomendado } from "@/lib/types";
import { TarjetaConTitulo } from "@/components/ui/Tarjeta";

/**
 * Los 2-3 proyectos con su porqué (criterio de aceptación 4).
 *
 * El porqué pesa tanto como la recomendación: sin él, esto sería una
 * lista de nombres y volveríamos a la caja negra.
 *
 * La rejilla de dos columnas es la del kit `ui_kits/advisor-panel/`.
 * Con 2-3 proyectos entra completa sin scroll, que es lo que el asesor
 * necesita para comparar de un vistazo.
 */
export function BloqueProyectos({ proyectos }: { proyectos: ProyectoRecomendado[] }) {
  if (proyectos.length === 0) return null;

  return (
    <TarjetaConTitulo
      titulo={`Proyectos recomendados (${proyectos.length})`}
      descripcion="Cada uno con la razón concreta por la que le sirve a este lead."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {proyectos.map((proyecto) => (
          <article
            key={proyecto.proyecto_id}
            data-testid="proyecto"
            className="border-borde rounded-sm border p-4"
          >
            <h3 className="text-texto text-[15px] font-bold">{proyecto.nombre}</h3>
            <p className="text-texto-suave mt-1.5 text-[13px] leading-normal">
              {proyecto.porque}
            </p>
          </article>
        ))}
      </div>
    </TarjetaConTitulo>
  );
}
