# Descripción del Problema y Solución Técnica: Módulo Guatemala (Transporte Express)

**Proyecto II — Algoritmos de Grafos y Redes de Transporte**  
**RutaQ — Sistema de Análisis de Rutas Óptimas**  
**Universidad Mariano Gálvez de Guatemala**  
**Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación**

| Campo                     | Información Oficial                  |
| :------------------------ | :----------------------------------- |
| **Curso**                 | Investigación de Operaciones         |
| **Catedrático**           | Ing. Samuel Isaac Gómez Moreno       |
| **Semestre y Carrera**    | 6.º semestre, Ingeniería en Sistemas |
| **Fecha de Presentación** | Sábado 31 de octubre de 2026         |

### Integrantes del Proyecto

| Nombre Completo                       | Número de Carné |
| :------------------------------------ | :-------------: |
| **Cristopher Alexis Castellanos Paz** |  2690-24-5972   |
| **Leonel Taracena Marroquín**         |  2690-24-4072   |
| **Pablo Alexander Vásquez Rivera**    |  2690-24-13123  |

---

## 1. Planteamiento y Descripción del Problema

### Contexto Empresarial

La empresa guatemalteca de logística y paquetería **Transporte Express** brinda servicios de distribución de encomiendas y carga ligera entre los diferentes departamentos de la República de Guatemala. La operación cotidiana de la empresa enfrenta una problemática crítica: **los paquetes llegan sistemáticamente tarde a sus destinos**, generando insatisfacción en los clientes, penalizaciones comerciales y un incremento desmedido en los costos operativos por consumo de combustible y desgaste de la flota vehicular.

### Diagnóstico de Causas Raíz

Tras el análisis operativo, se determinaron los siguientes factores como causantes del problema:

1. **Selección Empírica de Trayectos:** Los conductores eligen sus trayectos con base en la intuición o hábitos individuales, incurriendo frecuentemente en desvíos innecesarios por carreteras secundarias en mal estado o de mayor longitud.
2. **Carencia de una Red Vial Integrada y Cuantificada:** La empresa no disponía de un registro digital unificado de las carreteras que conectan formalmente las cabeceras departamentales con sus kilometrajes reales y trazables.
3. **Ausencia de un Asistente Automatizado de Enrutamiento:** El personal de despacho no contaba con una herramienta que respondiera de inmediato a las dos preguntas fundamentales del proceso logístico:
   - _¿Dónde se encuentra el paquete actualmente?_
   - _¿A qué departamento debe entregarse?_
4. **Falta de Estrategia para la Red Troncal Mínima:** No existía una planificación sobre cuál es la infraestructura mínima de carreteras necesaria para interconectar los 22 departamentos del país con el menor costo global de mantenimiento y desplazamiento.

---

## 2. Modelo Matemático de Grafo

Para dar solución computacional determinista al problema, la red vial de Guatemala se modela formalmente como un **grafo no dirigido ponderado**:

$$G = (V, E, W)$$

Donde:

### 2.1. Conjunto de Vértices ($V$): Las 22 Cabeceras Departamentales

Cada nodo representa la cabecera departamental oficial de uno de los 22 departamentos de Guatemala, identificada mediante un código alfanumérico canónico e inmutable de 3 letras mayúsculas, su nombre oficial, su posición geográfica georreferenciada (latitud y longitud) proyectada en Web Mercator (norte arriba) y su fuente oficial de datos:

