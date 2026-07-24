import type { ProyectoRecomendado } from "@/lib/types";

/**
 * Los 2-3 proyectos con su porqué (criterio de aceptación 4).
 *
 * El porqué pesa tanto como la recomendación: sin él, esto sería una
 * lista de nombres y volveríamos a la caja negra.
 *
 * Un solo bloque reglado con un renglón por proyecto — no tres
 * tarjetas sueltas (DESIGN.md, la Regla del Papel Impreso).
 */
export function BloqueProyectos({ proyectos }: { proyectos: ProyectoRecomendado[] }) {
  if (proyectos.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold tracking-tight text-tinta">
        Proyectos recomendados{" "}
        <span className="cifra font-normal text-tinta-suave">
          ({proyectos.length})
        </span>
      </h2>

      <div className="divide-y-2 divide-borde overflow-hidden rounded-md border-2 border-borde bg-papel">
        {proyectos.map((proyecto) => (
          <article
            key={proyecto.proyecto_id}
            data-testid="proyecto"
            className="px-5 py-5"
          >
            <h3 className="text-lg font-bold tracking-tight text-tinta">
              {proyecto.nombre}
            </h3>
            <p className="mt-2 max-w-[68ch] text-base leading-relaxed text-tinta-suave">
              {proyecto.porque}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
