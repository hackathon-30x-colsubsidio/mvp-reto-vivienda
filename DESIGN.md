---
name: Colsubsidio Vivienda — Curado de leads
description: Un formato oficial reglado y sellado, en el azul y el amarillo de Colsubsidio, donde toda decisión se muestra con lo que la sostiene.
colors:
  amarillo: "#ffd000"
  amarillo-80: "#ffd933"
  amarillo-60: "#ffe366"
  amarillo-40: "#ffec99"
  azul: "#0067b1"
  azul-80: "#3385c1"
  azul-60: "#66a4d0"
  azul-40: "#99c2e0"
  azul-profundo: "#00457a"
  grafito: "#575756"
  grafito-60: "#9a9a9a"
  grafito-40: "#bcbcbb"
  grafito-20: "#dddddd"
  rojo-bandera: "#ce1126"
  fondo: "#f8f9fa"
  papel: "#ffffff"
  papel-hueco: "#f1f3f5"
  tinta: "#212529"
  borde: "#dee2e6"
  verde-whatsapp: "#075e54"
typography:
  display:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.08em"
  cifra:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 500
    fontFeature: "tabular-nums"
rounded:
  sm: "3px"
  md: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  boton-primario:
    backgroundColor: "{colors.azul}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  boton-primario-hover:
    backgroundColor: "{colors.azul-profundo}"
  boton-secundario:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.azul}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  boton-accion:
    backgroundColor: "{colors.amarillo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  sello-listo:
    backgroundColor: "{colors.azul}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  sello-cupo:
    backgroundColor: "{colors.amarillo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  sello-nutricion:
    backgroundColor: "{colors.azul-40}"
    textColor: "#00457a"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  campo-entrada:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Colsubsidio Vivienda — Curado de leads

## Overview

**Creative North Star: "El formato sellado"**

Este producto decide cosas serias sobre la vida de alguien: si puede comprar vivienda, con cuál subsidio, bajo cuál norma. Su restricción fundacional es *cero caja negra*. El mundo visual que sostiene eso no es un dashboard: es un **formato oficial** — el papel reglado de una caja de compensación, con su folio, sus campos, su renglón de dictamen y su sello. Un formato no esconde nada; enseña todos los renglones, incluidos los que no cumplen, y cita la norma al pie.

Del formato viene todo lo demás. Las reglas son reglas de verdad (2px de grafito), no hairlines decorativas. Las esquinas son casi rectas (3px), porque el papel timbrado no tiene esquinas redondeadas. Las cifras van en monoespaciada con numerales tabulares, porque son valores leídos de un campo, no adornos. El azul Colsubsidio no salpica como acento: **tiñe regiones enteras** — el riel superior, la banda de veredicto, el sello del lead listo. El amarillo hace exactamente dos cosas: es el fondo del sello que pide atención, y es el **trazo de resaltador** sobre el único hecho que decide la pantalla.

El sistema rechaza tres cosas explícitamente: el score reducido a un número grande con una barra de progreso; la tarjeta con sombra suave repetida como estructura de página; y cualquier tratamiento que haga que "nutrición" se lea como un rechazo. Nutrición es un tinte del mismo azul, no un gris muerto ni un rojo.

**Key Characteristics:**
- Reglado antes que sombreado: la profundidad es capa tonal y línea, nunca `box-shadow`.
- El color tiñe regiones, no bordes.
- Toda cifra es monoespaciada y tabular.
- Un solo trazo de resaltador por pantalla, y es el único movimiento.
- Nada se oculta: si el motor evaluó ocho factores, se ven ocho.

## Colors

Tres colores corporativos que ya venían con jerarquía asignada, más un rojo que solo aparece cuando algo falla.

### Primary
- **Azul Colsubsidio** (`#0067b1`): el color de campo. Riel superior, banda de veredicto, sello del lead listo, botón primario, enlaces. Sobre él el texto es blanco (5,9:1). Sus tintes 80/60/40 son superficies y estados, nunca texto sobre claro.
- **Azul Profundo** (`#00457a`): titulares dentro de un campo azul claro, hover del botón primario, tinta del sello de nutrición.

### Secondary
- **Amarillo Colsubsidio** (`#ffd000`): fondo del sello "restricción de cupo", trazo del resaltador, y anillo de foco. Nunca es texto y nunca toca un fondo claro sin llevar tinta `#212529` encima (12:1).

### Tertiary
- **Rojo Bandera** (`#ce1126`): el tercer color de la bandera, y el único que no viene de la guía. Solo para factores que NO cumplen y errores de red.

