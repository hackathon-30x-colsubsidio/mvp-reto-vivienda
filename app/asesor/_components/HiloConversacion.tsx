import type { MensajeConversacion } from "@/lib/types";
import { TarjetaConTitulo } from "@/components/ui/Tarjeta";

/**
 * La conversación completa, tal como ocurrió.
 *
 * Es paridad con lo que el asesor ya tiene hoy en su plataforma (charla con el
 * mentor: ve el hilo entero más el resumen), y es el respaldo de todo lo demás
 * de la ficha: si duda de un factor, viene aquí y lee dónde lo dijo el lead.
 * El hilo se persistía desde el 2026-07-24 y ninguna pantalla lo leía.
 *
 * Va al final de la ficha a propósito: primero el veredicto y su porqué, que es
 * lo que el asesor necesita para decidir a quién llama; la evidencia cruda
 * después, para cuando quiera comprobarla.
 *
 * Las filas `sistema` no son mensajes de nadie: son los eventos auditables del
 * flujo (la ingesta, el consentimiento con su hora, el trigger de nutrición, el
 * momento en que alguien pidió hablar con un asesor). Por eso van centradas y
 * sin burbuja — se leen como marcas de tiempo, no como conversación.
 */
export function HiloConversacion({ mensajes }: { mensajes: MensajeConversacion[] }) {
  if (mensajes.length === 0) return null;

  return (
    <TarjetaConTitulo
      titulo="La conversación completa"
      descripcion="Lo que el lead respondió, en orden. Es el respaldo de cada factor de arriba."
      className="mx-auto mt-4 max-w-3xl"
    >
      <ol data-testid="hilo" className="space-y-2.5">
        {mensajes.map((mensaje, i) => (
          <li
            key={i}
            data-rol={mensaje.rol}
            className={
              mensaje.rol === "sistema"
                ? "py-1 text-center"
                : mensaje.rol === "lead"
                  ? "flex justify-end"
                  : "flex justify-start"
            }
          >
            {mensaje.rol === "sistema" ? (
              <span className="cifra text-texto-tenue text-[12px] leading-normal">
                {mensaje.mensaje}
              </span>
            ) : (
              <span
                className={`max-w-[85%] rounded-md px-3.5 py-2 text-[14px] leading-normal ${
                  mensaje.rol === "lead"
                    ? "bg-salida-suave text-texto"
                    : "border-borde bg-surface-sunken text-texto border"
                }`}
              >
                {mensaje.mensaje}
              </span>
            )}
          </li>
        ))}
      </ol>
    </TarjetaConTitulo>
  );
}
