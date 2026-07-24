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

export function BotonTema() {
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
      className="themeToggle"
      onClick={alternar}
      aria-label={tema === "claro" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      {tema === "claro" ? "◐ Oscuro" : "◑ Claro"}
    </button>
  );
}
