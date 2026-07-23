"use client";

import { useState } from "react";
import type { LeadEvento } from "@/lib/types";

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
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
    >
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Soy yo — arranca tu propia conversación
      </h3>
      <input
        required
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre completo"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
      />
      <input
        required
        value={celular}
        onChange={(e) => setCelular(e.target.value)}
        placeholder="Celular"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
      />
      <input
        required
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
        placeholder="Cédula"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
      />
      <input
        value={proyecto}
        onChange={(e) => setProyecto(e.target.value)}
        placeholder="Proyecto de interés (opcional)"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
      />
      <select
        value={fuente}
        onChange={(e) => setFuente(e.target.value as LeadEvento["fuente"])}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
      >
        <option value="web">Web</option>
        <option value="meta">Meta (Facebook/Instagram)</option>
        <option value="google">Google Ads</option>
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-full bg-[#075e54] px-4 py-2 text-sm font-medium text-white"
        >
          Empezar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-full border border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
