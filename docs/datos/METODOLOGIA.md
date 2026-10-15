# Metodología de Construcción del Dataset Vial de Quetzaltenango

Este documento detalla los principios metodológicos, fuentes consultadas, criterios topológicos de conectividad y decisiones técnicas adoptadas para generar de forma 100 % reproducible y guiada por datos el dataset oficial de la red vial del departamento de Quetzaltenango (`src/data/quetzaltenango.json`), insumo fundamental del proyecto **RutaQ**.

---

## 1. Fuentes Oficiales y Trazabilidad

Todos los datos que integran la red provienen de fuentes primarias geográficas verificadas:

1. **División Político-Administrativa:**
   - **Instituto Nacional de Estadística (INE Guatemala):** Censo Nacional de Población y Vivienda, catálogo oficial de departamentos y municipios de la República de Guatemala.
   - **Secretaría de Planificación y Programación de la Presidencia (SEGEPLAN):** Estrategias de Desarrollo Departamental y Municipal de Quetzaltenango.
   - **Total verificado:** Exactamente 24 municipios que conforman el departamento de Quetzaltenango.

2. **Coordenadas Geográficas (Latitud y Longitud de Cabeceras):**
   - **OpenStreetMap / Nominatim API:** Puntos geográficos correspondientes a las cabeceras municipales oficiales (plazas centrales, parques municipales o edificios consistoriales).
   - **Fecha de consulta:** 14 de octubre de 2026.
   - **Política de consulta:** Máximo 1 petición por segundo, cabecera de identificación descriptiva `User-Agent: RutaQ-proyecto-academico`, y almacenamiento persistente en caché local (`scripts/cache/nominatim/`).

3. **Distancias Viales y Trazado de Rutas (OSRM):**
   - **Project OSRM (Open Source Routing Machine) Car Routing:** Servicio de cálculo de rutas por carretera (`router.project-osrm.org/route/v1/driving/...`).
   - **Parámetros de consulta:** `?overview=full&geometries=polyline&steps=true`.
   - **Métricas:** Distancia vial en kilómetros redondeada a un decimal ($km > 0$).
   - **Geometría:** Polyline codificada (precisión 5) simplificada mediante el algoritmo Ramer-Douglas-Peucker (RDP, $\epsilon = 0.0001^\circ \approx 10\text{ m}$) para mantener ligereza computacional y fidelidad visual.
   - **Políticas de consulta:** Respeto estricto del límite del servidor público ($\le 1\text{ req/s}$) y almacenamiento persistente de todas las respuestas en caché local (`scripts/cache/osrm/`).

4. **Límites Departamentales Oficiales:**
   - **Nominatim / OpenStreetMap (Relación OSM 214710 / `addresstype='state'`):** Polígono GeoJSON oficial del departamento de Quetzaltenango (`polygon_geojson=1`), almacenado en `scripts/cache/nominatim/departamento_quetzaltenango.json`.

---

## 2. Catálogo Oficial de los 24 Municipios (Nodos)

Se asignaron identificadores únicos, concisos y estables de 3 letras en mayúscula (`NodeId`):

