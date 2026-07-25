import type { LeadEvento } from "@/lib/types";

// Los 3 personajes del demo (spec §4): afiliado listo, no afiliado listo, nutrición.
//
// ⚠️ `proyecto_interes` sale del CATÁLOGO REAL de 18 proyectos
// (data/sintetica/proyectos.json) — ticket 001, costura S6 del plan. Hasta el
// 2026-07-24 eran inventados ("Torres de Bellavista", "Reserva del Poblado" en
// Medellín, ciudad que el catálogo no tiene): el motor no encontraba el proyecto
// de entrada y calificaba contra el más barato, y la ficha decía una ciudad que
// el matcher nunca podía recomendar. Si alguien cambia un nombre aquí, tiene que
// existir en el catálogo: `fixtures.test.ts` falla si no.

export const afiliadoListo: LeadEvento = {
  lead_id: "lead-001",
  nombre: "Diana Marcela Ríos",
  celular: "3001234567",
  cedula: "1010123456",
  proyecto_interes: "LA ARBOLEDA", // Bogotá, $194.023.050
  fuente: "meta",
};

export const noAfiliadoListo: LeadEvento = {
  lead_id: "lead-002",
  nombre: "Carlos Andrés Muñoz",
  celular: "3109876543",
  cedula: "1020987654",
  proyecto_interes: "PAYANDÉ", // Ricaurte, $175.500.000
  fuente: "google",
};

export const nutricion: LeadEvento = {
  lead_id: "lead-003",
  nombre: "Yuliana Andrea Pérez",
  celular: "3157654321",
  cedula: "1030456789",
  // El proyecto MÁS ECONÓMICO del catálogo, a propósito: su caso es que hoy no
  // le cabe ni el más barato, y eso es lo que hace honesto el mensaje de nutrición.
  proyecto_interes: "LA MACARENA", // Bogotá, $149.702.400
  fuente: "web",
};
