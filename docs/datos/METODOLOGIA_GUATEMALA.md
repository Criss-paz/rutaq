# Metodología de Construcción del Dataset Vial de Guatemala (22 Departamentos)

**Proyecto II — Transporte Express (RutaQ)**  
**Universidad Mariano Gálvez de Guatemala**  
**Facultad de Ingeniería en Sistemas de Información**  
**Autores:**

- Cristopher Alexis Castellanos Paz (2690-24-5972)
- Leonel Taracena Marroquín (2690-24-4072)
- Pablo Alexander Vásquez Rivera (2690-24-13123)

Este documento describe la base metodológica, las fuentes geográficas oficiales, los criterios de filtrado topológico, las fórmulas de distancia y los protocolos de trazabilidad y reproducibilidad empleados para construir el dataset de la red vial de los 22 departamentos de Guatemala ([`src/data/guatemala.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala.json)) y el contorno territorial nacional ([`src/data/guatemala_contorno.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala_contorno.json)).

---

## 1. Fuentes Oficiales y Licencias de Uso

Todos los datos utilizados en el modelo provienen de fuentes primarias accesibles públicamente y sujetas a licenciamiento abierto:

1. **División Político-Administrativa:**
   - **Instituto Nacional de Estadística (INE):** Catálogo oficial de los 22 departamentos de la República de Guatemala y sus respectivas cabeceras departamentales.
   - **Licencia:** Datos abiertos del Gobierno de Guatemala (Dominio Público).

2. **Georreferenciación de Cabeceras Departamentales:**
   - **OpenStreetMap / Nominatim API:** Puntos geográficos centrales de cada cabecera (parques centrales, gobernaciones departamentales o palacios municipales).
   - **User-Agent oficial:** `RutaQ-proyecto-academico/1.0 (https://github.com/Criss-paz/rutaq; estudiante@miumg.edu.gt)`.
   - **Tasa de consulta:** Respeto estricto de la política de uso ($\le 1\text{ req/s}$) con persistencia en caché local bajo [`scripts/cache/nominatim_guatemala/`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/scripts/cache/nominatim_guatemala/).
   - **Licencia:** Open Database License (ODbL 1.0) © Colaboradores de OpenStreetMap.

3. **Límites Territoriales y Polígonos Departamentales:**
   - **OpenStreetMap / Nominatim API:** Polígonos oficiales de los 22 departamentos (`polygon_geojson=1`, `addresstype=state`), almacenados de forma persistente en [`scripts/cache/departamentos_geojson/`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/scripts/cache/departamentos_geojson/).
   - **Licencia:** ODbL 1.0 © Colaboradores de OpenStreetMap.

4. **Cálculo de Rutas, Geometrías y Carreteras:**
   - **Project OSRM (Open Source Routing Machine):** Instancia pública vehicular `router.project-osrm.org/route/v1/driving/` con parámetros `?overview=full&geometries=polyline&steps=true`.
   - **Tasa de consulta:** $\le 1\text{ req/s}$ con almacenamiento persistente en [`scripts/cache/osrm_guatemala/`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/scripts/cache/osrm_guatemala/).
   - **Licencia:** BSD 2-Clause License.

5. **Auditoría Externa de Coordenadas:**
   - **Wikipedia en español (MediaWiki API):** Módulo `action=query&prop=coordinates` con almacenamiento en [`scripts/cache/wikipedia_guatemala/`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/scripts/cache/wikipedia_guatemala/).
   - **Licencia:** Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0).

6. **Contorno Territorial Nacional:**
   - **Nominatim / OpenStreetMap (Límite de la República de Guatemala, Relación OSM 1521463):** Consulta `q=Guatemala&polygon_geojson=1`.
   - **Licencia:** ODbL 1.0 © Colaboradores de OpenStreetMap.

---

## 2. Catálogo Canónico de Nodos (22 Departamentos)

Cada departamento cuenta con un código alfanumérico inmutable de 3 letras en mayúsculas (`NodeId`), compatible con `GuatemalaDatasetNode` (`src/core/types.ts`):

