"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// =====================================================================
// Dictado por voz — contestar hablando en vez de escribiendo.
//
// POR QUÉ EXISTE: el mentor lo pidió textual — *"unas personas prefieren
// escoger y otras escribir o mandar notas de voz"* (spec 02 D4). Y es una
// decisión de inclusión, no una feature bonita: quien contesta desde una obra,
// manejando, o con poca práctica escribiendo, puede hablar. Este producto le
// vende vivienda a gente que compra una vez en la vida.
//
// QUÉ ES Y QUÉ NO ES — importa decirlo bien:
//   · ES dictado: el navegador transcribe y el texto cae en el campo, que la
//     persona puede corregir antes de enviar.
//   · NO es una nota de voz guardada. Ningún audio se sube ni se persiste.
//     En producción, WhatsApp entrega el audio y se transcribe igual, así que
//     el punto de entrada al flujo es el mismo.
//
// LO QUE NO TOCA: nada. El texto entra por el MISMO `interpretarTexto` que una
// respuesta escrita, así que el motor, el contrato y el set de preguntas no se
// enteran. Si el navegador no soporta la API, el botón no se pinta y el chat
// funciona idéntico — el campo de texto nunca desaparece (regla del repo).
// =====================================================================

/** Estados posibles del micrófono, en el orden en que los ve la persona. */
export type EstadoDictado = "no-soportado" | "listo" | "escuchando" | "sin-permiso";

// La Web Speech API no está en lib.dom (sigue siendo experimental y con
// prefijo), así que se declara el mínimo que este hook usa. Nada de `any`.
interface ResultadoVoz {
  readonly isFinal: boolean;
  readonly length: number;
  [indice: number]: { readonly transcript: string };
}

interface EventoResultadoVoz {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [indice: number]: ResultadoVoz };
}

interface ReconocimientoVoz {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((evento: EventoResultadoVoz) => void) | null;
  onerror: ((evento: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type ConstructorVoz = new () => ReconocimientoVoz;

interface VentanaConVoz {
  SpeechRecognition?: ConstructorVoz;
  webkitSpeechRecognition?: ConstructorVoz;
}

function constructorDeVoz(): ConstructorVoz | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as VentanaConVoz;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** El soporte del navegador no cambia mientras la página vive: nada a qué suscribirse. */
const sinCambios = () => () => {};
const haySoporteEnCliente = () => Boolean(constructorDeVoz());
/** En el servidor no hay `window`, y decir "sí" ahí rompería la hidratación. */
const haySoporteEnServidor = () => false;

export function useDictado({
  onTexto,
  idioma = "es-CO",
}: {
  /** Se llama con el texto dictado, en vivo mientras la persona habla. */
  onTexto: (texto: string) => void;
  idioma?: string;
}) {
  // `useSyncExternalStore` es la forma canónica de leer algo que solo existe en
  // el navegador sin desalinear el HTML del servidor: devuelve `false` al
  // renderizar en el server y el valor real al hidratar.
  const soportado = useSyncExternalStore(
    sinCambios,
    haySoporteEnCliente,
    haySoporteEnServidor,
  );
  /** Lo que cambia por lo que hace la persona, no por el navegador. */
  const [actividad, setActividad] = useState<Exclude<EstadoDictado, "no-soportado">>("listo");
  const estado: EstadoDictado = soportado ? actividad : "no-soportado";

  const reconocimientoRef = useRef<ReconocimientoVoz | null>(null);
  /** Lo que ya había escrito antes de dictar: se conserva y se le añade. */
  const baseRef = useRef("");
  const onTextoRef = useRef(onTexto);

  // El callback se guarda en un efecto y no durante el render: leer o escribir
  // un ref mientras se renderiza es justo lo que React desaconseja.
  useEffect(() => {
    onTextoRef.current = onTexto;
  }, [onTexto]);

  // Si la persona cierra el chat en mitad de una frase, se corta el micrófono.
  useEffect(() => () => reconocimientoRef.current?.abort(), []);

  const detener = useCallback(() => {
    reconocimientoRef.current?.stop();
  }, []);

  const arrancar = useCallback(
    (textoActual: string) => {
      const Constructor = constructorDeVoz();
      if (!Constructor) return;

      const reconocimiento = new Constructor();
      reconocimiento.lang = idioma;
      reconocimiento.continuous = false;
      // Resultados parciales: el texto aparece mientras la persona habla, que
      // es lo que hace que se sienta vivo en vez de un spinner.
      reconocimiento.interimResults = true;

      baseRef.current = textoActual.trim();

      reconocimiento.onresult = (evento) => {
        let dictado = "";
        for (let i = 0; i < evento.results.length; i += 1) {
          dictado += evento.results[i][0].transcript;
        }
        const base = baseRef.current;
        onTextoRef.current(base ? `${base} ${dictado.trim()}` : dictado.trim());
      };

      reconocimiento.onerror = (evento) => {
        // `not-allowed` es la persona diciendo que no al micrófono. No se
        // insiste ni se vuelve a ofrecer: se sigue por texto, que siempre está.
        setActividad(evento.error === "not-allowed" ? "sin-permiso" : "listo");
      };

      reconocimiento.onend = () => {
        setActividad((previo) => (previo === "escuchando" ? "listo" : previo));
      };

      reconocimientoRef.current = reconocimiento;
      setActividad("escuchando");
      reconocimiento.start();
    },
    [idioma],
  );

  return { estado, arrancar, detener };
}
