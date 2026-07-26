import { catalogo } from "@/lib/matching/catalogo";
import { sinTildes } from "./texto";

// ── La zona: la respuesta más impredecible de todas ──────
//
// A "¿dónde te imaginas viviendo?" la gente contesta cualquier cosa: una ciudad,
// un barrio, un deseo ("que tenga buenas zonas comunes"), o dónde queda el
// colegio de los niños. Por eso este intérprete es el único que NO devuelve el
// valor del campo pelado: devuelve POR QUÉ reconoció lo que reconoció, porque de
// eso depende qué se le contesta. Reconocer "Medellín" y reconocer "Chía" llevan
// al mismo tipo de dato y a dos respuestas opuestas.
//
// Y nunca queda sin entender: la última rama guarda el texto crudo. El asesor
// prefiere leer "cerca al colegio de los niños" que un campo vacío.

/** Ciudades del catálogo real, con cuántos proyectos tiene cada una. */
export const CIUDADES_CON_PROYECTOS: { ciudad: string; cuantos: number }[] = Object.entries(
  catalogo.reduce<Record<string, number>>((cuenta, p) => {
    cuenta[p.ciudad] = (cuenta[p.ciudad] ?? 0) + 1;
    return cuenta;
  }, {}),
).map(([ciudad, cuantos]) => ({ ciudad, cuantos }));

/** Barrios y sectores que el catálogo conoce (los trae el brochure). */
const ZONAS_CONOCIDAS = catalogo.map((p) => p.zona).filter((z): z is string => Boolean(z));

/**
 * Ciudades grandes de Colombia donde HOY no hay proyectos. No es data del reto:
 * es reconocer un nombre para poder decir la verdad en vez de un "anotado" que
 * suena a que sí tenemos algo allá.
 */
const CIUDADES_SIN_PROYECTOS = [
  "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira",
  "Santa Marta", "Cúcuta", "Ibagué", "Manizales", "Villavicencio", "Neiva",
  "Armenia", "Popayán", "Pasto", "Montería", "Valledupar", "Tunja",
];

/** Lo que la gente nombra cuando habla de cómo quiere vivir, no de dónde. */
const DESEOS =
  /zonas? comunes?|amenidad|piscina|gimnasio|parque|colegio|trabajo|mam[áa]|familia|tranquil|segur|verde|centro comercial|transporte|metro|cerca de todo/i;

function buscarEn(lista: string[], texto: string): string | undefined {
  const plano = sinTildes(texto);
  return lista.find((candidato) => plano.includes(sinTildes(candidato)));
}

/** Qué fue lo que la persona nombró. La respuesta depende de esto, no del dato. */
export type Zona =
  | { tipo: "ciudad_con_proyectos"; zona: string; cuantos: number }
  | { tipo: "barrio"; zona: string }
  | { tipo: "ciudad_sin_proyectos"; zona: string; ciudad: string }
  | { tipo: "deseo"; zona: string }
  | { tipo: "sin_reconocer"; zona: string };

/**
 * `zona` es siempre lo que hay que guardar en `zona_interes`, ya limpio: la
 * CIUDAD cuando se reconoce (el matcher filtra por eso y "espero que tenga
 * excelentes zonas comunes" no es una zona), el texto crudo cuando no.
 */
export function clasificarZona(texto: string): Zona {
  const conProyectos = CIUDADES_CON_PROYECTOS.find(({ ciudad }) =>
    sinTildes(texto).includes(sinTildes(ciudad)),
  );
  if (conProyectos) {
    return {
      tipo: "ciudad_con_proyectos",
      zona: conProyectos.ciudad,
      cuantos: conProyectos.cuantos,
    };
  }

  const barrio = buscarEn(ZONAS_CONOCIDAS, texto);
  if (barrio) return { tipo: "barrio", zona: barrio };

  const lejos = buscarEn(CIUDADES_SIN_PROYECTOS, texto);
  if (lejos) return { tipo: "ciudad_sin_proyectos", zona: texto, ciudad: lejos };

  if (DESEOS.test(texto)) return { tipo: "deseo", zona: texto };

  return { tipo: "sin_reconocer", zona: texto };
}