|  ID   | Departamento (`label`) | Cabecera (`cabecera`) | Latitud (°N) | Longitud (°O) | Fuente de Coordenadas                                   |
| :---: | :--------------------- | :-------------------- | :----------: | :-----------: | :------------------------------------------------------ |
| `GUA` | Guatemala              | Ciudad de Guatemala   |  $14.64161$  |  $-90.51328$  | Nominatim / OpenStreetMap                               |
| `SAC` | Sacatepéquez           | Antigua Guatemala     |  $14.55678$  |  $-90.73373$  | Nominatim / OpenStreetMap                               |
| `CHI` | Chimaltenango          | Chimaltenango         |  $14.66130$  |  $-90.81935$  | Nominatim / OpenStreetMap                               |
| `ESC` | Escuintla              | Escuintla             |  $14.30229$  |  $-90.78662$  | Nominatim / OpenStreetMap                               |
| `SRO` | Santa Rosa             | Cuilapa               |  $14.27682$  |  $-90.29891$  | Nominatim / OpenStreetMap                               |
| `JUT` | Jutiapa                | Jutiapa               |  $14.28817$  |  $-89.89353$  | Nominatim / OpenStreetMap                               |
| `JAL` | Jalapa                 | Jalapa                |  $14.63442$  |  $-89.98980$  | Nominatim / OpenStreetMap                               |
| `PRO` | El Progreso            | Guastatoya            |  $14.85467$  |  $-90.06872$  | Nominatim / OpenStreetMap                               |
| `ZAC` | Zacapa                 | Zacapa                |  $14.97072$  |  $-89.52974$  | Nominatim / OpenStreetMap                               |
| `CHQ` | Chiquimula             | Chiquimula            |  $14.80057$  |  $-89.54592$  | Nominatim / OpenStreetMap                               |
| `IZA` | Izabal                 | Puerto Barrios        |  $15.72752$  |  $-88.59525$  | Nominatim / OpenStreetMap                               |
| `AVE` | Alta Verapaz           | Cobán                 |  $15.47020$  |  $-90.37351$  | Nominatim / OpenStreetMap                               |
| `BVE` | Baja Verapaz           | Salamá                |  $15.10210$  |  $-90.31455$  | Nominatim / OpenStreetMap                               |
| `PET` | Petén                  | Flores                |  $16.92985$  |  $-89.89148$  | Nominatim / OpenStreetMap                               |
| `QUI` | Quiché                 | Santa Cruz del Quiché |  $15.02951$  |  $-91.14962$  | Nominatim / OpenStreetMap (contrastado con Google Maps) |
| `HUE` | Huehuetenango          | Huehuetenango         |  $15.31843$  |  $-91.47233$  | Nominatim / OpenStreetMap                               |
| `SMA` | San Marcos             | San Marcos            |  $14.96438$  |  $-91.79433$  | Nominatim / OpenStreetMap                               |
| `QUE` | Quetzaltenango         | Quetzaltenango        |  $14.84646$  |  $-91.51942$  | Nominatim / OpenStreetMap                               |
| `TOT` | Totonicapán            | Totonicapán           |  $14.91184$  |  $-91.35997$  | Nominatim / OpenStreetMap                               |
| `SOL` | Sololá                 | Sololá                |  $14.77224$  |  $-91.18332$  | Nominatim / OpenStreetMap                               |
| `REU` | Retalhuleu             | Retalhuleu            |  $14.53596$  |  $-91.67807$  | Nominatim / OpenStreetMap                               |
| `SUC` | Suchitepéquez          | Mazatenango           |  $14.53315$  |  $-91.50600$  | Nominatim / OpenStreetMap                               |

---

## 3. Auditoría de Coordenadas y Resolución de Discrepancias

Para garantizar que ningún nodo sufriera problemas de deslocalización territorial (como el antecedente de El Palmar en Quetzaltenango), se contrastó cada cabecera con Wikipedia en [`docs/datos/auditoria_coordenadas_guatemala.csv`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/docs/datos/auditoria_coordenadas_guatemala.csv):

