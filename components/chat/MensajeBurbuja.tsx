export interface Mensaje {
  id: string;
  autor: "bot" | "usuario";
  texto: string;
  hora: string;
}

export function MensajeBurbuja({ mensaje }: { mensaje: Mensaje }) {
  const esBot = mensaje.autor === "bot";
  return (
    <div className={`flex ${esBot ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm whitespace-pre-wrap ${
          esBot
            ? "bg-white text-zinc-900 rounded-tl-none dark:bg-zinc-700 dark:text-zinc-50"
            : "bg-[#dcf8c6] text-zinc-900 rounded-tr-none dark:bg-[#056162] dark:text-zinc-50"
        }`}
      >
        {mensaje.texto}
        <div className="mt-1 text-right text-[10px] text-zinc-500 dark:text-zinc-300">
          {mensaje.hora}
        </div>
      </div>
    </div>
  );
}