| Código  | Departamento   | Cabecera Departamental |     Latitud      |     Longitud      |
| :-----: | :------------- | :--------------------- | :--------------: | :---------------: |
| **GUA** | Guatemala      | Ciudad de Guatemala    | $14.64161^\circ$ | $-90.51328^\circ$ |
| **SAC** | Sacatepéquez   | Antigua Guatemala      | $14.55678^\circ$ | $-90.73373^\circ$ |
| **CHI** | Chimaltenango  | Chimaltenango          | $14.66130^\circ$ | $-90.81935^\circ$ |
| **ESC** | Escuintla      | Escuintla              | $14.30229^\circ$ | $-90.78662^\circ$ |
| **SRO** | Santa Rosa     | Cuilapa                | $14.27682^\circ$ | $-90.29891^\circ$ |
| **JUT** | Jutiapa        | Jutiapa                | $14.28817^\circ$ | $-89.89353^\circ$ |
| **JAL** | Jalapa         | Jalapa                 | $14.63442^\circ$ | $-89.98980^\circ$ |
| **PRO** | El Progreso    | Guastatoya             | $14.85467^\circ$ | $-90.06872^\circ$ |
| **ZAC** | Zacapa         | Zacapa                 | $14.97072^\circ$ | $-89.52974^\circ$ |
| **CHQ** | Chiquimula     | Chiquimula             | $14.80057^\circ$ | $-89.54592^\circ$ |
| **IZA** | Izabal         | Puerto Barrios         | $15.72752^\circ$ | $-88.59525^\circ$ |
| **AVE** | Alta Verapaz   | Cobán                  | $15.47020^\circ$ | $-90.37351^\circ$ |
| **BVE** | Baja Verapaz   | Salamá                 | $15.10210^\circ$ | $-90.31455^\circ$ |
| **PET** | Petén          | Flores                 | $16.92985^\circ$ | $-89.89148^\circ$ |
| **QUI** | Quiché         | Santa Cruz del Quiché  | $15.02951^\circ$ | $-91.14962^\circ$ |
| **HUE** | Huehuetenango  | Huehuetenango          | $15.31843^\circ$ | $-91.47233^\circ$ |
| **SMA** | San Marcos     | San Marcos             | $14.96438^\circ$ | $-91.79433^\circ$ |
| **QUE** | Quetzaltenango | Quetzaltenango         | $14.84646^\circ$ | $-91.51942^\circ$ |
| **TOT** | Totonicapán    | Totonicapán            | $14.91184^\circ$ | $-91.35997^\circ$ |
| **SOL** | Sololá         | Sololá                 | $14.77224^\circ$ | $-91.18332^\circ$ |
| **REU** | Retalhuleu     | Retalhuleu             | $14.53596^\circ$ | $-91.67807^\circ$ |
| **SUC** | Suchitepéquez  | Mazatenango            | $14.53315^\circ$ | $-91.50600^\circ$ |

### 2.2. Conjunto de Aristas ($E$): Carreteras Directas entre Departamentos Vecinos

Una arista $\{u, v\} \in E$ representa una **conexión vial directa** entre departamentos vecinos. Para evitar aristas artificiales compuestas o transversales (por ejemplo, conectar directamente Huehuetenango con Izabal o Chiquimula, o Ciudad de Guatemala con Quetzaltenango a través de Chimaltenango), se aplica un **criterio objetivo y reproducible**:

1. **Vecindad Territorial:** Los departamentos $u$ y $v$ deben compartir frontera geográfica según sus polígonos oficiales de OSM/Nominatim (tolerancia de contacto $\le 200\text{ m}$, identificando 51 pares vecinos).
2. **Umbral de Proximidad a Cabeceras Intermedias ($\ge 2.0\text{ km}$):** La ruta no debe cruzar ni aproximarse a menos de $2.0\text{ km}$ del casco urbano de ninguna otra cabecera departamental $w \notin \{u, v\}$. Solo dos pares vecinos (`JAL-ZAC` por cruzar Chiquimula y `PET-QUI` por cruzar Cobán) se descartan por este concepto.

> **Nota metodológica sobre la condición del 85 %:** Se evaluó y descartó formalmente una condición previa que requería $\ge 85\ \%$ del trayecto dentro de $u \cup v$, tras comprobar empíricamente que eliminaba arterias directas reales de primer orden como `GUA–CHI` sobre la CA-1 Occidente (que cruza brevemente Sacatepéquez), lo que provocaba que Dijkstra desviara la ruta por Antigua reportando distancias mayores a las reales ($56.8\text{ km}$ frente a $52.2\text{ km}$).

Todo par que no satisface las condiciones es descartado y auditado con su motivo en [`docs/datos/aristas_descartadas_guatemala.csv`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/docs/datos/aristas_descartadas_guatemala.csv). El grafo final consta de **49 aristas directas** y es 100 % conexo.

### 2.3. Función de Ponderación ($W$): Distancia de Conducción Real

A cada arista $e = \{u, v\}$ se le asocia un peso $W(e) > 0$ medido en **kilómetros ($\text{km}$)**, correspondiente a la distancia exacta de conducción sobre pavimento calculada con OSRM a partir de los datos vectoriales de OpenStreetMap, rounded a 1 decimal. Asimismo, a cada arista se le asocia la nomenclatura oficial de la carretera (CA-1, CA-2, CA-9, CA-13, CA-14, RN-…, etc.) extraída sin inventar a partir de los `steps` de navegación.

