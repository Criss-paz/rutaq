# Protocolo y Resultados de Validación del Dataset Vial de Guatemala (22 Departamentos)

**Proyecto II — Transporte Express (RutaQ)**  
**Universidad Mariano Gálvez de Guatemala**  
**Facultad de Ingeniería en Sistemas de Información**  
**Fecha de Validación:** 26 de octubre de 2026  
**Responsable de Datos:** Gemini (Agente de Datos y Documentación)

Este documento certifica el marco de control de calidad, medición empírica y validación de las distancias viales de la red nacional ([`src/data/guatemala.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala.json)) contra mediciones directas en **Google Maps** (conducción vehicular entre las coordenadas oficiales de las cabeceras departamentales).

---

## 1. Regla Metodológica de Validación con Google Maps

Para asegurar la máxima fidelidad geográfica sin perder la consistencia topológica de ruteo de OpenStreetMap/OSRM, se aplicó formalmente la siguiente **regla de decisión a tres niveles** (umbral de tolerancia del $\pm 10\,\%$):

1. **Ruta Recomendada de Google Maps (Tolerancia $\pm 10\,\%$):**
   Si la distancia obtenida por OSRM se encuentra a $\le 10\,\%$ de la ruta vehicular principal recomendada por Google Maps, se conserva el valor de **OSRM** (garantizando trazabilidad con el trazo vectorial y las geometrías de paso).
2. **Ruta Alternativa de Google Maps (Tolerancia $\pm 10\,\%$):**
   Si OSRM no coincide con la recomendada pero sí se ubica a $\le 10\,\%$ de una de las **rutas alternativas** que Google Maps ofrece para el mismo viaje, se conserva el valor de **OSRM**. Esto certifica que el trayecto físico existe y es transitable con esa longitud, difiriendo de la ruta recomendada de Google únicamente por criterios temporales de congestión o tráfico en tiempo real.
3. **Fuera de Tolerancia (Ninguna ruta coincide):**
   Si ninguna de las alternativas de Google Maps se ubica a $\le 10\,\%$ de OSRM, se descarta el kilometraje de OSRM y se adopta formalmente el valor de la **ruta recomendada de Google Maps**. Cuando la vía física identificada por Google Maps difiere de la catalogada preliminarmente, se actualiza también la nomenclatura de la carretera.

### Resumen Ejecutivo de la Validación (49 Aristas)

- **Total de aristas medidas:** $49$ aristas directas.
- **Coinciden con ruta recomendada ($\pm 10\,\%$):** **35 aristas** (71.4 %). Se utiliza OSRM.
- **Coinciden con ruta alternativa ($\pm 10\,\%$):** **9 aristas** (18.4 %). Se utiliza OSRM.
- **Fuera de tolerancia (adoptan Google Maps):** **5 aristas** (10.2 %):
  1. `CHI-SOL`: **$85.4\text{ km}$** (OSRM reportaba $69.2\text{ km}$, diferencia del $23.41\,\%$).
  2. `CHI-SUC`: **$155.0\text{ km}$** (OSRM reportaba $122.3\text{ km}$, diferencia del $26.74\,\%$).
  3. `JAL-PRO`: **$68.4\text{ km}$** (OSRM reportaba $52.0\text{ km}$, diferencia del $31.54\,\%$).
  4. `IZA-PET`: **$287.0\text{ km}$** (OSRM reportaba $387.1\text{ km}$, diferencia del $25.86\,\%$; carretera actualizada a **`CA-13`**).
  5. `QUE-TOT`: **$28.8\text{ km}$** (OSRM reportaba $25.1\text{ km}$, diferencia del $14.74\,\%$).

---

## 2. Tabla Completa de Validación de las 49 Aristas (Google Maps vs OSRM)

A continuación se detalla la medición de cada arista vehicular registrada en [`docs/datos/validacion_google_guatemala.csv`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/docs/datos/validacion_google_guatemala.csv):

|  Arista   | km OSRM | km Google Rec. | km Google Alts. | Vía Google Maps                                      |  Tolerancia   |  km Usado   | Criterio de Selección                                       |   Fecha    |
| :-------: | :-----: | :------------: | :-------------: | :--------------------------------------------------- | :-----------: | :---------: | :---------------------------------------------------------- | :--------: |
| `GUA-SAC` | $37.8$  |     $38.1$     |   41.3 / 35.3   | Pan-American Highway/CA-1 y RN-10                    | `recomendada` | **$37.8$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `CHI-GUA` | $52.2$  |     $51.0$     |   51.8 / 54.3   | Carr. Interamericana/Pan-American Highway/CA-1       | `recomendada` | **$52.2$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `ESC-GUA` | $57.7$  |     $61.9$     |   56.8 / 65.7   | CA-9                                                 | `recomendada` | **$57.7$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `GUA-SRO` | $67.3$  |     $66.8$     |   67.2 / 65.2   | Carr. a El Salvador/Pan-American Highway/CA-1        | `recomendada` | **$67.3$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `GUA-JAL` | $99.1$  |     $99.2$     |   99.1 / 10.0   | CA-9 y Carr. 19                                      | `recomendada` | **$99.1$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `GUA-PRO` | $74.3$  |     $75.3$     |   74.9 / 10.0   | CA-9                                                 | `recomendada` | **$74.3$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `BVE-GUA` | $89.0$  |    $150.0$     |  150.0 / 90.7   | CA-14 y CA-9                                         | `alternativa` | **$89.0$**  | OSRM (coincide con una ruta alternativa de Google: 90.7 km) | 2026-10-26 |
| `CHI-SAC` | $19.0$  |     $17.6$     |   17.9 / 22.9   | Pan-American Highway/CA-1                            | `recomendada` | **$19.0$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `ESC-SAC` | $36.3$  |     $36.1$     |      37.4       | RN 14                                                | `recomendada` | **$36.3$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `CHI-ESC` | $56.0$  |     $54.5$     |        —        | Pan-American Highway/CA-1                            | `recomendada` | **$56.0$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `BVE-CHI` | $119.3$ |    $118.0$     |  199.0 / 20.0   | Pan-American Highway/CA-1                            | `recomendada` | **$119.3$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `CHI-QUI` | $108.5$ |    $109.0$     |  94.0 / 109.0   | Pan-American Highway/CA-1                            | `recomendada` | **$108.5$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `CHI-SOL` | $69.2$  |     $85.4$     |   85.2 / 98.0   | Pan-American Highway/CA-1                            |     `no`      | **$85.4$**  | Google Maps (ninguna ruta de Google a ±10 % de OSRM)        | 2026-10-26 |
| `CHI-SUC` | $122.3$ |    $155.0$     |  179.0 / 182.0  | CA-2                                                 |     `no`      | **$155.0$** | Google Maps (ninguna ruta de Google a ±10 % de OSRM)        | 2026-10-26 |
| `ESC-SRO` | $100.0$ |    $105.0$     |  103.0 / 99.7   | CA-9 y Carr. a El Salvador/Pan-American Highway/CA-1 | `recomendada` | **$100.0$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `ESC-SUC` | $102.5$ |    $103.0$     |      20.0       | CA-2                                                 | `recomendada` | **$102.5$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `JUT-SRO` | $56.0$  |     $55.8$     |      10.0       | Pan-American Highway/CA-1                            | `recomendada` | **$56.0$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `JAL-SRO` | $100.5$ |    $107.0$     |      10.0       | Carr. 19 y Pan-American Highway/CA-1                 | `recomendada` | **$100.5$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `JAL-JUT` | $52.7$  |     $52.2$     |      53.6       | Carr. 19                                             | `recomendada` | **$52.7$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `CHQ-JUT` | $88.5$  |     $88.5$     |   92.1 / 10.0   | Pan-American Highway/CA-1                            | `recomendada` | **$88.5$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `JAL-PRO` | $52.0$  |     $68.4$     |        —        | Carr. 19 y Carr. Jacobo Árbenz Guzmán/CA-9           |     `no`      | **$68.4$**  | Google Maps (ninguna ruta de Google a ±10 % de OSRM)        | 2026-10-26 |
| `CHQ-JAL` | $80.5$  |     $95.0$     |   98.6 / 81.6   | Carr. 19                                             | `alternativa` | **$80.5$**  | OSRM (coincide con una ruta alternativa de Google: 81.6 km) | 2026-10-26 |
| `PRO-ZAC` | $75.6$  |     $76.3$     |   75.3 / 10.0   | Carr. Jacobo Árbenz Guzmán/CA-9                      | `recomendada` | **$75.6$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `BVE-PRO` | $77.5$  |     $78.1$     |      77.7       | CA-14                                                | `recomendada` | **$77.5$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `CHQ-ZAC` | $24.2$  |     $24.3$     |   25.0 / 25.9   | CA-10                                                | `recomendada` | **$24.2$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `IZA-ZAC` | $172.1$ |    $172.0$     |      20.0       | Carr. Jacobo Árbenz Guzmán/CA-9                      | `recomendada` | **$172.1$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `AVE-ZAC` | $192.2$ |    $192.0$     |  192.0 / 20.0   | CA-14 y Carr. Jacobo Árbenz Guzmán/CA-9              | `recomendada` | **$192.2$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `BVE-ZAC` | $128.3$ |    $129.0$     |  128.0 / 20.0   | CA-14 y Carr. Jacobo Árbenz Guzmán/CA-9              | `recomendada` | **$128.3$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `AVE-IZA` | $339.2$ |    $339.0$     |  284.0 / 283.0  | CA-14 y CA-9                                         | `recomendada` | **$339.2$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `IZA-PET` | $387.1$ |    $287.0$     |  296.0 / 50.0   | CA-13                                                |     `no`      | **$287.0$** | Google Maps (ninguna ruta de Google a ±10 % de OSRM)        | 2026-10-26 |
| `AVE-BVE` | $69.0$  |     $98.7$     |   69.1 / 68.4   | CA-14                                                | `alternativa` | **$69.0$**  | OSRM (coincide con una ruta alternativa de Google: 69.1 km) | 2026-10-26 |
| `AVE-PET` | $257.3$ |    $265.0$     |  381.0 / 20.0   | Franja Transversal del Nte.                          | `recomendada` | **$257.3$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `AVE-QUI` | $165.9$ |    $166.0$     |  165.0 / 20.0   | RN-7W                                                | `recomendada` | **$165.9$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `BVE-QUI` | $128.6$ |    $134.0$     |  130.0 / 20.0   | RN-5                                                 | `recomendada` | **$128.6$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `HUE-QUI` | $79.4$  |     $70.3$     |   74.7 / 10.0   | 5a Avenida                                           | `alternativa` | **$79.4$**  | OSRM (coincide con una ruta alternativa de Google: 74.7 km) | 2026-10-26 |
| `QUI-TOT` | $36.2$  |     $38.5$     |   42.3 / 41.8   | 6 avenida                                            | `recomendada` | **$36.2$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `QUI-SOL` | $47.7$  |     $47.7$     |   60.4 / 52.1   | Pan-American Highway/CA-1                            | `recomendada` | **$47.7$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `HUE-SMA` | $87.1$  |    $111.0$     |  88.4 / 104.0   | Pan-American Highway/CA-1                            | `alternativa` | **$87.1$**  | OSRM (coincide con una ruta alternativa de Google: 88.4 km) | 2026-10-26 |
| `HUE-QUE` | $91.7$  |     $90.1$     |  83.5 / 101.0   | Pan-American Highway/CA-1                            | `recomendada` | **$91.7$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `HUE-TOT` | $89.7$  |     $89.7$     |      87.8       | RN-9N y Pan-American Highway/CA-1                    | `recomendada` | **$89.7$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `QUE-SMA` | $49.6$  |     $47.5$     |   50.3 / 54.0   | Circunvalación San Juan Ostuncalco                   | `recomendada` | **$49.6$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `REU-SMA` | $91.0$  |    $103.0$     |  92.7 / 128.0   | CITO-180                                             | `alternativa` | **$91.0$**  | OSRM (coincide con una ruta alternativa de Google: 92.7 km) | 2026-10-26 |
| `QUE-TOT` | $25.1$  |     $28.8$     |   28.4 / 28.0   | Auto Pista Los Altos                                 |     `no`      | **$28.8$**  | Google Maps (ninguna ruta de Google a ±10 % de OSRM)        | 2026-10-26 |
| `QUE-SOL` | $79.4$  |     $74.8$     |   81.4 / 81.0   | Pan-American Highway/CA-1                            | `recomendada` | **$79.4$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `QUE-REU` | $59.5$  |     $53.4$     |      59.6       | CITO-180                                             | `alternativa` | **$59.5$**  | OSRM (coincide con una ruta alternativa de Google: 59.6 km) | 2026-10-26 |
| `QUE-SUC` | $60.2$  |     $54.1$     |   58.0 / 54.1   | CITO-180                                             | `alternativa` | **$60.2$**  | OSRM (coincide con una ruta alternativa de Google: 58.0 km) | 2026-10-26 |
| `SOL-TOT` | $59.3$  |     $52.0$     |   58.9 / 55.8   | Pan-American Highway/CA-1                            | `alternativa` | **$59.3$**  | OSRM (coincide con una ruta alternativa de Google: 58.9 km) | 2026-10-26 |
| `SOL-SUC` | $117.2$ |    $117.0$     |  78.6 / 133.0   | RN-11 y CA-2                                         | `recomendada` | **$117.2$** | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |
| `REU-SUC` | $25.5$  |     $25.8$     |   25.4 / 27.5   | CA-2                                                 | `recomendada` | **$25.5$**  | OSRM (coincide con la ruta recomendada de Google ±10 %)     | 2026-10-26 |

---

## 3. Distancias Calculadas por el Algoritmo de Dijkstra (`GUA` $\to$ 21 Cabeceras)

Con los pesos definitivos validados sobre la red de 49 aristas de [`src/data/guatemala.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala.json), el algoritmo de Dijkstra ejecutado desde la sede central en **Ciudad de Guatemala (`GUA`)** genera la siguiente tabla determinista hacia las 21 cabeceras departamentales restantes:

| Destino (Cabecera)        | Código | Distancia Dijkstra ($ ext{km}$) | Secuencia Óptima de Trayecto ($GUA o \dots o Destino$) | Carreteras Principales del Trayecto                        |
| :------------------------ | :----: | :-----------------------------: | :----------------------------------------------------- | :--------------------------------------------------------- |
| **Antigua Guatemala**     | `SAC`  |           **$37.8$**            | `GUA -> SAC`                                           | CA-1 Occ                                                   |
| **Chimaltenango**         | `CHI`  |           **$52.2$**            | `GUA -> CHI`                                           | CA-1 Occ                                                   |
| **Escuintla**             | `ESC`  |           **$57.7$**            | `GUA -> ESC`                                           | CA-9 Sur / CA-9 Sur A                                      |
| **Cuilapa**               | `SRO`  |           **$67.3$**            | `GUA -> SRO`                                           | CA-1 Or                                                    |
| **Guastatoya**            | `PRO`  |           **$74.3$**            | `GUA -> PRO`                                           | CA-9 Nor                                                   |
| **Salamá**                | `BVE`  |           **$89.0$**            | `GUA -> BVE`                                           | RD BV-12 / RD GUA-12                                       |
| **Jalapa**                | `JAL`  |           **$99.1$**            | `GUA -> JAL`                                           | CA-9 Nor / RN-19                                           |
| **Jutiapa**               | `JUT`  |           **$123.3$**           | `GUA -> SRO -> JUT`                                    | CA-1 Or                                                    |
| **Sololá**                | `SOL`  |           **$137.6$**           | `GUA -> CHI -> SOL`                                    | CA-1 Occ / RN-1                                            |
| **Zacapa**                | `ZAC`  |           **$149.9$**           | `GUA -> PRO -> ZAC`                                    | CA-9 Nor / CA-9 Nor / RD PRO-01                            |
| **Cobán**                 | `AVE`  |           **$158.0$**           | `GUA -> BVE -> AVE`                                    | RD BV-12 / RD GUA-12 / CA-14 / RN-5                        |
| **Mazatenango**           | `SUC`  |           **$160.2$**           | `GUA -> ESC -> SUC`                                    | CA-9 Sur / CA-9 Sur A / CA-02 OCC                          |
| **Santa Cruz del Quiché** | `QUI`  |           **$160.7$**           | `GUA -> CHI -> QUI`                                    | CA-1 Occ / CA-1 Occ / RN-15                                |
| **Chiquimula**            | `CHQ`  |           **$174.1$**           | `GUA -> PRO -> ZAC -> CHQ`                             | CA-9 Nor / CA-9 Nor / RD PRO-01 / CA-10                    |
| **Retalhuleu**            | `REU`  |           **$185.7$**           | `GUA -> ESC -> SUC -> REU`                             | CA-9 Sur / CA-9 Sur A / CA-02 OCC / CA-2 OCC               |
| **Totonicapán**           | `TOT`  |           **$196.9$**           | `GUA -> CHI -> QUI -> TOT`                             | CA-1 Occ / CA-1 Occ / RN-15 / RD QUI-04                    |
| **Quetzaltenango**        | `QUE`  |           **$217.0$**           | `GUA -> CHI -> SOL -> QUE`                             | CA-1 Occ / RN-1                                            |
| **Huehuetenango**         | `HUE`  |           **$240.1$**           | `GUA -> CHI -> QUI -> HUE`                             | CA-1 Occ / CA-1 Occ / RN-15 / RN-15 / RD QUI-22            |
| **San Marcos**            | `SMA`  |           **$266.6$**           | `GUA -> CHI -> SOL -> QUE -> SMA`                      | CA-1 Occ / RN-1                                            |
| **Puerto Barrios**        | `IZA`  |           **$322.0$**           | `GUA -> PRO -> ZAC -> IZA`                             | CA-9 Nor / CA-9 Nor / RD PRO-01                            |
| **Flores**                | `PET`  |           **$415.3$**           | `GUA -> BVE -> AVE -> PET`                             | RD BV-12 / RD GUA-12 / CA-14 / RN-5 / RD PET-11 / RD AV-09 |

---

## 4. Estado de Fuentes Oficiales

Durante la auditoría de fuentes primarias (realizada en octubre de 2026), se consultaron formalmente los portales y repositorios digitales gubernamentales:

- **Ministerio de Comunicaciones, Infraestructura y Vivienda (CIV):** Portal oficial [https://civ.gob.gt/](https://civ.gob.gt/).
- **Dirección General de Caminos (DGC) — Departamento de Ingeniería de Tránsito:** Cartografía y mapas de la red vial nacional por departamentos: [https://www.caminos.gob.gt/Descargas/Mapas/Departamentos/Mapa-Guatemala2014.pdf](https://www.caminos.gob.gt/Descargas/Mapas/Departamentos/Mapa-Guatemala2014.pdf).
- **Punto de Origen del Kilometraje Nacional:** El único dato técnico oficial y explícito que figura en la documentación cartográfica publicada de la DGC es que el origen del kilometraje de las carreteras del país (Kilómetro 0) está fijado en una plaqueta de bronce ubicada frente a la fachada del Palacio Nacional de la Cultura (Plaza de la Constitución, Zona 1, Ciudad de Guatemala). No existe publicada una tabla oficial verificable de distancias desde la capital a todas las cabeceras.
- **Determinismo Computacional:** En ausencia de tablas oficiales completas de la DGC, el cálculo algorítmico mediante Dijkstra sobre la red vial validada con Google Maps constituye la referencia matemática y reproducible de mayor exactitud disponible.

---

## 5. Métricas de Red y Árbol de Expansión Mínima (AEM / MST)

- **Total de Nodos:** $22$ cabeceras departamentales.
- **Total de Aristas:** $49$ carreteras directas.
- **Conexidad:** $100\,\%$ conexo ($1$ sola componente).
- **Peso Total del AEM (Prim y Kruskal):** **$1425.3\text{ km}$** ($21$ aristas troncales).
- **Verificación contra NetworkX:** $100\,\%$ de coincidencia en todos los pares de caminos mínimos ($1\,168 / 1\,168$) y en el total del AEM ($10 / 10$ datasets).
