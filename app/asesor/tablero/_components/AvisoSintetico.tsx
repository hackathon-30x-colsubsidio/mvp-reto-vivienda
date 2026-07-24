import type { DatosTablero } from "@/lib/tablero/tipos";

/**
 * Avisa qué parte de lo que se ve es telón sintético.
 *
 * Es la contraparte obligatoria de `lib/fixtures/cola-historica.ts`: ese
 * módulo genera volumen para que las métricas por día existan, y este
 * componente impide que ese volumen se lea como operación real. Mismo
 * criterio que `AvisoOrigen`: el demo puede ser incompleto, nunca falso.
 *
 * Si algún día la DB trae histórico de verdad, el telón se apaga y esta
 * banda desaparece sola.
 */
export function AvisoSintetico({ datos }: { datos: DatosTablero }) {
  const sinteticos = datos.leads.filter((l) => l.sintetico).length;
  if (sinteticos === 0) return null;

  const reales = datos.leads.length - sinteticos;

  return (
    <p className="mb-8 rounded-sm border-2 border-dashed border-regla bg-papel-hueco px-4 py-3 text-base text-tinta-suave">
      <strong className="text-tinta">Histórico sintético.</strong>{" "}
      <span className="cifra">{reales}</span> de estos leads son reales (los del
      demo, {datos.origen === "supabase" ? "leídos de Supabase" : "desde fixtures locales"});
      los otros <span className="cifra">{sinteticos}</span> se generaron a partir de
      las identidades anonimizadas de <code>data/sintetica/</code> para que las
      métricas por día tengan serie. Sus veredictos los calculó el motor real, no
      están escritos a mano.
    </p>
  );
}
