import type { ProyectoRecomendado } from "@/lib/types";
import * as curados from "./leads-curados";

// Los 2-3 proyectos que el matcher le recomienda a cada personaje.
//
// ⚠️ Ya NO se escriben a mano: salen de `matchear()` sobre el catálogo REAL de
// 18 proyectos (ver leads-curados.ts). Antes eran proyectos inventados
// ("Torres de Bellavista", "Alto de las Palmas" en Medellín) que no existen en
// el catálogo, así que las franjas de cita colgaban de ids fantasma y la ficha
// del asesor prometía un proyecto que el sistema no puede vender.

export const afiliadoListo: ProyectoRecomendado[] = curados.afiliadoListo.proyectos;
export const noAfiliadoListo: ProyectoRecomendado[] = curados.noAfiliadoListo.proyectos;
export const nutricion: ProyectoRecomendado[] = curados.nutricion.proyectos; // vacío: cae en nutrición
