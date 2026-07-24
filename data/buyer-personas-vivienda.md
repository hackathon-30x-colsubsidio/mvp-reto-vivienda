# Buyer Personas — Vivienda Colsubsidio

> Extraído de `Buyer_Person.pptx`. Corte de datos: **15/01/2026**.

> 22 slides: 17 proyectos individuales + 5 vistas agregadas (Total, Maipore, Bogotá, Municipios norte, Municipios sur).

> **Saneado por privacidad (ticket 022):** se removieron las 22 tablas de "Top empresas" (nombres reales de empleadores + conteos de compradores) por la restricción no-negociable de `AGENTS.md` — este repo es público. Quedan solo los agregados `%`, que es la data derivada que alimenta el [ticket 016](../docs/tasks/016-distribuciones-por-proyecto.md). El md crudo con los nombres vive local en `docs/recursos-reto/` (gitignored).


## ⚠️ Nota sobre la extracción

Los datos vienen de etiquetas de gráficos de torta dispersas en cada slide. La extracción automática recupera bien **los pares etiqueta-porcentaje**, pero:

- Algunos gráficos tienen etiquetas que no quedaron asociadas (aparecen categorías sueltas o mezcladas entre secciones).

- La sección **Género** solo recupera un porcentaje; el complemento es el restante (no se puede saber cuál corresponde a cuál género desde el texto).

- Los porcentajes de cada gráfico **no siempre suman 100%** porque el PPT solo muestra las categorías principales.

- **Slides con etiquetas cruzadas (revisar a mano):** Araucaria (15), Los Nogales (10), Abeto (13) y Karakali (11) tienen rangos salariales que no calzan con el formato SMLV de los demás ("Entre 4 y 6", "Entre 20 y 30") — parece que ahí el PPT usa otra escala o las etiquetas se cruzaron entre gráficos.
- La fila "Género" arrastra etiquetas del gráfico vecino en varios slides; tratarla como no confiable.
- Verificar contra el PPT original antes de usar cualquier cifra en el pitch.


## Tabla resumen — afiliación por proyecto

| # | Proyecto | Afiliado | No afiliado | Hasta 2 SMLV | 20-35 años |
|---|---|---|---|---|---|
| 1 | Bosques de Arrayan | 63% | 37% | 66% | 50% |
| 2 | Bosques de Turpial | 64% | 36% | 82% | 70% |
| 3 | La Macarena | 56% | 44% | 91% | 54% |
| 4 | Monguí | 66% | 34% | 87% | 56% |
| 5 | Pamplona | 65% | 35% | 87% | 46% |
| 6 | Reserva de Guayacán | 69% | 31% | 68% | 56% |
| 7 | Reserva de Saman | 77% | 23% | 64% | 41% |
| 8 | INARI | 64% | 36% | 72% | 56% |
| 9 | La arboleda | 64% | 36% | 90% | 53% |
| 10 | Los Nogales | 40% | 60% | — | 15% |
| 11 | karakali | 59% | 41% | 47% | 57% |
| 12 | Versalles | 71% | 29% | 100% | 61% |
| 13 | Abeto | 40% | 60% | 0% | 50% |
| 14 | Payande | 64% | 36% | 65% | 37% |
| 15 | Araucaria | 38% | 62% | — | 38% |
| 16 | Vibonce | 64% | 36% | 100% | 50% |
| 17 | Verde Esperanza | 64% | 36% | 94% | 52% |
| 18 | Total | 62% | 38% | 78% | 51% |
| 19 | Maipore | 62% | 38% | 90% | 54% |
| 20 | Bogota | 56% | 44% | 69% | 48% |
| 21 | Municipios norte | 64% | 36% | 75% | 54% |
| 22 | Municipios sur | 67% | 33% | 65% | 41% |

---

## Detalle por slide


### Slide 1 — Bosques de Arrayan

**Afiliación:** Afiliado 63% · No Afilado 37%

**Rango Salario:** Hasta 2 smlv 66% · Mas de 2 smlv 34%

**Rango Edad:** 20 a 35 años 50% · 36 a 45 años 29%

**Segmento:** Básico 26% · Alto 0% · Medio 45%

**Segmento Familia:** Monoparental 6% · Nuclear Integrada 12% · Pareja Conyugal 4% · Sin Grupo 44%

**Estrato:** Tres 18% · Cuatro 2% · Uno 2% · Dos 13%