|  ID   | Nombre Oficial del Municipio | Latitud (°N) | Longitud (°O) | Clasificación Administrativa  | Fuente de Coordenadas                                            |
| :---: | :--------------------------- | :----------: | :-----------: | :---------------------------- | :--------------------------------------------------------------- |
| `QTZ` | Quetzaltenango               |   14.84646   |   -91.51942   | Cabecera departamental (City) | Nominatim / OpenStreetMap                                        |
| `SAL` | Salcajá                      |   14.87911   |   -91.45754   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `OLI` | Olintepeque                  |   14.88514   |   -91.51479   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `SIJ` | San Carlos Sija              |   14.98369   |   -91.54905   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `SIB` | Sibilia                      |   14.99416   |   -91.62418   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `CAB` | Cabricán                     |   15.07470   |   -91.64844   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `CAJ` | Cajolá                       |   14.92271   |   -91.61495   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `SIG` | San Miguel Sigüilá           |   14.89629   |   -91.60282   | Municipio / County            | Nominatim / OpenStreetMap                                        |
| `OST` | San Juan Ostuncalco          |   14.86882   |   -91.62163   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `MAT` | San Mateo                    |   14.85897   |   -91.59253   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `CCH` | Concepción Chiquirichapa     |   14.85513   |   -91.62396   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `SMA` | San Martín Sacatepéquez      |   14.82362   |   -91.64263   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `ALM` | Almolonga                    |   14.81498   |   -91.49475   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `CAN` | Cantel                       |   14.80987   |   -91.45068   | Municipio / County            | Google Maps (lugar «Cantel»), contrastado con Wikipedia          |
| `HUI` | Huitán                       |   15.04950   |   -91.63801   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `ZUN` | Zunil                        |   14.78480   |   -91.48480   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `COL` | Colomba Costa Cuca           |   14.70759   |   -91.73194   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `FLU` | San Francisco La Unión       |   14.92429   |   -91.54333   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `PAL` | El Palmar                    |   14.64807   |   -91.55718   | Municipio / County            | Google Maps (lugar «El Nuevo Palmar»), contrastado con Wikipedia |
| `COA` | Coatepeque                   |   14.70263   |   -91.86564   | Municipio / City              | Nominatim / OpenStreetMap                                        |
| `GEN` | Génova                       |   14.62240   |   -91.83562   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `FCC` | Flores Costa Cuca            |   14.65606   |   -91.82563   | Municipio / Town              | Nominatim / OpenStreetMap                                        |
| `ESP` | La Esperanza                 |   14.86923   |   -91.57130   | Municipio / County            | Nominatim / OpenStreetMap                                        |
| `PLA` | Palestina de Los Altos       |   14.93315   |   -91.69398   | Municipio / Village           | Nominatim / OpenStreetMap                                        |

### Selección y Verificación de Cabeceras

Se comprobó que el campo `display_name` y `addresstype` de Nominatim para los 24 municipios situara el punto dentro del departamento de Quetzaltenango:

- **Caso de Almolonga:** La búsqueda inicial genérica devolvía la cima del Volcán Almolonga (`type=volcano`) en la zona rural alta. Se seleccionó la entidad administrativa de cabecera municipal situada en el valle poblado (`14.81498, -91.49475`), resolviendo la conectividad real sobre la RN-9S hacia Quetzaltenango y Zunil.

### Auditoría y Corrección de Coordenadas (El Palmar y Cantel)

En la auditoría sistemática de coordenadas de las 24 cabeceras municipales contrastando Nominatim (OpenStreetMap), Wikipedia en español (API `prop=coordinates` con caché local persistente en `scripts/cache/wikipedia/`) y Google Maps, consolidada en `docs/datos/auditoria_coordenadas.csv`, se identificaron dos discrepancias críticas:

1. **22 cabeceras consistentes ($\le 1.55\text{ km}$):** En 22 de los 24 municipios, las coordenadas de Nominatim y Wikipedia difieren en menos de $1.55\text{ km}$ (promedio subkilométrico), lo cual corresponde a la variabilidad esperada según el punto exacto seleccionado dentro del casco urbano (parque central, alcaldía o acceso principal).
2. **El Palmar (`PAL`):** Nominatim situaba la cabecera en `14.69381, -91.60183`, punto correspondiente al antiguo casco urbano de El Palmar, destruido y abandonado tras los lahares del volcán Santiaguito. La cabecera oficial contemporánea se encuentra reubicada en **El Nuevo Palmar**: Google Maps `14.6480742, -91.5571834` (consulta «El Palmar, Quetzaltenango, Guatemala» $\to$ lugar «El Nuevo Palmar») y Wikipedia (`14.65, -91.5833`, baja precisión histórica). Discrepancia real acumulada $\approx 6.8\text{ km}$ (error respecto a Wikipedia: $5.26\text{ km}$).
3. **Cantel (`CAN`):** Nominatim marcaba `14.81879, -91.43198` en la periferia este rural, mientras que Google Maps (`14.8098714, -91.450678`, lugar «Cantel») y Wikipedia (`14.81122, -91.45551`) coinciden a escasos $\approx 0.5\text{ km}$ situando la cabecera en el parque central histórico y casco urbano. Nominatim presentaba un desvío de $\approx 2.2\text{ km}$ (error respecto a Wikipedia: $2.67\text{ km}$).

