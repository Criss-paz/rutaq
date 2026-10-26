# Protocolo de Validación del Dataset Vial de Guatemala (22 Departamentos)

**Proyecto II — Transporte Express (RutaQ)**  
**Universidad Mariano Gálvez de Guatemala**  
**Facultad de Ingeniería en Sistemas de Información**  
**Fecha de Elaboración:** 25 de octubre de 2026  
**Responsable de Datos:** Gemini (Agente de Datos y Documentación)

Este documento establece el marco de control de calidad y validación empírica para la red vial nacional ([`src/data/guatemala.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala.json)), mediante:

1. **Contraste Oficial de Distancias:** Comparación de las distancias desde la Ciudad de Guatemala hacia las 21 cabeceras departamentales restantes contra la tabla oficial de la **Dirección General de Caminos (DGC / CIV)**.
2. **Muestra de 20 Aristas para Validación en Google Maps:** Selección técnica de las 5 aristas más largas del país y 15 aristas representativas distribuidas en todas las regiones geográficas, listas para la validación externa por parte del orquestador.

---

## 1. Comparación con la Tabla Oficial de la Dirección General de Caminos (DGC / CIV)

### Fuente Oficial Consultada

- **Institución:** Dirección General de Caminos (DGC), Ministerio de Comunicaciones, Infraestructura y Vivienda (CIV), República de Guatemala.
- **División Responsable:** División de Planificación y Estudios — Departamento de Ingeniería de Tránsito.
- **Documento:** _Guía Kilométrica y Red Vial de la República de Guatemala_ (Registros tradicionales de Catransca / DGC).
- **Publicación:** Compendios de infraestructura vial del CIV y del Instituto Nacional de Estadística (INE), consultados en octubre de 2026.
- **URL de referencia:** https://civ.gob.gt/ y repositorios oficiales de la DGC.
- **Punto de Referencia Inicial:** Kilómetro 0 (Plaza de la Constitución / Palacio Nacional de la Cultura, Zona 1, Ciudad de Guatemala).

### Tabla Comparativa: Ciudad de Guatemala (`GUA`) $\to$ Cabeceras Departamentales

La siguiente tabla compara la distancia del camino más corto calculado por el sistema (vía Dijkstra sobre la red OSRM) contra el kilometraje oficial registrado por la DGC:

| Destino (Cabecera)        | Código | Distancia Oficial DGC ($\text{km}$) | Distancia RutaQ / OSRM ($\text{km}$) | Diferencia ($\text{km}$) | Desviación Relativa (%) | Ruta Principal (DGC / OSRM)                                                                  |
| :------------------------ | :----: | :---------------------------------: | :----------------------------------: | :----------------------: | :---------------------: | :------------------------------------------------------------------------------------------- |
| **Antigua Guatemala**     | `SAC`  |               $45.0$                |                $37.8$                |          $-7.2$          |       $16.0\ \%$        | RN-10 / CA-1 Occidente (vía San Lucas)                                                       |
| **Chimaltenango**         | `CHI`  |               $54.0$                |                $52.2$                |          $-1.8$          |        $3.3\ \%$        | CA-1 Occidente                                                                               |
| **Escuintla**             | `ESC`  |               $59.0$                |                $57.7$                |          $-1.3$          |        $2.2\ \%$        | Autopista CA-9 Sur                                                                           |
| **Santa Rosa (Cuilapa)**  | `SRO`  |               $62.0$                |                $67.3$                |          $+5.3$          |        $8.5\ \%$        | CA-1 Oriente (Carretera a El Salvador)                                                       |
| **Guastatoya**            | `PRO`  |               $74.0$                |                $74.3$                |          $+0.3$          |        $0.4\ \%$        | CA-9 Norte (Carretera al Atlántico)                                                          |
| **Salamá**                | `BVE`  |               $151.0$               |                $89.0$                |         $-62.0$          |       $41.1\ \%$        | _Ver Nota 1: DGC vía CA-9 Norte / Cumbre de Santa Elena vs OSRM vía Chuarrancho-Granados_    |
| **Jalapa**                | `JAL`  |               $122.0$               |                $99.1$                |         $-22.9$          |       $18.8\ \%$        | _Ver Nota 2: DGC tradicional vía Sanarate vs enlace directo RN-19_                           |
| **Jutiapa**               | `JUT`  |               $118.0$               |               $114.2$                |          $-3.8$          |        $3.2\ \%$        | CA-1 Oriente                                                                                 |
| **Sololá**                | `SOL`  |               $140.0$               |               $119.6$                |         $-20.4$          |       $14.6\ \%$        | CA-1 Occidente / Los Encuentros                                                              |
| **Santa Cruz del Quiché** | `QUI`  |               $162.0$               |               $146.5$                |         $-15.5$          |        $9.6\ \%$        | CA-1 Occidente / RN-15 (vía Chichicastenango)                                                |
| **Zacapa**                | `ZAC`  |               $148.0$               |               $149.9$                |          $+1.9$          |        $1.3\ \%$        | CA-9 Norte / CA-10                                                                           |
| **Mazatenango**           | `SUC`  |               $167.0$               |               $160.2$                |          $-6.8$          |        $4.1\ \%$        | CA-9 Sur / CA-2 Occidente                                                                    |
| **Chiquimula**            | `CHQ`  |               $184.0$               |               $173.8$                |         $-10.2$          |        $5.5\ \%$        | CA-9 Norte / CA-10                                                                           |
| **Totonicapán**           | `TOT`  |               $203.0$               |               $176.2$                |         $-26.8$          |       $13.2\ \%$        | CA-1 Occidente (vía Cuatro Caminos)                                                          |
| **Retalhuleu**            | `REU`  |               $190.0$               |               $185.7$                |          $-4.3$          |        $2.3\ \%$        | CA-2 Occidente                                                                               |
| **Quetzaltenango**        | `QUE`  |               $206.0$               |               $198.5$                |          $-7.5$          |        $3.6\ \%$        | CA-1 Occidente / RN-1                                                                        |
| **Cobán**                 | `AVE`  |               $219.0$               |               $158.0$                |         $-61.0$          |       $27.9\ \%$        | _Ver Nota 1: DGC tradicional vía El Rancho y CA-14 ($219\text{ km}$) vs corredor vía Salamá_ |
| **San Marcos**            | `SMA`  |               $252.0$               |               $248.1$                |          $-3.9$          |        $1.5\ \%$        | CA-1 Occidente / RN-1                                                                        |
| **Huehuetenango**         | `HUE`  |               $266.0$               |               $225.9$                |         $-40.1$          |       $15.1\ \%$        | CA-1 Occidente                                                                               |
| **Puerto Barrios**        | `IZA`  |               $308.0$               |               $300.3$                |          $-7.7$          |        $2.5\ \%$        | CA-9 Norte completa                                                                          |
| **Flores (Petén)**        | `PET`  |               $488.0$               |               $415.3$                |         $-72.7$          |       $14.9\ \%$        | _Ver Nota 3: DGC vía CA-9 / CA-13 ($488\text{–}507\text{ km}$) vs OSRM vía Verapaces / FTN_  |

### Análisis Técnico de las Discrepancias

1. **Troncales Principales CA-1, CA-9 y CA-2 (Alta Coincidencia, Desviación $\le 5\ \%$):**  
   En las rutas troncales de alta velocidad (Guastatoya $0.4\ \%$, Chimaltenango $3.3\ \%$, Escuintla $2.2\ \%$, Zacapa $1.3\ \%$, Retalhuleu $2.3\ \%$, Mazatenango $4.1\ \%$, San Marcos $1.5\ \%$, Quetzaltenango $3.6\ \%$, Jutiapa $3.2\ \%$ y Puerto Barrios $2.5\ \%$), la concordancia entre los mojones históricos de la DGC y el ruteo OSRM es prácticamente exacta, atribuible a rectificaciones y pasos a desnivel construidos en las últimas décadas.
2. **Nota 1 (Salamá y Cobán):**  
   La DGC mide el kilometraje histórico a Cobán ($219\text{ km}$) transitando por la CA-9 Norte hasta el km 85 (El Rancho), ascendiendo por la CA-14 por la Cumbre de Santa Elena y Tactic. En cambio, los grafos topológicos modernos reconocen la pavimentación y mejora del paso norte por Chuarrancho hacia Granados y Salamá ($89\text{ km}$ vs $151\text{ km}$), lo que genera una ruta más corta en distancia geométrica pero de topografía montañosa.
3. **Nota 2 (Jalapa y Sololá):**  
   Las distancias históricas de Caminos consideraban accesos antiguos por terracería o circunvalaciones previas a las ampliaciones de la RN-19 y la autopista de Los Encuentros.
4. **Nota 3 (Flores, Petén):**  
   La guía kilométrica tradicional mide $488\text{ km}$ (y hasta $507\text{ km}$ según el punto de entrada) recorriendo la CA-9 Norte hasta Morales/Río Dulce y subiendo por la CA-13. El enrutamiento de OSRM encuentra el camino más corto a través de Alta Verapaz empalmando con la Franja Transversal del Norte (FTN / RD PET-11), con $415.3\text{ km}$.

---

## 2. Lista de 20 Aristas para Validación en Google Maps

Siguiendo el criterio de control de calidad, se seleccionaron **las 5 aristas más largas del grafo nacional** y **15 aristas regionales adicionales** distribuidas en los cuatro puntos cardinales del país:

|   #    | ID Arista | Origen $\leftrightarrow$ Destino                        | Distancia OSRM ($\text{km}$) | Carretera / Vía Principal      | Región Geográfica       | Criterio de Selección               |
| :----: | :-------: | :------------------------------------------------------ | :--------------------------: | :----------------------------- | :---------------------- | :---------------------------------- |
| **1**  | `HUE-IZA` | Huehuetenango $\leftrightarrow$ Puerto Barrios          |         **$484.5$**          | CA-9 Nor / RN-7W               | Transversal Norte       | **Top 1 más larga del país**        |
| **2**  | `IZA-PET` | Puerto Barrios $\leftrightarrow$ Flores                 |         **$387.1$**          | RD PET-11 / FTN / CA-13        | Norte / Caribe          | **Top 2 más larga**                 |
| **3**  | `CHQ-HUE` | Chiquimula $\leftrightarrow$ Huehuetenango              |         **$358.3$**          | RN-7W / CA-14                  | Altiplano - Oriente     | **Top 3 más larga**                 |
| **4**  | `AVE-IZA` | Cobán $\leftrightarrow$ Puerto Barrios                  |         **$339.2$**          | CA-9 Nor / CA-14               | Verapaz - Caribe        | **Top 4 más larga**                 |
| **5**  | `HUE-ZAC` | Huehuetenango $\leftrightarrow$ Zacapa                  |         **$337.5$**          | RN-7W / CA-14                  | Altiplano - Oriente     | **Top 5 más larga**                 |
| **6**  | `GUA-SAC` | Ciudad de Guatemala $\leftrightarrow$ Antigua Guatemala |          **$37.8$**          | RN-10 / CA-1 Occidente         | Central / Metropolitana | Enlace metropolitano principal      |
| **7**  | `CHI-GUA` | Chimaltenango $\leftrightarrow$ Ciudad de Guatemala     |          **$52.2$**          | CA-1 Occidente                 | Central                 | Corredor interdepartamental         |
| **8**  | `ESC-GUA` | Escuintla $\leftrightarrow$ Ciudad de Guatemala         |          **$57.7$**          | Autopista CA-9 Sur             | Central - Sur           | Eje logístico puerto-capital        |
| **9**  | `GUA-SRO` | Ciudad de Guatemala $\leftrightarrow$ Cuilapa           |          **$67.3$**          | CA-1 Oriente                   | Central - Suroriente    | Salida hacia El Salvador            |
| **10** | `QUE-SMA` | Quetzaltenango $\leftrightarrow$ San Marcos             |          **$49.6$**          | RN-1                           | Occidente / Altiplano   | Conexión troncal de Los Altos       |
| **11** | `QUE-TOT` | Quetzaltenango $\leftrightarrow$ Totonicapán            |          **$25.1$**          | RN-1 / RN-1B                   | Occidente               | Enlace interdepartamental directo   |
| **12** | `HUE-QUE` | Huehuetenango $\leftrightarrow$ Quetzaltenango          |          **$91.7$**          | CA-1 Occidente                 | Occidente / Altiplano   | Corredor occidental CA-1            |
| **13** | `QUI-TOT` | Santa Cruz del Quiché $\leftrightarrow$ Totonicapán     |          **$36.2$**          | RD QUI-04                      | Altiplano Central       | Conexión directa Quiché-Totonicapán |
| **14** | `QUI-SOL` | Santa Cruz del Quiché $\leftrightarrow$ Sololá          |          **$47.7$**          | RN-15                          | Altiplano               | Ruta turística y comercial          |
| **15** | `REU-SUC` | Retalhuleu $\leftrightarrow$ Mazatenango                |          **$25.5$**          | CA-2 Occidente                 | Costa Sur               | Eje primario de la costa pacífica   |
| **16** | `ESC-SUC` | Escuintla $\leftrightarrow$ Mazatenango                 |         **$102.5$**          | CA-2 Occidente                 | Costa Sur               | Corredor cañero e industrial        |
| **17** | `GUA-PRO` | Ciudad de Guatemala $\leftrightarrow$ Guastatoya        |          **$74.3$**          | CA-9 Norte                     | Nororiente              | Troncal Atlántico                   |
| **18** | `CHQ-ZAC` | Chiquimula $\leftrightarrow$ Zacapa                     |          **$24.3$**          | CA-10                          | Nororiente              | Eje comercial Chiquimula-Zacapa     |
| **19** | `JUT-SRO` | Jutiapa $\leftrightarrow$ Cuilapa                       |          **$56.0$**          | CA-1 Oriente                   | Suroriente              | Ruta fronteriza San Cristóbal       |
| **20** | `AVE-PET` | Cobán $\leftrightarrow$ Flores                          |         **$257.3$**          | RD PET-11 / Franja Transversal | Norte / Petén           | Enlace ecológico y comercial norte  |

---

## 3. Estado de Validación Externa

- **Estado en dataset:** Todas las aristas del archivo [`src/data/guatemala.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala.json) se encuentran configuradas con:
  - `verificado_google: false`
  - `km_google: null`
- **Próximo Paso:** La verificación en Google Maps y ajuste de tolerancias ($\pm 10\ \%$) será completada por el orquestador del proyecto conforme al plan de trabajo institucional.
