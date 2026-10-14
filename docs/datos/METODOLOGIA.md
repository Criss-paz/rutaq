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

|  ID   | Nombre Oficial del Municipio | Latitud (°N) | Longitud (°O) | Clasificación Administrativa  | Fuente de Coordenadas     |
| :---: | :--------------------------- | :----------: | :-----------: | :---------------------------- | :------------------------ |
| `QTZ` | Quetzaltenango               |   14.84646   |   -91.51942   | Cabecera departamental (City) | Nominatim / OpenStreetMap |
| `SAL` | Salcajá                      |   14.87911   |   -91.45754   | Municipio / Town              | Nominatim / OpenStreetMap |
| `OLI` | Olintepeque                  |   14.88514   |   -91.51479   | Municipio / Town              | Nominatim / OpenStreetMap |
| `SIJ` | San Carlos Sija              |   14.98369   |   -91.54905   | Municipio / Town              | Nominatim / OpenStreetMap |
| `SIB` | Sibilia                      |   14.99416   |   -91.62418   | Municipio / Town              | Nominatim / OpenStreetMap |
| `CAB` | Cabricán                     |   15.07470   |   -91.64844   | Municipio / Town              | Nominatim / OpenStreetMap |
| `CAJ` | Cajolá                       |   14.92271   |   -91.61495   | Municipio / Town              | Nominatim / OpenStreetMap |
| `SIG` | San Miguel Sigüilá           |   14.89629   |   -91.60282   | Municipio / County            | Nominatim / OpenStreetMap |
| `OST` | San Juan Ostuncalco          |   14.86882   |   -91.62163   | Municipio / Town              | Nominatim / OpenStreetMap |
| `MAT` | San Mateo                    |   14.85897   |   -91.59253   | Municipio / Town              | Nominatim / OpenStreetMap |
| `CCH` | Concepción Chiquirichapa     |   14.85513   |   -91.62396   | Municipio / Town              | Nominatim / OpenStreetMap |
| `SMA` | San Martín Sacatepéquez      |   14.82362   |   -91.64263   | Municipio / Town              | Nominatim / OpenStreetMap |
| `ALM` | Almolonga                    |   14.81498   |   -91.49475   | Municipio / Town              | Nominatim / OpenStreetMap |
| `CAN` | Cantel                       |   14.81879   |   -91.43198   | Municipio / County            | Nominatim / OpenStreetMap |
| `HUI` | Huitán                       |   15.04950   |   -91.63801   | Municipio / Town              | Nominatim / OpenStreetMap |
| `ZUN` | Zunil                        |   14.78480   |   -91.48480   | Municipio / Town              | Nominatim / OpenStreetMap |
| `COL` | Colomba Costa Cuca           |   14.70759   |   -91.73194   | Municipio / Town              | Nominatim / OpenStreetMap |
| `FLU` | San Francisco La Unión       |   14.92429   |   -91.54333   | Municipio / Town              | Nominatim / OpenStreetMap |
| `PAL` | El Palmar                    |   14.69381   |   -91.60183   | Municipio / County            | Nominatim / OpenStreetMap |
| `COA` | Coatepeque                   |   14.70263   |   -91.86564   | Municipio / City              | Nominatim / OpenStreetMap |
| `GEN` | Génova                       |   14.62240   |   -91.83562   | Municipio / Town              | Nominatim / OpenStreetMap |
| `FCC` | Flores Costa Cuca            |   14.65606   |   -91.82563   | Municipio / Town              | Nominatim / OpenStreetMap |
| `ESP` | La Esperanza                 |   14.86923   |   -91.57130   | Municipio / County            | Nominatim / OpenStreetMap |
| `PLA` | Palestina de Los Altos       |   14.93315   |   -91.69398   | Municipio / Village           | Nominatim / OpenStreetMap |

### Selección y Verificación de Cabeceras

Se comprobó que el campo `display_name` y `addresstype` de Nominatim para los 24 municipios situara el punto dentro del departamento de Quetzaltenango:

- **Caso de Almolonga:** La búsqueda inicial genérica devolvía la cima del Volcán Almolonga (`type=volcano`) en la zona rural alta. Se seleccionó la entidad administrativa de cabecera municipal situada en el valle poblado (`14.81498, -91.49475`), resolviendo la conectividad real sobre la RN-9S hacia Quetzaltenango y Zunil.

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
   - **Aristas directas aceptadas:** 55
   - **Pares descartados:** 221
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

## 6. Verificación de Integridad y Reproducibilidad

El dataset cumple rigurosamente con el contrato TypeScript `Dataset` de `src/core/types.ts`:

- `nodes`: 24 objetos `{id, label, lat, lon, fuente}`.
- `edges`: 55 objetos `{id, source, target, km, carretera, fuente, verificado_google: false, km_google: null, nota, geometry}`.
- `meta`: unidad `'km'`, fuentes oficiales y fecha `'2026-10-14'`.

### Ejecución 100 % Reproducible desde Caché

El script `scripts/build_dataset.py` puede ejecutarse de manera offline y determinista utilizando los archivos cacheados en `scripts/cache/`:

```bash
python scripts/build_dataset.py
python scripts/verify_dataset.py
```

Ambas ejecuciones generan de forma idéntica byte por byte el archivo `src/data/quetzaltenango.json` sin llamadas de red.
