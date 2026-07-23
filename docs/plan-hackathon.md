# Plan de Acción — Reto Vivienda (perfilamiento inteligente de leads)

✅ **Reto cerrado: Vivienda.** Ver el porqué en `adr/0001-eleccion-reto-vivienda.md` y el arranque en `URGENTE-Y-NOTICIAS.md`. Ya no se decide reto — este plan es para definir y construir el MVP.

**Quedan 3.5 días útiles**: jueves, viernes, sábado completos + domingo hasta las 11:30 a.m. **El Día 0 (miércoles) se perdió** — nadie del equipo hizo el kickoff, y solo se avanzó la organización de GitHub + este repo. Cero días más perdidos.

## El marco (por qué está armado así)

| Marco | Pregunta que responde | Cómo lo usamos |
|---|---|---|
| **Design Thinking** (Empatizar→Definir→Idear→Prototipar→Testear) | ¿Resolvemos el problema correcto, de la forma correcta? | Estructura el jueves. No se codea sin pasar por Definir e Idear. |
| **Design Sprint** (Google Ventures: Map→Sketch→Decide→Prototype→Test) | ¿Cómo comprimir semanas de diseño en horas? | Técnica concreta para la sesión de brainstorming del jueves (ver abajo). |
| **TRL** (madurez del prototipo, 1-9) | ¿Qué tan probada está la solución en cada momento? | Cada día tiene un TRL objetivo — obliga a madurar, no solo "avanzar". |
| **Pareto (80/20)** | ¿En qué vale la pena gastar las horas de hoy? | Cada día abre con **"el 20% de hoy"**: si eso no se hace, nada más importa. |
| **MECE** (Mutuamente Excluyente, Colectivamente Exhaustivo) | ¿Cómo brainstormear sin repetirse ni dejar huecos? | Organiza las alternativas de solución en categorías que no se pisan. |

Reglas de oro (validadas con research externo, no solo la charla del día 1):
- **"Feo pero funciona" > "bonito pero falso".** Un MVP terminado gana sobre una obra maestra a medias.
- **Si el jurado no lo ve en el demo/pitch de 2 min, no lo construyas todavía.**
- **Hay pre-filtro por video**: solo 6 finalistas pasan a vivo. El video pesa más de lo que parece — no es un anexo, es el entregable #1.
- **Cero caja negra**: todo debe ser explicable ("por qué esto y no lo otro"), y el jurado debe poder recorrer el demo **solo**, sin que el equipo lo narre.

Equipo: 5 personas, cada una con Claude Code de pago + $100 USD Fable 5 — recursos de sobra, el cuello de botella es **foco**, no herramienta.

---

## Día 0 — Miércoles (perdido, recuperar ya)
**Estado real:** solo **1 persona** vio la sesión en vivo de los 4 retos (la grabó y sintetizó en `plan-research/sources/lives/analisis-retos.md`) — el resto del equipo no tiene ese contexto todavía. Organización de GitHub + repo de planeación ✅ creado, pero poca gente del equipo se ha unido. **El kickoff no ha pasado.**

- [x] Crear organización de GitHub + repo de planeación (`plan-research`).
- [ ] **Todo el equipo se une al repo de GitHub** — sin esto no hay punto de partida común.
- [ ] **Todo el equipo lee `URGENTE-Y-NOTICIAS.md` y `plan-research/sources/lives/analisis-retos.md`** antes de decidir nada.
- [ ] Descargar los **3 insumos de Vivienda** (anonimizados): Excel de 4.142 compradores, buyer personas por proyecto (PPT) y brochure. Confirmar por el WhatsApp del reto si ya están disponibles (ojo con el formato del valor de vivienda: hay que quitar los últimos ceros).
- [x] Cerrar el reto → **Vivienda** (`adr/0001-eleccion-reto-vivienda.md`).
- [ ] Kickoff real del equipo completo — ya, no "mañana temprano". Cerrar la **frase de apuesta** (el reto ya está decidido).

**Entregable:** `01-problema.md` — borrador de la frase de apuesta + preguntas abiertas para cerrar en el kickoff (aún por crear con todo el equipo presente).

---

## Día 1 — Jueves: Contexto + Brainstorming + Diseño
**TRL objetivo: 1 → 3** (idea observada → prueba de concepto)
**El 20% de hoy:** salir con **una** frase de apuesta validada por todo el equipo + **una** arquitectura de solución elegida (no dos, no "vemos cómo va").

### Bloque 1 (mañana) — Kick-off + Empatizar + Definir
- [ ] Kick-off de equipo (30-45 min): cada persona dice su hipótesis de problema en una frase, sin evaluar soluciones todavía.
- [ ] Cerrar las preguntas abiertas de `01-problema.md` (disponibilidad de los 3 insumos, qué se infiere vs. qué se mockea en los cruces externos, y alcance del canal —empezar por WhatsApp—).
- [ ] Redefinir el problema como **"¿Cómo podríamos...?"** (técnica *How Might We*). Ej: *"¿Cómo podríamos perfilar un lead de pauta —sin interrogarlo— para que llegue al asesor tan calificado como uno orgánico, listo para agendar visita?"*
- [ ] Cerrar la **frase de apuesta** final: *"Un [afiliado/segmento] necesita [X], logra [Y] sin [Z]."* — máx. 10 min, si toma más están sobrepensando.

