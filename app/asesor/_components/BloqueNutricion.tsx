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
      className="rounded-md border-2 border-azul-40 bg-salida-suave px-6 py-6"
    >
      <h2 className="text-xl font-bold tracking-tight text-tinta">
        Todavía no puede comprar — y por qué
      </h2>

      <div className="mt-5">
        <h3 className="text-xs font-bold tracking-[0.08em] text-azul-profundo uppercase">
          La regla que no pasó
        </h3>
        <p
          data-testid="regla-fallida"
          className="mt-1.5 max-w-[68ch] text-base leading-relaxed text-tinta"
        >
          {score.regla_fallida}
        </p>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-bold tracking-[0.08em] text-azul-profundo uppercase">
          Qué lo volvería viable (trigger de recontacto)
        </h3>
        <p
          data-testid="trigger-nutricion"
          className="mt-1.5 max-w-[68ch] text-base leading-relaxed text-tinta"
        >
          {score.trigger_nutricion}
        </p>
      </div>

      <div className="mt-6 border-t-2 border-azul-40 pt-5">
        <BotonSimularTrigger leadId={leadId} reEnganchadoEn={reEnganchadoEn} />
        {reEnganchadoEn && (
          <p className="mt-2 text-sm text-tinta-suave">
            Trigger disparado el {fechaLarga(reEnganchadoEn)}.
          </p>
        )}
      </div>
    </section>
  );
}
