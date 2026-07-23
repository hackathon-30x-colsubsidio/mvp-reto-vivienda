# 0001 — Elección de reto: Vivienda (perfilamiento inteligente de leads)

**Estado:** Aceptada · **Fecha:** 2026-07-23 · **Origen:** heredada de `plan-research/docs/adr/0001`

## Contexto

La hackathon Colsubsidio × 30X abre 4 retos y hay que elegir **uno**: Hotelería, Crédito, Seguros o Vivienda. Quedan 3.5 días útiles y el demo tiene que ser recorrible por el jurado **solo** (autogestionado), con pre-filtro por video de 2 min (solo 6 finalistas pasan a vivo). Los 4 criterios que evalúan: Impacto (incluye "a cuántos afiliados"), Innovación, Ejecución técnica **implementable de verdad**, y Calidad del pitch.

## Decisión

**Vamos por Vivienda: un perfilador inteligente de leads que hace que los leads pagos se parezcan a los orgánicos** — distingue afiliado/no afiliado desde el inicio, infiere/valida capacidad de compra sin sentirse un interrogatorio, prioriza (listo para cerrar → asesor; aún no → nutrición) y recomienda proyectos acordes al perfil.

## Por qué (frente a las alternativas)

Vivienda ofrece el mejor balance bajo los 4 criterios con la restricción real de 5 días y demo autogestionado:

- **Datos reales y usables**, no mockeados: Excel anonimizado de 4.142 compradores (3–4 años) + buyer personas por proyecto (PPT) + brochure. Es la data más limpia de los 4 retos.
- **Demo autocontenido y lineal**: perfilador conversacional (canal declarado: WhatsApp) que detecta afiliado → infiere capacidad → prioriza → matchea proyecto.
- **Alto impacto de cara al afiliado** y **ROI cristalino**: ataca el doble costo del lead sin perfilar (CPL pagado + horas del equipo comercial).
- **Gancho regulatorio diferenciador**: la regla 90/10 convierte "distinguir afiliado temprano" en un cuello de botella de negocio, no un detalle.
- **Altísima implementabilidad**: sistemas y ROI conocidos (CRM = Salesforce); Colsubsidio quiere implementar al ganador.

## Alternativas consideradas (y por qué no)

- **Seguros** (2ª opción): misma familia de solución con menos riesgo de datos, pero menos diferenciado; plan B si Vivienda no cuaja.
- **Crédito**: mayor techo de innovación, pero el de mayor riesgo de ejecución — la base va anonimizada, lo que rompe el scraping literal de variables exógenas.
- **Hotelería**: el más tratable técnicamente, pero puntúa bajo en "a cuántos afiliados beneficia" (ahorro operativo interno, no de cara al afiliado).

## Consecuencias

- **Riesgo — competencia:** Vivienda fue el reto favorito del público, así que probablemente será el más elegido. El diferencial estará en la ejecución y el pitch, no en la idea.
- **Riesgo — cruces externos:** los cruces con Ministerio de Vivienda y buró están fuera de alcance real; se **infieren/simulan**, no se integran. Confirmar por WhatsApp si el jurado lo espera *demostrado* o basta *inferirlo* (ver `docs/URGENTE-Y-NOTICIAS.md`).
- Desbloquea los siguientes pasos: definir el MVP (frase de apuesta + spec de 7 bloques) y construir.

## Fuente

`plan-research/sources/lives/analisis-retos.md` (sección "Recomendación") — síntesis del live del 22/07/2026 contrastada contra los briefs oficiales.
