// Puntaje 0-100 del lead — TS puro, determinista, sin LLM (ADR 0002).
//
// =====================================================================
// POR QUÉ EXISTE, Y POR QUÉ NO CONTRADICE A DESIGN.md
//
// DESIGN.md rechaza explícitamente "el score reducido a un número
// grande con una barra de progreso". Este módulo NO produce eso: produce
// un número Y la aritmética completa que lo sostiene (`aportes`), que la
// UI está obligada a mostrar junto a él. Un puntaje sin su desglose
// delante viola la restricción no-negociable de cero caja negra de
// AGENTS.md; con el desglose, es un renglón de cuentas de un formato.
//
// El puntaje NO decide nada. Quien decide es `Score.salida`, que sale
// del motor de reglas (index.ts). El puntaje solo ORDENA leads dentro
// de un mismo grupo, que es lo que la cola por recencia no sabía hacer.
// =====================================================================

import type { Score } from "../types.js";

/**
 * Cuánto vale cada factor del motor. Suman 100 (un test lo fija).
 *
 * El reparto no es una opinión de diseño: refleja la jerarquía que ya
 * tiene el motor en `index.ts`. La cuota sobre ingreso es la ÚNICA
 * regla que bloquea (Decreto 583 de 2025), así que se lleva el peso
 * mayor; la afiliación es lo que separa las dos salidas de "listo";
 * el resto son señales.
 *
 * ⚠️  CANARIO: todo factor que emita `calcularScore()` tiene que tener
 *     entrada aquí. `puntaje.test.ts` falla si el motor agrega uno y
 *     nadie decidió cuánto pesa. Si un test te trajo hasta acá: agrega
 *     el factor con su peso y reajusta para que sigan sumando 100. No
 *     borres el test.
 */
export const PESOS: Record<string, number> = {
  cuota_ingreso_40: 35,
  afiliacion: 20,
  situacion_crediticia: 15,
  subsidio_aplicable: 10,
  ya_tiene_vivienda: 10,
  cupo_90_10: 10,

  // Peso 0 a propósito, no por olvido: el spec §4 dice que la similitud
  // con compradores históricos es evidencia de respaldo y NUNCA criterio
  // de corte. Aparece en el desglose con su cero visible.
  similitud_compradores_reales: 0,
  // Alias heredado de las fixtures de los personajes (ver la misma nota
  // en TablaFactores.tsx). Se borra cuando se regeneren desde el motor.
  similitud_compradores: 0,
};

/** Lo que aportó un factor al puntaje, con su porqué. */
export interface AportePuntaje {
  nombre: string;
  obtenido: number;
  maximo: number;
  /** Lo que evaluó el motor, tal cual lo redactó. No se parafrasea. */
  porque: string;
}

export interface Puntaje {
  /** 0-100, normalizado sobre los factores realmente evaluados. */
  total: number;
  /** Puntos crudos sumados. */
  obtenido: number;
  /** Puntos posibles con los factores que llegaron. */
  posible: number;
  aportes: AportePuntaje[];
}

/**
 * Calcula el puntaje de un lead ya calificado.
 *
 * `afiliado` viaja aparte porque el factor `afiliacion` del motor es
 * INFORMATIVO (`cumple: true` siempre, para no bloquear a nadie por no
 * ser afiliado): su `cumple` no sirve para puntuar. Se pasa el booleano
 * de `afiliadoEfectivo()` — la misma fuente que usa el agrupador.
 *
 * El total se normaliza sobre los factores presentes, no sobre 100
 * fijo: un lead evaluado con 6 factores no puede quedar castigado
 * frente a uno de 7 por algo que nadie le midió.
 */
export function calcularPuntaje(score: Score, afiliado: boolean): Puntaje {
  const aportes = score.factores.map((factor): AportePuntaje => {
    const maximo = PESOS[factor.nombre];

    // Factor que el motor emite y este módulo no conoce. No se descarta
    // en silencio: entra al desglose con 0 y lo dice.
    if (maximo === undefined) {
      return {
        nombre: factor.nombre,
        obtenido: 0,
        maximo: 0,
        porque: `${factor.valor} — factor sin peso asignado, no cuenta para el puntaje`,
      };
    }

    const cumple = factor.nombre === "afiliacion" ? afiliado : factor.cumple;

    return {
      nombre: factor.nombre,
      obtenido: cumple ? maximo : 0,
      maximo,
      porque: factor.valor,
    };
  });

  const obtenido = aportes.reduce((suma, a) => suma + a.obtenido, 0);
  const posible = aportes.reduce((suma, a) => suma + a.maximo, 0);

  return {
    total: posible === 0 ? 0 : Math.round((obtenido / posible) * 100),
    obtenido,
    posible,
    aportes,
  };
}