---

## 3. Algoritmos Implementados y Complejidad Computacional

El núcleo algorítmico del sistema implementa las técnicas clásicas de optimización combinatoria en grafos, garantizando pureza funcional, inmutabilidad y determinismo:

### 3.1. Algoritmo de Dijkstra (Caminos Mínimos Origen-Destino)

- **Función:** Responde al asistente principal de Transporte Express calculando el camino de menor distancia entre el departamento donde está el paquete ($s$) y su destino final ($t$).
- **Implementación:** Cola de prioridad basada en montículo binario indexado (_min-heap_). Mantiene etiquetas permanentes y temporales $(\text{dist}, \text{pred})$.
- **Complejidad Temporal:** $O((|V| + |E|) \log |V|)$. Con $|V| = 22$, la ejecución toma menos de un milisegundo en el navegador.
- **Complejidad Espacial:** $O(|V|)$ para almacenar distancias, predecesores y el montículo.
- **Desglose Logístico:** Reconstruye la ruta en una secuencia de tramos con tabla detallada:
  $$\# \quad|\quad \text{Desde} \quad|\quad \text{Hasta} \quad|\quad \text{Carretera} \quad|\quad \text{km del tramo} \quad|\quad \text{km acumulado}$$
  y genera la fórmula explícita de la suma (ej. $54.2 + 42.1 = 96.3\text{ km}$).

### 3.2. Árbol de Expansión Mínima (AEM / MST)

Permite a la gerencia de Transporte Express analizar la red mínima troncal que conecta todos los departamentos sin ciclos y con el menor kilometraje acumulado de carretera:

#### a) Algoritmo de Prim

- **Estrategia:** Enfoque voraz (_greedy_) que expande un árbol desde un nodo inicial ($s$). En cada iteración agrega la arista de menor peso que cruza el corte entre los nodos ya conectados y los restantes.
- **Estructuras:** Min-heap sobre las aristas del corte.
- **Complejidad:** $O(|E| \log |V|)$ en tiempo y $O(|V| + |E|)$ en memoria.
- **Visualización:** Genera una solución tabulada paso a paso que simula el método de clase (arista mínima elegida, nodo incorporado y columna tachada).

#### b) Algoritmo de Kruskal

- **Estrategia:** Ordena todas las aristas del grafo ascendentemente y las evalúa una por una. Incorpora la arista si sus extremos pertenecen a componentes conexas distintas y la rechaza si formaría un ciclo.
- **Estructuras:** Estructura de partición Disjoint-Set / Union-Find con dos optimizaciones teóricas:
  1. _Compresión de caminos (path compression)_ en `find`.
  2. _Unión por rango (union by rank)_ en `union`.
- **Complejidad:** $O(|E| \log |E|)$ para el ordenamiento y casi lineal $O(|E| \cdot \alpha(|V|))$ para las operaciones de conjuntos disjuntos, donde $\alpha$ es la función inversa de Ackermann.
- **Prueba Cruzada:** Prim y Kruskal arrojan de manera verificada exactamente el mismo conjunto de aristas y el mismo kilometraje total.

### 3.3. Algoritmo de Floyd-Warshall (Todos los Pares de Caminos Cortos)

- **Función:** Calcula simultáneamente la matriz de distancias mínimas entre cualquier par de departamentos $(i, j) \in V \times V$.
- **Complejidad:** $O(|V|^3)$ en tiempo y $O(|V|^2)$ en memoria.
- **Utilidad:** Permite alimentar la tabla de distancias desde la bodega central hacia los otros 21 departamentos de forma instantánea.

---

## 4. Cómo el Sistema Resuelve los Retrasos de Transporte Express

El despliegue de RutaQ soluciona las deficiencias identificadas a través de cuatro mecanismos operativos:

1. **Eliminación de la Incertidumbre en Despacho:**  
   El personal de bodega solo debe indicar el origen y destino del paquete. El sistema calcula en milisegundos la ruta geográficamente óptima y libre de subjetividades.
2. **Instrucciones de Navegación Claras para el Conductor:**  
   En lugar de instrucciones ambiguas, el conductor recibe la secuencia exacta de cabeceras intermedias y los códigos de las carreteras oficiales (CA-1, CA-9, etc.) que debe seguir.
3. **Control y Auditoría de Tiempos y Kilometrajes:**  
   Al conocer el kilometraje exacto del tramo y la ruta total, la administración puede establecer tiempos estándar de entrega, detectar desvíos no autorizados y estimar con exactitud el consumo de combustible.
