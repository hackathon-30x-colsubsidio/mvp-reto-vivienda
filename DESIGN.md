---
name: Colsubsidio Vivienda — Curado de leads
description: El design system de Colsubsidio aplicado a las dos caras del perfilador — el chat cálido del lead y el panel denso del asesor — donde toda decisión se muestra con lo que la sostiene.
colors:
  amarillo: "#ffd000"
  amarillo-80: "#ffda33"
  amarillo-60: "#ffe366"
  amarillo-40: "#ffed99"
  amarillo-20: "#fff6cc"
  azul: "#0067b1"
  azul-80: "#3385c1"
  azul-60: "#66a3d1"
  azul-40: "#99c2e0"
  azul-20: "#cce0f0"
  grafito: "#575756"
  grafito-80: "#78787a"
  grafito-60: "#a0a0a1"
  grafito-40: "#c7c7c8"
  grafito-20: "#e4e4e4"
  rojo-bandera: "#ce1126"
  surface-page: "#f8f9fa"
  surface-card: "#ffffff"
  surface-sunken: "#f1f3f5"
  text-primary: "#212529"
  text-secondary: "#575756"
  text-tertiary: "#868e96"
  border-default: "#dee2e6"
  estado-listo: "#21c714"
  estado-cupo: "#ffab1a"
  estado-nutricion: "#2f95e0"
  dato-simulado: "#8a5cb8"
typography:
  display:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
  headline-sm:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.2
  body-lg:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  body-sm:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.08em"
  cifra:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "16px"
    fontWeight: 500
    fontFeature: "tabular-nums"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
shadows:
  xs: "0 1px 2px hsl(220 15% 20% / 0.06)"
  sm: "0 2px 6px hsl(220 15% 20% / 0.08)"
  md: "0 6px 20px hsl(220 15% 20% / 0.10)"
  lg: "0 12px 32px hsl(220 15% 20% / 0.14)"
components:
  boton-primario:
    backgroundColor: "{colors.azul}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  boton-secundario:
    backgroundColor: "transparent"
    textColor: "{colors.azul}"
    borderColor: "{colors.azul}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  boton-accion:
    backgroundColor: "{colors.amarillo}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 18px"
  sello-listo:
    backgroundColor: "{colors.estado-listo}"
    textColor: "#08340a"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  sello-cupo:
    backgroundColor: "{colors.estado-cupo}"
    textColor: "#3d2600"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  sello-nutricion:
    backgroundColor: "{colors.estado-nutricion}"
    textColor: "#07293f"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  etiqueta-simulado:
    backgroundColor: "#f3ecfa"
    textColor: "{colors.dato-simulado}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  tarjeta:
    backgroundColor: "{colors.surface-card}"
    borderColor: "{colors.border-default}"
    rounded: "{rounded.md}"
    shadow: "{shadows.xs}"
  campo-entrada:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-default}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Colsubsidio Vivienda — Curado de leads

## Overview

**Este documento describe el design system de Colsubsidio,** entregado como kit por Claude Design y portado a este repo. Reemplazó al mundo propio que vivía aquí, *"El formato sellado"* — ver el [ADR 0004](docs/adr/0004-design-system-colsubsidio.md) para el porqué y para lo que se sacrificó en el cambio.

El producto tiene dos caras, y se comportan distinto a propósito:

1. **El escenario del lead** — la portada y el chat. Cálido, generoso en aire, píldoras y radios blandos. Es la pantalla más vista del demo. Puerto del kit `ui_kits/lead-chat/`, vive en [`app/chat.css`](app/chat.css).
2. **La consola del asesor** — bandeja, ficha y tablero. Densa, escaneable, hecha para trabajar. Puerto del kit `ui_kits/advisor-panel/`, vive en `app/asesor/` y en los primitivos de [`components/ui/`](components/ui/).

Las dos comparten identidad —la misma paleta, las mismas fuentes, la misma marca— y difieren en densidad y en ritmo, no en vocabulario.

Lo que **no** cambió con el sistema nuevo es la restricción que gobierna todo: *cero caja negra*. Este producto decide cosas serias sobre la vida de alguien —si puede comprar vivienda, con cuál subsidio, bajo cuál norma— así que toda decisión se muestra con lo que la sostiene. El score nunca es un número solo: se descompone factor por factor, con su peso, su valor medido y su frase en lenguaje natural. Si el motor evaluó ocho factores, se ven ocho, incluidos los que no cumplen — que son justo los que el asesor necesita ver.

