# Portafolio de proyectos Colsubsidio

Extracción de los **18 brochures oficiales** de vivienda que Colsubsidio publica en Heyzine (material comercial público, no la data confidencial del reto).

| Archivo | Qué es |
|---|---|
| [`proyectos-colsubsidio.md`](proyectos-colsubsidio.md) | La extracción completa. Tabla maestra + ficha por proyecto (ubicación, unidades, torres, tipologías con áreas, zonas sociales, entorno) + el ecosistema Colsubsidio (subsidios, créditos, seguros, PerteneSer, EDGE) + los vacíos detectados. |
| [`proyectos-colsubsidio.json`](proyectos-colsubsidio.json) | Los mismos 18 proyectos estructurados, listos para alimentar el matching. |
| [`versalles-maipore-brochure.md`](versalles-maipore-brochure.md) | Versalles página por página (el primero que se extrajo, con más detalle narrativo). |

## Cómo se obtuvo

Los flipbooks de Heyzine renderizan el PDF original en canvas y exponen ese PDF en su CDN. Se descargaron los 18 PDFs, se extrajo la capa de texto (11 brochures) y se leyeron visualmente página por página los 6 que estaban aplanados a imagen (Monguí, Inari, La Macarena, Bosque de Arrayán, Samán, Karakalí). Extraído el **2026-07-24**.

Los PDFs fuente **no se versionan** — pesan ~95 MB y se pueden volver a bajar desde los flipbooks (el id de cada uno está en la ficha del proyecto).

## Lo que hay que saber antes de usarlo

- **Los precios casi no existen en el material.** Solo Zarzal (`$149 M precio fijo desde`) y Vibo Once (`$150–175 SMLV` según tipología). El estándar legal de los brochures es que el valor se pacta en **SMMLV del año de escrituración**, proyectado a **2027**. Cualquier lógica de capacidad de pago sale del Excel del reto, no de aquí.
- **Ningún brochure menciona la regla 90/10 ni exige ser afiliado.** La afiliación solo aparece en el crédito hipotecario ("para afiliados categorías A y B"). El material le habla igual a afiliados y no afiliados.
- **Hay inconsistencias entre fuentes** (Inari 594 vs. 649 unidades; Los Nogales 74 vs. 77,95 m²). Están marcadas en el markdown — resolver antes de tratarlo como verdad.
- Tres proyectos son **NO VIS** (Abeto, Araucaria, Los Nogales, todos en Ciudadela Calle 80): otro segmento, otra conversación.
