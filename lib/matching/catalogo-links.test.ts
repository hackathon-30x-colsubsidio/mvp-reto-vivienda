import { describe, expect, it } from "vitest";
import { catalogo } from "./catalogo";

// Los dos links roto del catálogo, medidos el 2026-07-26 sobre
// `data/sintetica/proyectos.json`:
//
//   ZARZAL    → la url termina en U+200B (espacio de ancho cero) y `trim()` no
//               lo borra, porque no es whitespace para Unicode.
//   VERSALLES → no trae una url sino CUATRO, separadas por saltos de línea (una
//               por tipología más la de amenidades), y el `href` se las llevaba
//               concatenadas: no abría ninguna.
//
// Importan más desde la rama 5: hasta entonces el link solo lo veía el asesor en
// su ficha; hoy la recomendación se lo manda al LEAD por el chat, así que es
// algo que el jurado puede cliquear.
//
// El saneo vive en `catalogo.ts` y NO en el JSON a propósito: ese archivo lo
// genera `scripts/generar_sintetica.py` desde el Excel real, y una corrección a
// mano la borra la siguiente corrida sin avisar.

const conLink = catalogo.filter((p) => p.recorrido_360 || p.brochure);

describe("los links del catálogo son servibles", () => {
  it("hay links que revisar (si esto falla, el catálogo se quedó sin ninguno)", () => {
    expect(conLink.length).toBeGreaterThan(10);
  });

  it.each(conLink.map((p) => [p.nombre, p] as const))(
    "%s: una sola url, sin caracteres invisibles",
    (_nombre, proyecto) => {
      for (const url of [proyecto.recorrido_360, proyecto.brochure]) {
        if (!url) continue;
        expect(url).toMatch(/^https?:\/\/\S+$/);
        // Una sola: dos "http" en el mismo string es el bug de VERSALLES.
        expect(url.match(/https?:/g)).toHaveLength(1);
        // Ningún invisible pegado: el bug de ZARZAL.
        expect(url).not.toMatch(/[\u200b-\u200d\u2060\ufeff]/);
        expect(url).toBe(url.trim());
      }
    },
  );

  it("ZARZAL conserva su url, solo sin el invisible", () => {
    const zarzal = catalogo.find((p) => p.nombre === "ZARZAL")!;
    expect(zarzal.recorrido_360).toBe("https://zarzal.shape.com.co");
  });

  it("VERSALLES queda con la PRIMERA de sus cuatro, no con las cuatro pegadas", () => {
    const versalles = catalogo.find((p) => p.nombre === "VERSALLES")!;
    expect(versalles.recorrido_360).toBe(
      "https://shape.com.co/360/COLSUBSIDIO-Versalles_APTOA",
    );
  });
});