- **21 Cabeceras con alta coincidencia ($\le 2.35\text{ km}$):** 19 cabeceras mostraron discrepancia menor a $1.0\text{ km}$ y 2 entre $1.4$ y $2.35\text{ km}$, atribuibles a la diferencia entre el parque central y los accesos periféricos.
- **Caso Santa Cruz del Quiché (`QUI` — Discrepancia de $11.02\text{ km}$):**
  - Coordenada de Wikipedia: $15.05000^\circ\text{N}, -91.25000^\circ\text{O}$.
  - Al realizar geocodificación inversa, se descubrió que este punto cae dentro del municipio vecino de **San Antonio Ilotenango**. El artículo de Wikipedia contenía un valor redondeado con error de digitación en los minutos de arco ($91^\circ 15'00''\text{W}$ en vez de $91^\circ 08'58''\text{W}$).
  - La coordenada de Nominatim ($15.02951^\circ\text{N}, -91.14962^\circ\text{O}$) sitúa la cabecera a escasos $50\text{ metros}$ del Parque Central y de la Catedral de Santa Cruz del Quiché ($15.02963^\circ\text{N}, -91.14901^\circ\text{O}$).
  - Se confirmó y documentó formalmente la ratificación en [`docs/datos/coordenadas_corregidas_guatemala.csv`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/docs/datos/coordenadas_corregidas_guatemala.csv).

---

## 4. Criterio de Arista Directa y Filtrado Topológico (Triple Criterio)

Entre los 22 departamentos existen $\frac{22 \times 21}{2} = 231$ pares no dirigidos posibles. Para que un par $\{A, B\}$ sea admitido como **arista directa** en la red vial nacional, debe satisfacer simultáneamente tres condiciones objetivas y reproducibles:

### 4.1. Condición 1: Vecindad Geográfica (Frontera Compartida)

Los departamentos $A$ y $B$ deben ser vecinos inmediatos. A partir de los polígonos oficiales de OSM/Nominatim (`polygon_geojson=1`, `addresstype=state`), se calcula la distancia mínima euclidiana entre sus geometrías:

$$\text{distancia}(P_A, P_B) \le \epsilon_{\text{vecindad}}$$

- **Umbral de tolerancia ($\epsilon\_{\text{vecindad}}$):** $0.002^\circ \approx 220\text{ metros}$.
- **Resultado:** De los 231 pares, exactamente **51 pares** comparten frontera geográfica en la República de Guatemala. La matriz completa de adyacencia binaria se encuentra documentada en [`docs/datos/vecindad_departamentos.csv`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/docs/datos/vecindad_departamentos.csv).
- **Descartes por Condición 1:** Los 180 pares que no comparten frontera quedan inmediatamente descartados como aristas directas.

### 4.2. Condición 2: Recorrido Intra-Departamental ($\ge 85.0\ \%$ en $A \cup B$)

Aun cuando dos departamentos compartan frontera, la carretera real que conecta sus cabeceras no debe transitar extensamente por el territorio de departamentos intermediarios. La longitud de la ruta OSRM contenida dentro de la unión de los polígonos $A$ y $B$ debe cumplir:

$$\frac{\text{longitud}\big(\text{ruta}(A \leftrightarrow B) \cap (P_A \cup P_B)\big)}{\text{longitud}\big(\text{ruta}(A \leftrightarrow B)\big)} \ge 85.0\ \%$$

- **Justificación:** Si una carretera entre vecinos cruza un tercer departamento en un tramo prolongado (por ejemplo, `CHI-GUA` que recorre Sacatepéquez por la CA-1 en un $46.2\ \%$, o `GUA-JAL` que pasa por El Progreso en un $48.7\ \%$, o `IZA-PET` que transita por Alta Verapaz en un $28.6\ \%$), el desplazamiento no constituye un enlace interdepartamental directo sino una composición a través de un corredor vial vecino.
- **Descartes por Condición 2:** 15 pares vecinos fueron descartados por no alcanzar el $85.0\ \%$ dentro de sus propios territorios.

### 4.3. Condición 3: Umbral de Proximidad a Cabeceras Intermedias ($\ge 2.0\text{ km}$)

La trayectoria vehicular vehicular entre $A$ y $B$ no debe aproximarse al casco urbano de ninguna otra cabecera departamental $C \notin \{A, B\}$:

