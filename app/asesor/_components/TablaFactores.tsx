import { Check, Info, X } from "lucide-react";
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
  cupo_90_10: "Cupo para no afiliados (regla 90/10)",
  similitud_compradores_reales: "Similitud con compradores reales",
  // Alias heredado: las fixtures de los personajes todavía nombran así el
  // factor que el motor emite como `similitud_compradores_reales`. Se borra
  // cuando las fixtures se regeneren desde el motor.
  similitud_compradores: "Similitud con compradores reales",
};

export const ETIQUETA_FUENTE: Record<FactorScore["fuente"], string> = {
  enriquecimiento: "Ya lo sabíamos",
  conversacion: "Lo dijo en el chat",
  catalogo: "Catálogo de proyectos",
  historico: "Histórico de compradores",
  // No es un dato: es lo que el motor asumió a falta de uno. Se dice así para
  // no atribuirle a la persona algo que nunca dijo.
  supuesto: "Lo asumió el motor",
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
      <p className="border-rojo text-rojo rounded-md border px-4 py-4 text-[15px] font-semibold">
        Este lead no tiene factores registrados. Es un error: ningún lead
        calificado debería llegar aquí sin ellos.
      </p>
    );
  }

  return (
    // Tratamiento `ScoreFactor` del design system: el DATO duro (valor,
    // peso) va en mono y la EXPLICACIÓN en Work Sans suave. Nunca
    // comparten tratamiento tipográfico — es lo que hace que el asesor
    // distinga de un vistazo lo medido de lo interpretado.
    <ul className="divide-borde divide-y">
      {/* El .map() completo: tantas filas como factores evaluó el motor. */}
      {factores.map((factor) => (
        <li
          key={factor.nombre}
          data-testid="factor"
          className="py-3 first:pt-0 last:pb-0"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="flex flex-wrap items-center gap-2">
              <span
                data-testid="factor-nombre"
                className="text-texto text-[15px] font-semibold"
              >
                {legible(factor.nombre)}
              </span>
              {factor.peso !== undefined && (
                <span className="cifra bg-surface-sunken text-texto-tenue rounded-sm px-1.5 py-0.5 text-[12px]">
                  peso {Math.round(factor.peso * 100)}%
                </span>
              )}
            </span>
            <span
              data-testid="factor-valor"
              className="cifra text-texto text-[16px] font-semibold"
            >
              {factor.valor}
            </span>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
            {/* El "cumple" es TEXTO, no solo un color ni solo un icono:
                el color nunca puede ser el único portador del
                significado. El icono acompaña, no sustituye. */}
            {/* Un factor INFORMATIVO no cumple ni deja de cumplir: informa.
                La afiliación, el cupo 90/10 y la similitud llevaban un "✓
                Cumple" verde porque `cumple` estaba en true para decir "no
                bloquea" — y en pantalla eso se leía como una contradicción:
                "✓ Cumple" al lado de "No afiliado a Colsubsidio". */}
            {factor.informativo ? (
              <span
                data-testid="factor-cumple"
                className="text-texto-tenue inline-flex items-center gap-1 font-semibold"
              >
                <Info className="size-3.5" aria-hidden="true" strokeWidth={3} />
                Informativo
              </span>
            ) : (
              <span
                data-testid="factor-cumple"
                className={`inline-flex items-center gap-1 font-semibold ${
                  factor.cumple ? "text-estado-listo" : "text-rojo"
                }`}
              >
                {factor.cumple ? (
                  <Check
                    className="size-3.5"
                    aria-hidden="true"
                    strokeWidth={3}
                  />
                ) : (
                  <X className="size-3.5" aria-hidden="true" strokeWidth={3} />
                )}
                {factor.cumple ? "Cumple" : "No cumple"}
              </span>
            )}
            <span className="text-texto-tenue" aria-hidden="true">
              ·
            </span>
            <span data-testid="factor-fuente" className="text-texto-suave">
              {ETIQUETA_FUENTE[factor.fuente]}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}