**PAC:** Tres 9% · Cuatro 2% · Dos 18% · Uno 27% · Joven 29% · Cero 44%

**Entidad Financieras:** FNA 10% · Otros 19%

**Segmento Empresas:** Grandes 20% · Emp Top 25% · Micro 29%

**Localidad:** Engativá 5% · Suba 8% · Sin Infor 58%

**Departamento:** Chía 5% · Bogotá 45% · Gachancipa 2% · Estándar 6%

### Slide 2 — Bosques de Turpial

**Afiliación:** Afiliado 64% · No Afilado 36%

**Rango Salario:** Hasta 2 smlv 82% · Mas de 2 smlv 18%

**Rango Edad:** 20 a 35 años 70% · 36 a 45 años 13%

**Segmento:** Básico 29% · Alto 0% · Medio 30%

**Segmento Familia:** Monoparental 5% · Nuclear Integrada 7% · Sin Grupo 54%

**Estrato:** Tres 13% · Cuatro 4% · Uno 4% · Dos 13%

**PAC:** Tres 1% · Cuatro 1% · Dos 11% · Uno 32% · Joven 41% · Cero 54%

**Entidad Financieras:** La Hipotecaria 4% · Otros 7%

**Segmento Empresas:** Medianas 21% · Grandes 18% · Emp Top 17% · Micro 39%

**Localidad:** Engativá 5% · Suba 12% · Sin Infor 61%

**Departamento:** Cota 1% · Bogotá 45% · Choconta 1% · Estándar 3%

### Slide 3 — La Macarena

**Afiliación:** Afiliado 56% · No Afilado 44%

**Rango Salario:** Hasta 2 smlv 91% · Mas de 2 smlv 9%

**Rango Edad:** 20 a 35 años 54% · 36 a 45 años 26%

**Segmento:** Básico 44% · Alto 0% · Medio 29%

**Segmento Familia:** Monoparental 7% · Nuclear Integrada 3% · Sin Grupo 50%

**Estrato:** Tres 10% · Cuatro 1% · Uno 3% · Dos 16%

**PAC:** Tres 7% · Cuatro 2% · Dos 12% · Uno 30% · Joven 27% · Cero 50% · Pareja Conyugal 2%

**Entidad Financieras:** FNA 9% · Otros 12%

**Segmento Empresas:** Medianas 28% · Grandes 24% · Emp Top 16% · Micro 25%

**Localidad:** Bosa 3% · Kennedy 3% · Sin Infor 64%

**Departamento:** Funza 1% · Bogotá 42% · Fusagasugá 1% · Estándar 5%

### Slide 4 — Monguí

**Afiliación:** Afiliado 66% · No Afilado 34%

**Rango Salario:** Hasta 2 smlv 87% · Mas de 2 smlv 13%

**Rango Edad:** 20 a 35 años 56% · 36 a 45 años 26%

**Segmento:** Básico 39% · Alto 0% · Medio 39%

**Segmento Familia:** Monoparental 2% · Nuclear Integrada 7% · Sin Grupo 40%

**Estrato:** Tres 11% · Cuatro 2% · Uno 5% · Dos 14%

**PAC:** Tres 7% · Cuatro 2% · Dos 22% · Uno 28% · Joven 22% · Cero 40% · Pareja Conyugal 3%

**Entidad Financieras:** FNA 13% · Otros 15%

**Segmento Empresas:** Medianas 29% · Grandes 20% · Emp Top 15% · Micro 32%

**Localidad:** C. Bolivar 3% · Kennedy 4% · Sin Infor 65%

**Departamento:** Sibaté 1% · Bogotá 45% · Fusagasugá 1% · Estándar 4%

### Slide 5 — Pamplona

**Afiliación:** Afiliado 65% · No Afilado 35%

**Rango Salario:** Hasta 2 smlv 87% · Mas de 2 smlv 13%

**Rango Edad:** 20 a 35 años 46% · 36 a 45 años 30%

**Segmento:** Básico 42% · Alto 0% · Medio 40%

**Segmento Familia:** Monoparental 2% · Nuclear Integrada 17% · Sin Grupo 35%

**Estrato:** Tres 7% · Cuatro 0% · Uno 5% · Dos 13%

**PAC:** Tres 13% · Cuatro 1% · Dos 23% · Uno 27% · Joven 18% · Cero 35% · Pareja Conyugal 2%

