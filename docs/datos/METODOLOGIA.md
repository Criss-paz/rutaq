# Metodología de Construcción del Dataset Vial de Quetzaltenango

Este documento detalla los principios metodológicos, fuentes consultadas, criterios topológicos de conectividad y decisiones técnicas adoptadas para generar el dataset oficial de la red vial del departamento de Quetzaltenango (`src/data/quetzaltenango.json`), insumo fundamental del proyecto **RutaQ**.

---

## 1. Fuentes Oficiales y Trazabilidad

Todos los datos utilizados en la red son reales, trazables y reproducibles mediante scripts automatizados:

1. **División Político-Administrativa:**
   - **Instituto Nacional de Estadística (INE Guatemala):** Censo Nacional de Población y Vivienda, catálogo oficial de departamentos y municipios de la República de Guatemala.
   - **Secretaría de Planificación y Programación de la Presidencia (SEGEPLAN):** Estrategias de Desarrollo Departamental y Municipal de Quetzaltenango.
   - **Total verificado:** Exactamente 24 municipios que conforman el departamento de Quetzaltenango.

2. **Coordenadas Geográficas (Latitud y Longitud):**
   - **OpenStreetMap / Nominatim API:** Puntos geográficos correspondientes a las cabeceras municipales oficiales (plazas centrales, parques municipales o edificios consistoriales).
   - **Fecha de consulta:** 14 de octubre de 2026.
   - **Política de consulta:** Máximo 1 petición por segundo, cabecera de identificación descriptiva `User-Agent: RutaQ-proyecto-academico`, y almacenamiento persistente en caché local (`scripts/cache/nominatim/`).

3. **Distancias Viales y Trazado de Rutas:**
   - **Project OSRM (Open Source Routing Machine) Car Routing:** Servicio de cálculo de rutas óptimas por carretera (`router.project-osrm.org/route/v1/driving/...`).
   - **Métricas:** Distancia vial en kilómetros redondeada a un decimal ($km > 0$).
   - **Geometría:** Polyline codificada (precisión 5) simplificada mediante el algoritmo Ramer-Douglas-Peucker (RDP) para mantener ligereza computacional y fidelidad visual.
   - **Políticas de consulta:** Respeto estricto del límite del servidor público (máximo 1 req/s) y almacenamiento de respuestas en caché local (`scripts/cache/osrm/`).

4. **Nomenclatura Vial:**
   - **Ministerio de Comunicaciones, Infraestructura y Vivienda (MICIVI / Dirección General de Caminos - DGC):** Clasificación de la red vial nacional en carreteras centroamericanas (CA), rutas nacionales (RN) y rutas departamentales (RD).

---

## 2. Catálogo Oficial de los 24 Municipios (Nodos)

Se asignaron identificadores únicos y estables de 3 letras en mayúscula (`NodeId`):

