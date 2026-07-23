import type { FactorScore } from "@/lib/types";

// =====================================================================
// CRITERIO DE ACEPTACIÓN 2 — cero caja negra.  ·  Ticket 012
//
// "El conteo de factores que el motor evaluó debe ser igual al conteo
//  de factores visibles en la ficha."
//
// ⚠️  ESTE COMPONENTE HACE .map() SOBRE EL ARRAY COMPLETO.
//     Nunca poner filas fijas, nunca filtrar, nunca cortar con slice.
//     Si el motor evaluó 8 factores, aquí salen 8 — incluidos los que
//     NO cumplen, que son justo los que el asesor necesita ver.
//
// Cada fila muestra los CUATRO campos de FactorScore (nombre, valor,
// cumple, fuente): el ticket 012 pide que ninguno se muestre a medias.
// =====================================================================

/**
 * Nombre técnico del factor → cómo lo lee un asesor.
 *
 * ⚠️  Es el CANARIO del ticket 012: "agregar un factor nuevo al motor
 *     sin tocar la ficha debe ROMPER el test". Un factor que llegue del
 *     motor sin entrada aquí falla `TablaFactores.test.tsx`, y así el
 *     Track D se entera de que B agregó uno.
 *
 *     Si un test te trajo hasta acá: agrega la etiqueta del factor
 *     nuevo. No borres el test.
 */
export const ETIQUETA_FACTOR: Record<string, string> = {
  afiliacion: "Afiliación a Colsubsidio",
  cuota_ingreso_40: "Cuota sobre ingreso (tope 40%)",
  subsidio_aplicable: "Subsidio aplicable",
  ya_tiene_vivienda: "Vivienda propia",
  situacion_crediticia: "Situación crediticia",
  similitud_compradores: "Similitud con compradores reales",
};

export const ETIQUETA_FUENTE: Record<FactorScore["fuente"], string> = {
  enriquecimiento: "Ya lo sabíamos",
  conversacion: "Lo dijo en el chat",
  catalogo: "Catálogo de proyectos",
  historico: "Histórico de compradores",
};

/**
 * Un factor sin etiqueta se muestra con su nombre crudo.
 *
 * Preferimos algo feo antes que esconder un factor: la restricción no
 * negociable es "cero caja negra", no "todo bonito". El test es el que
 * avisa; la UI nunca oculta.
 */
function legible(nombre: string): string {
  return ETIQUETA_FACTOR[nombre] ?? nombre.replaceAll("_", " ");
}

export function TablaFactores({ factores }: { factores: FactorScore[] }) {
  if (factores.length === 0) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-4 text-base text-red-900">
        Este lead no tiene factores registrados. Es un error: ningún lead
        calificado debería llegar aquí sin ellos.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-base font-bold text-gray-700">Factor</th>
            <th className="px-4 py-3 text-base font-bold text-gray-700">
              Qué se evaluó
            </th>
            <th className="px-4 py-3 text-base font-bold text-gray-700">Cumple</th>
          </tr>
        </thead>
        <tbody>
          {/* El .map() completo: tantas filas como factores evaluó el motor. */}
          {factores.map((factor) => (
            <tr
              key={factor.nombre}
              data-testid="factor"
              className="border-t border-gray-200 align-top"
            >
              <td className="px-4 py-4">
                <span
                  data-testid="factor-nombre"
                  className="text-base font-bold text-gray-900"
                >
                  {legible(factor.nombre)}
                </span>
                <span
                  data-testid="factor-fuente"
                  className="mt-1 block text-sm text-gray-500"
                >
                  {ETIQUETA_FUENTE[factor.fuente]}
                </span>
              </td>
              <td
                data-testid="factor-valor"
                className="px-4 py-4 text-base text-gray-800"
              >
                {factor.valor}
              </td>
              <td data-testid="factor-cumple" className="px-4 py-4 whitespace-nowrap">
                {factor.cumple ? (
                  <span className="font-bold text-green-700">✓ Sí</span>
                ) : (
                  <span className="font-bold text-red-700">✗ No</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