**Entidad Financieras:** Colpatria 11% · Otros 31%

**Segmento Empresas:** Medianas 27% · Grandes 17% · Emp Top 7% · Micro 41%

**Localidad:** C. Bolivar 3% · Bosa 5% · Sin Infor 70%

**Departamento:** Sibaté 1% · Bogotá 37% · Mosquera 1% · Estándar 5%

### Slide 6 — Reserva de Guayacán

**Afiliación:** Afiliado 69% · No Afilado 31%

**Rango Salario:** Hasta 2 smlv 68% · Mas de 2 smlv 32%

**Rango Edad:** 20 a 35 años 56% · 36 a 45 años 30%

**Segmento:** Básico 34% · Alto 0% · Medio 44%

**Segmento Familia:** Monoparental 16% · Nuclear Integrada 10% · Sin Grupo 46%

**Estrato:** Tres 20% · Cinco 64% · Uno 0% · Dos 14%

**PAC:** Tres 4% · Dos 14% · Uno 36% · Joven 22% · Cero 46%

**Entidad Financieras:** Colsubsidio 6% · Otros 20%

**Segmento Empresas:** Medianas 20% · Grandes 24% · Emp Top 6% · Micro 46%

**Localidad:** Bosa 2% · Engativá 16% · Sin Infor 58%

**Departamento:** Ubaté 2% · Bogotá 40% · Mosquera 2% · Estándar 4%

### Slide 7 — Reserva de Saman

**Afiliación:** Afiliado 77% · No Afilado 23%

**Rango Salario:** Hasta 2 smlv 64% · Mas de 2 smlv 36%

**Rango Edad:** 20 a 35 años 41% · 36 a 45 años 31%

**Segmento:** Básico 37% · Alto 0% · Medio 42%

**Segmento Familia:** Nuclear Integrada 15% · Sin Grupo 37%

**Estrato:** Cuatro 2% · Seis 2% · Dos 20% · Tres 12%

**PAC:** Tres 12% · Dos 20% · Uno 25% · Joven 20% · Cero 37% · Monoparental 2% · Cuatro 5%

**Entidad Financieras:** Colsubsidio 25% · Banco de Bogota 20% · Otros 25%

**Segmento Empresas:** Medianas 22% · Grandes 22% · Emp Top 12% · Micro 39%

**Localidad:** Engativa 5% · Kennedy 8% · Sin Infor 54%

**Departamento:** Agua de Dios 2% · Bogotá 59% · Nocaima 2% · Estándar 5%

### Slide 8 — INARI

**Afiliación:** Afiliado 64% · No Afilado 36%

**Rango Salario:** Hasta 2 smlv 72% · Mas de 2 smlv 28%

**Rango Edad:** 20 a 35 años 56% · 36 a 45 años 26%

**Segmento:** Básico 38% · Alto 0% · Medio 28%

**Segmento Familia:** Nuclear Integrada 6% · Sin Grupo 57%

**Estrato:** Tres 9% · Cuatro 3% · Uno 1% · Dos 19%

**PAC:** Tres 4% · Dos 11% · Uno 28% · Joven 34% · Cero 57% · Cinco 1% · Pareja Conyugal 6%

**Entidad Financieras:** Colsubsidio 41% · Otros 15%

**Segmento Empresas:** Medianas 25% · Grandes 17% · Emp Top 17% · Micro 38%

**Localidad:** Engativa 6% · Chia 9% · Sin Infor 61%

**Departamento:** Ubate 14% · Bogotá 29% · Zipaquira 1% · Estándar 2%

### Slide 9 — La arboleda

**Afiliación:** Afiliado 64% · No Afilado 36%

**Rango Salario:** Hasta 2 smlv 90% · Mas de 2 smlv 10%

**Rango Edad:** 20 a 35 años 53% · 36 a 45 años 33%

**Segmento:** Básico 47% · Alto 0% · Medio 37%

**Segmento Familia:** Nuclear Integrada 8% · Sin Grupo 30%

**Estrato:** Tres 4% · Cuatro 3% · Uno 7% · Dos 20%

**PAC:** Tres 9% · Dos 24% · Uno 34% · Joven 16% · Cero 30% · Cuatro 3% · Pareja Conyugal 3%

**Entidad Financieras:** FNA 14% · Otros 20%

**Segmento Empresas:** Medianas 27% · Grandes 25% · Emp Top 14% · Micro 28%