**Key Characteristics:**
- El score nunca aparece sin la aritmética que lo sostiene.
- El dato duro y su explicación nunca comparten tratamiento tipográfico: mono para lo medido, Work Sans para lo interpretado.
- Los estados usan una paleta separada de la de marca. Un chip amarillo nunca es un estado.
- Máximo dos colores de marca visibles por vista.
- Un solo trazo de resaltador por pantalla, y es la única animación decorativa de la app.
- Nada se oculta: ni un factor, ni una fila, ni el origen de una cifra.

## Colors

Tres colores corporativos con jerarquía ya asignada, una paleta de estados aparte, y un violeta que no pertenece a ninguna de las dos.

### Primary
- **Azul Colsubsidio** (`#0067b1`): el color estructural. Barra lateral, banda de veredicto, botón primario, enlaces, barras de la serie diaria. Sobre él el texto es blanco (5,9:1). Sus tintes 80/60/40/20 son superficies, nunca texto sobre claro.

### Secondary
- **Amarillo Colsubsidio** (`#ffd000`): acento escaso. Botón de acción, trazo del resaltador, filo del ítem activo en la navegación y anillo de foco. Nunca es texto y nunca toca fondo claro sin llevar tinta `#212529` encima (12:1).

### Estados del score
Deliberadamente **fuera** de la paleta de marca, para que un estado nunca se confunda con un acento decorativo:
- **Listo** — verde `#21c714` con tinta `#08340a`.
- **Cupo 90/10** — ámbar `#ffab1a` con tinta `#3d2600`.
- **Nutrición** — azul `#2f95e0` con tinta `#07293f`. Azul, no rojo ni gris muerto: no es un rechazo.

> Los rellenos que trae el kit se corrigieron donde no pasaban AA con la tinta que el propio kit especifica: nutrición en claro daba 3,26:1 con blanco, y en oscuro verde y ámbar daban 3,49:1 y 3,25:1. Se conservó el matiz y se ajustó la luminosidad.

### Metadato
- **Violeta desaturado** (`#8a5cb8` sobre `#f3ecfa`): marca un dato simulado o inferido. Fuera de marca **y** fuera de la paleta de estados, porque "simulado" no es un cuarto estado del lead: es información sobre la confianza del dato.

### Tertiary
- **Rojo Bandera** (`#ce1126`): el tercer color de la bandera, y el único que no viene ni de la cartilla ni del kit. Solo para factores que NO cumplen y errores de red.

### Neutral
Escala `neutral-0` a `neutral-950`, expuesta por rol: `surface-page` (el fondo de trabajo) → `surface-card` (la tarjeta) → `surface-sunken` (cabeceras y zonas de apoyo); `text-primary` / `text-secondary` / `text-tertiary`; `border-default` y `border-strong`.

### Modo oscuro
No es una inversión mecánica. El azul de marca **sube** a `#3385c1` para sobrevivir sobre fondo oscuro; las superficies van de `#14171a` a `#23282c`; el amarillo se usa aún más escaso. El tema lo manda `data-theme` en `<html>`, que un script pre-paint fija antes del primer pintado — sin él la página arranca en claro y salta al oscuro al hidratar, que es un flash de tema justo en el arranque del demo.

### Named Rules

**La Regla del Rol Único.** Un color que cambia de valor entre temas sirve a **un solo rol**. `azul-profundo` se aclara en oscuro para poder ser texto, así que ahí deja de servir como relleno: el hover del campo tiene su propio `campo-hover`. Reusar el token del otro rol da 1,6:1 — y el modo claro no lo delata.

**La Regla del Único Trazo.** Hay exactamente un `.resaltado` por pantalla, y va sobre la frase que decide esa pantalla. Dos trazos significan que no se decidió cuál era el hecho. Hoy: uno en la bandeja, uno en el tablero, uno en la ficha.

**La Regla del Rojo Escaso.** El rojo bandera aparece únicamente donde algo no cumplió o algo falló. Nunca decora, nunca titula, nunca marca "nutrición".

**La Regla de los Dos Colores.** Máximo dos colores de marca visibles en una misma vista. Si el azul ya estructura la pantalla y el amarillo ya marcó el hecho que decide, no entra un tercero.

