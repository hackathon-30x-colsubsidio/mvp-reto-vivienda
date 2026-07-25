import { ExternalLink } from "lucide-react";
import type { ProyectoRecomendado } from "@/lib/types";
import { TarjetaConTitulo } from "@/components/ui/Tarjeta";
import { catalogo } from "@/lib/matching/catalogo";

/**
 * Los 2-3 proyectos con su porqué (criterio de aceptación 4).
 *
 * El porqué pesa tanto como la recomendación: sin él, esto sería una
 * lista de nombres y volveríamos a la caja negra.
 *
 * La rejilla de dos columnas es la del kit `ui_kits/advisor-panel/`.
 * Con 2-3 proyectos entra completa sin scroll, que es lo que el asesor
 * necesita para comparar de un vistazo.
 *
 * El brochure y el recorrido 360 se buscan aquí en el catálogo, y no viajan
 * dentro de `ProyectoRecomendado`: el contrato entre tracks no se toca por un
 * enlace, y el catálogo es la fuente de esos links de todos modos. Estaban en
 * `data/sintetica/proyectos.json` desde el principio y ninguna pantalla los
 * ofrecía, así que el asesor tenía que buscarlos por fuera para mandárselos al
 * lead.
 */
export function BloqueProyectos({ proyectos }: { proyectos: ProyectoRecomendado[] }) {
  if (proyectos.length === 0) return null;

  return (
    <TarjetaConTitulo
      titulo={`Proyectos recomendados (${proyectos.length})`}
      descripcion="Cada uno con la razón concreta por la que le sirve a este lead."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {proyectos.map((proyecto) => {
          const ficha = catalogo.find((c) => c.proyecto_id === proyecto.proyecto_id);

          return (
            <article
              key={proyecto.proyecto_id}
              data-testid="proyecto"
              className="border-borde rounded-sm border p-4"
            >
              <h3 className="text-texto text-[15px] font-bold">{proyecto.nombre}</h3>
              <p className="text-texto-suave mt-1.5 text-[13px] leading-normal">
                {proyecto.porque}
              </p>
              {(ficha?.brochure || ficha?.recorrido_360) && (
                <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {ficha.brochure && (
                    <EnlaceProyecto href={ficha.brochure} texto="Brochure" />
                  )}
                  {ficha.recorrido_360 && (
                    <EnlaceProyecto href={ficha.recorrido_360} texto="Recorrido 360°" />
                  )}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </TarjetaConTitulo>
  );
}

/** Material oficial del proyecto, para que el asesor lo mande sin buscarlo. */
function EnlaceProyecto({ href, texto }: { href: string; texto: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-enlace inline-flex items-center gap-1 text-[13px] font-semibold hover:underline"
    >
      {texto}
      <ExternalLink className="size-3.5" aria-hidden="true" strokeWidth={2} />
    </a>
  );
}
