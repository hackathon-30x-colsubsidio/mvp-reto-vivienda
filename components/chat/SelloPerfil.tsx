import type { Lead, PerfilConocido } from "@/lib/types";
// El enum de la situación crediticia nunca se le enseña a nadie: las etiquetas
// humanas viven en lib/formato.ts, compartidas con la ficha del asesor.
import { etiquetaCrediticia } from "@/lib/formato";

/**
 * El cierre de la conversación: le devuelve al lead, en una sola tarjeta, lo
 * que quedó registrado de él. Es puro reflejo — no calcula, no pide nada y no
 * inventa: cada fila sale del enriquecimiento (`perfil`) o de lo que él mismo
 * respondió (`respuestas`), y la que no tiene dato no se pinta. Es la versión
 * mínima de la regla "cero caja negra" (AGENTS.md) del lado del lead: la
 * explicación factor por factor vive en la ficha del asesor.
 */
export function SelloPerfil({
  perfil,
  respuestas,
}: {
  perfil: PerfilConocido;
  respuestas: Lead["respuestas"];
}) {
  const filas: { etiqueta: string; valor: string; cifra?: boolean }[] = [];

  const afiliado = perfil.afiliado ?? respuestas.afiliado_autoreportado;
  if (afiliado !== undefined) {
    filas.push({ etiqueta: "Afiliación", valor: afiliado ? "Afiliado" : "No afiliado" });
  }

  const zona = perfil.ciudad ?? respuestas.zona_interes;
  if (zona) filas.push({ etiqueta: "Ciudad o zona", valor: zona });

  const ingreso = perfil.rango_ingreso ?? respuestas.rango_ingreso_hogar;
  if (ingreso) filas.push({ etiqueta: "Ingreso del hogar", valor: ingreso, cifra: true });

  if (respuestas.tiene_vivienda !== undefined) {
    filas.push({
      etiqueta: "Vivienda propia",
      valor: respuestas.tiene_vivienda ? "Sí" : "No",
    });
  }

  if (respuestas.subsidios !== undefined) {
    filas.push({
      etiqueta: "Subsidios",
      valor: respuestas.subsidios.length ? respuestas.subsidios.join(", ") : "Ninguno",
    });
  }

  if (respuestas.situacion_crediticia) {
    filas.push({
      etiqueta: "Situación crediticia",
      valor: etiquetaCrediticia(respuestas.situacion_crediticia),
    });
  }

  return (
    <div className="seal">
      <div className="seal__badge">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Perfil registrado
      </div>
      <div className="seal__title">Tu perfil quedó sellado</div>
      <div className="seal__body">
        Un asesor comercial revisará tu caso y verás el detalle completo —factor por
        factor— cuando te contacte. Nada queda en caja negra.
      </div>
      {filas.length > 0 && (
        <div className="seal__rows">
          {filas.map((f) => (
            <div className="seal__r" key={f.etiqueta}>
              <span>{f.etiqueta}</span>
              <b className={f.cifra ? "cifra" : undefined}>{f.valor}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