## Typography

**Display:** Sora (700–800) — títulos, nombres de lead, cifras grandes. Geométrica y redondeada, hace eco al peso del isotipo.
**Body / UI:** Work Sans (400–600) — todo lo que se lee de corrido y toda la interfaz. Muy legible en tablas densas.
**Datos:** JetBrains Mono (400–500, `tabular-nums`) — cifras, IDs de lead, montos, pesos.

Las tres las carga `next/font` en [`app/layout.tsx`](app/layout.tsx), que las auto-hospeda. El `@import` a `fonts.googleapis.com` que trae `tokens/typography.css` del kit **no se usa**: sería una petición a un CDN externo en el primer pintado del demo.

### Hierarchy
- **Display** (Sora 800, 38px, `-0.02em`): titular de pantalla y el puntaje del resumen. Una vez por pantalla.
- **Headline** (Sora 800, 30px): nombre del lead en su ficha.
- **Title** (Sora 700, 16–20px): títulos de sección y cabecera de tarjeta.
- **Body** (Work Sans 400, 15px, 1.45): lectura de corrido. Medida máxima 68ch. `17px` para el párrafo de entrada de una pantalla.
- **Body-sm** (Work Sans 400, 13px): explicaciones, metadatos de fila, fuente de una cifra.
- **Label** (Work Sans 600, 12px, `0.08em`, mayúsculas): la clase `.rotulo`. Rótulo de campo de datos.
- **Cifra** (JetBrains Mono 500, `tabular-nums`): la clase `.cifra`. Cualquier número que el sistema midió.

### Named Rules

**La Regla del Rótulo.** Las versalitas espaciadas (`.rotulo`) rotulan campos de datos y nada más. No son un antetítulo decorativo sobre cada sección.

**La Regla del Dato y su Explicación.** El valor medido va en mono y color primario; la frase que lo explica va en Work Sans y color secundario. Nunca comparten tratamiento. Es lo que deja al asesor distinguir de un vistazo lo que el motor midió de lo que el motor interpretó.

## Layout

**La consola del asesor es una consola lista/detalle.** Barra lateral azul de 220px con el lockup y la navegación → lista de leads de 380px → panel de detalle. En escritorio el shell no hace scroll: cada panel se desplaza por dentro, así la bandeja y la ficha se mueven independientes. En móvil la lateral colapsa a barra superior, la lista se oculta en la ruta de detalle y el documento vuelve a hacer scroll normal.

Escala de espaciado de 4px (`4/8/12/16/20/24/32/40/48/64`) — la misma que Tailwind trae por defecto. La consola usa los pasos pequeños; el escenario del lead usa 16–24 entre burbujas. El `body` nunca hace scroll lateral: lo que desborda (tablas) scrollea en su propio contenedor.

## Elevation & Depth

`shadow-xs` en tarjetas en reposo, `shadow-sm` en hover si la tarjeta es un destino clickeable, `shadow-md`/`lg` solo en elementos flotantes. Nunca sombras de color — nada de "glow" azul o amarillo. La profundidad se apoya además en tres capas tonales (`surface-page` → `surface-card` → `surface-sunken`) y en bordes de 1px.

### Vidrio suave (adición del 2026-07-25)

La consola del asesor lleva encima una capa de **vidrio**, pedida explícitamente para que el sistema se leyera menos rígido. **Es una desviación consciente del kit**, que dice *"blur no es un motivo de esta marca, se prioriza legibilidad sobre efecto"*. La desviación se acota así:

- **El efecto se construye con capas, no con blur:** gradiente diagonal (`--vidrio`), un **filo claro en el borde superior** (`--filo`, va como `inset` box-shadow) y una sombra difusa y baja (`--sombra-vidrio`). Eso da la lectura de vidrio sin tocar el contraste del texto.
- **`backdrop-filter` existe en un solo sitio: el cromo.** La clase `.vidrio-cromo` lo lleva y se usa en barras y cabeceras — sitios donde detrás no hay datos que leer. **Nunca detrás de una cifra, de una fila de factores ni de una tarjeta de métrica.**
- **`.halo` es el fondo de página:** dos manchas radiales muy diluidas, azul y amarilla, fijas. Existen porque el vidrio necesita algo que refractar; sobre gris plano el efecto se ve solo gris. No se animan.

