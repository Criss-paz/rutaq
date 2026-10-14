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

## 6. Validación Externa con Google Maps y Ajuste de Pesos

Conforme al protocolo de aseguramiento de calidad vial del Plan Maestro (Sección 3.2, paso 6), se realizó una validación externa con la plataforma de navegación vehicular comercial Google Maps sobre una muestra representativa de **20 aristas prioritarias**, la cual incluye obligatoriamente las 5 aristas más largas de toda la red, ejes troncales intermunicipales y corredores limítrofes.

### 6.1 Protocolo de Aplicación Automatizada en `scripts/build_dataset.py`

Las 20 mediciones obtenidas y verificadas de forma independiente por el orquestador (`docs/datos/VALIDACION.md`) se transcribieron en `docs/datos/validacion_google.csv` (columnas: `arista,km_google,via_google,fecha`).

El script constructor `scripts/build_dataset.py` procesa dicho archivo al finalizar la determinación geométrica de las aristas y aplica las siguientes reglas de ajuste:

1. **Atributos de verificación:** Para cada arista registrada en el CSV, se asigna `verificado_google = true` y `km_google = <valor>`.
2. **Evaluación de discrepancia:** Se calcula la discrepancia relativa respecto a OSRM:
   $$\text{Diferencia \%} = \frac{|km_{\text{OSRM}} - km_{\text{Google}}|}{km_{\text{OSRM}}} \times 100$$
3. **Aristas fuera de tolerancia ($> 10\,\%$):** Si la discrepancia supera el umbral de aceptación del $10\,\%$, el peso oficial del grafo pasa a ser el provisto por Google Maps ($km = km_{\text{Google}}$). En el campo `nota` se concatena (separado por « · » si ya existía una anotación previa):
   `"Distancia de Google Maps (OSRM: X km, diferencia Y %)"`
4. **Aristas dentro de tolerancia ($\le 10\,\%$):** Se conserva el peso original derivado de OSRM ($km = km_{\text{OSRM}}$).
5. **Aristas no evaluadas:** Las 35 aristas restantes conservan su distancia OSRM con `verificado_google = false` y `km_google = null`.

### 6.2 Resultados de la Validación

- **Aristas dentro de tolerancia (13 aristas, 65 % de la muestra):**
  - Conservan el valor de OSRM: `FCC-ZUN` ($70.9\text{ km}$), `PAL-SMA` ($70.0\text{ km}$), `COA-PAL` ($58.4\text{ km}$), `PAL-ZUN` ($57.2\text{ km}$), `FCC-PAL` ($53.1\text{ km}$), `HUI-SAL` ($42.4\text{ km}$), `COA-SMA` ($40.3\text{ km}$), `FCC-SMA` ($39.9\text{ km}$), `SAL-SIJ` ($24.7\text{ km}$), `HUI-PLA` ($24.4\text{ km}$), `COL-SMA` ($23.7\text{ km}$), `CAB-PLA` ($21.5\text{ km}$) y `OST-PLA` ($18.0\text{ km}$).
  - 4 aristas troncales mostraron coincidencia exacta ($0.00\,\%$): `COA-SMA`, `FCC-SMA`, `SAL-SIJ` y `COL-SMA`.
  - 4 de las 5 aristas más largas del departamento cumplieron holgadamente la cota (diferencias de $0.42\,\%$ a $6.64\,\%$).
- **Aristas ajustadas con valor de Google Maps (7 aristas, 35 % de la muestra):**
  - Superaron el umbral del $10\,\%$ debido a la elección de rutas urbanas céntricas en Google Maps frente a circunvalaciones periféricas de alta velocidad en OSRM:
    1. `COL-PAL`: $46.6\text{ km}$ (OSRM: $60.5\text{ km}$, dif. $22.98\,\%$)
    2. `CAN-HUI`: $54.9\text{ km}$ (OSRM: $49.6\text{ km}$, dif. $10.69\,\%$)
    3. `SAL-ZUN`: $17.9\text{ km}$ (OSRM: $22.8\text{ km}$, dif. $21.49\,\%$)
    4. `ESP-SAL`: $15.0\text{ km}$ (OSRM: $19.7\text{ km}$, dif. $23.86\,\%$)
    5. `CAN-SAL`: $13.8\text{ km}$ (OSRM: $18.4\text{ km}$, dif. $25.00\,\%$)
    6. `ALM-SAL`: $13.2\text{ km}$ (OSRM: $17.5\text{ km}$, dif. $24.57\,\%$)
    7. `QTZ-ZUN`: $10.9\text{ km}$ (OSRM: $17.3\text{ km}$, dif. $36.99\,\%$)

---

## 7. Verificación de Integridad y Reproducibilidad

El dataset cumple rigurosamente con el contrato TypeScript `Dataset` de `src/core/types.ts`:

- `nodes`: 24 objetos `{id, label, lat, lon, fuente}`.
- `edges`: 55 objetos `{id, source, target, km, carretera, fuente, verificado_google, km_google, nota, geometry}` (20 aristas con `verificado_google: true`, de las cuales 7 adoptan el peso de Google Maps por discrepancia $> 10\,\%$, y 35 con `verificado_google: false` y `km_google: null`).
- `meta`: unidad `'km'`, fuentes oficiales y fecha `'2026-10-14'`.

### Ejecución 100 % Reproducible desde Caché

El script `scripts/build_dataset.py` puede ejecutarse de manera offline y determinista utilizando los archivos cacheados en `scripts/cache/` y la tabla `docs/datos/validacion_google.csv`:

```bash
python scripts/build_dataset.py
python scripts/verify_dataset.py
```

Ambas ejecuciones generan de forma idéntica byte por byte el archivo `src/data/quetzaltenango.json` sin llamadas de red.
