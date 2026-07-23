import type { ProyectoRecomendado } from "@/lib/types";

/**
 * Los 2-3 proyectos con su porqué (criterio de aceptación 4).
 *
 * El porqué pesa tanto como la recomendación: sin él, esto sería una
 * lista de nombres y volveríamos a la caja negra.
 */
export function BloqueProyectos({ proyectos }: { proyectos: ProyectoRecomendado[] }) {
  if (proyectos.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-gray-900">
        Proyectos recomendados{" "}
        <span className="font-normal text-gray-500">({proyectos.length})</span>
      </h2>

      <div className="space-y-3">
        {proyectos.map((proyecto) => (
          <article
            key={proyecto.proyecto_id}
            data-testid="proyecto"
            className="rounded-xl border-2 border-gray-200 bg-white p-5"
          >
            <h3 className="text-lg font-bold text-gray-900">{proyecto.nombre}</h3>
            <p className="mt-2 text-base leading-relaxed text-gray-700">
              {proyecto.porque}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
