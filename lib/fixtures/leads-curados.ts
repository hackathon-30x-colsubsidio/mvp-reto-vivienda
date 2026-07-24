import type { LeadCurado } from "@/lib/types";
import * as leads from "./leads";
import * as scores from "./scores";
import * as proyectos from "./proyectos-recomendados";

export const afiliadoListo: LeadCurado = {
  lead: leads.afiliadoListo,
  score: scores.afiliadoListo,
  proyectos: proyectos.afiliadoListo,
  cita: { fecha: "2026-07-25T10:00:00-05:00", sala_ventas: "Sala Bogotá Centro" },
  explicacion:
    "Diana es afiliada a Colsubsidio y su cuota estimada (32% del ingreso del hogar) queda holgada bajo el tope legal del 40% que fija el Decreto 583 de 2025, incluso antes de sumar el subsidio Mi Casa Ya al que aplica. No tiene vivienda propia y no reporta mora, y el 84% de similitud con compradores históricos de Torres de Bellavista respalda la recomendación.",
};

export const noAfiliadoListo: LeadCurado = {
  lead: leads.noAfiliadoListo,
  score: scores.noAfiliadoListo,
  proyectos: proyectos.noAfiliadoListo,
  cita: { fecha: "2026-07-25T16:00:00-05:00", sala_ventas: "Sala Medellín Poblado" },
  explicacion:
    "Carlos no es afiliado a Colsubsidio, así que su lead queda marcado contra el cupo del 10% de no afiliados de Reserva del Poblado (regla 90/10) — no se le descarta por eso. Su cuota estimada (35% del ingreso del hogar) está dentro del tope legal del 40% del Decreto 583 de 2025 incluso sin subsidio, no tiene vivienda propia y no reporta mora.",
};

export const nutricion: LeadCurado = {
  lead: leads.nutricion,
  score: scores.nutricion,
  proyectos: proyectos.nutricion,
  // sin cita: no supera el corte
  explicacion:
    "La cuota estimada de Yuliana (52% del ingreso del hogar) supera el tope legal del 40% que fija el Decreto 583 de 2025 para Alameda del Río, así que el banco no podría prestarle hoy: no es una heurística nuestra, es la norma. No es afiliada, no tiene subsidios aplicables declarados y reporta mora reciente. Queda en nutrición con esta razón exacta; el trigger de recontacto es un aumento del ingreso del hogar o la aplicación a un subsidio que baje la cuota bajo el 40%.",
};
