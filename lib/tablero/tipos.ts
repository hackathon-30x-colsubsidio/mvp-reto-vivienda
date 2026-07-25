import type { LeadEnCola } from "@/lib/types-asesor";
import type { OrigenDatos } from "@/lib/leads-repo";

// =====================================================================
// LOS CONTRATOS DEL TABLERO — por qué existe esta carpeta
//
// El tablero se pidió "abierto": que agregar algo nuevo no obligue a
// reescribir la pantalla. La forma de conseguirlo es que la página NO
// sepa qué métricas existen ni por qué eje se agrupa. La página itera
// registries; los registries son listas de definiciones.
//
// Agregar una métrica  = un objeto más en METRICAS (metricas.ts).
// Cambiar el eje       = una línea en la página (agrupadores.ts).
// Ninguna de las dos   = tocar JSX.
//
// La regla que ninguna definición puede romper: toda cifra en pantalla
// viene con su `descripcion`, que dice de dónde salió. Una métrica sin
// fuente es caja negra, y eso está prohibido por AGENTS.md.
// =====================================================================

/** Todo lo que el tablero sabe. Es lo único que reciben las definiciones. */
export interface DatosTablero {
  leads: LeadEnCola[];
  origen: OrigenDatos;
  /** El "ahora" del tablero, inyectado. Ningún cálculo lee el reloj. */
  hoy: Date;
}

/** Una cifra de la franja superior. */
export interface Metrica {
  id: string;
  titulo: string;
  /** De dónde sale el número. Se imprime bajo la cifra, no es un tooltip. */
  descripcion: string;
  /**
   * La cifra que decide la pantalla, si la hay.
   *
   * Existe para que la franja NO sea seis tarjetas idénticas: un tablero
   * donde todo pesa lo mismo obliga a leerlo entero para saber qué
   * importa. Como máximo UNA métrica lleva esta marca — dos destacadas
   * es ninguna destacada.
   */
  principal?: boolean;
  calcular(datos: DatosTablero): {
    /** Ya formateado: la definición sabe si es "12", "34%" o "3,2 h". */
    valor: string;
    /** Segunda línea opcional: el contraste que le da sentido a la cifra. */
    detalle?: string;
  };
}

/** Un grupo de leads dentro de un eje de agrupación. */
export interface GrupoLeads {
  clave: string;
  titulo: string;
  subtitulo: string;
  leads: LeadEnCola[];
}

/** Un eje por el que partir la cola: afiliación, salida, fuente… */
export interface Agrupador {
  id: string;
  titulo: string;
  /**
   * ⚠️  INVARIANTE: la unión de los grupos son TODOS los leads, sin
   *     perder ni duplicar ninguno. `agrupadores.test.ts` lo verifica
   *     para cada agrupador registrado. Un lead que no aparece en
   *     ningún grupo es un lead que el asesor nunca va a llamar.
   */
  grupos(datos: DatosTablero): GrupoLeads[];
}
