"use client";

import { useState } from "react";
import type { LeadEvento } from "@/lib/types";

// `.campo` vive en app/chat.css: es el mismo campo del pie del chat, para que
// escribir aquí y escribir allá se sienta igual.
const CLASE_CAMPO = "campo";

/**
 * El formato en blanco: mismo mundo que la ficha del asesor, pero
 * vacío y a la espera. Cada campo lleva su rótulo en versalitas — un
 * formato rotula sus campos, no los deja adivinar desde el placeholder.
 */
export function FormularioSoyYo({
  onEnviar,
  onCancelar,
}: {
  onEnviar: (evento: LeadEvento) => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [cedula, setCedula] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [fuente, setFuente] = useState<LeadEvento["fuente"]>("web");

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !celular.trim() || !cedula.trim()) return;
    onEnviar({
      lead_id: `lead-${Date.now()}`,
      nombre: nombre.trim(),
      celular: celular.trim(),
      cedula: cedula.trim(),
      proyecto_interes: proyecto.trim() || undefined,
      fuente,
    });
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="overflow-hidden rounded-md border-2 border-borde bg-papel"
    >
      <h3 className="border-b-2 border-borde bg-papel-hueco px-5 py-3 text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase">
        Soy yo — arranca tu propia conversación
      </h3>

      <div className="flex flex-col gap-4 px-5 py-5">
        <Campo etiqueta="Nombre completo" htmlFor="nombre">
          <input
            id="nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Como aparece en tu cédula"
            className={CLASE_CAMPO}
          />
        </Campo>

        <Campo etiqueta="Celular" htmlFor="celular">
          <input
            id="celular"
            required
            inputMode="tel"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            placeholder="300 000 0000"
            className={`${CLASE_CAMPO} cifra`}
          />
        </Campo>

        <Campo etiqueta="Cédula" htmlFor="cedula">
          <input
            id="cedula"
            required
            inputMode="numeric"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Sin puntos ni comas"
            className={`${CLASE_CAMPO} cifra`}
          />
        </Campo>

        <Campo etiqueta="Proyecto de interés (opcional)" htmlFor="proyecto">
          <input
            id="proyecto"
            value={proyecto}
            onChange={(e) => setProyecto(e.target.value)}
            placeholder="Si viste uno en el anuncio"
            className={CLASE_CAMPO}
          />
        </Campo>

        <Campo etiqueta="Por dónde llegaste" htmlFor="fuente">
          <select
            id="fuente"
            value={fuente}
            onChange={(e) => setFuente(e.target.value as LeadEvento["fuente"])}
            className={CLASE_CAMPO}
          >
            <option value="web">Web</option>
            <option value="meta">Meta (Facebook/Instagram)</option>
            <option value="google">Google Ads</option>
          </select>
        </Campo>

        <div className="mt-1 flex gap-2">
          <button type="submit" className="btn btn--primary !text-sm">
            Empezar
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="btn btn--ghost !text-sm !flex-none"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

function Campo({
  etiqueta,
  htmlFor,
  children,
}: {
  etiqueta: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase"
      >
        {etiqueta}
      </label>
      {children}
    </div>
  );
}
