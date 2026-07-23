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
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {etiqueta}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {titulo}
      </h3>
      <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
        {descripcion}
      </p>
      <button
        onClick={onSeleccionar}
        className="rounded-full bg-[#075e54] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#064e44]"
      >
        Empezar conversación
      </button>
    </div>
  );
}
