---
id: 022
serves: "restricción no-negociable de AGENTS.md — la data real de Colsubsidio nunca es pública"
status: done (falta confirmación de Rol 2 sobre el json de 016)
---

# 022 — 🔴 Sanear data/buyer-personas-vivienda.md en el repo público

**Dueño:** Rol 4 (Pitch & Video) · seguridad · hallado 2026-07-24 al integrar el md del compañero

## Objetivo
`data/buyer-personas-vivienda.md` es una **transcripción casi literal del insumo `Buyer_Person.pptx`** (uno de los 3 archivos reales que `AGENTS.md` manda mantener gitignored). Está commiteado en **este** repo, que es público (commit `d07dbe3`). Contiene:

- **Aceptable (agregados):** porcentajes por proyecto (afiliación, salario, edad, segmento, estrato) — es justo la data derivada que el reto quiere usar y que alimenta el ticket [016](016-distribuciones-por-proyecto.md).
- **🔴 Problema:** **22 tablas de "Top empresas"** con **nombres reales** de empresas y conteos de compradores (TEXTILES DE TOCANCIPA, ALPINA, CLINICA DE MARLY, ADECCO…). Eso es data comercial identificable de Colsubsidio, no un agregado anónimo.

## Por qué se coló
El `.gitignore` bloquea `*.pptx`/`*.xlsx` pero **no un `.md`**. Una transcripción a markdown esquiva la regla.

## Alcance
- Dentro: quitar del repo público la parte sensible. Opción mínima: **borrar las 22 tablas de "Top empresas"** del md (los agregados % pueden quedarse). Opción limpia: **mover el md crudo a `docs/recursos-reto/`** (gitignored) y dejar en el repo solo el `buyer_personas.json` derivado y depurado que produce el ticket 016.
- Dentro: **blindar el gitignore** para el futuro — por ejemplo ignorar `data/*.md` con excepción explícita para lo derivado, o una regla equivalente, para que otra transcripción no vuelva a colarse.
- Fuera / decisión de equipo: reescribir el historial (`git filter-repo`/BFG) para borrar `d07dbe3` — mismo caso que el [ticket 021](021-plan-research-privado.md). Riesgo residual: quien ya lo clonó.

## Done cuando
- [x] El HEAD del repo público ya no tiene nombres de empresas reales de Colsubsidio. **Hecho 2026-07-24 (Rol 4):** removidas las 22 tablas "Top empresas"; se conservan los agregados %. El md crudo con nombres se guardó local en `docs/recursos-reto/buyer-personas-vivienda-RAW.md` (gitignored).
- [x] El `.gitignore` impide que una nueva transcripción `.md` de un insumo se cuele. **Hecho:** `data/*.md` ignorado por defecto con excepción explícita para el archivo saneado; verificado con `git check-ignore`.
- [ ] Rol 2 confirma que el `buyer_personas.json` derivado (016) no incluye nombres de empresas. **← acción de Rol 2 al construir 016.**

## Notas
No es una acción destructiva de un solo click: coordinar con el compañero que subió el md (`d07dbe3`, Alejandro) para no pisar su trabajo. Los agregados % son valiosos y se conservan; lo único que sale son los nombres propios.