### Neutral
- **Grafito** (`#575756`): texto secundario (7,2:1 sobre papel) y el reglado grueso de 2px. Sus tintes 60/40/20 son separadores y bordes finos.
- **Fondo** (`#f8f9fa`) / **Papel** (`#ffffff`) / **Papel hueco** (`#f1f3f5`): escritorio, hoja y cabecera de tabla.
- **Tinta** (`#212529`): todo el texto de lectura.
- **Borde** (`#dee2e6`): reglado fino entre renglones.

### Modo oscuro
El mismo formato bajo luz de oficina de noche: fondo `#101418`, papel `#191e24`, tinta `#e8eaed`. El azul **como texto** sube al tinte 60% (`#66a4d0`, 6,2:1); el azul **como campo** se queda en `#0067b1` para no perder la marca. El amarillo y su tinta no se mueven en ningún tema.

**La Regla del Rol Único.** Un color que cambia de valor entre temas sirve a **un solo rol**. `azul-profundo` se aclara en oscuro para poder ser texto, así que ahí deja de servir como relleno: el hover del campo tiene su propio `campo-hover` y el sello de nutrición lleva tinta fija `#00457a`. Reusar el token del otro rol da 1,6:1 — el modo claro no lo delata.

### Named Rules
**La Regla del Único Trazo.** Hay exactamente un `.resaltado` por pantalla, y va sobre la frase que decide esa pantalla. Dos trazos significan que no se decidió cuál era el hecho.

**La Regla del Rojo Escaso.** El rojo bandera aparece únicamente donde algo no cumplió o algo falló. Nunca decora, nunca titula, nunca marca "nutrición".

**La Regla del Campo.** El azul se aplica a regiones completas (riel, banda, sello, botón). Un `border-left` azul de 4px sobre una tarjeta blanca es esta regla mal entendida.

## Typography

**Display / Body Font:** Geist Sans (con `system-ui`, `sans-serif`)
**Cifra Font:** Geist Mono (con `ui-monospace`, `monospace`)

**Character:** una grotesca de trabajo, sin opinión decorativa, emparejada con su monoespaciada hermana. Es deliberado: en una superficie de *operar*, la personalidad no vive en la letra sino en el reglado, el campo de color y el sello. La monoespaciada no es disfraz de "técnico" — solo toca dígitos medidos.

### Hierarchy
- **Display** (700, `clamp(2rem, 5vw, 3rem)`, 1.05, `-0.03em`): el nombre del lead en su ficha y el titular de la cola. Una vez por pantalla.
- **Headline** (700, 1.25rem, 1.25): títulos de sección dentro del formato.
- **Title** (700, 1.125rem, 1.3): nombre del lead en una fila de la cola, nombre de proyecto.
- **Body** (400, 1rem, 1.6): todo lo que se lee de corrido. Medida máxima 68ch.
- **Label** (700, 0.75rem, `0.08em`, mayúsculas): rótulo de campo de formulario (`dt`, cabecera de tabla). Es gramática nativa del mundo: un formato rotula sus campos.
- **Cifra** (500, mono, `tabular-nums`): cualquier número que el sistema midió.

### Named Rules
**La Regla del Rótulo.** Las versalitas espaciadas rotulan campos de datos y nada más. No son un antetítulo decorativo sobre cada sección.

## Layout

Contenedor de 56rem (`max-w-4xl`) centrado sobre el fondo, con la hoja en papel. Rejilla vertical de 8px: `4 / 8 / 16 / 24 / 40`. Más aire encima de un título que debajo (`mt-10 mb-3` como par típico). La tabla de factores desborda horizontalmente en su propio contenedor con scroll; el `body` nunca hace scroll lateral. En móvil, las columnas de la ficha (`dl`) colapsan a una y la banda de veredicto conserva su relleno completo — es lo primero que se lee en un proyector.

## Elevation & Depth

**Este sistema no usa sombras.** La profundidad se construye con tres capas tonales (`fondo` → `papel` → `papel-hueco`) y con reglado: 1px de `borde` entre renglones, 2px de `regla` alrededor de un bloque que es una unidad. Un bloque no "flota", está impreso.

Única excepción, y es de otro mundo: las burbujas del chat conservan la sombra suave de WhatsApp, porque ahí la autoridad es WhatsApp y no este sistema.

### Named Rules
**La Regla del Papel Impreso.** Si un elemento necesita `box-shadow` para separarse de su fondo, le falta reglado o le falta capa tonal. Se arregla ahí, no con sombra.

