import type { Score } from "@/lib/types";
import * as curados from "./leads-curados";

// El veredicto del motor para cada personaje.
//
// ⚠️ Ya NO se escribe a mano: es el `Score` que produce `calcularScore()` sobre
// el lead del personaje (ver leads-curados.ts). Este archivo se conserva como el
// nombre por el que el resto del repo lo pide —`scores.afiliadoListo` sigue
// funcionando igual— pero la fuente es una sola: el motor.
//
// Antes había dos verdades: estas fixtures decían 84 / 61 / 0 con 6 factores y
// el motor calculaba otra cosa con 7. El asesor veía en la ficha sembrada un
// número que el motor nunca produjo, y el seed de Supabase copiaba ese número.

export const afiliadoListo: Score = curados.afiliadoListo.score;
export const noAfiliadoListo: Score = curados.noAfiliadoListo.score;
export const nutricion: Score = curados.nutricion.score;
