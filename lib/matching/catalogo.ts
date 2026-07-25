import crudo from "@/data/sintetica/proyectos.json";
import type { FichaProyecto } from "./tipos";

// El catálogo REAL que consume producción: los 18 proyectos oficiales del reto,
// derivados por Datos & Motor (ex-Track B) del Excel a data/sintetica/proyectos.json
// (pesos ya limpios, ÷10.000 como manda AGENTS.md). Es data SINTÉTICA/DERIVADA:
// puede vivir en git; la data cruda de Colsubsidio nunca (restricción no-negociable).
//
// El JSON trae campos que el matcher no usa (ciudad_inferida, ubicacion_incierta,
// ubicacion_nota) y usa `null` donde FichaProyecto usa `undefined`. Aquí se proyecta
// a la forma exacta de FichaProyecto y se convierten los null a undefined.
//
// Ojo con el cupo 90/10: en el catálogo real casi todos los proyectos traen
// `usado >= total` (la munición del pitch: 16/16 incumplen el límite del 10%). El
// matcher ya no descarta al no afiliado por eso; lo deja ver el proyecto con la
// razón honesta de que el cupo está sobre-utilizado (ver lib/matching/index.ts).

interface ProyectoCrudo {
  proyecto_id: string;
  nombre: string;
  ciudad: string;
  zona: string | null;
  precio_desde: number;
  vis: boolean;
  cupo_no_afiliados: { usado: number; total: number };
  brochure: string | null;
  recorrido_360: string | null;
  ubicacion_incierta?: boolean;
}

export const catalogo: FichaProyecto[] = (crudo as ProyectoCrudo[]).map((p) => ({
  proyecto_id: p.proyecto_id,
  nombre: p.nombre,
  ciudad: p.ciudad,
  zona: p.zona ?? undefined,
  precio_desde: p.precio_desde,
  vis: p.vis,
  cupo_no_afiliados: p.cupo_no_afiliados,
  brochure: p.brochure ?? undefined,
  recorrido_360: p.recorrido_360 ?? undefined,
  // VIBO ONCE y KARAKALI aparecen en dos ciudades distintas según la hoja del
  // insumo. El matcher lo necesita para no prometer una zona que no está
  // confirmada; sin este campo, la ciudad se leería como un hecho.
  ...(p.ubicacion_incierta ? { ubicacion_incierta: true } : {}),
}));