## Shapes

Esquinas casi rectas: 3px (`--r-sm`) en sellos, botones, entradas y celdas; 6px (`--r-md`) en bloques grandes. Cero píldoras y cero círculos en la consola y la landing — la píldora pertenece al chat, donde es gramática de WhatsApp. Los bloques que son una unidad de decisión llevan borde de 2px; los renglones de una lista llevan 1px.

## Components

### Botones
- **Shape:** esquina de 3px (`--r-sm`), nunca píldora fuera del chat.
- **Primario:** campo azul con texto blanco, `12px 20px`, peso 700.
- **Hover / Focus:** el fondo baja a azul profundo (`#00457a`); el foco es anillo amarillo de 3px con 2px de separación, igual en todo el sistema.
- **Secundario:** papel con texto azul y borde de 2px en azul; hover tiñe el fondo a `azul-40` al 30%.
- **Acción (raro):** fondo amarillo con tinta. Reservado para la única acción que interrumpe un estado — hoy, "Simular trigger".
- **Disabled:** opacidad 60% y `cursor: not-allowed`; nunca se le quita el color, para que no parezca otro componente.

### Sellos (chips de estado)
- **Style:** rectángulo de 3px, `4px 10px`, peso 700, tamaño 0.875rem. Sin anillo: el fondo teñido ya lo separa.
- **Listo:** campo azul, texto blanco. **Restricción de cupo:** amarillo, tinta. **Nutrición:** `azul-40`, azul profundo.
- **Re-enganchado:** sin relleno, borde de 2px en grafito y texto grafito — se lee como un sello añadido después.

### Cards / Containers
- **Corner Style:** 6px (`--r-md`).
- **Background:** papel; `papel-hueco` cuando el bloque es una zona de apoyo (datos del perfil).
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** 2px de `borde` para bloques-unidad; el bloque de veredicto va en campo azul sin borde.
- **Internal Padding:** 20px (`p-5`).

### Inputs / Fields
- **Style:** papel, borde de 2px en `borde`, esquina de 3px, `10px 12px`. Rótulo en versalitas encima, nunca solo placeholder.
- **Focus:** el borde pasa a azul y entra el anillo amarillo.
- **Error:** borde y mensaje en rojo bandera; el mensaje nombra el problema y la salida.

### Navigation
No hay barra de navegación: el riel azul superior es el encabezado del formato y lleva el folio y el enlace de vuelta. El enlace de vuelta va en blanco sobre el campo azul, subrayado en hover.

### La tabla reglada de factores (componente firma)
El corazón del "cero caja negra". Cabecera en `papel-hueco` con rótulos en versalitas; una fila por factor evaluado, sin filtrar y sin cortar; cada fila trae nombre, de dónde salió el dato, qué se midió y si cumple. El "cumple" es texto (`✓ Sí` en azul profundo / `✗ No` en rojo bandera), nunca solo un ícono de color — el color no puede ser el único portador del significado.

### El chat (mundo prestado)
El chat conserva el verde WhatsApp (`#075e54`), el fondo `#e5ddd5`, las burbujas `#dcf8c6` y las píldoras. Es una decisión de producto: el reconocimiento del canal vale más que la consistencia de marca en esa superficie. Colsubsidio aparece ahí en tres puntos y ningún otro: el avatar, el nombre del contacto y la banda amarilla del disclaimer.

## Do's and Don'ts

### Do:
- **Do** teñir regiones enteras con el azul (`--campo`) y poner el texto en blanco encima.
- **Do** poner toda cifra medida en `.cifra` (Geist Mono, tabular).
- **Do** usar el amarillo como fondo con tinta `#212529` encima, siempre.
- **Do** separar bloques con reglado de 2px y capa tonal.
- **Do** acompañar todo color de estado con su palabra: el sello dice "Nutrición", no solo se pinta.
- **Do** dejar el chat en el verde de WhatsApp.

### Don't:
- **Don't** usar amarillo como color de texto sobre fondo claro: `#ffd000` sobre blanco es 1,5:1.
- **Don't** agregar `box-shadow` a nada fuera del chat.
- **Don't** pintar "nutrición" de rojo, gris muerto o ámbar de advertencia; es un tinte del azul.
- **Don't** poner más de un `.resaltado` por pantalla.
- **Don't** usar `border-left` de color como recurso de bloque destacado.
- **Don't** meter píldoras (`rounded-full`) en la consola del asesor ni en la landing.
- **Don't** ocultar, filtrar ni truncar filas de la tabla de factores por razones visuales.