|  ID   | Nombre Oficial del Municipio | Latitud (°N) | Longitud (°O) | Clasificación Geográfica    | Fuente de Coordenadas     |
| :---: | :--------------------------- | :----------: | :-----------: | :-------------------------- | :------------------------ |
| `QTZ` | Quetzaltenango               |   14.84646   |   -91.51942   | Altiplano / Cabecera Dptal. | Nominatim / OpenStreetMap |
| `SAL` | Salcajá                      |   14.87911   |   -91.45754   | Valle de Los Altos          | Nominatim / OpenStreetMap |
| `OLI` | Olintepeque                  |   14.88514   |   -91.51479   | Valle de Los Altos          | Nominatim / OpenStreetMap |
| `SIJ` | San Carlos Sija              |   14.98369   |   -91.54905   | Altiplano Norte             | Nominatim / OpenStreetMap |
| `SIB` | Sibilia                      |   14.99416   |   -91.62418   | Altiplano Noroccidental     | Nominatim / OpenStreetMap |
| `CAB` | Cabricán                     |   15.07470   |   -91.64844   | Extremo Norte               | Nominatim / OpenStreetMap |
| `CAJ` | Cajolá                       |   14.92271   |   -91.61495   | Altiplano Central           | Nominatim / OpenStreetMap |
| `SIG` | San Miguel Sigüilá           |   14.89629   |   -91.60282   | Altiplano Central           | Nominatim / OpenStreetMap |
| `OST` | San Juan Ostuncalco          |   14.86882   |   -91.62163   | Altiplano Occidental        | Nominatim / OpenStreetMap |
| `MAT` | San Mateo                    |   14.85897   |   -91.59253   | Valle de Los Altos          | Nominatim / OpenStreetMap |
| `CCH` | Concepción Chiquirichapa     |   14.85513   |   -91.62396   | Altiplano Occidental        | Nominatim / OpenStreetMap |
| `SMA` | San Martín Sacatepéquez      |   14.82362   |   -91.64263   | Falda Volcánica             | Nominatim / OpenStreetMap |
| `ALM` | Almolonga                    |   14.81498   |   -91.49475   | Cañón del Samalá            | Nominatim / OpenStreetMap |
| `CAN` | Cantel                       |   14.81879   |   -91.43198   | Altiplano Suroriental       | Nominatim / OpenStreetMap |
| `HUI` | Huitán                       |   15.04950   |   -91.63801   | Altiplano Norte             | Nominatim / OpenStreetMap |
| `ZUN` | Zunil                        |   14.78480   |   -91.48480   | Cañón del Samalá            | Nominatim / OpenStreetMap |
| `COL` | Colomba Costa Cuca           |   14.70759   |   -91.73194   | Costa Cuca / Boca Costa     | Nominatim / OpenStreetMap |
| `FLU` | San Francisco La Unión       |   14.92429   |   -91.54333   | Altiplano Norte             | Nominatim / OpenStreetMap |
| `PAL` | El Palmar                    |   14.69381   |   -91.60183   | Boca Costa                  | Nominatim / OpenStreetMap |
| `COA` | Coatepeque                   |   14.70263   |   -91.86564   | Costa Cuca (Pacífico)       | Nominatim / OpenStreetMap |
| `GEN` | Génova                       |   14.62240   |   -91.83562   | Costa Cuca Sur              | Nominatim / OpenStreetMap |
| `FCC` | Flores Costa Cuca            |   14.65606   |   -91.82563   | Costa Cuca Central          | Nominatim / OpenStreetMap |
| `ESP` | La Esperanza                 |   14.86923   |   -91.57130   | Valle de Los Altos          | Nominatim / OpenStreetMap |
| `PLA` | Palestina de Los Altos       |   14.93315   |   -91.69398   | Altiplano Occidental        | Nominatim / OpenStreetMap |

---

## 3. Criterio de Arista Directa

Para modelar con rigor la red vial como un grafo no dirigido $G = (V, E)$, una arista $(A, B)$ se considera **directa** si y solo si:

1. **Existe conexión vehicular continua:** OSRM encuentra una ruta de conducción válida sobre la red vial pública entre las cabeceras $A$ y $B$.
2. **Criterio de no intermediación:** Ningún punto intermedio de la ruta calculada por OSRM pasa a menos de **$1.0\text{ km}$** (distancia geodésica Haversine) de la cabecera municipal de un tercer municipio $C \notin \{A, B\}$.
   - _Fundamento:_ Si la carretera entre $A$ y $B$ atraviesa el centro urbano de $C$, el viaje directo $A \to B$ es topológicamente la composición de dos aristas directas: $(A, C)$ y $(C, B)$. Incluir $A \to B$ como arista simple generaría aristas redundantes que distorsionarían los cálculos de Dijkstra y Floyd-Warshall.
   - _Ejemplo práctico:_ La ruta entre Quetzaltenango (`QTZ`) y San Juan Ostuncalco (`OST`) pasa sucesivamente por La Esperanza (`ESP`) y San Mateo (`MAT`). Por consiguiente, la arista `QTZ-OST` se descompone en `QTZ-ESP`, `ESP-MAT` y `MAT-OST`.
