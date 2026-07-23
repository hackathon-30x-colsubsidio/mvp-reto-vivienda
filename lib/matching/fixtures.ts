import type { FichaProyecto } from "./tipos";

// Fixture PROVISIONAL del catálogo. Los 6 proyectos son inventados; el catálogo
// real son los 18 oficiales del reto y lo publica el Track B en
// `data/sintetica/proyectos.json` (spec §6). Cuando B avise, este archivo se borra
// y el matcher se prueba contra el JSON real.
//
// Los nombres coinciden a propósito con los de `lib/fixtures/proyectos-recomendados.ts`
// (Track A) y con `docs/explicaciones-referencia.md`: mientras el catálogo real no
// exista, que al menos el demo no se contradiga entre pantallas.

export const catalogo: FichaProyecto[] = [
  {
    proyecto_id: "p-03",
    nombre: "Reserva del Poblado",
    ciudad: "Medellín",
    zona: "El Poblado",
    precio_desde: 165_000_000,
    vis: true,
    cupo_no_afiliados: { usado: 9, total: 10 },
  },
  {
    proyecto_id: "p-07",
    nombre: "Torres de Bellavista",
    ciudad: "Bogotá",
    zona: "Suba",
    precio_desde: 185_000_000,
    vis: true,
    cupo_no_afiliados: { usado: 4, total: 14 },
  },
  {
    proyecto_id: "p-09",
    nombre: "Alto de las Palmas",
    ciudad: "Medellín",
    zona: "Envigado",
    precio_desde: 178_000_000,
    vis: true,
    cupo_no_afiliados: { usado: 3, total: 12 },
  },
  {
    proyecto_id: "p-12",
    nombre: "Reserva de los Cerros",
    ciudad: "Bogotá",
    zona: "Usaquén",
    precio_desde: 172_000_000,
    vis: true,
    cupo_no_afiliados: { usado: 6, total: 11 },
  },
  {
    proyecto_id: "p-15",
    nombre: "Alameda del Río",
    ciudad: "Bogotá",
    zona: "Fontibón",
    precio_desde: 210_000_000,
    vis: false,
    cupo_no_afiliados: { usado: 10, total: 10 }, // sin cupo: ningún no afiliado debería verlo
  },
  {
    proyecto_id: "p-18",
    nombre: "Ciudadela del Este",
    ciudad: "Medellín",
    zona: "Belén",
    precio_desde: 158_000_000,
    vis: true,
    cupo_no_afiliados: { usado: 8, total: 8 }, // sin cupo, y el más barato: la trampa del test
  },
];

/**
 * El precio máximo de cada personaje mientras `Score.precio_maximo` no exista
 * (ticket 002). Lo calculará `precioMaximo(ingreso)` de `lib/scoring/capacidad.ts`
 * (ticket 004, dueño B) con el tope del 40% del Decreto 583 de 2025.
 * Estos valores son coherentes con los rangos de ingreso de `lib/fixtures/leads.ts`,
 * pero son **provisionales**: el número bueno es el que calcule B.
 */
export const preciosMaximos = {
  afiliadoListo: 230_000_000, // 3-5 SMMLV
  noAfiliadoListo: 190_000_000, // 1-3 SMMLV
  nutricion: 95_000_000, // 1-2 SMMLV, y aun así la cuota se le va al 52%
};
