import { matchear } from "@/lib/matching";
import { catalogo, preciosMaximos } from "@/lib/matching/fixtures";
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

  // El precio máximo lo calcula el motor de B con el tope del 40% (ticket 004).
  // Mientras `Score` no lo traiga (ticket 002), viaja en el cuerpo o cae al
  // fixture del personaje. Cuando 002 aterrice: score.precio_maximo y se acabó.
  const precio_maximo = cuerpo.precio_maximo ?? precioMaximoDeFixture(score.salida);

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

function precioMaximoDeFixture(salida: Cuerpo["score"]["salida"]): number {
  if (salida === "nutricion") return preciosMaximos.nutricion;
  if (salida === "listo_restriccion_cupo") return preciosMaximos.noAfiliadoListo;
  return preciosMaximos.afiliadoListo;
}
