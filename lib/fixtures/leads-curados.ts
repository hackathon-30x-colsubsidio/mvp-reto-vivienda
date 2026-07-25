import type { Lead, LeadCurado } from "@/lib/types";
import { curar } from "@/lib/curar";
import { franjasDe } from "@/lib/citas";
import * as leads from "./leads";

// =====================================================================
// Los 3 personajes YA CURADOS: lo que ve el asesor en su ficha.
//
// ⚠️ El `score` y los `proyectos` NO se escriben a mano: salen de `curar()`,
// el mismo código que corre cuando el jurado conversa en vivo. Antes eran
// números escritos a mano (84 / 61 / 0, con 6 factores y proyectos que no
// existen en el catálogo real) mientras el motor calculaba otra cosa: la ficha
// sembrada y la ficha calculada se contradecían en pantalla, que es exactamente
// lo que la costura S6 del plan advierte.
//
// Lo único escrito a mano es la EXPLICACIÓN, y por una razón: es la vara de
// calidad del experto (docs/explicaciones-referencia.md) y el fallback del
// ticket 010 cuando el LLM no responde. Sus cifras salen del `Score` que produce
// el motor con estos mismos leads — si cambian los pesos, el catálogo o el
// guion, hay que reescribirlas, y `fixtures.test.ts` lo verifica.
// =====================================================================

/** La primera franja disponible del proyecto recomendado #1. */
function primeraFranja(curado: LeadCurado): LeadCurado["cita"] {
  const proyecto = curado.proyectos[0];
  if (!proyecto) return undefined;

  const franja = franjasDe(proyecto.proyecto_id, 1)[0];
  return franja ? { fecha: franja.fecha, sala_ventas: franja.sala_ventas } : undefined;
}

function curarConCita(lead: Lead, explicacion: string): LeadCurado {
  const base = curar(lead);
  const cita = primeraFranja(base);
  return { ...base, ...(cita ? { cita } : {}), explicacion };
}

export const afiliadoListo: LeadCurado = curarConCita(
  leads.afiliadoListo,
  "Diana es afiliada a Colsubsidio y puede comprar hoy: la primera cuota estimada de LA ARBOLEDA ($1.164.138) es el 20,4% del ingreso de su hogar ($5.694.000), muy por debajo del tope del 40% que fija el Decreto 583 de 2025 — le sobra la mitad del margen que permite la norma, y eso es lo que la pone arriba en la cola. No tiene vivienda propia, está al día en sus créditos y declaró Mi Casa Ya, todavía sin monto verificado: el asesor lo valida y la postula, y cuando entre bajará aún más la cuota. Le caben tres proyectos en Bogotá, empezando por el que preguntó.",
);

export const noAfiliadoListo: LeadCurado = curarConCita(
  leads.noAfiliadoListo,
  "Carlos SÍ puede comprar: la cuota estimada de PAYANDÉ ($1.053.000) es el 36,9% del ingreso de su hogar ($2.850.000) y cabe bajo el tope del 40% del Decreto 583 de 2025 — justo, pero cabe, y por eso su puntaje de prioridad es bajo, no su salida. Lo que hay que saber antes de llamarlo es otra cosa: no es afiliado, así que compite por el 10% de cupo que permite la regla 90/10, y los tres proyectos que le sirven ya lo tienen copado (PAYANDÉ lleva 27 no afiliados de 14 permitidos). No se le esconde el límite ni se le promete la unidad: el asesor valida cupo antes de separar. No tiene vivienda propia y está al día en sus créditos.",
);

export const nutricion: LeadCurado = curarConCita(
  leads.nutricion,
  "Yuliana todavía no puede comprar, y la razón es una sola y es legal: la cuota estimada de LA MACARENA —el proyecto más económico del catálogo— es $898.214, o sea el 42,1% del ingreso de su hogar ($2.135.250), y el Decreto 583 de 2025 pone el techo en 40%. No es criterio nuestro: por encima de ese porcentaje el banco no puede prestarle. No se descarta, queda en nutrición, y le falta poquísimo: con $2.245.536 de ingreso del hogar —$110.286 más— pasa el corte. También la destraban un subsidio que baje la cuota o un proyecto más económico que entre al catálogo. Reporta una mora reciente y no tiene vivienda propia.",
);
