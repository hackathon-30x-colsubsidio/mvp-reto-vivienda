export interface Mensaje {
  id: string;
  autor: "bot" | "usuario";
  texto: string;
  hora: string;
}

// Colores de WhatsApp, incluidos los de su tema oscuro real: esta
// superficie es mundo prestado (DESIGN.md, "El chat").
export function MensajeBurbuja({ mensaje }: { mensaje: Mensaje }) {
  const esBot = mensaje.autor === "bot";
  return (
    <div className={`flex ${esBot ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap shadow-sm ${
          esBot
            ? "rounded-tl-none bg-white text-zinc-900 dark:bg-[#202c33] dark:text-zinc-50"
            : "rounded-tr-none bg-[#dcf8c6] text-zinc-900 dark:bg-[#005c4b] dark:text-zinc-50"
        }`}
      >
        {mensaje.texto}
        <div
          className={`mt-1 text-right text-[10px] ${
            esBot ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {mensaje.hora}
        </div>
      </div>
    </div>
  );
}
