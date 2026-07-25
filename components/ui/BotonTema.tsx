"use client";

import { useSyncExternalStore } from "react";

type Tema = "claro" | "oscuro";

/**
 * Conmutador claro/oscuro del escenario.
 *
 * La fuente de verdad no es un estado de React sino el atributo `data-theme`
 * de <html>, que el script pre-paint de app/layout.tsx ya dejó puesto antes
 * del primer pintado. Por eso el botón lo lee con `useSyncExternalStore` en
 * vez de copiarlo a un `useState`: el atributo es un sistema externo y
 * duplicarlo solo abre la puerta a que las dos versiones se desincronicen.
 */

const oyentes = new Set<() => void>();

function suscribir(alCambiar: () => void) {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

function leerCliente(): Tema {
  return document.documentElement.dataset.theme === "dark" ? "oscuro" : "claro";
}

// En el servidor no hay <html> que leer. Devolver "claro" es seguro: si el
// navegador está en oscuro, useSyncExternalStore lo corrige al hidratar.
function leerServidor(): Tema {
  return "claro";
}

/**
 * `className` por defecto es `.themeToggle`, que vive en chat.css y está
 * posicionada en absoluto sobre el escenario del lead. La consola del
 * asesor lo monta dentro de una topbar en flujo normal, así que pasa sus
 * propias clases: sin la salida, el botón se le iría a una esquina.
 */
export function BotonTema({ className = "themeToggle" }: { className?: string }) {
  const tema = useSyncExternalStore(suscribir, leerCliente, leerServidor);

  function alternar() {
    const siguiente: Tema = tema === "claro" ? "oscuro" : "claro";
    document.documentElement.dataset.theme =
      siguiente === "oscuro" ? "dark" : "light";
    try {
      localStorage.setItem("tema", siguiente);
    } catch {
      // Modo incógnito o storage bloqueado: el tema vive solo en esta pestaña.
    }
    oyentes.forEach((avisar) => avisar());
  }

  return (
    <button
      className={className}
      onClick={alternar}
      aria-label={tema === "claro" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      {tema === "claro" ? "◐ Oscuro" : "◑ Claro"}
    </button>
  );
}
