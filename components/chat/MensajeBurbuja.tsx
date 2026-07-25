export interface Mensaje {
  id: string;
  autor: "bot" | "usuario";
  texto: string;
  hora: string;
}

/**
 * Los enlaces del mensaje se vuelven clickeables, como en WhatsApp.
 *
 * Solo `https://`, y siempre con `rel="noopener noreferrer"`: el texto lo
 * escribe nuestro código, pero un enlace que se abre con acceso a la ventana
 * de origen es una puerta que no hay razón para dejar abierta.
 */
const URL_HTTPS = /(https:\/\/[^\s]+[^\s.,;:!?)])/g;

function conEnlaces(texto: string) {
  return texto.split(URL_HTTPS).map((parte, i) =>
    parte.startsWith("https://") ? (
      <a key={i} href={parte} target="_blank" rel="noopener noreferrer">
        {parte.replace(/^https:\/\//, "")}
      </a>
    ) : (
      parte
    ),
  );
}

// La burbuja del escenario de marca (app/chat.css): esquina recta del lado
// de quien habla, redondeada del otro. El color sale de los roles
// `--chat-bubble-*`, nunca de un hex escrito aquí.
export function MensajeBurbuja({ mensaje }: { mensaje: Mensaje }) {
  const esBot = mensaje.autor === "bot";
  return (
    <div className={`row ${esBot ? "bot" : "user"}`}>
      <div className="bubble">
        {conEnlaces(mensaje.texto)}
        <div className="time cifra">{mensaje.hora}</div>
      </div>
    </div>
  );
}