**Localidad:** Usme 5% · San cristobal 14% · Sin Infor 62%

**Departamento:** Bogotá 55% · Estándar 6%

### Slide 10 — Los Nogales

**Afiliación:** Afiliado 40% · No Afilado 60%

**Rango Salario:** Mas  4 smlv 67% · Menos de 4 smlv 33%

**Rango Edad:** 20 a 35 años 15% · 36 a 45 años 40%

**Segmento:** Básico 7% · Alto 2% · Medio 80%

**Segmento Familia:** Nuclear Integrada 24% · Sin Grupo 35%

**Estrato:** Seis 4% · Sin Inf 55% · Tres 36% · Cuatro 4%

**PAC:** Tres 15% · Dos 16% · Uno 33% · Joven 11% · Cero 35% · Pareja Conyugal 22% · cuatro 2%

**Entidad Financieras:** Bancolombia 18% · Otros 38%

**Segmento Empresas:** Medianas 16% · Grandes 33% · Emp Top 7% · Micro 35%

**Localidad:** Chapinero 2% · Engativá 55% · Sin Infor 55%

**Departamento:** Bogotá 76% · Pensionados 9%

### Slide 11 — karakali

**Afiliación:** Afiliado 59% · No Afilado 41%

**Rango Salario:** Hasta 2 smlv 47% · Mas de 2 smlv 53%

**Rango Edad:** 20 a 35 años 57% · 36 a 45 años 21%

**Segmento:** Básico 28% · Alto 0% · Medio 35%

**Segmento Familia:** Nuclear Integrada 9% · Sin Grupo 68%

**Estrato:** Tres 22% · Cuatro 4% · Uno 3% · Dos 3%

**PAC:** Tres 7% · Dos 9% · Uno 16% · Joven 37% · Cero 68% · Cuatro 0% · Pareja Conyugal 6%

**Entidad Financieras:** Bancolombia 16% · Otros 25%

**Segmento Empresas:** Medianas 16% · Grandes 19% · Emp Top 7% · Micro 53%

**Localidad:** Teusaquillo 3% · Engativá 9% · Sin Infor 62%

**Departamento:** Bogotá 49% · Estándar 3%

### Slide 12 — Versalles

**Afiliación:** Afiliado 71% · No Afilado 29%

**Rango Salario:** Hasta 2 smlv 100% · Mas de 2 smlv 0%

**Rango Edad:** 20 a 35 años 61% · 36 a 45 años 29%

**Segmento:** Básico 38% · Alto 0% · Medio 42%

**Segmento Familia:** Nuclear Integrada 13% · Sin Grupo 34%

**Estrato:** Tres 8% · Cuatro 2% · Uno 4% · Dos 11%

**PAC:** Tres 9% · Dos 22% · Uno 31% · Joven 20% · Cero 34% · Cinco 2%

**Entidad Financieras:** Hipoteca 15% · Otros 32%

**Segmento Empresas:** Medianas 29% · Grandes 20% · Emp Top 13% · Micro 29%

**Localidad:** Chapinero 2% · Engativá 5% · Sin Infor 68%

**Departamento:** Bogotá 41% · Sibaté 1% · Estándar 7%

### Slide 13 — Abeto

**Afiliación:** Afiliado 40% · No Afilado 60%

**Rango Salario:** Hasta 2 smlv 0% · Mas de 2 smlv 50%

**Rango Edad:** 20 a 35 años 50% · 36 a 45 años 0%

**Segmento:** Básico 0% · Alto 0% · Medio 50%

**Segmento Familia:** Monoparental 0% · Nuclear Integrada 0% · Pareja Conyugal 0% · Sin Grupo 100%

**Estrato:** Tres 50% · Cuatro 0% · Uno 0% · Dos 0%

**PAC:** Tres 0% · Cuatro 0% · Dos 0% · Uno 0% · Joven 50% · Cero 100%

**Segmento Empresas:** Grandes 50% · Emp Top 0% · Micro 50%

**Localidad:** Engativa 50% · Sin Infor 50%

**Departamento:** Bogotá 50% · Estándar 0%

### Slide 14 — Payande

**Afiliación:** Afiliado 64% · No Afilado 36%

**Rango Salario:** Hasta 2 smlv 65% · Mas de 2 smlv 35%

**Rango Edad:** 20 a 35 años 37% · 36 a 45 años 31%

