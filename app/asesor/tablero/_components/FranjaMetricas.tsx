import { METRICAS } from "@/lib/tablero/metricas";
import type { DatosTablero } from "@/lib/tablero/tipos";

/**
 * La franja de cifras del tablero.
 *
 * NO sabe qué métricas existen: itera el registry de
 * `lib/tablero/metricas.ts`. Agregar una cifra no toca este archivo.
 *
 * Cada cifra es una tarjeta del design system. El rótulo va en
 * versalitas porque es exactamente eso — el rótulo de un campo de datos,
 * que es el único uso que el sistema le da a las versalitas.
 */
export function FranjaMetricas({ datos }: { datos: DatosTablero }) {
  return (
    // Rejilla de alto completo: las 6 celdas se reparten el espacio que
    // deja la cabecera, así el corte llena la pantalla sin desbordarla.
    // `auto-rows-fr` es lo que iguala las dos filas.
    <section
      aria-label="Métricas de la operación"
      className="grid h-full auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {METRICAS.map((metrica) => {
        const { valor, detalle } = metrica.calcular(datos);

        return (
          <article
            key={metrica.id}
            data-testid="metrica"
            className="vidrio flex min-h-0 flex-col p-4"
          >
            <h3 className="rotulo">{metrica.titulo}</h3>

            <p
              data-testid="metrica-valor"
              className="cifra text-texto mt-2 text-[38px] leading-none font-bold"
            >
              {valor}
            </p>

            {detalle && (
              <p className="text-texto mt-1.5 text-[13px] leading-normal">
                {detalle}
              </p>
            )}

            {/* La fuente de la cifra, impresa. No es un tooltip: una
                métrica que no dice de dónde salió es caja negra. */}
            <p className="border-filo-borde text-texto-tenue mt-auto border-t pt-2 text-[12px] leading-snug">
              {metrica.descripcion}
            </p>
          </article>
        );
      })}
    </section>
  );
}
