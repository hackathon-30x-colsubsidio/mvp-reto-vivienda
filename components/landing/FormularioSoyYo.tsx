"use client";

import { useState } from "react";
import type { LeadEvento } from "@/lib/types";
import { catalogo } from "@/lib/matching/catalogo";

// `.campo` vive en app/chat.css: es el mismo campo del pie del chat, para que
// escribir aquí y escribir allá se sienta igual.
const CLASE_CAMPO = "campo";

/**
 * El proyecto de entrada se ELIGE de una lista, no se escribe.
 *
 * El campo era texto libre y eso lo volvía una trampa silenciosa: el motor
 * califica contra el proyecto por el que entró el lead, y lo busca por nombre
 * exacto (`resolverProyectoDeReferencia`). Escribir "La Arboleda" con una tilde
 * de más, o un proyecto que no existe, no fallaba: el sistema caía al proyecto
 * más económico del catálogo **sin decirlo**, y el jurado veía una ficha
 * calificada contra otra vivienda. Con la lista, el valor siempre existe.
 *
 * De paso enseña el catálogo real —18 proyectos, con su ciudad y su precio
 * desde— que es data derivada del Excel del reto, no inventada.
 */
const pesos = (n: number) => `$${n.toLocaleString("es-CO")}`;

/** "Ricaurte o Bogotá (ubicación contradictoria…)" → "Ricaurte o Bogotá". */
const ciudadCorta = (ciudad: string) => ciudad.split(" (")[0];

const PROYECTOS_POR_CIUDAD = Object.entries(
  catalogo.reduce<Record<string, typeof catalogo>>((grupos, proyecto) => {
    // Los dos proyectos con la ubicación en duda no se mezclan con los de una
    // ciudad confirmada: el insumo los reporta en dos sitios distintos y eso se
    // dice, no se promedia (ver `ubicacion_incierta` en lib/matching/tipos.ts).
    const clave = proyecto.ubicacion_incierta
      ? `${ciudadCorta(proyecto.ciudad)} · por confirmar`
      : proyecto.ciudad;
    (grupos[clave] ??= []).push(proyecto);
    return grupos;
  }, {}),
)
  .sort(([a], [b]) => a.localeCompare(b, "es"))
  .map(([ciudad, proyectos]) => ({
    ciudad,
    // Del más económico al más caro: es el orden en que alguien compara.
    proyectos: [...proyectos].sort((a, b) => a.precio_desde - b.precio_desde),
  }));

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
          <select
            id="proyecto"
            value={proyecto}
            onChange={(e) => setProyecto(e.target.value)}
            className={CLASE_CAMPO}
          >
            {/* Es opcional de verdad: sin proyecto, el motor califica contra el
                más económico del catálogo, que es el caso conservador. */}
            <option value="">Todavía no tengo uno en mente</option>
            {PROYECTOS_POR_CIUDAD.map(({ ciudad, proyectos }) => (
              <optgroup key={ciudad} label={ciudad}>
                {proyectos.map((p) => (
                  // El valor es el NOMBRE del catálogo, que es lo que viaja en
                  // `LeadEvento.proyecto_interes` y lo que el motor busca.
                  <option key={p.proyecto_id} value={p.nombre}>
                    {p.nombre} — desde {pesos(p.precio_desde)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
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