Ambas correcciones se plasmaron en `docs/datos/coordenadas_corregidas.csv` y se integran automáticamente en `scripts/build_dataset.py` inmediatamente después de Nominatim y con prioridad sobre este, actualizando la fuente del nodo a `"Google Maps (lugar «…»), contrastado con Wikipedia"`.

---

## 3. Criterio de Arista Directa (Totalmente Calculado)

Para erradicar cualquier lista manual de aristas y asegurar reproducibilidad matemática estricta:

1. **Universo de pares candidatos:** Se evaluaron de forma exhaustiva los **276 pares no dirigidos** posibles entre los 24 municipios:
   $$\binom{24}{2} = \frac{24 \times 23}{2} = 276\text{ pares candidatos}$$
2. **Criterio de proximidad geométrica punto-segmento:** Para cada par candidato $(A, B)$, se decodificó la geometría completa de la ruta devuelta por OSRM ($P_1, P_2, \dots, P_m$). Un par $(A, B)$ se acepta como **arista directa** si y solo si dicha geometría **NO** pasa a menos de **$1.0\text{ km}$** de la cabecera municipal de ningún otro municipio intermedio $C \notin \{A, B\}$:
   $$\min_{C \notin \{A, B\}} d(C, \text{ruta}(A, B)) \ge 1.0\text{ km}$$
   La distancia $d(C, \text{ruta})$ se calcula proyectando $C$ ortogonalmente sobre cada segmento $[P_k, P_{k+1}]$ y midiendo la distancia esférica Haversine exacta al punto más cercano del segmento.
3. **Registro de descarte:** Todo par que pasa a $< 1.0\text{ km}$ de una cabecera intermedia se rechaza y se almacena en `docs/datos/aristas_descartadas.csv` indicando el origen, destino, municipio intermedio interceptor y la distancia mínima observada.
4. **Resultados del filtrado:**
   - **Pares consultados:** 276
   - **Aristas directas aceptadas:** 50
   - **Pares descartados:** 226
   - **Efecto de la reubicación de PAL y CAN en la topología:** Con las coordenadas corregidas, se reevaluó el criterio de arista directa para todos los 276 pares de OSRM. Cinco aristas directas previas fueron reclasificadas a pares descartados debido a que sus rutas viales ahora intersectan los nuevos cascos urbanos a $< 1.0\text{ km}$:
     1. `CAN-HUI`: la ruta recalculada pasa a $0.076\text{ km}$ de la cabecera de San Carlos Sija (`SIJ`).
     2. `PAL-SMA`: la ruta desde El Nuevo Palmar pasa a $0.097\text{ km}$ de Concepción Chiquirichapa (`CCH`).
     3. `FCC-ZUN`: la ruta hacia Zunil pasa a $0.812\text{ km}$ de la nueva posición de El Palmar (`PAL`).
     4. `QTZ-ZUN`: la ruta por la CITO-180 cruza a $0.291\text{ km}$ del casco central corregido de Cantel (`CAN`).
     5. `SAL-ZUN`: la ruta hacia Zunil cruza igualmente a $0.291\text{ km}$ del casco de Cantel (`CAN`).
   - **Topología resultante:** Grafo 100 % conexo verificado mediante recorrido BFS y `networkx`.

---

## 4. Determinación de Nombres de Carretera (`carretera`)

Siguiendo la regla de no inventar códigos ni nomenclaturas artificiales:

1. Para cada arista aceptada, se inspeccionan los `steps` (tramos de maniobra) devueltos por OSRM.
2. Cada paso aporta un atributo `ref` (referencia oficial de carretera en OSM, p. ej. `RN-1`, `CA-1 Occ`, `CITO 180`) o en su defecto `name` (nombre de vía).
3. Se totaliza la distancia recorrida sobre cada `ref`.
4. Si existen referencias `ref`:
   - Se selecciona la referencia que sume mayor distancia.
   - Si una segunda referencia acumula al menos el 20 % de la distancia total señalizada, se presentan combinadas (p. ej. `"RN-1 / RN-1B"`, `"CITO-180 / RN-1"`, `"CA-2 OCC / RN 13"`).
