# 0004 — El design system de Colsubsidio reemplaza a "El formato sellado"

**Estado:** Aceptada · **Fecha:** 2026-07-24

## Contexto

El repo llegó a tener **dos sistemas de diseño para el mismo producto**, y no coincidían.

1. **"El formato sellado"** — un mundo propio, construido en el repo a partir de la cartilla de identidad cromática. Su tesis: la ficha de un lead es un formato oficial de Colsubsidio, reglado y sellado. De ahí salían sus reglas duras: cero sombra (la profundidad es reglado y capa tonal), esquinas casi rectas de 3/6px, sin píldoras en la consola del asesor, sin librería de iconos, y los estados pintados con tintes del azul de marca. Vivía en `DESIGN.md` y en `app/globals.css`.

2. **El design system de Colsubsidio**, entregado como kit por Claude Design (`Colsubsidio Design System.zip`). Trae fuentes (Sora + Work Sans + JetBrains Mono), radios 6/10/16 + píldora, sombras `xs/sm/md/lg`, iconos Lucide, **los logos oficiales en seis variantes**, una paleta de estados separada de la de marca, y **un ui_kit por cada superficie del producto**: `lead-chat/` y `advisor-panel/`.

Los dos coincidían en lo que más importa: la paleta corporativa es idéntica (`#0067b1`, `#ffd000`, `#575756`, mismos neutrales) y ambos exigen *cero caja negra*. Chocaban en todo lo demás.

Y había un hecho decisivo: **el equipo ya había empezado a portar el kit.** `app/chat.css` declara en su encabezado que es el puerto de `ui_kits/lead-chat/desktop.html`, `public/marca/` ya tenía los logos oficiales, y `globals.css` ya había cambiado `prefers-color-scheme` por el `data-theme` que el kit usa. La superficie del lead estaba portada; la del asesor seguía en el mundo viejo. El producto tenía una cara en cada sistema.

## Decisión

**El design system de Colsubsidio es el canon. "El formato sellado" se retira.**

Con eso, la consola del asesor se porta al kit `ui_kits/advisor-panel/`: una **consola lista/detalle** con barra lateral de marca, lista de leads y panel de detalle, que reemplaza a las tres páginas anchas independientes.

### Lo que se hereda del kit

| Pieza | Antes | Ahora |
|---|---|---|
| Fuentes | Geist Sans + Geist Mono | Sora (display) + Work Sans (cuerpo) + JetBrains Mono (datos) |
| Radios | 3 / 6px | 6 / 10 / 16 / 999px |
| Profundidad | Cero sombra: reglado de 2px y capa tonal | `shadow-xs/sm` en reposo, `md/lg` flotante |
| Estados | Tintes del azul de marca | Paleta aparte: verde / ámbar / azul-nutrición |
| Dato simulado | No existía | Violeta desaturado, fuera de marca y de estados |
| Iconos | Unicode a mano (`→ ✓ ✗`) y emoji | Lucide |
| Marca | Ausente en la consola | Lockup blanco en la barra lateral |

### Cómo conviven los tokens

`globals.css` queda en **tres capas**, y solo se edita la primera:

1. Los tokens del kit, con sus nombres verbatim (`--brand-azul`, `--surface-card`, `--text-primary`). Es la fuente de verdad, y estar nombrados como en el kit es lo que permite pegar el CSS de un ui_kit sin traducirlo — que es exactamente como entró `chat.css`.
2. Los tokens viejos del repo (`--papel`, `--tinta`, `--campo`) redefinidos como **alias** que apuntan a la capa 1. Existen porque ~20 componentes los usan como clases de Tailwind, y migrarlos de golpe a dos días del cierre no compraba nada.
3. `@theme inline`, que publica ambas capas como utilidades. No inventa valores.

## Consecuencias

