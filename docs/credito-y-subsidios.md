# Crédito hipotecario y subsidios en Colombia — lo verificado (2026-07-25)

> Investigación con fuentes citables para cerrar tres cosas que el repo tenía marcadas como supuesto: **el 0,6% que estima la cuota** (spec 03 D2, la pregunta 1 al TEAM), **la tabla de subsidios** ([ticket 017](tasks/017-tabla-subsidios.md)) y **el SMMLV** que usa el conversador.
>
> Regla de este documento: cada número trae su fuente. Lo que no se pudo verificar se dice como no verificado.

---

## 1. Resumen: tres cosas que cambian, una que se confirma

1. ✅ **El 40% del Decreto 583 de 2025 es correcto tal como está en el motor**, y aplica **sin distinguir VIS de no VIS**. La base legal del gate está bien.
2. 🔴 **El 0,6% que estima la cuota subestima entre un 25% y un 45%.** Con las tasas de 2026, la cuota real de un crédito a 20 años está entre **0,70% y 1,00%** del valor de la vivienda. El 0,6% equivale a una tasa del **8,66% E.A.**, que hoy no existe en el mercado.
3. 🔴 **El SMMLV del repo está desactualizado**: usa $1.423.500 (2025) y el vigente es **$1.750.905** (+23%). Afecta a quien contesta "gano 3 salarios mínimos" y a los rangos del enriquecimiento.
4. 🟡 **Mi Casa Ya no está operando en 2026** (sin presupuesto). El subsidio que sí está vigente es el de **las cajas de compensación** — o sea, el de Colsubsidio. Eso no es un problema del demo: es un regalo para el pitch.

---

## 2. El gate del 40%: confirmado

El [Decreto 583 del 28 de mayo de 2025](https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=179478) modifica el art. 2.1.11.1 del Decreto 1077 de 2015:

> *"La primera cuota del crédito no podrá representar más del cuarenta por ciento (40%) de los ingresos familiares."*

