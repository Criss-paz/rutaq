# Protocolo de Validación del Dataset Vial de Guatemala (22 Departamentos)

**Proyecto II — Transporte Express (RutaQ)**  
**Universidad Mariano Gálvez de Guatemala**  
**Facultad de Ingeniería en Sistemas de Información**  
**Fecha de Elaboración:** 26 de octubre de 2026  
**Responsable de Datos:** Gemini (Agente de Datos y Documentación)

Este documento establece el marco de control de calidad y validación empírica para la red vial nacional ([`src/data/guatemala.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala.json)), mediante:

1. **Estado de Fuentes Oficiales de Kilometraje y Validación Dijkstra:** Documentación técnica sobre la búsqueda de tablas oficiales publicadas y el cálculo algorítmico determinista de las distancias desde la Ciudad de Guatemala (`GUA`) hacia las 21 cabeceras departamentales restantes mediante el algoritmo de Dijkstra.
2. **Muestra de 20 Aristas para Validación en Google Maps:** Selección técnica de las 5 aristas más largas del grafo nacional y 15 aristas representativas distribuidas en todas las regiones geográficas del país, listas para la validación externa por parte del orquestador.

---

## 1. Estado de Fuentes Oficiales y Distancias Calculadas por el Programa (Dijkstra)

### Estado de las Tablas Oficiales Publicadas

No se encontró publicada una tabla oficial verificable de la Dirección General de Caminos (DGC) con distancias de la Ciudad de Guatemala a cada cabecera.

Durante la auditoría de fuentes primarias (realizada el 26 de octubre de 2026), se consultaron formalmente los portales y repositorios digitales gubernamentales:

- **Ministerio de Comunicaciones, Infraestructura y Vivienda (CIV):** Portal oficial [https://civ.gob.gt/](https://civ.gob.gt/) (consultado el 26 de octubre de 2026).
- **Dirección General de Caminos (DGC) — Departamento de Ingeniería de Tránsito:** Cartografía y mapas de la red vial nacional por departamentos: [https://www.caminos.gob.gt/Descargas/Mapas/Departamentos/Mapa-Guatemala2014.pdf](https://www.caminos.gob.gt/Descargas/Mapas/Departamentos/Mapa-Guatemala2014.pdf) (consultado el 26 de octubre de 2026).
- **Punto de Origen del Kilometraje Nacional:** El único dato técnico oficial y explícito que figura en la documentación cartográfica publicada de la DGC es que el origen del kilometraje de las carreteras del país (Kilómetro 0) está fijado en una plaqueta de bronce ubicada frente a la fachada del Palacio Nacional de la Cultura (Plaza de la Constitución, Zona 1, Ciudad de Guatemala).
- **Evaluación de Fuentes Terciarias:** Las listas o compendios que circulan en plataformas web como Scribd, Studocu o PDFCoffee corresponden a transcripciones de terceros (algunas citando estudios gremiales antiguos de CATRANSCA) que carecen de fecha de expedición, sellos oficiales o trazabilidad metodológica verificable. En consecuencia, y en estricto cumplimiento del principio de reproducibilidad y datos trazables de RutaQ, se descarta el uso de cualquier cifra no verificable.

### Distancias Calculadas por el Algoritmo de Dijkstra (`GUA` $\to$ Cabeceras Departamentales)

En su lugar, el sistema calcula de forma determinista el camino de distancia mínima sobre la red vial nacional conectada ([`src/data/guatemala.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala.json)) mediante el **Algoritmo de Dijkstra**, utilizando el peso de cada arista obtenido de OpenStreetMap / OSRM.

A continuación se presentan las distancias calculadas desde la Ciudad de Guatemala (`GUA`) hacia las 21 cabeceras restantes, acompañadas de la secuencia óptima de departamentos y la columna para validación externa en Google Maps:

| Destino (Cabecera)        | Código | Distancia RutaQ / Dijkstra ($\text{km}$) | Secuencia Óptima de Trayecto ($GUA \to \dots \to Destino$) | Carreteras Principales del Trayecto     | Distancia Google Maps ($\text{km}$) |
| :------------------------ | :----: | :--------------------------------------: | :--------------------------------------------------------- | :-------------------------------------- | :---------------------------------: |
| **Antigua Guatemala**     | `SAC`  |                  $37.8$                  | `GUA -> SAC`                                               | CA-1 Occ                                |             _Pendiente_             |
| **Chimaltenango**         | `CHI`  |                  $56.8$                  | `GUA -> SAC -> CHI`                                        | CA-1 Occ                                |             _Pendiente_             |
| **Escuintla**             | `ESC`  |                  $57.7$                  | `GUA -> ESC`                                               | CA-9 Sur / CA-9 Sur A                   |             _Pendiente_             |
| **Cuilapa (Santa Rosa)**  | `SRO`  |                  $67.3$                  | `GUA -> SRO`                                               | CA-1 Or                                 |             _Pendiente_             |
| **Guastatoya**            | `PRO`  |                  $74.3$                  | `GUA -> PRO`                                               | CA-9 Nor                                |             _Pendiente_             |
| **Salamá**                | `BVE`  |                  $89.0$                  | `GUA -> BVE`                                               | RD BV-12 / RD GUA-12                    |             _Pendiente_             |
| **Jutiapa**               | `JUT`  |                 $123.3$                  | `GUA -> SRO -> JUT`                                        | CA-1 Or                                 |             _Pendiente_             |
| **Sololá**                | `SOL`  |                 $126.0$                  | `GUA -> SAC -> CHI -> SOL`                                 | CA-1 Occ / RN-1                         |             _Pendiente_             |
| **Jalapa**                | `JAL`  |                 $126.3$                  | `GUA -> PRO -> JAL`                                        | CA-9 Nor / RN-19                        |             _Pendiente_             |
| **Zacapa**                | `ZAC`  |                 $149.9$                  | `GUA -> PRO -> ZAC`                                        | CA-9 Nor / RD PRO-01                    |             _Pendiente_             |
| **Cobán**                 | `AVE`  |                 $158.0$                  | `GUA -> BVE -> AVE`                                        | RD BV-12 / CA-14 / RN-5                 |             _Pendiente_             |
| **Mazatenango**           | `SUC`  |                 $160.2$                  | `GUA -> ESC -> SUC`                                        | CA-9 Sur / CA-02 OCC                    |             _Pendiente_             |
| **Santa Cruz del Quiché** | `QUI`  |                 $165.3$                  | `GUA -> SAC -> CHI -> QUI`                                 | CA-1 Occ / RN-15                        |             _Pendiente_             |
| **Chiquimula**            | `CHQ`  |                 $174.1$                  | `GUA -> PRO -> ZAC -> CHQ`                                 | CA-9 Nor / CA-10                        |             _Pendiente_             |
| **Totonicapán**           | `TOT`  |                 $185.3$                  | `GUA -> SAC -> CHI -> SOL -> TOT`                          | CA-1 Occ / RN-1                         |             _Pendiente_             |
| **Retalhuleu**            | `REU`  |                 $185.7$                  | `GUA -> ESC -> SUC -> REU`                                 | CA-9 Sur / CA-02 OCC / CA-2 OCC         |             _Pendiente_             |
| **Quetzaltenango**        | `QUE`  |                 $210.4$                  | `GUA -> SAC -> CHI -> SOL -> TOT -> QUE`                   | CA-1 Occ / RN-1 / RN-1B                 |             _Pendiente_             |
| **Huehuetenango**         | `HUE`  |                 $244.7$                  | `GUA -> SAC -> CHI -> QUI -> HUE`                          | CA-1 Occ / RN-15 / RD QUI-22            |             _Pendiente_             |
| **San Marcos**            | `SMA`  |                 $260.0$                  | `GUA -> SAC -> CHI -> SOL -> TOT -> QUE -> SMA`            | CA-1 Occ / RN-1                         |             _Pendiente_             |
| **Puerto Barrios**        | `IZA`  |                 $322.0$                  | `GUA -> PRO -> ZAC -> IZA`                                 | CA-9 Nor                                |             _Pendiente_             |
| **Flores (Petén)**        | `PET`  |                 $415.3$                  | `GUA -> BVE -> AVE -> PET`                                 | RD BV-12 / CA-14 / RD PET-11 / RD AV-09 |             _Pendiente_             |

---

## 2. Lista de 20 Aristas para Validación en Google Maps

De acuerdo con el protocolo técnico, se seleccionaron **las 5 aristas más largas del grafo nacional** y **15 aristas representativas distribuidas en todas las regiones geográficas**, correspondientes a la nueva red vial de 36 conexiones directas entre departamentos vecinos:

|   #    | ID Arista | Origen $\leftrightarrow$ Destino                        | Distancia OSRM ($\text{km}$) | Carretera / Vía Principal | Región Geográfica         | Criterio de Selección               | Distancia Google Maps ($\text{km}$) |
| :----: | :-------: | :------------------------------------------------------ | :--------------------------: | :------------------------ | :------------------------ | :---------------------------------- | :---------------------------------: |
| **1**  | `AVE-PET` | Cobán $\leftrightarrow$ Flores                          |         **$257.3$**          | RD PET-11 / RD AV-09      | Norte / Transversal Norte | **Top 1 más larga del país**        |             _Pendiente_             |
| **2**  | `IZA-ZAC` | Puerto Barrios $\leftrightarrow$ Zacapa                 |         **$172.1$**          | CA-9 Nor                  | Nororiente / Caribe       | **Top 2 más larga**                 |             _Pendiente_             |
| **3**  | `AVE-QUI` | Cobán $\leftrightarrow$ Santa Cruz del Quiché           |         **$165.9$**          | RN-7W / RN-15             | Norte - Altiplano         | **Top 3 más larga**                 |             _Pendiente_             |
| **4**  | `BVE-QUI` | Salamá $\leftrightarrow$ Santa Cruz del Quiché          |         **$128.6$**          | RD QUI-2 / RN-5           | Verapaz - Altiplano       | **Top 4 más larga**                 |             _Pendiente_             |
| **5**  | `CHI-SUC` | Chimaltenango $\leftrightarrow$ Mazatenango             |         **$122.3$**          | CA-02 OCC / RN-10         | Central - Costa Sur       | **Top 5 más larga**                 |             _Pendiente_             |
| **6**  | `GUA-SAC` | Ciudad de Guatemala $\leftrightarrow$ Antigua Guatemala |          **$37.8$**          | CA-1 Occ                  | Central / Metropolitana   | Enlace metropolitano principal      |             _Pendiente_             |
| **7**  | `ESC-GUA` | Escuintla $\leftrightarrow$ Ciudad de Guatemala         |          **$57.7$**          | CA-9 Sur / CA-9 Sur A     | Central - Sur             | Eje logístico puerto-capital        |             _Pendiente_             |
| **8**  | `GUA-PRO` | Ciudad de Guatemala $\leftrightarrow$ Guastatoya        |          **$74.3$**          | CA-9 Nor                  | Central - Nororiente      | Troncal al Atlántico                |             _Pendiente_             |
| **9**  | `GUA-SRO` | Ciudad de Guatemala $\leftrightarrow$ Cuilapa           |          **$67.3$**          | CA-1 Or                   | Central - Suroriente      | Troncal al Oriente                  |             _Pendiente_             |
| **10** | `CHI-SAC` | Chimaltenango $\leftrightarrow$ Antigua Guatemala       |          **$19.0$**          | CA-1 Occ / RD SAC-09      | Central                   | Enlace directo Chimaltenango-Sacat. |             _Pendiente_             |
| **11** | `QUE-SMA` | Quetzaltenango $\leftrightarrow$ San Marcos             |          **$49.6$**          | RN-1                      | Occidente / Altiplano     | Conexión troncal de Los Altos       |             _Pendiente_             |
| **12** | `QUE-TOT` | Quetzaltenango $\leftrightarrow$ Totonicapán            |          **$25.1$**          | RN-1 / RN-1B              | Occidente                 | Enlace interdepartamental directo   |             _Pendiente_             |
| **13** | `HUE-QUI` | Huehuetenango $\leftrightarrow$ Santa Cruz del Quiché   |          **$79.4$**          | RN-15 / RD QUI-22         | Occidente / Altiplano     | Corredor Huehuetenango-Quiché       |             _Pendiente_             |
| **14** | `QUI-SOL` | Santa Cruz del Quiché $\leftrightarrow$ Sololá          |          **$47.7$**          | RN-15                     | Altiplano Central         | Ruta comercial y turística          |             _Pendiente_             |
| **15** | `REU-SUC` | Retalhuleu $\leftrightarrow$ Mazatenango                |          **$25.5$**          | CA-2 OCC                  | Costa Sur                 | Eje primario de la costa pacífica   |             _Pendiente_             |
| **16** | `ESC-SUC` | Escuintla $\leftrightarrow$ Mazatenango                 |         **$102.5$**          | CA-02 OCC                 | Costa Sur                 | Corredor industrial costero         |             _Pendiente_             |
| **17** | `CHQ-ZAC` | Chiquimula $\leftrightarrow$ Zacapa                     |          **$24.2$**          | CA-10                     | Nororiente                | Eje comercial Chiquimula-Zacapa     |             _Pendiente_             |
| **18** | `PRO-ZAC` | Guastatoya $\leftrightarrow$ Zacapa                     |          **$75.6$**          | CA-9 Nor / RD PRO-01      | Nororiente                | Corredor del Motagua                |             _Pendiente_             |
| **19** | `JUT-SRO` | Jutiapa $\leftrightarrow$ Cuilapa                       |          **$56.0$**          | CA-1 Or                   | Suroriente                | Troncal fronteriza San Cristóbal    |             _Pendiente_             |
| **20** | `AVE-BVE` | Cobán $\leftrightarrow$ Salamá                          |          **$69.0$**          | CA-14 / RN-5              | Verapaces                 | Eje integrador de las Verapaces     |             _Pendiente_             |

---

## 3. Estado de Validación Externa

- **Estado en dataset:** Todas las aristas del archivo [`src/data/guatemala.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala.json) se encuentran configuradas con:
  - `verificado_google: false`
  - `km_google: null`
- **Trazabilidad:** La columna _Distancia Google Maps_ de las secciones 1 y 2 queda dispuesta para ser completada por el orquestador o evaluador externo mediante mediciones directas en Google Maps sobre las mismas cabeceras georreferenciadas.
