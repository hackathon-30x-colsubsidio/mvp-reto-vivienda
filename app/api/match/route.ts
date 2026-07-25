import { matchear } from "@/lib/matching";
import { catalogo } from "@/lib/matching/catalogo";
import { precioMaximoDe } from "@/lib/scoring/capacidad";
import type { EntradaMatch } from "@/lib/matching/tipos";

// Elegir proyectos es determinista: reglas puras, sin LLM y sin red (ADR 0002).
// Por eso esta ruta responde JSON de una vez; la que llama a Claude es
// /api/explicacion, y esa sí va en streaming.
export const runtime = "nodejs";

type Cuerpo = Pick<EntradaMatch, "lead" | "score"> & { precio_maximo?: number };

export async function POST(req: Request) {
  let cuerpo: Cuerpo;
  try {
    cuerpo = await req.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const { lead, score } = cuerpo;
  if (!lead || !score) {
    return new Response("Faltan lead y score", { status: 400 });
  }

  // El precio máximo es el gate del 40% despejado al revés, calculado por el
  // MOTOR (`lib/scoring/capacidad.ts`, costura S2 / ticket 004). El matcher no
  // reimplementa la norma ni cae a una fixture por personaje: si el Decreto
  // cambia, cambia en config.ts y esto sigue siendo correcto.
  const precio_maximo = cuerpo.precio_maximo ?? precioMaximoDe(lead);

  const elegidos = matchear({ lead, score, catalogo, precio_maximo });

  return Response.json({
    // El contrato ProyectoRecomendado necesita `porque`, y ese lo escribe el
    // experto: se pide aparte a /api/explicacion con estas razones como insumo.
    proyectos: elegidos.map(({ ficha, razones }) => ({
      proyecto_id: ficha.proyecto_id,
      nombre: ficha.nombre,
      razones,
    })),
    precio_maximo,
  });
}