### Bloque 2 (tarde) — Idear (Design Sprint: Sketch + Decide, con MECE)
- [ ] Brainstorming divergente usando MECE: separar alternativas en categorías que no se pisen (ej. "capa de perfilamiento/capacidad de compra" vs. "capa conversacional/canal" vs. "capa de match proyecto↔persona y priorización") para no repetir ideas ni dejar huecos.
- [ ] Cada persona bosqueja su propia solución en silencio (Sketch, 10-15 min) antes de discutir en grupo — evita que la primera idea que se dice en voz alta contamine a las demás.
- [ ] Converger (Decide): votar/filtrar contra 3 criterios — (a) ¿se demuestra en 2 min?, (b) ¿usa datos que sí vamos a tener?, (c) ¿es viable de implementar en Colsubsidio de verdad?
- [ ] Quedarse con **una** arquitectura: qué entra (lead + fuente), cómo se detecta afiliado, qué modelo/LLM perfila y matchea, qué sale (lead priorizado + proyecto recomendado), cómo se explica el "por qué".
- [ ] Repartir roles/carriles: 1 líder de producto (specs + pitch), 1-2 en diseño/UX del demo, 2 en desarrollo (perfilamiento/datos + capa conversacional/match).

### Bloque 3 (noche) — Prototipar bajo fidelidad + Spec
- [ ] Mockup del "momento demo": la pantalla o mensaje exacto que el jurado va a ver. Esto ancla todo lo que se construye después.
- [ ] Redactar `spec.md` (7 bloques): qué hace / qué NO hace / usuario y su momento de mayor tensión / flujo en 5 pasos / 3 criterios de aceptación verificables / datos y consentimiento / supuestos a validar.

**Entregables del día:** `01-problema.md` cerrado + `02-spec-mvp.md` (spec de 7 bloques + arquitectura + mockup del demo).

---

## Día 2 — Viernes: Construcción del núcleo
**TRL objetivo: 3 → 5** (prueba de concepto → validado en entorno simulado)
**El 20% de hoy:** flujo **end-to-end** funcionando con datos reales (o simulados), aunque sea feo.

- [ ] Backend/perfilamiento: motor mínimo que detecta afiliado/no afiliado e infiere capacidad de compra sobre la data disponible (Excel de compradores + buyer personas).
- [ ] Capa conversacional + match: modelo que pregunta solo lo que falta (sin interrogar), prioriza el lead y recomienda proyecto(s) con el "por qué" en lenguaje natural.
- [ ] Frontend mínimo: solo la pantalla/flujo que se muestra en el demo (el perfilador conversacional, canal WhatsApp), nada más.
- [ ] Primer test end-to-end con al menos 1 caso funcionando de punta a punta.
- [ ] Aprovechar talleres/mentorías presenciales para validar el enfoque con un mentor.
- [ ] Commits frecuentes (los modelos pueden borrar cosas por accidente).

**Entregable:** demo interno corriendo (no necesita estar desplegado todavía).

---

## Día 3 — Sábado: Robustecer + Pitch
**TRL objetivo: 5 → 6** (validado en simulación → prototipo demostrable)
**El 20% de hoy:** el guion del pitch de 2 min escrito y cronometrado, aunque el producto siga cambiando.

- [ ] Congelar features que no se vean en el pitch/demo. Terminar solo lo visible.
- [ ] Escribir y cronometrar el guion del pitch (problema → solución → demo → impacto), máx. 5 diapositivas.
- [ ] Mentoría de pitch/fundraising si hay disponible — feedback externo real.
- [ ] Decidir formato del video hoy, no domingo: ¿grabado en vivo, voz IA (ElevenLabs), o avatar (Synthesia)?
- [ ] Desplegar el demo en un link público — el jurado tiene que poder darle clic solo, sin ayuda del equipo.

**Entregable:** guion final del pitch + demo desplegado y accesible por link.

---

## Día 4 — Domingo (hasta 11:30 a.m.): Producción final + entrega
**TRL objetivo: 6 → 7** (prototipo demostrable → demostrado en el entorno real del hackathon)
**El 20% de hoy:** los 3 entregables subidos con margen, no a las 11:29.

- [ ] Grabar/producir el video de pitch + demo (2 min).
- [ ] Repo de GitHub público con README que enlace todo (si hay varios repos).
- [ ] Últimas pruebas del link de demo (que no se caiga en vivo, que un extraño lo pueda recorrer solo).
- [ ] Subir los 3 entregables con margen real, no al límite.
- [ ] Descansar y estar pendiente de WhatsApp por si avisan finalistas (~30 min antes del pitch final).

**Entregable:** los 3 componentes entregados antes de las 11:30 a.m.

---

## Checklist final de entregables del hackathon
- [ ] Link a demo funcional (recorrible sin el equipo)
- [ ] Video pitch + demo (2 min, máx. 5 diapositivas: problema → solución → demo → impacto)
- [ ] Repositorio de GitHub público (creado después del inicio del evento)

## Fuentes
- Charla día 1 "Cómo construir tu MVP con IA" y "Patrones de diseño con IA" — `plan-research/sources/charlas-dia1-metodo-y-patrones-ia.md`.
- Análisis propio de la sesión de retos en vivo — `plan-research/sources/lives/analisis-retos.md`.
- Design Sprint de Google Ventures (Map-Sketch-Decide-Prototype-Test), [design.google/library/design-sprints](https://design.google/library/design-sprints).
- Escala TRL (NASA, 1-9) adaptada como medida de madurez del prototipo día a día.
- Buenas prácticas generales de hackathons: MVP funcionando > feature incompleta, rapid prototyping. [dev.to — How to Win Any Hackathon](https://dev.to/chintanonweb/how-to-win-any-hackathon-a-step-by-step-guide-to-success-2gol).
