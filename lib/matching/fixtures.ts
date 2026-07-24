import type { FichaProyecto } from "./tipos";

// Catálogo CONTROLADO, solo para los tests del matcher (matching.test.ts).
// Producción consume el catálogo REAL de los 18 proyectos en
// `lib/matching/catalogo.ts` (data/sintetica/proyectos.json); acá se mantiene una
// muestra chica y estable —con la trampa de "Ciudadela del Este" sin cupo y el más
// barato— para probar el ranking del matcher de forma determinista, sin atarlo a
// los datos vivos. Los nombres coinciden con `lib/fixtures/proyectos-recomendados.ts`
// y `docs/explicaciones-referencia.md`.

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
