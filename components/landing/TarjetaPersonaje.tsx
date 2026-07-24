/**
 * Un personaje pre-sembrado, presentado como el panel de un formato:
 * franja de rótulo arriba, quién es, y el botón que abre su conversación.
 *
 * No es una tarjeta suelta — vive dentro del bloque reglado de
 * LandingJurado y se separa de sus hermanos por regla, no por sombra
 * (DESIGN.md, la Regla del Papel Impreso).
 */
export function TarjetaPersonaje({
  emoji,
  titulo,
  descripcion,
  etiqueta,
  onSeleccionar,
}: {
  emoji: string;
  titulo: string;
  descripcion: string;
  etiqueta: string;
  onSeleccionar: () => void;
}) {
  return (
    <div className="flex flex-col bg-papel">
      {/* Franja de rótulo: el renglón que clasifica el formato. */}
      <div className="flex items-center gap-2 border-b-2 border-borde bg-papel-hueco px-5 py-3">
        <span aria-hidden className="text-lg leading-none">
          {emoji}
        </span>
        <span className="text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase">
          {etiqueta}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        <h3 className="text-lg font-bold tracking-tight text-tinta">{titulo}</h3>
        <p className="flex-1 text-base leading-relaxed text-tinta-suave">
          {descripcion}
        </p>
        <button
          onClick={onSeleccionar}
          className="btn btn--primary btn--bloque mt-3 !text-sm"
        >
          Abrir su conversación
        </button>
      </div>
    </div>
  );
}
