import type { ProyectoRecomendado } from "@/lib/types";

export const afiliadoListo: ProyectoRecomendado[] = [
  {
    proyecto_id: "p-07",
    nombre: "Torres de Bellavista",
    porque:
      "Tu cuota estimada es 32% de tu ingreso del hogar, dentro del tope legal del 40%; está en Bogotá, tu ciudad, y el subsidio Mi Casa Ya que aplicas la baja todavía más.",
  },
  {
    proyecto_id: "p-12",
    nombre: "Reserva de los Cerros",
    porque:
      "Mismo rango de precio que Torres de Bellavista y en tu ciudad; el 84% de similitud con compradores históricos de este proyecto respalda que perfiles como el tuyo sí compran aquí.",
  },
];

export const noAfiliadoListo: ProyectoRecomendado[] = [
  {
    proyecto_id: "p-03",
    nombre: "Reserva del Poblado",
    porque:
      "Tu cuota estimada es 35% de tu ingreso del hogar, dentro del tope legal del 40%, y está en Medellín, tu ciudad. Como no eres afiliado quedas marcado contra el 10% de cupo del proyecto.",
  },
  {
    proyecto_id: "p-09",
    nombre: "Alto de las Palmas",
    porque:
      "Precio similar a Reserva del Poblado y en tu misma zona; el 61% de similitud con compradores históricos no afiliados muestra que este proyecto sí tiene espacio para tu perfil.",
  },
];

export const nutricion: ProyectoRecomendado[] = []; // vacío: cae en nutrición, no se matchea
