# Roles de cierre — recta final (grilling 2026-07-24)

> A ~48h del deadline (dom 26 jul, 11:30 a.m.), el reparto de construcción A/B/C/D ya cumplió: casi todo existe. Lo que falta es **transversal** (conectar la cadena, integración, video, QA). El equipo se recasta a **4 roles de cierre**; cada quien conserva la propiedad del código que ya escribió. Este doc reemplaza a [`reparto-inicial.md`](../reparto-inicial.md) para las últimas 48h.
>
> **Cómo usarlo:** toma tu rol y **pega su bloque de prompt en una sesión fresca** de tu herramienta de IA sobre este repo. Cada prompt es autocontenido. El detalle de las decisiones que fijaron esto está en [`handoff.md`](handoff.md) (Memory 2026-07-24 10:52) y [`URGENTE-Y-NOTICIAS.md`](../URGENTE-Y-NOTICIAS.md).

## Mapeo rápido

| Rol | Natural (track) | Foco | Tickets |
|---|---|---|---|
| **1 — Integrador** | ex-A | La cadena conectada en código real, cero fixtures en prod | 002, 005, 006, 007, 008, 009, 014 |
| **2 — Datos & Motor** | ex-B | Datos por proyecto, subsidios, trigger híbrido, impacto | 001, 003, 004, 011, 012, 013, 016, 017, 019 |
| **3 — Calidad IA & Demo** | ex-C | Catálogo real, similitud, QA sin narración, fallbacks | 010, 018 |
| **4 — Pitch & Video** | ex-D | Guion + video, implementabilidad, mentores, leaks | 015, 020, 021, 022 |

**Definition of done del MVP:** cadena completa conectada en código real, cero fixtures en producción, los 4 criterios de aceptación del [spec §5](../spec.md) verificables en la URL pública, y el video subido antes del deadline.

---

## Rol 1 — Integrador (ex-Track A)

```
Soy el Integrador de la recta final. Mi meta: la cadena completa conectada en código real, cero fixtures en producción. Lee docs/agents/handoff.md y los tickets 002, 005, 006, 007, 008, 009 y 014 en docs/tasks/. Mi misión, en orden:
0. Ticket 002 (primero, desbloquea el 006): los dos cambios ratificados a lib/types.ts — Score.precio_maximo y /api/match recibiendo { lead, score }. Avisar al grupo al mergear (es el único archivo que rompe a los demás).
1. Ticket 006 (HOY): orquestador /api/curar — al terminar la conversación, el Lead fluye chat → /api/score → /api/match → /api/explicacion → POST /api/leads. Hoy el chat solo hace console.log.
2. Ticket 007: app/page.tsx debe leer ?lead_id=X&reenganche=1 (el motivo viene en trigger_nutricion vía GET /api/leads/<id> y en la última fila rol='sistema' de la conversación). Cierra el criterio de aceptación 3.
3. Ticket 005: ofrecer franjas en el chat (GET /api/citas?proyecto_id=..&limite=3, POST /api/citas).
4. Cargar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_KEY en Vercel → Settings → Environment Variables y redesplegar; verificar que curl https://mvp-reto-vivienda.vercel.app/api/leads diga origen: supabase.
5. Smoke test real de Gemini con los 3 personajes (hasta ahora solo se probó el fallback). OJO: la IA está caída en producción (500), ver el bullet 2026-07-24 10:55 del handoff — coordinar con Nico.
6. Ticket 008: shell de navegación del demo (el jurado pasa de landing → chat → /asesor sin URLs a mano).
7. Sábado a.m.: LIDERAR el ticket 014 — integración total: reemplazar toda fixture por llamadas reales y recorrer los 3 personajes de punta a punta en la URL pública, con los 4 presentes.
Reglas: main siempre desplegable; streaming obligatorio; correr npm test y npx tsc --noEmit antes de cada merge; actualizar el handoff al cerrar.
```

## Rol 2 — Datos & Motor (ex-Track B)

