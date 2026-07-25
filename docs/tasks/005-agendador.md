---
id: 005
serves: "spec §4 paso 4 (el agendador ofrece franjas) + criterio de aceptación 4 (el lead listo llega con cita registrada)"
status: done (2026-07-24 — el chat ofrece las 3 franjas del proyecto #1 y `POST /api/citas` persiste la elegida; `slots.json` se genera desde el catálogo real)
---

# 005 — Agendador: ofrecer y registrar la franja

**Dueño:** A (ofrecer en el chat) + D (persistir) · **Costura S3** de [`plan.md §3`](../plan.md)

## Objetivo
Que un lead que pasa el corte salga de la conversación con una franja de sala de ventas registrada, y que el asesor la vea en su ficha.

## Alcance
- Dentro: `data/sintetica/slots.json` — franjas simuladas por sala de ventas ([spec §2](../spec.md): no hay integración de calendario).
- Dentro: A ofrece 2-3 franjas al final de la conversación del lead listo y captura la elegida en `LeadCurado.cita`.
- Dentro: D la persiste en la tabla `citas` y la muestra en la ficha.
- Fuera: reglas de disponibilidad reales, conflictos, cancelación. Un slot elegido no se bloquea para otros.

## Done cuando
- [ ] Los 2 personajes "listos" terminan la conversación con `cita: { fecha, sala_ventas }` no vacía.
- [ ] La cita aparece en la ficha de `/asesor`.
- [ ] El personaje de nutrición **no** recibe oferta de cita.

## Nota de implementación para A (2026-07-24)

El chat cambió de forma: cada paso es un `PasoPregunta` con `opciones` (atajos) + `interpretarTexto`, y toda respuesta devuelve `{ patch, acuse }` ([`lib/conversacion/preguntas.ts`](../../lib/conversacion/preguntas.ts)). La oferta de franjas encaja natural ahí — una franja es una opción más, con su acuse ("Listo, te espero el jueves a las 10 ☕"). **Lo que no encaja es meterla como un paso más de indagación:** las franjas se ofrecen *después* del corte, así que van en una fase nueva del `ChatWhatsApp`, no en el arreglo de `pasos`.

## Estado (2026-07-23, rama `feature/asesor`)

**La mitad de D está hecha.** Falta la de A.

- [x] `data/sintetica/slots.json` — catálogo de franjas por sala (3 salas × 3 franjas). Lo creó D para no bloquear; A puede ajustar horarios y salas sin pedir permiso.
- [x] `GET /api/citas?proyecto_id=&limite=3` — devuelve las franjas que A ofrece en el chat. No toca la DB: es catálogo.
- [x] `POST /api/citas` — persiste la franja elegida (`{ lead_id, fecha, sala_ventas }`), upsert por `lead_id`. Rechaza con 422 una franja que no esté en `slots.json`, para que el chat no pueda agendar una hora inventada.
- [x] La cita se muestra en la ficha de `/asesor` (`BloqueCita`), verificada por test.
- [ ] **A:** ofrecer 2-3 franjas al final de la conversación del lead listo y llamar a `POST /api/citas` con la elegida.

## Notas
El reparto decía "la cita la agrega D o A": este ticket cierra ese "o". Depende de 001 y de la conversación de A.
El [spec §2](../spec.md) dice "slots simulados en la DB"; aquí el **catálogo** de franjas es JSON y sólo la franja **elegida** va a Supabase, por la regla del [ADR 0002](../adr/0002-stack-mvp.md): a la DB va únicamente lo que muta.
