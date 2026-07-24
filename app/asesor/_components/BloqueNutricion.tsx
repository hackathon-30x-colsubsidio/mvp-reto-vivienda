import type { Score } from "@/lib/types";
import { BotonSimularTrigger } from "./BotonSimularTrigger";
import { fechaLarga } from "@/lib/formato";

/**
 * El bloque de nutrición: la regla EXACTA que falló + el trigger que
 * la revierte + el botón que lo dispara (criterio de aceptación 3).
 *
 * Es el bloque que defiende el propósito social del reto: no es un
 * "no califica", es un "todavía no, y esto es lo que falta".
 */
export function BloqueNutricion({
  score,
  leadId,
  reEnganchadoEn,
}: {
  score: Score;
  leadId: string;
  reEnganchadoEn: string | null;
}) {
  return (
    <section
      data-testid="bloque-nutricion"
      className="rounded-xl border-2 border-sky-300 bg-sky-50 p-5"
    >
      <h2 className="text-xl font-bold text-sky-900">
        Todavía no puede comprar — y por qué
      </h2>

      <div className="mt-4">
        <h3 className="text-base font-bold text-sky-900">La regla que no pasó</h3>
        <p
          data-testid="regla-fallida"
          className="mt-1 text-base leading-relaxed text-sky-900"
        >
          {score.regla_fallida}
        </p>
      </div>

      <div className="mt-4">
        <h3 className="text-base font-bold text-sky-900">
          Qué lo volvería viable (trigger de recontacto)
        </h3>
        <p
          data-testid="trigger-nutricion"
          className="mt-1 text-base leading-relaxed text-sky-900"
        >
          {score.trigger_nutricion}
        </p>
      </div>

      <div className="mt-5 border-t border-sky-200 pt-4">
        <BotonSimularTrigger leadId={leadId} reEnganchadoEn={reEnganchadoEn} />
        {reEnganchadoEn && (
          <p className="mt-2 text-sm text-sky-700">
            Trigger disparado el {fechaLarga(reEnganchadoEn)}.
          </p>
        )}
      </div>
    </section>
  );
}
