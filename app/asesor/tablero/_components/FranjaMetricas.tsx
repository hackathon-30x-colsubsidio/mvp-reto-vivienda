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
 *
 * NO son seis tarjetas idénticas. La que el registry marca `principal`
 * lleva superficie teñida, cifra mayor y el filo de marca, porque un
 * tablero donde todo pesa lo mismo obliga a leerlo entero para saber qué
 * importa — y aquí sí hay una cifra que decide: el reparto de afiliación
 * contra el 10% que permite la regla 90/10.
 */
export function FranjaMetricas({ datos }: { datos: DatosTablero }) {
  return (
    // ⚠️ SIN `h-full` y SIN `auto-rows-fr`. Las tuvo, y comprimían cada
    //    tarjeta a 44px cuando su contenido pedía 167: el texto se salía
    //    y se montaba sobre la tarjeta de abajo. Las filas van a su
    //    altura natural y quien decide si hay scroll es el contenedor
    //    de la página, no esta rejilla.
    <section
      aria-label="Métricas de la operación"
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      {METRICAS.map((metrica) => {
        const { valor, detalle } = metrica.calcular(datos);
        const esPrincipal = metrica.principal === true;

        return (
          <article
            key={metrica.id}
            data-testid="metrica"
            // Padding vertical menor que el horizontal: los 8px que
            // ahorran las dos filas son justo lo que hacía que el corte
            // no cupiera en una ventana de 1440×900 (alto útil real
            // ~530px, no 900 — medido en el navegador, no estimado).
            className={`vidrio flex flex-col px-2.5 py-2 ${
              esPrincipal ? "vidrio-principal" : ""
            }`}
          >
            <h3
              className={`rotulo leading-snug text-balance ${
                esPrincipal ? "text-brand-azul" : ""
              }`}
            >
              {metrica.titulo}
            </h3>

            <p
              data-testid="metrica-valor"
              className={`cifra text-texto mt-1 leading-none font-bold ${
                esPrincipal ? "text-[38px]" : "text-[30px]"
              }`}
            >
              {valor}
            </p>

            {detalle && (
              <p
                className={`mt-0.5 text-[12px] leading-snug text-balance ${
                  esPrincipal ? "text-texto font-semibold" : "text-texto"
                }`}
              >
                {detalle}
              </p>
            )}

            {/* La fuente de la cifra, impresa COMPLETA. No es un tooltip
                ni se recorta: una métrica que no dice de dónde salió es
                caja negra. Se separa por espacio, no por regla — el
                border-t costaba 10px por tarjeta y no aportaba nada que
                el aire no diga. */}
            <p className="text-texto-tenue mt-1.5 text-[12px] leading-snug">
              {metrica.descripcion}
            </p>
          </article>
        );
      })}
    </section>
  );
}
