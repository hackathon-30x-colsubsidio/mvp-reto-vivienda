import type { RecursoRecomendado } from "@/lib/types";
import { TarjetaConTitulo } from "@/components/ui/Tarjeta";
import { ETIQUETA_FACTOR } from "./TablaFactores";

/**
 * Los recursos que el lead recibió (capa ORTOGONAL a la salida).
 *
 * Va en la ficha tanto de un `listo` como de un lead de nutrición: no es el
 * premio de consolación de la nutrición. Por eso la descripción se lo dice al
 * asesor — no reemplazan su contacto, lo complementan.
 *
 * DESIGN: superficie neutra (la de `Tarjeta`), NUNCA el azul-nutrición, que es
 * solo de la salida. El aliado externo se rotula en TEXTO, no solo con color
 * (el color nunca es el único portador). Cada recurso cita el factor que lo
 * disparó: cero caja negra, igual que el porqué de cada proyecto.
 */
export function BloqueRecursos({ recursos }: { recursos?: RecursoRecomendado[] }) {
  if (!recursos || recursos.length === 0) return null;

  return (
    <TarjetaConTitulo
      titulo="Recursos para el lead"
      descripcion="Se le enviaron para fortalecer un factor débil. No reemplazan el contacto del asesor: son un paso adicional."
    >
      <ul className="space-y-3">
        {recursos.map((recurso) => (
          <li
            key={recurso.recurso_id}
            data-testid="recurso"
            className="border-borde rounded-sm border p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-texto text-[15px] font-bold">{recurso.nombre}</h3>
              {recurso.tipo === "aliado_externo" && (
                <span
                  data-testid="recurso-externo"
                  className="border-borde text-texto-suave rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                >
                  Aliado externo
                </span>
              )}
            </div>
            <p className="text-texto-suave mt-1.5 text-[13px] leading-normal">
              {recurso.porque}
            </p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px]">
              <span className="rotulo">
                Disparado por: {ETIQUETA_FACTOR[recurso.factor_disparador] ?? recurso.factor_disparador}
              </span>
              <a
                href={recurso.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-azul break-all underline"
              >
                {recurso.url}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </TarjetaConTitulo>
  );
}