**Segmento:** Básico 29% · Alto 0% · Medio 49%

**Segmento Familia:** Monoparental 3% · Nuclear Integrada 9% · Sin Grupo 51%

**Estrato:** Tres 11% · Cuatro 4% · Uno 4% · Dos 11%

**PAC:** Tres 7% · Cuatro 1% · Dos 15% · Uno 26% · Joven 22% · Cero 51%

**Entidad Financieras:** Davivienda 15% · Otros 26%

**Segmento Empresas:** Medianas 14% · Grandes 23% · Emp Top 8% · Micro 47%

**Localidad:** P Aranda 3% · Kennedy 5% · Sin Infor 63%

**Departamento:** Girardot 2% · Bogotá 50% · Soacha 1% · Estándar 3%

### Slide 15 — Araucaria

**Afiliación:** Afiliado 38% · No Afilado 62%

**Rango Salario:** Entre 4 y 6 25% · Entre 3 y 4 22%

**Rango Edad:** 20 a 35 años 38% · 36 a 45 años 25%

**Género:** Entre 6 y 8 19% · Entre 20 y 30 3%

**Segmento:** Básico 3% · Alto 3% · Medio 56%

**Segmento Familia:** Monoparental 16% · Nuclear Integrada 16% · Sin Grupo 47%

**Estrato:** Cuatro 3% · Seis 3% · Dos 34% · Tres 34%

**PAC:** Tres 6% · Cuatro 0% · Dos 22% · Uno 25% · Joven 38% · Cero 47%

**Entidad Financieras:** B Bogota 16% · Otros 9%

**Segmento Empresas:** Medianas 19% · Grandes 34% · Emp Top 6% · Micro 34%

**Localidad:** Teusaquillo 3% · Engativa 38% · Sin Infor 44%

**Departamento:** Bogotá 56% · Mosquera 3% · Estándar 3%

### Slide 16 — Vibonce

**Afiliación:** Afiliado 64% · No Afilado 36%

**Rango Salario:** Hasta 2 smlv 100% · Mas de 2 smlv 0%

**Rango Edad:** 20 a 35 años 50% · 36 a 45 años 0%

**Segmento:** Básico 50% · Alto 0% · Medio 0%

**Segmento Familia:** Monoparental 0% · Nuclear Integrada 0% · Sin Grupo 50%

**Estrato:** Tres 0% · Cuatro 0% · Uno 0% · Dos 0%

**PAC:** Tres 0% · Cuatro 0% · Dos 50% · Uno 0% · Joven 50% · Cero 50%

**Entidad Financieras:** Davivienda 100%

**Segmento Empresas:** Medianas 0% · Grandes 0% · Emp Top 0% · Micro 100%

**Localidad:** P Aranda 0% · Kennedy 0% · Sin Infor 100%

**Departamento:** Girardot 0% · Bogotá 0% · Soacha 0% · Estándar 0%

### Slide 17 — Verde Esperanza

**Afiliación:** Afiliado 64% · No Afilado 36%

**Rango Salario:** Hasta 2 smlv 94% · Mas de 2 smlv 6%

**Rango Edad:** 20 a 35 años 52% · 36 a 45 años 23%

**Segmento:** Básico 59% · Alto 0% · Medio 30%

**Segmento Familia:** Monoparental 4% · Nuclear Integrada 22% · Sin Grupo 25%

**Estrato:** Tres 22% · Cuatro 1% · Uno 2% · Dos 5%

**PAC:** Tres 12% · Cuatro 2% · Dos 26% · Uno 33% · Joven 11% · Cero 25%

**Segmento Empresas:** Medianas 36% · Grandes 6% · Emp Top 10% · Micro 37%

**Localidad:** Kenedy 1% · Ubate 26% · Sin Infor 65%

**Departamento:** Mosquera 1% · Ubate 38% · Sibate 1% · Estándar 9%

### Slide 18 — Total

**Afiliación:** Afiliado 62% · No Afilado 38%

**Rango Salario:** Hasta 2 smlv 78% · Mas de 10 smlv 1%

**Rango Edad:** 20 a 35 años 51% · 36 a 45 años 28%

**Género:** 2 a 4 smlv 16% · 4 a 10 smlv 5%

**Segmento:** Básico 38% · Alto 0% · Medio 39%

**Segmento Familia:** Monoparental 4% · Nuclear Integrada 10% · Sin Grupo 43%

