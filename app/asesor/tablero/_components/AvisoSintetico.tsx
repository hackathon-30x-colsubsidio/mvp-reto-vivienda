import type { DatosTablero } from "@/lib/tablero/tipos";
import { EtiquetaSimulado } from "@/components/ui/EtiquetaSimulado";

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
    <p className="border-filo-borde text-texto-suave rounded-[10px] border border-dashed px-3.5 py-2 text-[12px] leading-normal">
      {/* Redactado corto a propósito: vive en el pie de una vista que
          tiene que caber en una pantalla. Se dice lo mismo —cuántos son
          reales, de dónde salen los otros, y que sus veredictos los
          calculó el motor— sin cuatro renglones. */}
      <strong className="text-texto">Histórico sintético.</strong>{" "}
      <span className="cifra">{reales}</span> reales (del demo,{" "}
      {datos.origen === "supabase" ? "desde Supabase" : "desde fixtures"}) y{" "}
      <span className="cifra">{sinteticos}</span> generados desde{" "}
      <code>data/sintetica/</code> para que las métricas por día tengan serie;
      sus veredictos los calculó el motor real, no están escritos a mano. En las
      listas van marcados <EtiquetaSimulado texto="histórico" />.
    </p>
  );
}
