// =====================================================================
// Puerto de `components/status/SimulatedTag` del design system.
//
// El violeta está deliberadamente fuera de la paleta de marca Y fuera
// de la de estados: "este dato es simulado" no es un cuarto estado del
// lead, es metadato sobre la confianza del dato. Si se pintara con un
// color de estado, el asesor leería "simulado" como una salida más.
//
// Aquí lo usan los 57 leads sintéticos del tablero
// (`lib/fixtures/cola-historica.ts`) y los campos inferidos de la ficha.
// =====================================================================

export function EtiquetaSimulado({ texto = "Dato simulado" }: { texto?: string }) {
  return (
    <span className="bg-simulado-bg text-simulado inline-flex shrink-0 items-center gap-1 rounded-pill px-2 py-0.5 text-[12px] font-semibold tracking-[0.02em]">
      <span className="cifra">~</span>
      {texto}
    </span>
  );
}