**Estrato:** Tres 13% · Uno 4%

**PAC:** Tres 8% · Cuatro 2% · Dos 18% · Uno 29% · Cuatro 2% · Joven 24% · Cero 43% · Dos 14% · Sinco 0% · Seis 1%

**Segmento Empresas:** Medianas 25% · Grandes 21% · Emp Top 14% · Micro 34%

**Localidad:** Kenedy 3% · Engativa 5% · Sin Infor 62%

**Departamento:** Ubate 2% · Bogota 44% · Chia 1% · Estándar 4%

### Slide 19 — Maipore

**Afiliación:** Afiliado 62% · No Afilado 38%

**Rango Salario:** Hasta 2 smlv 90% · Mas de 2 smlv 10%

**Rango Edad:** 20 a 35 años 54% · 36 a 45 años 27%

**Segmento:** Básico 41% · Alto 0% · Medio 36%

**Segmento Familia:** Monoparental 4% · Nuclear Integrada 8% · Sin Grupo 42%

**Estrato:** Tres 10% · Cuatro 1% · Uno 4% · Dos 14%

**PAC:** Tres 8% · Cuatro 2% · Dos 19% · Uno 29% · Joven 23% · Cero 42%

**Segmento Empresas:** Medianas 29% · Grandes 21% · Emp Top 14% · Micro 31%

**Localidad:** Bosa 3% · Kennedy 4% · Sin Infor 65%

**Departamento:** Fusagasuga 1% · Soacha 10% · Sibate 1% · Estándar 5%

### Slide 20 — Bogota

**Afiliación:** Afiliado 56% · No Afilado 44%

**Rango Salario:** Hasta 2 smlv 69% · Mas de 2 smlv 31%

**Rango Edad:** 20 a 35 años 48% · 36 a 45 años 31%

**Segmento:** Básico 37% · Alto 0% · Medio 43%

**Segmento Familia:** Monoparental 4% · Nuclear Integrada 10% · Sin Grupo 37%

**Estrato:** Tres 13% · Cuatro 3% · Uno 5% · Dos 14%

**PAC:** Tres 9% · Cuatro 2% · Dos 21% · Uno 31% · Joven 20% · Cero 37%

**Segmento Empresas:** Medianas 23% · Grandes 26% · Emp Top 12% · Micro 28%

**Localidad:** Chapinero 4% · San crist 9% · Sin Infor 60%

**Departamento:** Soacha 1% · Estándar 5%

### Slide 21 — Municipios norte

**Afiliación:** Afiliado 64% · No Afilado 36%

**Rango Salario:** Hasta 2 smlv 75% · Mas de 2 smlv 25%

**Rango Edad:** 20 a 35 años 54% · 36 a 45 años 25%

**Segmento:** Básico 36% · Alto 0% · Medio 36%

**Segmento Familia:** Monoparental 5% · Nuclear Integrada 12% · Sin Grupo 44%

**Estrato:** Tres 17% · Cuatro 2% · Uno 2% · Dos 13%

**PAC:** Tres 8% · Cuatro 1% · Dos 17% · Uno 29% · Joven 28% · Cero 44%

**Segmento Empresas:** Medianas 25% · Grandes 16% · Emp Top 19% · Micro 34%

**Localidad:** Engativa 4% · Suba 7% · Sin Infor 61%

**Departamento:** Chia 4% · Ubate 8% · Tocancipa 2% · Estándar 4%

### Slide 22 — Municipios sur

**Afiliación:** Afiliado 67% · No Afilado 33%

**Rango Salario:** Hasta 2 smlv 65% · Mas de 2 smlv 45%

**Rango Edad:** 20 a 35 años 41% · 36 a 45 años 31%

**Segmento:** Básico 32% · Alto 0% · Medio 47%

**Segmento Familia:** Monoparental 5% · Nuclear Integrada 11% · Sin Grupo 48%

**Estrato:** Tres 13% · Cuatro 3% · Uno 3% · Dos 14%

**PAC:** Tres 7% · Cuatro 1% · Dos 16% · Uno 27% · Joven 22% · Cero 48%

**Segmento Empresas:** Medianas 17% · Grandes 23% · Emp Top 9% · Micro 45%

**Localidad:** Kenedy 1% · Kennedy 6% · Sin Infor 60%

**Departamento:** Soacha 2% · Girardot 3% · Fusagasuga 2% · Estándar 4%

