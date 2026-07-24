export interface Mensaje {
  id: string;
  autor: "bot" | "usuario";
  texto: string;
  hora: string;
}

// La burbuja del escenario de marca (app/chat.css): esquina recta del lado
// de quien habla, redondeada del otro. El color sale de los roles
// `--chat-bubble-*`, nunca de un hex escrito aquí.
export function MensajeBurbuja({ mensaje }: { mensaje: Mensaje }) {
  const esBot = mensaje.autor === "bot";
  return (
    <div className={`row ${esBot ? "bot" : "user"}`}>
      <div className="bubble">
        {mensaje.texto}
        <div className="time cifra">{mensaje.hora}</div>
      </div>
    </div>
  );
}