**La Regla del Vidrio Sin Datos Detrás.** Si hay que leer un número a través de una superficie, esa superficie no lleva blur. El vidrio es para el mueble; los datos van sobre superficie sólida.

## Densidad y scroll

**La vista de Métricas cabe en una pantalla y no se desplaza.** El shell es de altura fija en escritorio (`h-screen` + `overflow-hidden`) y cada panel decide si se recorre por dentro. Un tablero que hay que scrollear deja de responder de un vistazo, que es justo lo que un tablero tiene que hacer.

Eso **no** se logra escondiendo datos. Se logra partiendo las métricas en **cortes** —Resumen · Entrada diaria · Reparto— que se eligen con un selector, igual que el "diario / mensual" de una gráfica: son vistas del mismo dato, no secciones distintas. Cada corte llena el alto disponible; donde una lista es más larga que la pantalla, **se desplaza el panel, nunca la página**, y el conteo real siempre está a la vista.

Referencia de diseño: **1440×900** (el caso de demo en vivo y de grabación); en 1920×1080 simplemente respira más.

> La ficha del lead **sí** se desplaza, y es deliberado: sus factores no se recortan por razones visuales. Ahí manda "nada se oculta".

## Shapes

`6px` en botones, entradas, badges y celdas. `10px` en tarjetas. `16px` en contenedores grandes. `999px` (píldora) en los sellos de estado y las burbujas del chat. Bordes de 1px `border-default`, nunca gruesos ni de color en reposo.

## Motion

Mínima y utilitaria: 120–200ms, `cubic-bezier(.2,.7,.3,1)`. Los mensajes del chat entran con fade + slide-up de 8px. Nada rebota, nada gira. La única animación decorativa de toda la app es el trazo del resaltador (620ms), y respeta `prefers-reduced-motion`.

## Components

### Botones ([`components/ui/Boton.tsx`](components/ui/Boton.tsx))
Esquina de 6px, peso 600. **Primario:** azul de marca con texto blanco. **Secundario:** transparente con borde y texto azul. **Fantasma:** sin fondo ni borde. **Amarillo:** reservado para la única acción que interrumpe un estado — hoy, "Simular trigger". Disabled a 50% con `cursor: not-allowed`. Se exporta también `clasesBoton()` porque la mitad de los "botones" de esta app son enlaces, y forzarlos a un `<button>` los volvería cliente sin necesidad.

### Sellos de estado ([`components/ui/Pildora.tsx`](components/ui/Pildora.tsx))
Píldora de `2px 10px`, 12px, peso 600, en la paleta de estados. El texto sale de `ETIQUETA_ESTADO` en `lib/types-asesor.ts`, **no** del kit: el kit dice "Listo · cupo restringido" y aquí decimos "Listo · cupo 90/10", que es la regla concreta que el asesor tiene que validar. **Re-enganchado** va sin relleno, solo contorno: se lee como un sello añadido después.

### Etiqueta de dato simulado ([`components/ui/EtiquetaSimulado.tsx`](components/ui/EtiquetaSimulado.tsx))
Píldora violeta con una tilde en mono. Marca los 57 leads sintéticos del tablero y los campos inferidos de la ficha.

### Tarjetas ([`components/ui/Tarjeta.tsx`](components/ui/Tarjeta.tsx))
`surface-card`, borde de 1px, radio 10px, `shadow-xs`. `TarjetaConTitulo` agrega cabecera con título en Sora y descripción opcional.

### Inputs ([`CampoBusqueda`](components/ui/CampoBusqueda.tsx), [`SelectorEstado`](components/ui/SelectorEstado.tsx))
Superficie de tarjeta, borde de 1px, radio 6px, `10px 12px`. **Van sin `useState`:** viven dentro de un `<form method="get">` y su valor viaja por la querystring, para que la consola del asesor siga sin cargar JS de cliente.

### Navegación
Barra lateral azul con el lockup blanco arriba y **dos entradas: Métricas y Leads**. Nombran el contenido, no el mueble — antes decían "Tablero" y "Bandeja", y el jurado recorre esto sin narración. El ítem activo se marca con `bg-white/18` y un filo interior claro arriba, no con un borde de color.

