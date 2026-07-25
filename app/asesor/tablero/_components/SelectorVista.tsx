import Link from "next/link";

// =====================================================================
// El selector de sub-vistas de Métricas.
//
// Misma lógica que el "diario / mensual" de una gráfica: son cortes del
// mismo dato, no secciones distintas. Existe para que cada corte quepa
// SIN SCROLL — apilar los tres bloques obligaba a desplazarse, y un
// tablero que hay que scrollear deja de responder de un vistazo.
//
// Va por querystring (`?v=`) y con `<Link>`, no con estado de cliente:
// la consola del asesor no carga JS y así cada vista es además una URL
// que se puede compartir o dejar abierta en el demo.
// =====================================================================

export const VISTAS = [
  {
    clave: "resumen",
    texto: "Resumen",
    titulo: "La operación en cifras",
    // Sin contar cuántas son: el registry promete que agregar una métrica no
    // obliga a tocar la pantalla, y un número escrito aquí rompía esa promesa
    // en silencio (decía "seis" con ocho en pantalla, ticket 025).
    descripcion:
      "Cada cifra con la fuente de la que sale. Ninguna es un tooltip: si un número no dice de dónde viene, es caja negra.",
  },
  {
    clave: "entrada",
    texto: "Entrada diaria",
    titulo: "Leads que entran por día",
    descripcion:
      "Últimos 14 días, hora de Bogotá. Los días en cero se muestran: un hueco en la serie también es información.",
  },
  {
    clave: "reparto",
    texto: "Reparto",
    titulo: "Leads por afiliación",
    descripcion:
      "Dentro de cada grupo, ordenados por puntaje: el más cerca de comprar, arriba. Abre uno para ver el desglose completo.",
  },
] as const;

export type ClaveVista = (typeof VISTAS)[number]["clave"];

/** Normaliza el `?v=` de la URL. Un valor inventado cae a "resumen". */
export function vistaActiva(v?: string): ClaveVista {
  return (VISTAS.find((x) => x.clave === v)?.clave ?? "resumen") as ClaveVista;
}

export function SelectorVista({ activa }: { activa: ClaveVista }) {
  return (
    <nav
      aria-label="Cortes de las métricas"
      className="border-filo-borde inline-flex shrink-0 gap-1 rounded-[12px] border p-1"
      style={{ backgroundImage: "var(--vidrio-hueco)" }}
    >
      {VISTAS.map((v) => {
        const esta = v.clave === activa;
        return (
          <Link
            key={v.clave}
            href={`/asesor/tablero?v=${v.clave}`}
            aria-current={esta ? "page" : undefined}
            className={`rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
              esta
                ? "bg-surface-card text-texto shadow-[0_1px_2px_rgba(15,23,42,0.10),inset_0_1px_0_0_var(--filo)]"
                : "text-texto-tenue hover:text-texto"
            }`}
          >
            {v.texto}
          </Link>
        );
      })}
    </nav>
  );
}
