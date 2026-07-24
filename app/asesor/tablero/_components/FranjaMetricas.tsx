import { METRICAS } from "@/lib/tablero/metricas";
import type { DatosTablero } from "@/lib/tablero/tipos";

/**
 * La franja de cifras del tablero.
 *
 * NO sabe qué métricas existen: itera el registry de
 * `lib/tablero/metricas.ts`. Agregar una cifra no toca este archivo.
 *
 * Cada casilla es un campo de formato, no una tarjeta: se separa de sus
 * vecinas por reglado y capa tonal, nunca por sombra (DESIGN.md, la
 * Regla del Papel Impreso). El rótulo va en versalitas porque es
 * exactamente eso — el rótulo de un campo.
 */
export function FranjaMetricas({ datos }: { datos: DatosTablero }) {
  return (
    <section
      aria-label="Métricas de la operación"
      className="grid gap-px overflow-hidden rounded-md border-2 border-borde bg-borde sm:grid-cols-2 lg:grid-cols-3"
    >
      {METRICAS.map((metrica) => {
        const { valor, detalle } = metrica.calcular(datos);

        return (
          <article key={metrica.id} data-testid="metrica" className="bg-papel px-5 py-5">
            <h3 className="text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase">
              {metrica.titulo}
            </h3>

            <p
              data-testid="metrica-valor"
              className="cifra mt-2 text-4xl leading-none font-bold text-tinta"
            >
              {valor}
            </p>

            {detalle && <p className="mt-2 text-base text-tinta">{detalle}</p>}

            {/* La fuente de la cifra, impresa. No es un tooltip: una
                métrica que no dice de dónde salió es caja negra. */}
            <p className="mt-3 border-t border-borde pt-2 text-sm text-tinta-suave">
              {metrica.descripcion}
            </p>
          </article>
        );
      })}
    </section>
  );
}