Solo lleva a rutas que existen. El kit trae también *Proyectos* y *Citas* — no están, porque un ítem que no lleva a ningún lado en un demo autogestionado es peor que no tenerlo.

### Selector de cortes
Dentro de Métricas, un control segmentado elige el corte (Resumen · Entrada diaria · Reparto). Va por querystring y con enlaces reales, no con estado de cliente: cada corte es una URL que se puede dejar abierta o compartir, y la consola sigue sin cargar JS. El segmento activo se eleva sobre superficie sólida; los inactivos son solo texto.

### La lista de factores (componente firma)
El corazón del "cero caja negra". Una entrada por factor evaluado, sin filtrar y sin cortar. Cada una trae el nombre, el chip de peso en mono, el valor medido en mono, si cumple, y de dónde salió el dato. El "cumple" es **texto** ("Cumple" / "No cumple") acompañado de un icono, nunca solo un color ni solo un icono: el color no puede ser el único portador del significado.

### Iconos
**Lucide** (`lucide-react`), trazo 2px. Renderiza SVG plano y funciona en Server Components, así que no obliga a `"use client"` ni al `<script>` de CDN que usa el ui_kit. **No se usa emoji en la consola ni en el chat,** y no hay iconografía unicode hecha a mano (`→ ✓ ✗`) — es lo que reemplazó Lucide.

### El escenario (la superficie del lead)
Puerto del kit `ui_kits/lead-chat/desktop.html` en [`app/chat.css`](app/chat.css). Escenario azul a pantalla completa con degradado radial y el isotipo de marca de agua al 6%; una ventana de 1120×720 montada encima, con riel izquierdo que dice de qué va la conversación antes de que empiece. Píldoras y radios blandos: es lo contrario de la densidad de la consola, y está bien — son dos caras del mismo producto. Cada token `--chat-*` apunta a la paleta corporativa; cambiar un color se hace ahí, nunca en el componente.

## Voz y contenido

- **Idioma:** español colombiano, institucional pero cercano — una caja de compensación con misión social, no un banco.
- **Tratamiento:** "tú" en el chat del lead; tercera persona en la consola del asesor, que es una herramienta de trabajo.
- **Cifras en pesos:** `$ 450.000.000`. Punto como separador de miles, nunca decimales en COP.
- **Ningún estado es un rechazo.** "En nutrición" jamás se redacta como negativo: no es "no calificas todavía" sino "esto es lo que falta".
- **Sin emoji,** en ninguna de las dos superficies.
- **El chat siempre declara que es un asistente,** nunca se hace pasar por un asesor humano.

## Do's and Don'ts

### Do:
- **Do** mostrar el score siempre con su desglose al lado.
- **Do** poner toda cifra medida en `.cifra` (JetBrains Mono, tabular).
- **Do** usar el amarillo como fondo con tinta oscura encima, siempre.
- **Do** acompañar todo color de estado con su palabra: el sello dice "Nutrición", no solo se pinta.
- **Do** imprimir de dónde sale cada cifra del tablero, como texto y no como tooltip.
- **Do** marcar los datos simulados o inferidos con `EtiquetaSimulado`.
- **Do** dejar el escenario del lead con su propia densidad: más aire, más radio, campo azul a pantalla completa.
- **Do** poner el scroll dentro del panel que lo necesita, no en la página, cuando la vista tiene que caber de un vistazo.

### Don't:
- **Don't** usar amarillo como color de texto sobre fondo claro: `#ffd000` sobre blanco es 1,5:1.
- **Don't** usar un color de marca para un estado del score, ni un color de estado para decorar.
- **Don't** pintar "nutrición" de rojo, gris muerto o ámbar de advertencia.
- **Don't** poner más de un `.resaltado` por pantalla.
- **Don't** mostrar más de dos colores de marca en una misma vista.
- **Don't** usar emoji ni iconografía unicode hecha a mano: los iconos son Lucide.
- **Don't** ocultar, filtrar ni truncar factores de un lead por razones visuales.
- **Don't** meter estado de cliente (`useState`) en la consola del asesor para cosas que un `<form method="get">` resuelve.
- **Don't** poner `backdrop-filter` detrás de una cifra, un factor o una tarjeta de datos. El blur es solo para el cromo.
- **Don't** hacer que la vista de Métricas scrollee. Si no cabe, es un corte nuevo en el selector, no una página más larga.
