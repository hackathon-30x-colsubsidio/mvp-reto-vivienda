# mvp-reto-vivienda — Context

Glosario del dominio (Colsubsidio + reto Vivienda). Existe para fijar el lenguaje ubicuo antes de nombrar cosas o diseñar el MVP.

Esto es un **glosario y nada más** — el lenguaje ubicuo del proyecto. Sin detalles de implementación, sin specs, sin decisiones (eso va en `docs/adr/`). Definiciones de una o dos frases: qué **es** un término, no qué hace.

`/grill-with-docs` lo va afinando a medida que se resuelven términos. Semilla abajo (heredada de `plan-research`, recortada a lo relevante para Vivienda).

## Language

**Colsubsidio**:
Caja de compensación familiar colombiana; corporación de protección social con ~1.5M afiliados. Vende vivienda no como constructora tradicional sino para cerrar brechas sociales.

**Caja de compensación**:
Entidad que administra el subsidio familiar y presta servicios sociales (salud, vivienda, recreación, crédito) a trabajadores afiliados y sus familias.

**Afiliado**:
Trabajador vinculado a Colsubsidio a través de su empresa. Sujeto de la regla 90/10; en el Excel del reto se infiere de si `PERIODO_AFILIADO` está lleno.

**Regla 90/10**:
Por regulación, el 90% de las ventas de vivienda de Colsubsidio deben ser a afiliados y solo el 10% a no afiliados. Distinguir afiliado/no afiliado temprano es un cuello de botella regulatorio, no un detalle.

**Lead**:
Persona interesada en un proyecto de vivienda, captada por pauta digital. Hoy llega mal perfilada al asesor.

**Lead orgánico**:
Lead que entra por canales propios de Colsubsidio (sitio web). Convierte muy bien porque llega mejor calificado; es el estándar que los leads pagos deberían alcanzar.

**Lead pago**:
Lead captado por pauta digital (Meta, Google Ads). Llega en volumen pero mal calificado; hacerlo parecerse al orgánico es la misión del reto.

**Perfilamiento**:
Calificar y enriquecer un lead para juzgar su capacidad de compra y hacer match con el proyecto de vivienda adecuado, preguntando solo lo que falta.

**CPL (costo por lead)**:
Lo que cuesta traer un lead por pauta. El costo de un lead sin perfilar es doble: el CPL pagado + las horas del equipo comercial persiguiéndolo.

**Nutrición**:
Flujo donde cae un lead que aún no puede comprar: se guarda con su razón + un trigger de recontacto (condicional o temporal) que lo re-engancha cuando cambia su situación. No se descarta a nadie.

**Scoring**:
Calificación del lead con factores explícitos y auditables (afiliación 90/10, cuota/ingreso ≤40%, subsidio aplicable, ya-tiene-vivienda, segmento vs buyer persona) + similitud con los compradores reales. El corte (listo / aún-no) es por reglas transparentes; el LLM solo redacta el porqué.

**Match de proyectos**:
Recomendar 2-3 proyectos acordes al perfil del lead (no todo el catálogo), con el porqué en lenguaje natural. Grounded en buyer personas + brochures.

**Buyer persona**:
Perfil agregado de los compradores actuales de un proyecto (afiliación, género, rango salarial, edad, segmento, familia, estrato, pirámide, ubicación, entidad financiera). Entregado como PPT por proyecto, con versiones agrupadas (municipios sur/norte).

**Segmentación de la caja** _(categorías Colsubsidio)_:
Cuatro categorías por ingreso y grupo familiar — **Básico** (≤1.44 SMMLV con personas a cargo), **Medio** (1.44–20 SMMLV con grupo familiar), **Alto** (>20 SMMLV), **Joven** (<39 años sin personas a cargo).

**Segmento pirámide / Pirámide de empresas**:
Clasificación de la empresa empleadora del afiliado por tamaño/tipo: top, medianas, estándar, micro.

**Segmentación familiar** _(DANE)_:
Conformación del hogar según variables del DANE: monoparental, nuclear ampliada, monoparental ampliada, pareja conyugal.

**Códigos griegos** _(dato del Excel)_:
`SEGMENTO_POBLACIONAL`/`CATEGORIA`/`PIRAMIDE_NUEVA` vienen anonimizados con letras griegas (KAPPA, PI, OMEGA…) en vez de las categorías Básico/Medio/Alto/Joven o top/micro/estándar. Decisión abierta: tratarlos como clusters anónimos o inferir el mapeo contra el PPT.

**Asesor**:
El comercial de Colsubsidio que cierra la venta. El endpoint del reto: el lead debe llegarle tan calificado que la conversación sea prácticamente de cierre y agendamiento de visita a sala de ventas.

**30X**:
Aliado de la hackathon; plataforma de educación ejecutiva en IA en Latinoamérica.
