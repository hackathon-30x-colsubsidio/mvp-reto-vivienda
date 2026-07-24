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
      className="border-azul-40 bg-salida-suave rounded-md border px-5 py-5"
    >
      <h2 className="font-display text-texto text-[16px] font-bold">
        Todavía no puede comprar — y por qué
      </h2>

      <div className="mt-4">
        <h3 className="rotulo text-azul">La regla que no pasó</h3>
        <p
          data-testid="regla-fallida"
          className="text-texto mt-1 text-[15px] leading-normal"
        >
          {score.regla_fallida}
        </p>
      </div>

      <div className="mt-4">
        <h3 className="rotulo text-azul">
          Qué lo volvería viable (trigger de recontacto)
        </h3>
        <p
          data-testid="trigger-nutricion"
          className="text-texto mt-1 text-[15px] leading-normal"
        >
          {score.trigger_nutricion}
        </p>
      </div>

      <div className="border-azul-40 mt-5 border-t pt-4">
        <BotonSimularTrigger leadId={leadId} reEnganchadoEn={reEnganchadoEn} />
        {reEnganchadoEn && (
          <p className="text-texto-suave mt-2 text-[13px]">
            Trigger disparado el {fechaLarga(reEnganchadoEn)}.
          </p>
        )}
      </div>
    </section>
  );
}
