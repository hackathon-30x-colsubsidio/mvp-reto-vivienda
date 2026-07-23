import type { LeadEvento } from "@/lib/types";

// Los 3 personajes del demo (spec §4): afiliado listo, no afiliado listo, nutrición.

export const afiliadoListo: LeadEvento = {
  lead_id: "lead-001",
  nombre: "Diana Marcela Ríos",
  celular: "3001234567",
  cedula: "1010123456",
  proyecto_interes: "Torres de Bellavista",
  fuente: "meta",
};

export const noAfiliadoListo: LeadEvento = {
  lead_id: "lead-002",
  nombre: "Carlos Andrés Muñoz",
  celular: "3109876543",
  cedula: "1020987654",
  proyecto_interes: "Reserva del Poblado",
  fuente: "google",
};

export const nutricion: LeadEvento = {
  lead_id: "lead-003",
  nombre: "Yuliana Andrea Pérez",
  celular: "3157654321",
  cedula: "1030456789",
  proyecto_interes: "Alameda del Río",
  fuente: "web",
};