5. Si ninguna vía tiene `ref`, se toma el `name` con mayor distancia.
6. Si OSRM no provee ni `ref` ni `name`, se asigna cadena vacía `""`. Jamás se introducen códigos no verificados.

---

## 5. Detección de Rutas Interdepartamentales (`nota`)

El relieve quebrado de la Sierra Madre y los cañones del río Samalá obligan a ciertas vías a salir brevemente del contorno de Quetzaltenango para comunicar el altiplano con la costa (Retalhuleu) o cruzar nudos de transporte (Totonicapán, San Marcos):

1. **Cálculo geométrico (punto-en-polígono):**
   - Se carga el polígono oficial del departamento de Quetzaltenango desde Nominatim (`departamento_quetzaltenango.json`, 3 003 vértices).
   - Se evalúa cada vértice de la polyline de la ruta mediante el algoritmo de ray-casting.
2. **Regla de asignación:**
   - Si algún punto de la geometría vial se encuentra fuera del polígono departamental, se asigna obligatoriamente:
     $$\text{nota} = \text{"La ruta sale del departamento de Quetzaltenango"}$$
   - Si todos los puntos permanecen estrictamente dentro del departamento, se asigna `nota = ""` (cadena vacía).
   - Rutas detectadas con tránsito exterior: `PAL-ZUN` (Cito-180 por cañón del Samalá en Retalhuleu), `SAL-SIJ` (CA-1 Occidente por Cuatro Caminos / Totonicapán), `COL-PAL`, `COA-PAL`, entre otras.

---

## 6. Validación Externa con Google Maps, Invalidación y Ajuste de Pesos

Conforme al protocolo de aseguramiento de calidad vial del Plan Maestro (Sección 3.2, paso 6), se implementó la contrastación con mediciones de la plataforma Google Maps sobre ejes troncales y las aristas más largas del departamento.

### 6.1 Remedición por Corrección de Coordenadas (Ronda 7)

Dado que las mediciones originales asociadas a cabeceras de `PAL` y `CAN` se calcularon en la Ronda 4 utilizando las coordenadas antiguas de Nominatim:

1. **Invalidación y remedición:** Las mediciones con extremo en `PAL` o `CAN` quedaron invalidadas tras corregir las coordenadas hacia El Nuevo Palmar y el casco histórico de Cantel. El 15 de octubre de 2026 el orquestador realizó la remedición formal en Google Maps de las 8 aristas directas asociadas a las nuevas posiciones (`ALM-CAN`, `CAN-QTZ`, `CAN-SAL`, `CAN-ZUN`, `COA-PAL`, `COL-PAL`, `FCC-PAL` y `PAL-ZUN`), consolidándolas en `docs/datos/validacion_google.csv`.
2. **Muestra consolidada:** El archivo `docs/datos/validacion_google.csv` contiene 22 registros: 18 correspondientes a aristas directas de la red activa (incluyendo las 5 aristas más largas del departamento) y 4 mediciones sobre pares que formaron parte de la red inicial pero fueron reclasificados a pares descartados (`FCC-ZUN`, `PAL-SMA`, `QTZ-ZUN` y `SAL-ZUN`).

### 6.2 Protocolo de Aplicación Automatizada en `scripts/build_dataset.py`

El script constructor procesa `docs/datos/validacion_google.csv` al finalizar la determinación geométrica de las aristas y aplica las siguientes reglas:

1. **Atributos de verificación:** Para cada arista registrada en el CSV que forme parte de las aristas directas aceptadas, se asigna `verificado_google = true` y `km_google = <valor>`.
2. **Evaluación de discrepancia:** Se calcula la discrepancia relativa respecto a OSRM:
   $$\text{Diferencia \%} = \frac{|km_{\text{OSRM}} - km_{\text{Google}}|}{km_{\text{OSRM}}} \times 100$$