$$\min_{C \notin \{A, B\}} \text{distancia}(C, \text{geometría}(A \leftrightarrow B)) \ge 2.0\text{ km}$$

- **Justificación:** A escala departamental, una aproximación a menos de $2.0\text{ km}$ de una cabecera implica transitar por su zona urbana céntrica o su anillo de circunvalación inmediata, dividiendo físicamente el trayecto en $A \to C \to B$.
- **Registro de descartes:** Cada par descartado (195 en total) queda registrado con el desglose exacto de la condición incumplida, porcentaje en $A \cup B$ y cabecera intermedia más próxima en [`docs/datos/aristas_descartadas_guatemala.csv`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/docs/datos/aristas_descartadas_guatemala.csv).

### 4.4. Conexidad Topológica y Enlace de Petén

La red resultante contiene exactamente **36 aristas directas** (dentro del rango meta de 35 a 50 aristas). El grafo es **100 % conexo** y cubre la totalidad de los 22 departamentos:

- **Conectividad de Petén (`PET`):** Petén queda conectado formalmente a la red nacional a través de su enlace directo con Alta Verapaz (`AVE-PET`, $257.3\text{ km}$), siguiendo la Franja Transversal del Norte (RD PET-11 / RD AV-09).
- **Sin aristas artificiales:** Ninguna arista fue inventada o forzada; todas provienen de cálculos geométricos estrictos y reproducibles sobre datos oficiales.

---

## 5. Nomenclatura Vial y Steps de Navegación

El nombre de la carretera (`carretera`) asignado a cada arista se extrae de forma determinista desde la colección de pasos (`steps`) de OSRM:

1. Se acumula la longitud recorrida por cada código de referencia vial (`ref`), priorizando nomenclaturas como `CA-1`, `CA-2`, `CA-9`, `CA-10`, `CA-13`, `CA-14`, `RN-1`, etc.
2. Si el tramo principal comparte dos vías significativas (segunda vía con $\ge 20\ \%$ de la longitud total), se consignan ambas (ejemplo: `CA-1 Occ / RN-15`).
3. Si no existe código de referencia (`ref`), se emplea el nombre de la vía (`name`).
4. **Regla de integridad:** Si no se registra ningún dato formal, el campo permanece como cadena vacía `""`. **Bajo ninguna circunstancia se inventan identificadores de carreteras.**

---

## 6. Simplificación Cartográfica del Contorno Nacional

Para la visualización de fondo en el lienzo interactivo del módulo Guatemala, se generó un archivo GeoJSON ligero y fiel:

- **Fuente:** Polígono nacional de Guatemala en Nominatim (`polygon_geojson=1`), basado en OpenStreetMap.
- **Número original de vértices:** $11\,047$ puntos (excesivo para renderizado web reactivo).
- **Algoritmo de Simplificación:** Ramer-Douglas-Peucker (RDP) implementado en Python sobre las coordenadas geográficas $[\text{longitud}, \text{latitud}]$.
- **Parámetro $\epsilon$:** $0.005^\circ$ ($\approx 550\text{ m}$).
- **Resultado:** Reducción a **$298$ vértices** ($\le 400$ puntos), preservando fielmente los golfos, la península de Manabique en el Atlántico, la frontera con México en Petén y la costa del Pacífico.
- **Destino:** [`src/data/guatemala_contorno.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala_contorno.json).
- **Licencia:** ODbL 1.0 © Colaboradores de OpenStreetMap.

---

## 7. Protocolo de Reproducibilidad Offline

El proceso de construcción está completamente desacoplado de la red una vez generada la caché:

- Con los archivos almacenados en `scripts/cache/`, la ejecución de:
  ```bash
  python scripts/build_guatemala.py
  # O alternativamente:
  python scripts/build_dataset.py --guatemala
  ```
- Se ejecuta en **$0$ peticiones de red**, produciendo un JSON exactamente idéntico y garantizando consistencia byte a byte.
- La ejecución preserva íntegramente el dataset del Proyecto I ([`src/data/quetzaltenango.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/quetzaltenango.json)), conservando su suma de verificación SHA-256 inalterada.