- **Aplica a toda vivienda**, sin distinguir VIS de no VIS. El repo lo dice bien.
- Subió desde el 30% anterior, y por eso la prensa lo cubrió como *"más familias podrán acceder a No VIS"* ([El Espectador](https://www.elespectador.com/economia/finanzas-personales/aumenta-el-tope-del-ingreso-para-creditos-de-vivienda-a-quien-beneficia/), [Infobae](https://www.infobae.com/colombia/2025/05/30/nuevas-condiciones-para-creditos-de-vivienda-familias-podran-destinar-mas-ingreso-a-la-cuota-inicial/)).
- **Dato nuevo y útil que el repo no tenía:** el mismo decreto fija cuánto se puede financiar — **hasta el 70% del valor** del inmueble en general y **hasta el 80% en VIS**. Eso es justo el insumo que faltaba para estimar la cuota bien.

---

## 3. El 0,6%: el número está mal, y se puede probar

El motor estima `cuota = precio × 0,6%` ([`config.ts`](../lib/scoring/config.ts)), declarado como *"aproxima una cuota a 20 años sobre el 70% del valor"*. Con la fórmula de anualidad —`cuota = P × i / (1 − (1+i)^−n)`— y las tasas reales de 2026, eso no da.

**Tasas vigentes** ([Superfinanciera vía La República](https://www.larepublica.co/finanzas/las-tasas-para-la-compra-de-vivienda-estan-entre-11-8-y-17-7-segun-la-superfinanciera-4431233), [comparativas 2026](https://vivienda.com.co/creditos-hipotecarios-colombia-tasas-vivienda-2026/)): promedio ~**13% E.A.**; **15,18% E.A.** ponderado para no VIS (corte 19 jun 2026); rango del mercado **10,93%–17,75%**.

### Cuota real, como % del valor de la vivienda (20 años)

| Tasa E.A. | Financiando 70% (no VIS) | Financiando 80% (VIS) |
|---|---|---|
| 10,93% — la más barata del mercado | **0,695%** | 0,794% |
| 13,00% — promedio 2026 | **0,785%** | 0,897% |
| 15,18% — ponderada no VIS | **0,881%** | 1,007% |
| 17,75% — la más cara | 0,998% | 1,140% |

**El 0,6% del repo equivale a una tasa del 8,66% E.A. a 20 años.** Ninguna entidad presta a eso hoy. Ni siquiera estirando el plazo a 30 años se llega: ahí el 0,6% implicaría 10,17% E.A., todavía por debajo del mercado.

**Y hay un margen que el 0,6% tampoco cubre:** la cuota que cobra el banco **incluye el seguro de vida deudor y el de incendio y terremoto** ([Bancolombia](https://www.bancolombia.com/personas/seguros/deudores/seguro-incendio-terremoto-deudores-hipotecarios), [BBVA](https://www.bbva.com.co/personas/productos/seguros/deudores/incendio-y-terremoto.html)), que van en el mismo recibo. O sea que la cuota real es incluso algo mayor que la tabla de arriba.

### Consecuencia: el motor está siendo más permisivo de lo que el banco será

| Persona | Con el 0,6% de hoy | Con la cuota real (13% E.A., 70%) |
|---|---|---|
| Diana · LA ARBOLEDA | 20,4% → pasa | 26,7% → **pasa** |
| Carlos · PAYANDÉ | 36,9% → pasa | **48,3% → nutrición** |
| Yuliana · LA MACARENA | 42,1% → nutrición | 55,0% → nutrición |

Es decir: **hoy le estamos diciendo "sí puedes" a alguien a quien el banco le va a decir que no.** Para un producto cuya promesa entera es "capacidad validada contra reglas explícitas", ese es el error más caro que puede tener.

---

## 4. El SMMLV: el repo va un año atrasado

`preguntas.ts` usa **$1.423.500** marcado como *"⚠️ SUPUESTO POR VALIDAR: salario mínimo de 2025"*. El vigente desde el 1 de enero de 2026 es **$1.750.905** (+23%), fijado por los Decretos 1469 y 1470 de 2025 ([Holland & Knight](https://www.hklaw.com/en/insights/publications/2025/12/colombia-decreta-aumento-del-salario-minimo-y-auxilio-de-transporte)). El auxilio de transporte es $249.095, y juntos dan el "salario vital" de $2.000.000 que anunció el Gobierno ([Presidencia](https://www.presidencia.gov.co/prensa/Paginas/Salario-vital-2-000-000-a-partir-de-enero-de-2026-251230.aspx)).

Dónde muerde:

| Rango | Ingreso que calcula hoy | Con el SMMLV real |
|---|---|---|
| 3-5 SMMLV (Diana) | $5.694.000 | **$7.003.620** |
| 1-3 SMMLV | $2.847.000 | $3.501.810 |
| 1-2 SMMLV | $2.135.250 | $2.626.358 |

Y a quien conteste *"gano 3 salarios mínimos"* en el chat, hoy se le calcula un 23% menos de lo que gana.

> ⚠️ **Efecto colateral a revisar:** el umbral VIS de `generar_sintetica.py` es `150 SMMLV`. Con el SMMLV de 2026 pasa de ~$213M a ~$262M, así que **varios proyectos del catálogo cambiarían de no-VIS a VIS**. No se puede recalcular aquí (los insumos del Excel no están en el repo), pero hay que decirlo antes de afirmar en el pitch cuáles son VIS.

---

## 5. Subsidios: el programa del Gobierno está apagado, el de la caja no

Esto cambia el argumento, y a favor:

- **Mi Casa Ya no tiene asignaciones en 2026.** El Gobierno confirmó que no hay presupuesto para el programa este año ([El Colombiano](https://www.elcolombiano.com/negocios/subsidios-de-vivienda-2026-colombia-montos-requisitos-acceder-casa-propia-DO32696533), [Portafolio](https://www.portafolio.co/mis-finanzas/vivienda/subsidios-de-vivienda-vigentes-en-2026-cajas-de-compensacion-y-programas-locales-tras-mi-casa-ya-485814)). Cuando operaba, daba 30 SMMLV (Sisbén A1–C8) o 20 SMMLV (C9–D20).
- **El subsidio vigente es el de las cajas de compensación**, y llega hasta **30 SMMLV ≈ $52.527.150** con el salario de 2026 ([Metrocuadrado](https://www.metrocuadrado.com/noticias/noticias-y-tendencias/estos-son-los-subsidios-de-vivienda-vigentes-en-el-2026-5659)). Requisitos generales: no ser propietario en el territorio nacional, aplicar a un proyecto VIS o VIP, y **estar afiliado a una caja**.
- Colsubsidio publica su propio [cronograma de asignación 2026](https://cms.colsubsidio.com/sites/default/files/Documentos/colsubsidio/2026/cronograma-asignacion-subsidios-colsubsidio-2026.pdf).

**Por qué esto es munición y no un problema.** El reto es de Colsubsidio, que **es** una caja de compensación. Con Mi Casa Ya apagado, el subsidio de la caja pasó de ser un complemento a ser *el* subsidio — y solo lo reciben **los afiliados**. Eso le da un sentido nuevo a la regla 90/10 y al perfilamiento: para un afiliado, la caja puede poner hasta $52,5 millones sobre la mesa; para el no afiliado, hoy no hay programa nacional que lo reemplace. **Afiliarse deja de ser un trámite y se vuelve la palanca financiera más grande del negocio.**

> ⚠️ **No verificado:** el monto exacto que Colsubsidio asigna por tramo de ingreso en su convocatoria vigente, y si hay concurrencia con algún programa distrital. El PDF del cronograma existe pero no se leyó su contenido. **Antes de poner una cifra por tramo en el demo, hay que abrirlo.**

---

## 6. Qué recomiendo hacer con esto

En orden de valor y con el costo real:

| # | Cambio | Por qué | Costo |
|---|---|---|---|
| 1 | **Reemplazar el 0,6% por la fórmula de anualidad** con parámetros citados (13% E.A., 20 años, 70%/80% según VIS) | Es el número del que cuelga cada veredicto, y hoy aprueba a quien el banco rechaza | ~1 h + resembrar |
| 2 | **Actualizar el SMMLV a $1.750.905** | Un dato con fuente reemplazando un supuesto marcado como tal | 10 min |
| 3 | **Ajustar el ingreso de Carlos** a ~$3.500.000 (2 SMMLV de 2026) | Con la cuota real, Carlos ya no pasa el corte y el demo pierde su personaje del 90/10. Con ese ingreso queda en ~39%: **apenas pasa**, que es exactamente su historia | 5 min |
| 4 | **Tabla de subsidios ([017](tasks/017-tabla-subsidios.md)) con lo de la caja**, no con Mi Casa Ya | Mi Casa Ya está apagado; citar un programa sin presupuesto como si aplicara sería vender humo | Depende de abrir el PDF |
| 5 | Revisar el umbral VIS del generador | Con el SMMLV nuevo, varios proyectos cambian de categoría | No se puede aquí |

**Lo que gana el pitch si se hace 1 y 2:** cuando el jurado pregunte *"¿de dónde sale esa cuota?"*, la respuesta deja de ser "una heurística nuestra" y pasa a ser *"anualidad estándar, al 13% efectivo anual que reporta la Superfinanciera, a 20 años, financiando el 70% que permite el Decreto 583 — y el seguro de vida y el de incendio van aparte"*. Eso es lo que separa un prototipo de algo que un banco reconocería.

---

## Fuentes

- [Decreto 583 de 2025, texto en el régimen legal de Bogotá](https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=179478) · [PDF de Presidencia](https://dapre.presidencia.gov.co/normativa/normativa/DECRETO%200583%20DEL%2028%20DE%20MAYO%20DE%202025.pdf)
- [El Espectador — el tope de ingresos sube al 40%](https://www.elespectador.com/economia/finanzas-personales/aumenta-el-tope-del-ingreso-para-creditos-de-vivienda-a-quien-beneficia/) · [Infobae](https://www.infobae.com/colombia/2025/05/30/nuevas-condiciones-para-creditos-de-vivienda-familias-podran-destinar-mas-ingreso-a-la-cuota-inicial/) · [Vanguardia](https://www.vanguardia.com/colombia/2025/06/02/mas-familias-podran-acceder-a-vivienda-no-vis-con-el-nuevo-decreto-del-gobierno/)
- [La República — tasas de la Superfinanciera (11,8%–17,7%)](https://www.larepublica.co/finanzas/las-tasas-para-la-compra-de-vivienda-estan-entre-11-8-y-17-7-segun-la-superfinanciera-4431233) · [Comparativa de tasas 2026](https://vivienda.com.co/creditos-hipotecarios-colombia-tasas-vivienda-2026/)
- [Holland & Knight — salario mínimo y auxilio de transporte 2026](https://www.hklaw.com/en/insights/publications/2025/12/colombia-decreta-aumento-del-salario-minimo-y-auxilio-de-transporte) · [Presidencia — salario vital $2.000.000](https://www.presidencia.gov.co/prensa/Paginas/Salario-vital-2-000-000-a-partir-de-enero-de-2026-251230.aspx)
- [El Colombiano — subsidios 2026](https://www.elcolombiano.com/negocios/subsidios-de-vivienda-2026-colombia-montos-requisitos-acceder-casa-propia-DO32696533) · [Portafolio — cajas de compensación tras Mi Casa Ya](https://www.portafolio.co/mis-finanzas/vivienda/subsidios-de-vivienda-vigentes-en-2026-cajas-de-compensacion-y-programas-locales-tras-mi-casa-ya-485814) · [Metrocuadrado — montos y requisitos](https://www.metrocuadrado.com/noticias/noticias-y-tendencias/estos-son-los-subsidios-de-vivienda-vigentes-en-el-2026-5659)
- [Minvivienda — Subsidio Familiar de Vivienda Nueva](https://www.minvivienda.gov.co/viceministerio-de-vivienda/mi-casa-ya/subsidio-familiar-de-vivienda-nueva-0) · [Colsubsidio — cronograma de asignación 2026](https://cms.colsubsidio.com/sites/default/files/Documentos/colsubsidio/2026/cronograma-asignacion-subsidios-colsubsidio-2026.pdf)
- Seguros que van dentro de la cuota: [Bancolombia](https://www.bancolombia.com/personas/seguros/deudores/seguro-incendio-terremoto-deudores-hipotecarios) · [BBVA](https://www.bbva.com.co/personas/productos/seguros/deudores/incendio-y-terremoto.html)
