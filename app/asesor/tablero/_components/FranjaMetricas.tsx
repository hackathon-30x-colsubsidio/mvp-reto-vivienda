import { METRICAS } from "@/lib/tablero/metricas";
import type { DatosTablero } from "@/lib/tablero/tipos";
import { Tarjeta } from "@/components/ui/Tarjeta";

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
    <section
      aria-label="Métricas de la operación"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {METRICAS.map((metrica) => {
        const { valor, detalle } = metrica.calcular(datos);

        return (
          <Tarjeta key={metrica.id} className="flex flex-col p-4">
            <div data-testid="metrica" className="flex flex-1 flex-col">
              <h3 className="rotulo">{metrica.titulo}</h3>

              <p
                data-testid="metrica-valor"
                className="cifra text-texto mt-1.5 text-[30px] leading-none font-bold"
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
              <p className="border-borde text-texto-tenue mt-auto border-t pt-2 text-[12px] leading-normal">
                {metrica.descripcion}
              </p>
            </div>
          </Tarjeta>
        );
      })}
    </section>
  );
}