4. **Optimización de la Infraestructura de Enlaces:**  
   Mediante la visualización del AEM (Prim/Kruskal), Transporte Express puede priorizar contratos de mantenimiento vial, estaciones de servicio aliadas y centros de distribución intermedios en los corredores troncales de mayor impacto geográfico.

---

## 5. Datos: Fuentes, Construcción y Validación

### 5.1. Fuentes Oficiales Utilizadas

- **Instituto Nacional de Estadística (INE):** División administrativa y nómina oficial de departamentos y cabeceras de Guatemala.
- **OpenStreetMap / Nominatim:** Georreferenciación de las 22 cabeceras departamentales, contorno territorial de la república y polígonos vectoriales oficiales de los 22 departamentos.
- **OSRM (Open Source Routing Machine):** Ruteo vehicular real sobre la red vial nacional, cálculo métrico de distancias y pasos de navegación (_steps_).
- **Protocolo de Validación con Google Maps:** Al no existir una tabla oficial verificable de distancias publicada por la Dirección General de Caminos (DGC), las 49 aristas fueron contrastadas directamente en Google Maps aplicando una regla de decisión a tres niveles con umbral de tolerancia del $\pm 10\,\%$. 35 aristas coincidieron con la ruta recomendada y 9 con rutas alternativas (conservando el kilometraje de OSRM). En 5 aristas sin coincidencia (`CHI-SOL`, `CHI-SUC`, `JAL-PRO`, `IZA-PET` y `QUE-TOT`), se adoptó el kilometraje recomendado de Google Maps, actualizando en `IZA-PET` su carretera a `CA-13` ($287.0\text{ km}$). Todas las rutas mínimas se calculan de forma determinista con el algoritmo de Dijkstra sobre este grafo validado.

### 5.2. Auditoría de Coordenadas y Lección de Santa Cruz del Quiché (`QUI`)

Siguiendo la metodología rigurosa del Proyecto I (donde se descubrió la reubicación de El Palmar tras la destrucción del volcán Santiaguito), se contrastaron las coordenadas de Nominatim con la API de Wikipedia (`prop=coordinates`) para los 22 departamentos en [`docs/datos/auditoria_coordenadas_guatemala.csv`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/docs/datos/auditoria_coordenadas_guatemala.csv).

- **Resultado:** 21 de las 22 cabeceras mostraron concordancia cercana ($\le 2.35\text{ km}$).
- **Investigación de `QUI`:** Santa Cruz del Quiché presentó una discrepancia de $11.02\text{ km}$ entre Nominatim ($15.02951^\circ, -91.14962^\circ$) y Wikipedia ($15.05000^\circ, -91.25000^\circ$). Al realizar geocodificación inversa, se constató que la coordenada de Wikipedia correspondía al municipio vecino de San Antonio Ilotenango debido a un redondeo angular erróneo en Wikipedia ($91^\circ 15'00''\text{W}$ en vez de $91^\circ 08'58''\text{W}$). Nominatim situaba el punto a escasos metros del Parque Central de Santa Cruz del Quiché ($15.02963^\circ, -91.14901^\circ$). La investigación quedó formalmente documentada en [`docs/datos/coordenadas_corregidas_guatemala.csv`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/docs/datos/coordenadas_corregidas_guatemala.csv).

### 5.3. Reproducibilidad y Validación

- El script de construcción [`scripts/build_guatemala.py`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/scripts/build_guatemala.py) cuenta con almacenamiento persistente en caché local bajo `scripts/cache/`, lo que permite regenerar el archivo [`src/data/guatemala.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala.json) y [`src/data/guatemala_contorno.json`](file:///C:/Users/DELL/orca/workspaces/Ruta%20Mas%20Corta/gemini-data/src/data/guatemala_contorno.json) de manera 100 % desconectada y determinista.
- El grafo resultante consta de **49 aristas directas**, es **completamente conexo** y enlaza a todas las regiones de la república, incluyendo la conectividad estratégica del departamento de Petén (`PET`) a través de Alta Verapaz (`AVE-PET`, $257.3\text{ km}$) e Izabal (`IZA-PET`, $287.0\text{ km}$ vía CA-13). El Árbol de Expansión Mínima (AEM) de la red nacional totaliza **$1\,425.3\text{ km}$** a través de 21 aristas troncales.