```
Soy Datos & Motor de la recta final. Lee docs/agents/handoff.md, scripts/README.md y los tickets 001, 003, 004, 011, 012, 013, 016, 017 y 019. Decisiones ya cerradas en el grilling del 24-jul (no re-litigar): subsidios = tabla simple fundamentada; trigger de nutrición = híbrido; similitud = distribución por proyecto; griegos = clusters anónimos con etiqueta [inferido]. Mi misión:
1. Ticket 016: extender scripts/generar_sintetica.py para emitir distribuciones POR PROYECTO desde el Excel limpio (hoy distribuciones.json es global y la similitud no se puede calcular). Ya existe data/buyer-personas-vivienda.md (transcripción del PPT que hizo un compañero): úsala como fuente de las variables que el Excel no trae, PERO genera un buyer_personas.json derivado SIN los nombres de empresas reales (ver ticket 022 — esos nombres no van al repo público).
2. Ticket 017: tabla de 2-3 subsidios reales de Colsubsidio (montos por rango de ingreso, fuente citada, cero inventos) y que el motor reste el subsidio de la cuota antes del corte del 40%.
3. Trigger híbrido en lib/scoring/: si la regla fallida es temporal y el dato existe (antigüedad de afiliación → fecha exacta), el trigger lleva fecha; si no, condición pura. El personaje de nutrición del demo debe ser el caso CON fecha.
4. Ticket 003: el enriquecimiento REAL cédula → PerfilConocido contra data/sintetica/identidades.json. Escribir el test del criterio 1 (ticket 011) junto con la pieza.
5. Ticket 004: la regla del 40% como función compartida (una sola implementación que consumen scoring y matcher).
6. Con el Integrador: personajes canónicos con proyecto_interes del catálogo real de 18 (ticket 001).
7. Ticket 013: test del criterio 3 (todo lead de nutrición sale con regla fallida + trigger no vacíos).
8. Ticket 019: franja de impacto — 3 cifras (% leads curados, horas comerciales ahorradas, alerta 90/10 por proyecto), timebox medio día, si se pasa se corta.
Reglas: scoring TS puro sin LLM; Python solo offline; correr npm test (el test del criterio 2 tiene dientes y compara contra ETIQUETA_FACTOR).
```

## Rol 3 — Calidad IA & Demo (ex-Track C)

```
Soy Calidad IA & Demo de la recta final. Lee docs/agents/handoff.md, docs/explicaciones-referencia.md y los tickets 010 y 018. Mi misión:
1. Reemplazar lib/matching/fixtures.ts por data/sintetica/proyectos.json real (B ya lo publicó en la forma de lib/matching/tipos.ts::FichaProyecto).
2. Ticket 018: cuando B publique las distribuciones por proyecto (016), meter la similitud-distribución en el prompt del experto y en la explicación ("el 72% de compradores de este proyecto está en tu rango de ingreso"). La explicación sigue citando los 6 factores y el Decreto 583 textual.
3. Evaluar el output real de /api/explicacion contra las 3 explicaciones de referencia con su checklist de 6 criterios (necesita GEMINI_API_KEY en .env.local). OJO: la IA está caída en producción (500) — ver handoff 2026-07-24 10:55.
4. Ticket 010: verificar el fallback del conversador y del experto si la IA falla — el demo nunca depende de la red.
5. Cuando el Integrador mergee el ticket 002: eliminar la fixture provisional de precio_maximo y consumir Score.precio_maximo real.
6. QA "recorrible sin narración": los 3 personajes de punta a punta en la URL pública, dark mode (globals.css pone el body negro), móvil, y que ninguna pantalla necesite explicación humana. Presente en la integración del sábado (ticket 014).
Reglas: la IA solo redacta sobre hechos calculados, nunca inventa montos; streaming con primer token < 2s.
```

## Rol 4 — Pitch & Video (ex-Track D)

```
Soy Pitch & Video de la recta final. Lee docs/agents/handoff.md y los tickets 015, 020, 021 y 022. Mi misión, en orden:
1. PRIMERO (seguridad): ticket 021 — poner el repo plan-research en privado (tiene la data real de Colsubsidio pública, commit 8bc42eb3). Y ticket 022 — sacar/depurar data/buyer-personas-vivienda.md de ESTE repo público (tiene 22 tablas de "Top empresas" con nombres reales de Colsubsidio). Si no tengo permisos, escalar YA.
2. Preguntas a mentores HOY por el canal del reto: ¿un lead form de pauta puede pedir cédula?, ¿qué sabe Colsubsidio de un lead de pauta?, ¿convergencia multi-canal a WhatsApp es válida?, ¿cruces Ministerio/buró demostrados o inferidos?, ¿formato real de premios?
3. Ticket 015: guion del video HOY (esqueleto: problema → 27,1% no afiliados y 16/16 proyectos incumplen el 90/10 → flujo del lead → clímax vista asesor → nutrición 15 seg → 30 seg de implementabilidad). Dato nuevo para el guion: la página orgánica real de Colsubsidio (colsubsidio.com/vivienda) no tiene ni formulario ni proyectos — el perfilador ES el funnel que no existe.
4. Ticket 020: tramo de implementabilidad — diagrama simple (esto corre hoy en Vercel; producción = WhatsApp Business API + Salesforce + cruce real de afiliados; los puntos de integración ya están aislados).
5. Grabar sábado p.m. después de la integración (ticket 014): screen recording del producto real en https://mvp-reto-vivienda.vercel.app recorriendo los 3 personajes, voz en off, ≤2 min.
```

---

## Secuencia crítica

1. **Hoy (vie):** repo privado + md saneado (021, 022) · orquestador 006 · env vars Vercel · **IA caída en prod (Nico)** · preguntas a mentores · guion del video · data v2 de B (016, 017).
2. **Sábado a.m.:** integración real (014), recorrido de los 3 personajes en la URL pública.
3. **Sábado p.m.:** freeze de features (regla de `AGENTS.md`) · grabar video · franja de impacto (019) si el timebox aguantó.
4. **Domingo a.m.:** solo QA y entrega. Nada nuevo.