### Lo que se gana
- **Una sola identidad.** Las dos caras del producto dejan de venir de sistemas distintos.
- **La marca oficial aparece.** La consola del asesor no mostraba el logo en ninguna parte.
- **El asesor no pierde el contexto de la cola** al abrir una ficha: es el punto del arquetipo lista/detalle.
- **Los tokens del kit son portables:** el siguiente ui_kit que llegue se pega sin traducir.

### Lo que se sacrifica
- **La tesis del formato oficial**, que era la idea más distintiva que tenía el repo. Era mejor argumento de pitch que "un dashboard bien hecho". Se conserva su consecuencia funcional —nada se oculta— pero no su lenguaje visual.
- **Cero sombra**, que era la regla más difícil de sostener y la que más obligaba a resolver la jerarquía con estructura en vez de con efecto.
- **Cambio de fuentes global.** Las fuentes viven en `layout.tsx`, así que el chat y la landing también cambian de tipo, aunque el alcance acordado fuera solo el asesor. Es coherente con el kit, que prescribe las mismas fuentes para ambas superficies, pero no quedó contenido.

### Lo que NO cambia
- `lib/` completo: scoring, matching, tablero, tipos. Esto fue un cambio de presentación.
- El copy en español y los `data-testid`. Los 291 renglones de `FichaLead.test.tsx` + `TablaFactores.test.tsx` pasaron sin editarse, salvo una aserción (ver abajo).
- Las rutas y el contrato de datos.

## Notas de la implementación

**Del kit se tomó el color y la forma; el copy salió del repo.** El kit rotula la salida restringida como "Listo · cupo restringido"; aquí sigue diciendo **"Listo · cupo 90/10"**, porque el 90/10 es la regla concreta que el asesor tiene que validar y así está aserto en los tests.

**Tres tokens de estado del kit se corrigieron por contraste.** Con la tinta que el propio kit especifica, nutrición en claro daba 3,26:1 con blanco encima, y en oscuro verde y ámbar daban 3,49:1 y 3,25:1 — por debajo de AA al tamaño en que se usa la píldora. Se conservó el matiz y se ajustó la luminosidad.

**Un test se modificó, y vale registrar cuál.** `TablaFactores.test.tsx` fijaba el glifo literal `"✗ No"`. El glifo desapareció cuando la tabla se portó al kit, que prohíbe la iconografía unicode hecha a mano. La aserción pasó a contar los marcadores renderizados: es el contrato que el test dice proteger ("los factores que no cumplen se muestran igual, no se esconden") y sobrevive al próximo cambio de piel. Los demás tests siguen intactos.

**El shell no usa librerías de gráficas.** `SerieDiaria` sigue siendo una `<table>` con barras en CSS: meter Recharts obligaría a `"use client"` y la consola del asesor no carga JS de cliente salvo la navegación (que necesita la ruta activa) y el conmutador de tema. El filtro de la bandeja va por querystring con `<form method="get">` por la misma razón.

**Sobre v0.** Se revisaron los 24 templates de la categoría *Dashboards*. Los estructuralmente cercanos —*Pulse — Incident Response Console* y *SalesOps*— son shadcn + Radix + Recharts + client components; importar uno a dos días del cierre habría reescrito una app que hoy renderiza sin JS de cliente. Se tomó de v0 **el arquetipo** (consola lista/detalle), no el código — y ese arquetipo ya venía instanciado en marca dentro del propio kit.

## Alternativas descartadas

- **Conservar "El formato sellado" y tomar del kit solo lo aditivo** (logos, iconos, densidad). Era la opción de menor riesgo y conservaba la tesis más distintiva del repo. Se descartó porque dejaba el chat y el asesor en sistemas visuales distintos de forma permanente.
- **Híbrido tipográfico:** adoptar las fuentes y los logos del kit conservando las cinco reglas nombradas (cero sombra, sin píldoras, radios 3/6). Se descartó por lo mismo: sostiene dos gramáticas a la vez, y las píldoras de estado del kit son justamente el vocabulario que el chat ya estaba usando.