3. **Consistencia de identificación:** El identificador de cada arista sigue el formato estricto `ORIGEN-DESTINO` con los identificadores ordenados alfabéticamente (`min(u, v) - max(u, v)`), garantizando unicidad y ausencia de aristas duplicadas.

---

## 4. Tratamiento de Rutas Interdepartamentales (Costa Cuca y Boca Costa)

El departamento de Quetzaltenango presenta una geografía abrupta dividida por la Sierra Madre en dos regiones no contiguas vialmente dentro de los límites estrictos del departamento:

- **Los Altos:** Meseta templada a más de 2 300 msnm.
- **La Costa Cuca / Boca Costa:** Planicie costera cálida en el suroeste (Coatepeque, Génova, Flores Costa Cuca, Colomba, El Palmar).

Por razones orográficas, las vías que comunican ambas zonas deben atravesar cañones fluviales y valles vecinos:

1. **Ruta Cito-180 (`ZUN-PAL`):** Desciende desde Zunil por el cañón del río Samalá hacia El Palmar; la vía bordea el volcán Santa María saliendo brevemente hacia el norte del departamento de Retalhuleu antes de acceder a El Palmar.
2. **Corredor Costero (`COL-PAL`):** Para conectar El Palmar con Colomba por vías principales asfaltadas, el tránsito desciende a la Carretera Internacional del Pacífico CA-02 en territorio de Retalhuleu y enlaza con la RN-13 hacia Colomba.
3. **Carretera Panamericana (`SAL-SIJ`):** La vía principal CA-01 Occidente comunica Salcajá con San Carlos Sija cruzando el nudo de Cuatro Caminos / Pologuá en el departamento de Totonicapán.

**Decisión metodológica:** De acuerdo con la sección 3.2 (inciso 4) del Plan Maestro, estas rutas **se permiten y se mantienen como aristas directas**, documentando explícitamente en el campo `nota` su tránsito interdepartamental.

---

## 5. Decisiones Técnicas y Control de Calidad

1. **Corrección de Coordenadas de Almolonga:**
   - La consulta genérica inicial en Nominatim arrojó coordenadas correspondientes al Cerro Quemado / Volcán Almolonga en la Zona 12 rural de Quetzaltenango (`class=natural type=volcano`).
   - Se ejecutó un proceso de corrección específica seleccionando la entidad urbana de cabecera municipal (`class=boundary type=administrative / place`), situando el nodo en el fondo del valle agrícola sobre la RN-10 (`14.81498, -91.49475`), lo que resolvió de manera exacta las distancias `ALM-QTZ` (6.8 km) y `ALM-ZUN` (4.8 km).

2. **Simplificación Geométrica Ramer-Douglas-Peucker (RDP):**
   - Las geometrías devueltas por OSRM contienen cientos de vértices por tramo. Se aplicó RDP con una tolerancia $\epsilon = 0.0001^{\circ}$ (~10 metros de desviación lateral).
   - Esto redujo el tamaño del archivo JSON en más del 70 % sin pérdida perceptible del trazado real de las carreteras al proyectarlo en mapas interactivos o lienzos SVG/React Flow.

3. **Verificación de Conectividad:**
   - Se validó con la biblioteca `networkx` que el grafo resultante de 24 nodos y 36 aristas es **100 % conexo** ($\text{is\_connected}(G) = \text{True}$).
   - No existen nodos aislados, lazos (aristas con mismo origen y destino) ni aristas con peso $\le 0$.

---

## 6. Reproducibilidad

El dataset se regenera de forma determinista ejecutando:

```bash
# Activar entorno virtual
.\.venv\Scripts\activate

# Ejecutar constructor reproducible
python scripts/build_dataset.py
```

El script utiliza los archivos almacenados en `scripts/cache/` para garantizar reproducibilidad idéntica y sin sobrecargar los servidores externos.