3. **Aristas fuera de tolerancia ($> 10\,\%$):** Si la discrepancia supera el umbral de aceptación del $10\,\%$, el peso oficial del grafo pasa a ser el provisto por Google Maps ($km = km_{\text{Google}}$). En el campo `nota` se concatena:
   `"Distancia de Google Maps (OSRM: X km, diferencia Y %)"`
4. **Aristas dentro de tolerancia ($\le 10\,\%$):** Se conserva el peso original derivado de OSRM ($km = km_{\text{OSRM}}$).
5. **Aristas no evaluadas:** Las 32 aristas restantes conservan su distancia OSRM con `verificado_google = false` y `km_google = null`.

### 6.3 Resultados de la Validación Activa

De las 22 mediciones registradas en `validacion_google.csv`, exactamente 18 pertenecen a la red directa aceptada:

- **Aristas dentro de tolerancia (13 aristas, 72.2 %):** Conservan su kilometraje OSRM. Cuatro presentan coincidencia exacta ($0.00\,\%$): `COA-SMA` ($40.3\text{ km}$), `FCC-SMA` ($39.9\text{ km}$), `SAL-SIJ` ($24.7\text{ km}$) y `COL-SMA` ($23.7\text{ km}$). Las otras nueve aristas presentan discrepancias mínimas: `FCC-PAL` ($0.20\,\%$), `COA-PAL` ($0.36\,\%$), `PAL-ZUN` ($2.37\,\%$), `ALM-CAN` ($2.67\,\%$), `HUI-PLA` ($3.69\,\%$), `CAN-QTZ` ($4.31\,\%$), `HUI-SAL` ($4.95\,\%$), `OST-PLA` ($8.33\,\%$) y `CAB-PLA` ($9.30\,\%$).
- **Aristas ajustadas con valor de Google Maps (5 aristas con discrepancia $> 10\,\%$):**
  1. `COL-PAL`: $46.3\text{ km}$ (OSRM: $57.0\text{ km}$, dif. $18.77\,\%$)
  2. `ESP-SAL`: $15.0\text{ km}$ (OSRM: $19.7\text{ km}$, dif. $23.86\,\%$)
  3. `ALM-SAL`: $13.2\text{ km}$ (OSRM: $17.5\text{ km}$, dif. $24.57\,\%$)
  4. `CAN-SAL`: $12.1\text{ km}$ (OSRM: $16.8\text{ km}$, dif. $27.98\,\%$)
  5. `CAN-ZUN`: $8.4\text{ km}$ (OSRM: $6.5\text{ km}$, dif. $29.23\,\%$)
- **Mediciones sobre pares descartados (4 aristas):** `FCC-ZUN`, `PAL-SMA`, `QTZ-ZUN` y `SAL-ZUN` ya no forman aristas directas independientes al ser interceptadas por los cascos céntricos de `PAL` y `CAN`.

---

## 7. Verificación de Integridad y Reproducibilidad

El dataset cumple rigurosamente con el contrato TypeScript `Dataset` de `src/core/types.ts`:

- `nodes`: 24 objetos `{id, label, lat, lon, fuente}` (22 fuentes Nominatim y 2 fuentes Google Maps contrastado con Wikipedia).
- `edges`: 50 objetos `{id, source, target, km, carretera, fuente, verificado_google, km_google, nota, geometry}` (18 aristas con `verificado_google: true`, de las cuales 5 adoptan el peso de Google Maps por discrepancia $> 10\,\%$, y 32 con `verificado_google: false` y `km_google: null`).
- `meta`: unidad `'km'`, fuentes oficiales y fecha `'2026-10-15'`.

### Ejecución 100 % Reproducible desde Caché

El script `scripts/build_dataset.py` puede ejecutarse de manera offline y determinista utilizando los archivos cacheados en `scripts/cache/` y las tablas de datos en `docs/datos/`:

```bash
python scripts/build_dataset.py
python scripts/verify_dataset.py
```

Ambas ejecuciones generan de forma idéntica byte por byte el archivo `src/data/quetzaltenango.json` sin llamadas de red.
