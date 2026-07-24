---
serves: "roles-recta-final.md Rol 4 paso 2 · spec §7 supuestos por validar · mvp-layout §7"
status: por enviar
dueño: Rol 4 (Pitch & Video)
---

# Preguntas a mentores — canal del reto (HOY)

> Consolida los supuestos que el spec dejó abiertos **hacia afuera** (los que no resolvemos solos). Enviar hoy por el canal del reto; el orden es por impacto en el pitch. Cada una trae **por qué importa** y **nuestro plan B si dicen que no**, para no quedar bloqueados esperando respuesta.

1. **¿Un lead form de pauta puede pedir la cédula?**
   Es la llave del enriquecimiento y el momento "wow" del criterio 1 (el bot ya sabe quién eres y no repregunta). Riesgo: pedirla en Meta/Google mete fricción justo donde el brief dice "sin sentirse como un interrogatorio".
   _Plan B si no:_ el celular como llave, con match más débil. El demo se sostiene igual.

2. **¿Qué sabe Colsubsidio de un lead que llega por pauta, y qué campos trae?**
   Define qué puede enriquecer el sistema "sin preguntar". Supuesto de trabajo actual: si es afiliado lo conocen (afiliación, ciudad, segmento, ingreso); si no, no sabe nada.
   _Plan B:_ seguimos con ese supuesto, marcado como tal en el pitch.

3. **¿La convergencia multi-canal a una sola conversación de WhatsApp es válida?**
   Nuestro diseño hace que Meta, Google y web emitan el mismo lead-evento estándar y converjan a un chat. Queremos confirmar que no esperan tratamiento separado por canal.
   _Plan B:_ lo defendemos como decisión de producto (la escala multi-canal se demuestra por diseño, no construyendo canales).

4. **Los cruces con Ministerio de Vivienda / buró: ¿demostrados o basta inferirlos/simularlos?**
   Afecta cuánto peso le damos a esos cruces en el scoring y en el tramo de implementabilidad del video.
   _Plan B:_ los tratamos como inferidos/simulados y lo decimos explícito (DataCrédito ya está fuera de alcance por el brief).

5. **¿Cuál es el formato real de los premios / la implementación con Colsubsidio?**
   Calibra cuánto invertimos en el tramo de implementabilidad ([ticket 020](../tasks/020-tramo-implementabilidad.md)) — si el 1er premio es implementación real, ese tramo pesa más en el video.

## Dato ya confirmado por nosotros (no es pregunta, es munición)

La página orgánica real de Colsubsidio (`colsubsidio.com/vivienda`) **no tiene ni formulario ni proyectos**. El perfilador que construimos **es el embudo que hoy no existe** — abre el video (tramo 0 del [guion](guion-video.md)).
