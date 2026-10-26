#!/usr/bin/env python3
"""
scripts/build_documento.py

Genera docs/proyecto2/DOCUMENTO.md ensamblando:
1. Carátula oficial
2. Descripción del problema
3. Solución técnica completa (modelo, datos, validación, algoritmos, ejemplos y verificación)
4. Capturas de pantalla (las 13 PNG con pie de figura)
5. Código fuente (anexo completo de docs/proyecto2/codigo_fuente.md)
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

HEADER_AND_BODY = """# UNIVERSIDAD MARIANO GÁLVEZ DE GUATEMALA

## FACULTAD DE INGENIERÍA EN SISTEMAS DE INFORMACIÓN Y CIENCIAS DE LA COMPUTACIÓN

---

### PROYECTO II — ALGORITMOS DE GRAFOS Y REDES DE TRANSPORTE

**SISTEMA DE OPTIMIZACIÓN DE RUTAS DEPARTAMENTALES Y RED TRONCAL MÍNIMA**  
**Caso de Estudio: Empresa de Logística y Paquetería «Transporte Express» (RutaQ)**  
*Modelado Matemático, Implementación Algorítmica (Dijkstra, Prim, Kruskal, Floyd-Warshall), Auditoría Geográfica y Verificación Computacional sobre la Red Vial de los 22 Departamentos de la República de Guatemala*

---

| Campo                     | Información Oficial                                                                                                                                           |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Curso**                 | Investigación de Operaciones                                                                                                                                  |
| **Catedrático**           | Ing. Samuel Isaac Gómez Moreno                                                                                                                                |
| **Semestre y Carrera**    | 6.º semestre, Ingeniería en Sistemas                                                                                                                          |
| **Integrantes (exactos)** | **Cristopher Alexis Castellanos Paz** (2690-24-5972)<br>**Leonel Taracena Marroquín** (2690-24-4072)<br>**Pablo Alexander Vásquez Rivera** (2690-24-13123)  |
| **Fecha de Presentación** | Sábado 31 de octubre de 2026                                                                                                                                  |
| **Aplicación Desplegada** | [https://criss-paz.github.io/rutaq/](https://criss-paz.github.io/rutaq/)                                                                                      |
| **Repositorio de Código** | [https://github.com/Criss-paz/rutaq](https://github.com/Criss-paz/rutaq)                                                                                      |

---

\\newpage

## 1. Descripción del Problema

### 1.1. Contexto Empresarial

La empresa guatemalteca de logística y paquetería **Transporte Express** brinda servicios de distribución de encomiendas y carga ligera entre los diferentes departamentos de la República de Guatemala. La operación cotidiana de la empresa enfrenta una problemática crítica: **los paquetes llegan sistemáticamente tarde a sus destinos**, generando insatisfacción en los clientes, penalizaciones comerciales y un incremento desmedido en los costos operativos por consumo de combustible y desgaste de la flota vehicular.

### 1.2. Diagnóstico de Causas Raíz

Tras el análisis operativo de la cadena de distribución, se determinaron los siguientes factores como causantes del problema:

1. **Selección Empírica de Trayectos:** Los conductores eligen sus trayectos con base en la intuición o hábitos individuales, incurriendo frecuentemente en desvíos innecesarios por carreteras secundarias en mal estado o de mayor longitud.
2. **Carencia de una Red Vial Integrada y Cuantificada:** La empresa no disponía de un registro digital unificado de las carreteras que conectan formalmente las cabeceras departamentales con sus kilometrajes reales y trazables.
3. **Ausencia de un Asistente Automatizado de Enrutamiento:** El personal de despacho no contaba con una herramienta que respondiera de inmediato a las dos preguntas fundamentales del proceso logístico:
   - *¿Dónde se encuentra el paquete actualmente?*
   - *¿A qué departamento debe entregarse?*
4. **Falta de Estrategia para la Red Troncal Mínima:** No existía una planificación sobre cuál es la infraestructura mínima de carreteras necesaria para interconectar los 22 departamentos del país con el menor costo global de mantenimiento y desplazamiento.

---

\\newpage

## 2. Solución

### 2.1. Modelo Matemático de Grafo

Para dar solución computacional determinista al problema, la red vial de Guatemala se modela formalmente como un **grafo no dirigido ponderado conexo**:

$$G = (V, E, W)$$

Donde:

#### 2.1.1. Conjunto de Vértices ($V$): Las 22 Cabeceras Departamentales

Cada nodo representa la cabecera departamental oficial de uno de los 22 departamentos de Guatemala, identificada mediante un código alfanumérico canónico e inmutable de 3 letras mayúsculas, su nombre oficial, su posición geográfica georreferenciada (latitud y longitud) proyectada en Web Mercator (norte arriba) y su fuente oficial de datos:

| Código  | Departamento   | Cabecera Departamental |     Latitud      |     Longitud      |
| :-----: | :------------- | :--------------------- | :--------------: | :---------------: |
| **GUA** | Guatemala      | Ciudad de Guatemala    | $14.64161^\\circ$ | $-90.51328^\\circ$ |
| **SAC** | Sacatepéquez   | Antigua Guatemala      | $14.55678^\\circ$ | $-90.73373^\\circ$ |
| **CHI** | Chimaltenango  | Chimaltenango          | $14.66130^\\circ$ | $-90.81935^\\circ$ |
| **ESC** | Escuintla      | Escuintla              | $14.30229^\\circ$ | $-90.78662^\\circ$ |
| **SRO** | Santa Rosa     | Cuilapa                | $14.27682^\\circ$ | $-90.29891^\\circ$ |
| **JUT** | Jutiapa        | Jutiapa                | $14.28817^\\circ$ | $-89.89353^\\circ$ |
| **JAL** | Jalapa         | Jalapa                 | $14.63442^\\circ$ | $-89.98980^\\circ$ |
| **PRO** | El Progreso    | Guastatoya             | $14.85467^\\circ$ | $-90.06872^\\circ$ |
| **ZAC** | Zacapa         | Zacapa                 | $14.97072^\\circ$ | $-89.52974^\\circ$ |
| **CHQ** | Chiquimula     | Chiquimula             | $14.80057^\\circ$ | $-89.54592^\\circ$ |
| **IZA** | Izabal         | Puerto Barrios         | $15.72752^\\circ$ | $-88.59525^\\circ$ |
| **AVE** | Alta Verapaz   | Cobán                  | $15.47020^\\circ$ | $-90.37351^\\circ$ |
| **BVE** | Baja Verapaz   | Salamá                 | $15.10210^\\circ$ | $-90.31455^\\circ$ |
| **PET** | Petén          | Flores                 | $16.92985^\\circ$ | $-89.89148^\\circ$ |
| **QUI** | Quiché         | Santa Cruz del Quiché  | $15.02951^\\circ$ | $-91.14962^\\circ$ |
| **HUE** | Huehuetenango  | Huehuetenango          | $15.31843^\\circ$ | $-91.47233^\\circ$ |
| **SMA** | San Marcos     | San Marcos             | $14.96438^\\circ$ | $-91.79433^\\circ$ |
| **QUE** | Quetzaltenango | Quetzaltenango         | $14.84646^\\circ$ | $-91.51942^\\circ$ |
| **TOT** | Totonicapán    | Totonicapán            | $14.91184^\\circ$ | $-91.35997^\\circ$ |
| **SOL** | Sololá         | Sololá                 | $14.77224^\\circ$ | $-91.18332^\\circ$ |
| **REU** | Retalhuleu     | Retalhuleu             | $14.53596^\\circ$ | $-91.67807^\\circ$ |
| **SUC** | Suchitepéquez  | Mazatenango            | $14.53315^\\circ$ | $-91.50600^\\circ$ |

#### 2.1.2. Conjunto de Aristas ($E$): Carreteras Directas entre Departamentos Vecinos

Una arista $\\{u, v\\} \\in E$ representa una **conexión vial directa** entre departamentos vecinos. Para evitar aristas artificiales compuestas o transversales (por ejemplo, conectar directamente Huehuetenango con Izabal o Chiquimula, o Ciudad de Guatemala con Quetzaltenango a través de Chimaltenango), se aplica un **criterio objetivo y reproducible**:

1. **Vecindad Territorial:** Los departamentos $u$ y $v$ deben compartir frontera geográfica según sus polígonos oficiales de OSM/Nominatim (tolerancia de contacto $\\le 200\\text{ m}$, identificando 51 pares vecinos).
2. **Umbral de Proximidad a Cabeceras Intermedias ($\\ge 2.0\\text{ km}$):** La ruta no debe cruzar ni aproximarse a menos de $2.0\\text{ km}$ del casco urbano de ninguna otra cabecera departamental $w \\notin \\{u, v\\}$. Solo dos pares vecinos (`JAL-ZAC` por cruzar Chiquimula a $0.0\\text{ km}$ y `PET-QUI` por cruzar Cobán a $0.0\\text{ km}$) se descartan por este concepto.

> **Nota metodológica sobre la condición del 85 %:** Se evaluó y descartó formalmente una condición previa que requería $\\ge 85\\ \\%$ del trayecto dentro de $u \\cup v$, tras comprobar empíricamente que eliminaba arterias directas reales de primer orden como `GUA–CHI` sobre la CA-1 Occidente (que cruza brevemente Sacatepéquez), lo que provocaba que Dijkstra desviara la ruta por Antigua reportando distancias mayores a las reales ($56.8\\text{ km}$ frente a $52.2\\text{ km}$).

Todo par que no satisface las condiciones es descartado y auditado con su motivo en el repositorio (`docs/datos/aristas_descartadas_guatemala.csv`). El grafo final consta de **49 aristas directas** y es 100 % conexo.

#### 2.1.3. Función de Ponderación ($W$): Distancia de Conducción Real y Nomenclatura Vial

A cada arista $e = \\{u, v\\}$ se le asocia un peso $W(e) > 0$ medido en **kilómetros ($\\text{km}$)**, correspondiente a la distancia exacta de conducción sobre pavimento calculada con OSRM a partir de los datos vectoriales de OpenStreetMap, redondeada a 1 decimal y validada con Google Maps. Asimismo, a cada arista se le asocia la nomenclatura oficial de la carretera (CA-1, CA-2, CA-9, CA-13, CA-14, RN-..., RD-...) extraída sin inventar a partir de los pasos de navegación reales.

---

### 2.2. Datos: Fuentes, Construcción y Validación

#### 2.2.1. Fuentes Oficiales Utilizadas

- **Instituto Nacional de Estadística (INE):** División administrativa y nómina oficial de los 22 departamentos y cabeceras de Guatemala.
- **OpenStreetMap / Nominatim:** Georreferenciación de las 22 cabeceras departamentales, contorno territorial de la república y polígonos vectoriales oficiales de los 22 departamentos.
- **OSRM (Open Source Routing Machine):** Ruteo vehicular real sobre la red vial nacional, cálculo métrico de distancias y pasos de navegación (*steps*).
- **Protocolo de Validación con Google Maps:** Al no existir una tabla oficial verificable de distancias publicada por la Dirección General de Caminos (DGC), las 49 aristas fueron contrastadas directamente en Google Maps aplicando una regla de decisión a tres niveles con umbral de tolerancia del $\\pm 10\\,\\%$. 35 aristas coincidieron con la ruta recomendada y 9 con rutas alternativas (conservando el kilometraje de OSRM). En 5 aristas sin coincidencia (`CHI-SOL`, `CHI-SUC`, `JAL-PRO`, `IZA-PET` y `QUE-TOT`), se adoptó el kilometraje recomendado de Google Maps, actualizando en `IZA-PET` su carretera a `CA-13` ($287.0\\text{ km}$). Todas las rutas mínimas se calculan de forma determinista con el algoritmo de Dijkstra sobre este grafo validado.

#### 2.2.2. Auditoría de Coordenadas y Lección de Santa Cruz del Quiché (`QUI`)

Siguiendo la metodología rigurosa del Proyecto I (donde se descubrió la reubicación de El Palmar tras la destrucción del volcán Santiaguito), se contrastaron las coordenadas de Nominatim con la API de Wikipedia (`prop=coordinates`) para los 22 departamentos en `docs/datos/auditoria_coordenadas_guatemala.csv`:

- **Resultado:** 21 de las 22 cabeceras mostraron concordancia cercana ($\\le 2.35\\text{ km}$).
- **Investigación de `QUI`:** Santa Cruz del Quiché presentó una discrepancia de $11.02\\text{ km}$ entre Nominatim ($15.02951^\\circ, -91.14962^\\circ$) y Wikipedia ($15.05000^\\circ, -91.25000^\\circ$). Al realizar geocodificación inversa, se constató que la coordenada de Wikipedia correspondía al municipio vecino de San Antonio Ilotenango debido a un redondeo angular erróneo en Wikipedia ($91^\\circ 15'00''\\text{W}$ en vez de $91^\\circ 08'58''\\text{W}$). Nominatim situaba el punto a escasos metros del Parque Central de Santa Cruz del Quiché ($15.02963^\\circ, -91.14901^\\circ$). La investigación quedó formalmente documentada en `docs/datos/coordenadas_corregidas_guatemala.csv`.

#### 2.2.3. Reproducibilidad y Validación

- El script de construcción `scripts/build_guatemala.py` cuenta con almacenamiento persistente en caché local bajo `scripts/cache/`, lo que permite regenerar el archivo `src/data/guatemala.json` y `src/data/guatemala_contorno.json` de manera 100 % desconectada y determinista.
- El grafo resultante consta de **49 aristas directas**, es **completamente conexo** y enlaza a todas las regiones de la república, incluyendo la conectividad estratégica del departamento de Petén (`PET`) a través de Alta Verapaz (`AVE-PET`, $257.3\\text{ km}$) e Izabal (`IZA-PET`, $287.0\\text{ km}$ vía CA-13). El Árbol de Expansión Mínima (AEM) de la red nacional totaliza **$1\\,425.3\\text{ km}$** a través de 21 aristas troncales.

---

### 2.3. Algoritmos Implementados y Complejidad Computacional

El núcleo algorítmico del sistema implementa las técnicas clásicas de optimización combinatoria en grafos, garantizando pureza funcional, inmutabilidad y determinismo:

#### 2.3.1. Algoritmo de Dijkstra (Caminos Mínimos Origen-Destino)

- **Función:** Responde al asistente principal de Transporte Express calculando el camino de menor distancia entre el departamento donde está el paquete ($s$) y su destino final ($t$).
- **Implementación:** Cola de prioridad basada en montículo binario indexado (*min-heap*). Mantiene etiquetas permanentes y temporales $(\\text{dist}, \\text{pred})$.
- **Complejidad Temporal:** $O((|V| + |E|) \\log |V|)$. Con $|V| = 22$ y $|E| = 49$, la ejecución toma menos de un milisegundo en el navegador.
- **Complejidad Espacial:** $O(|V|)$ para almacenar distancias, predecesores y el montículo.
- **Desglose Logístico:** Reconstruye la ruta en una secuencia de tramos con tabla detallada:
  $$\\# \\quad|\\quad \\text{Desde} \\quad|\\quad \\text{Hasta} \\quad|\\quad \\text{Carretera} \\quad|\\quad \\text{km del tramo} \\quad|\\quad \\text{km acumulado}$$
  y genera la fórmula explícita de la suma (ej. $28.8 + 36.2 + 128.6 + 128.3 + 172.1 = 494.0\\text{ km}$).

#### 2.3.2. Árbol de Expansión Mínima (AEM / MST)

Permite a la gerencia de Transporte Express analizar la red mínima troncal que conecta todos los departamentos sin ciclos y con el menor kilometraje acumulado de carretera:

##### a) Algoritmo de Prim

- **Estrategia:** Enfoque voraz (*greedy*) que expande un árbol desde un nodo inicial ($s$). En cada iteración agrega la arista de menor peso que cruza el corte entre los nodos ya conectados y los restantes.
- **Estructuras:** Min-heap sobre las aristas del corte.
- **Complejidad:** $O(|E| \\log |V|)$ en tiempo y $O(|V| + |E|)$ en memoria.
- **Visualización:** Genera una solución tabulada paso a paso que reproduce el método tradicional de clase (arista mínima elegida, nodo incorporado y columna tachada).

##### b) Algoritmo de Kruskal

- **Estrategia:** Ordena todas las aristas del grafo ascendentemente y las evalúa una por una. Incorpora la arista si sus extremos pertenecen a componentes conexas distintas y la rechaza si formaría un ciclo.
- **Estructuras:** Estructura de partición Disjoint-Set / Union-Find con dos optimizaciones teóricas fundamentales:
  1. *Compresión de caminos (path compression)* en `find`.
  2. *Unión por rango (union by rank)* en `union`.
- **Complejidad:** $O(|E| \\log |E|)$ para el ordenamiento y casi lineal $O(|E| \\cdot \\alpha(|V|))$ para las operaciones de conjuntos disjuntos, donde $\\alpha$ es la función inversa de Ackermann.
- **Prueba Cruzada:** Prim y Kruskal arrojan de manera verificada exactamente el mismo conjunto de aristas y el mismo kilometraje total ($1\\,425.3\\text{ km}$).

#### 2.3.3. Algoritmo de Floyd-Warshall (Todos los Pares de Caminos Cortos)

- **Función:** Calcula simultáneamente la matriz de distancias mínimas entre cualquier par de departamentos $(i, j) \\in V \\times V$.
- **Complejidad:** $O(|V|^3)$ en tiempo y $O(|V|^2)$ en memoria.
- **Utilidad:** Permite alimentar la tabla de distancias desde la bodega central hacia los otros 21 departamentos de forma instantánea.

---

### 2.4. Funcionamiento del Sistema y Solución a los Retrasos de Transporte Express

El despliegue de RutaQ soluciona las deficiencias identificadas a través de cuatro mecanismos operativos:

1. **Eliminación de la Incertidumbre en Despacho:**  
   El personal de bodega solo debe indicar el origen y destino del paquete en el asistente. El sistema calcula en milisegundos la ruta geográficamente óptima y libre de subjetividades.
2. **Instrucciones de Navegación Claras para el Conductor:**  
   En lugar de instrucciones ambiguas, el conductor recibe la secuencia exacta de cabeceras intermedias y los códigos de las carreteras oficiales (CA-1, CA-9, etc.) que debe seguir.
3. **Control y Auditoría de Tiempos y Kilometrajes:**  
   Al conocer el kilometraje exacto del tramo y la ruta total, la administración puede establecer tiempos estándar de entrega, detectar desvíos no autorizados y estimar con exactitud el consumo de combustible.
4. **Optimización de la Infraestructura de Enlaces:**  
   Mediante la visualización del AEM (Prim/Kruskal), Transporte Express puede priorizar contratos de mantenimiento vial, estaciones de servicio aliadas y centros de distribución intermedios en los corredores troncales de mayor impacto geográfico.

---

### 2.5. Ejemplos de Enrutamiento y Valores Reales

A continuación se detallan los 3 ejemplos canónicos representativos de la operación nacional de Transporte Express y la red troncal mínima (AEM), calculados de forma determinista sobre el grafo oficial:

#### 2.5.1. Ejemplo 1: Quetzaltenango a Izabal (`QUE` → `IZA`)

- **Ruta Óptima:** `QUE -> TOT -> QUI -> BVE -> ZAC -> IZA`
- **Distancia Total:** **$494.0\\text{ km}$**
- **Desglose de Tramos:**

| Tramo | Origen | Destino | Carretera | Distancia Tramo | Distancia Acumulada |
| :---: | :----- | :------ | :-------- | :-------------: | :-----------------: |
| 1 | Quetzaltenango (`QUE`) | Totonicapán (`TOT`) | RN-1 / RN-1B | $28.8\\text{ km}$ | $28.8\\text{ km}$ |
| 2 | Totonicapán (`TOT`) | Santa Cruz del Quiché (`QUI`) | RD QUI-04 | $36.2\\text{ km}$ | $65.0\\text{ km}$ |
| 3 | Santa Cruz del Quiché (`QUI`) | Salamá (`BVE`) | RD QUI-2 / RN-5 | $128.6\\text{ km}$ | $193.6\\text{ km}$ |
| 4 | Salamá (`BVE`) | Zacapa (`ZAC`) | CA-9 Nor / CA-14 | $128.3\\text{ km}$ | $321.9\\text{ km}$ |
| 5 | Zacapa (`ZAC`) | Puerto Barrios (`IZA`) | CA-9 Nor | $172.1\\text{ km}$ | $494.0\\text{ km}$ |

- **Fórmula Explícita de Suma:**
  $$\\text{Distancia Total} = 28.8 + 36.2 + 128.6 + 128.3 + 172.1 = \\mathbf{494.0\\text{ km}}$$

#### 2.5.2. Ejemplo 2: Ciudad de Guatemala a Flores, Petén (`GUA` → `PET`)

- **Ruta Óptima:** `GUA -> BVE -> AVE -> PET`
- **Distancia Total:** **$415.3\\text{ km}$**
- **Desglose de Tramos:**

| Tramo | Origen | Destino | Carretera | Distancia Tramo | Distancia Acumulada |
| :---: | :----- | :------ | :-------- | :-------------: | :-----------------: |
| 1 | Ciudad de Guatemala (`GUA`) | Salamá (`BVE`) | RD BV-12 / RD GUA-12 | $89.0\\text{ km}$ | $89.0\\text{ km}$ |
| 2 | Salamá (`BVE`) | Cobán (`AVE`) | CA-14 / RN-5 | $69.0\\text{ km}$ | $158.0\\text{ km}$ |
| 3 | Cobán (`AVE`) | Flores (`PET`) | RD PET-11 / RD AV-09 | $257.3\\text{ km}$ | $415.3\\text{ km}$ |

- **Fórmula Explícita de Suma:**
  $$\\text{Distancia Total} = 89.0 + 69.0 + 257.3 = \\mathbf{415.3\\text{ km}}$$

#### 2.5.3. Ejemplo 3: San Marcos a Jutiapa (`SMA` → `JUT`)

- **Ruta Óptima:** `SMA -> QUE -> SUC -> ESC -> SRO -> JUT`
- **Distancia Total:** **$368.3\\text{ km}$**
- **Desglose de Tramos:**

| Tramo | Origen | Destino | Carretera | Distancia Tramo | Distancia Acumulada |
| :---: | :----- | :------ | :-------- | :-------------: | :-----------------: |
| 1 | San Marcos (`SMA`) | Quetzaltenango (`QUE`) | RN-1 | $49.6\\text{ km}$ | $49.6\\text{ km}$ |
| 2 | Quetzaltenango (`QUE`) | Mazatenango (`SUC`) | CITO-180 / SCH-02 | $60.2\\text{ km}$ | $109.8\\text{ km}$ |
| 3 | Mazatenango (`SUC`) | Escuintla (`ESC`) | CA-02 OCC | $102.5\\text{ km}$ | $212.3\\text{ km}$ |
| 4 | Escuintla (`ESC`) | Cuilapa (`SRO`) | CA-2 OR / RN-16 | $100.0\\text{ km}$ | $312.3\\text{ km}$ |
| 5 | Cuilapa (`SRO`) | Jutiapa (`JUT`) | CA-1 Or | $56.0\\text{ km}$ | $368.3\\text{ km}$ |

- **Fórmula Explícita de Suma:**
  $$\\text{Distancia Total} = 49.6 + 60.2 + 102.5 + 100.0 + 56.0 = \\mathbf{368.3\\text{ km}}$$

#### 2.5.4. Árbol de Expansión Mínima de la Red Nacional (AEM / MST)

- **Total de Aristas Seleccionadas:** 21 aristas troncales sobre las 49 aristas de la red nacional.
- **Kilometraje Total Acumulado:** **$1\\,425.3\\text{ km}$**
- **Paridad Prim y Kruskal:** Idéntico conjunto de 21 aristas y exactamente el mismo costo global de $1\\,425.3\\text{ km}$, garantizando la cobertura conexa y óptima de los 22 departamentos con el menor tendido vial posible.

---

### 2.6. Verificación Rigurosa y Métricas de Calidad

Para asegurar la confiabilidad industrial de la plataforma, se implementó una batería de validación automatizada en tres capas:

1. **Verificación Matemática Cruzada con NetworkX (Python):**  
   Se contrastaron el 100 % de los caminos mínimos calculados por Dijkstra y Floyd-Warshall frente a la biblioteca científica NetworkX sobre la matriz completa de adyacencia de los 22 departamentos ($22 \\times 22 = 484$ pares), acumulando junto a los datasets del Proyecto I y grafos de control un total de **$1\\,168 / 1\\,168$ pares verificados con 0 discrepancias**. Asimismo, se contrastó la construcción del Árbol de Expansión Mínima frente a `networkx.minimum_spanning_tree` obteniendo **$10 / 10$ instancias de AEM idénticas**.
2. **Pruebas Automatizadas End-to-End (E2E) con Playwright:**  
   Se ejecutó la suite completa de pruebas de regresión funcional y visual en navegadores Chromium, WebKit y Firefox, alcanzando **$148 / 148$ pruebas aprobadas** ($100\\,\\%$ passing).
3. **Auditoría de Rendimiento y Estándares Web con Google Lighthouse:**  
   La plataforma obtuvo una evaluación técnica sobresaliente:
   - **Rendimiento (Performance):** **91 / 100**
   - **Accesibilidad (Accessibility):** **95 / 100**
   - **Mejores Prácticas (Best Practices):** **100 / 100**
   - **Optimización en Motores de Búsqueda (SEO):** **100 / 100**

---

\\newpage

## 3. Capturas de Pantalla del Sistema en Funcionamiento

A continuación se presentan las 13 capturas de pantalla de alta fidelidad obtenidas de la aplicación en ejecución real, documentando la interfaz interactiva, los formularios de datos, el asistente de enrutamiento, la visualización del AEM y los algoritmos tabulados:

![Figura 1. Pantalla de inicio de la plataforma RutaQ en el modo Transporte Express (Guatemala), mostrando el mapa interactivo con la red vial nacional, el panel lateral con las opciones principales de cálculo y la botonera superior de navegación.](../capturas/proyecto2/01-pantalla-inicial.png)

\\newpage

![Figura 2. Vista encajada completa (fit view) de la red vial de Guatemala sobre el lienzo cartográfico orientado al norte, exhibiendo los 22 nodos departamentales y las 49 carreteras directas sobre el contorno territorial nacional.](../capturas/proyecto2/02-mapa-completo.png)

\\newpage

![Figura 3. Modal «Administrar red» en la pestaña Departamentos, mostrando el catálogo tabular de los 22 departamentos con código oficial, nombre, cabecera departamental y coordenadas geográficas de latitud y longitud.](../capturas/proyecto2/03-formulario-departamentos.png)

\\newpage

![Figura 4. Modal «Administrar red» en la pestaña Carreteras, detallando la tabla de las 49 aristas viales directas con identificador de tramo, departamento de origen, destino, denominación de la carretera (CA, RN, RD) y kilometraje ponderado.](../capturas/proyecto2/04-formulario-carreteras.png)

\\newpage

![Figura 5. Ventana modal del asistente logístico de despacho «Calcular ruta más corta», diseñada para responder con menús desplegables a las preguntas: «¿Dónde se encuentra el paquete actualmente?» y «¿A qué departamento debe entregarse?».](../capturas/proyecto2/05-asistente.png)

\\newpage

![Figura 6. Resultado del cálculo del camino mínimo para el trayecto Quetzaltenango a Izabal (QUE → IZA, 494.0 km) en la pestaña Desglose, presentando la tabla detallada de tramos, carreteras intermedias y la expresión explícita de la suma.](../capturas/proyecto2/06-resultado-tramos-suma.png)

\\newpage

![Figura 7. Visualización del Árbol de Expansión Mínima (AEM / MST) en la pestaña correspondiente, resaltando sobre el mapa las 21 aristas troncales de la red nacional con un costo global de 1425.3 km y el aviso de paridad total entre Prim y Kruskal.](../capturas/proyecto2/07-arbol-expansion-minima.png)

\\newpage

![Figura 8. Panel de resultados maximizado exhibiendo la resolución tabulada paso a paso del Algoritmo de Prim, con columnas de iteración, vértices en el árbol, arista mínima de corte elegida, peso individual y columna tachada.](../capturas/proyecto2/08-prim-tabulado.png)

\\newpage

![Figura 9. Panel de resultados maximizado mostrando la tabla de ejecución secuencial del Algoritmo de Kruskal, con ordenamiento creciente de aristas, componentes evaluadas, decisión de aceptación o rechazo por ciclo y distancia acumulada.](../capturas/proyecto2/09-kruskal-tabulado.png)

\\newpage

![Figura 10. Vista responsiva y adaptativa del sistema en un dispositivo móvil inteligente (Google Pixel 7), con la interfaz optimizada para operadores en ruta y panel inferior deslizable con el resultado del enrutamiento.](../capturas/proyecto2/10-vista-celular.png)

\\newpage

![Figura 11. Modalidad de presentación a pantalla completa configurada a resolución HD (1280×720 píxeles), optimizada para proyectores de aula universitaria con controles simplificados y mapa de alta visibilidad.](../capturas/proyecto2/11-modo-presentacion-1280x720.png)

\\newpage

![Figura 12. Vista panorámica del modo presentación interactivo con acceso directo a los ejemplos de prueba, métricas operativas en vivo y mapa departamental sin elementos distractores de la interfaz.](../capturas/proyecto2/11-modo-presentacion.png)

\\newpage

![Figura 13. Vista en alta definición Full HD (1920×1080 píxeles) del modo presentación, mostrando el lienzo geográfico completo a escala óptima con la red vial nacional interconectada y panel de métricas lateral.](../capturas/proyecto2/12-modo-presentacion-1920x1080.png)

---

\\newpage

## 4. Código Fuente

"""


def main() -> None:
    codigo_path = ROOT / "docs" / "proyecto2" / "codigo_fuente.md"
    if not codigo_path.exists():
        raise FileNotFoundError(f"No existe: {codigo_path}")

    codigo_md = codigo_path.read_text(encoding="utf-8")

    # Si codigo_md comienza con un título h1 "# Anexo — Código fuente", lo ajustamos
    # para integrarse armónicamente como subsección de Código Fuente
    codigo_lines = codigo_md.splitlines()
    if codigo_lines and codigo_lines[0].startswith("# "):
        # Omitimos el título inicial repetido ya que el encabezado está en la sección 4
        # y conservamos el resto
        codigo_content = "\n".join(codigo_lines[1:]).lstrip()
    else:
        codigo_content = codigo_md

    documento_path = ROOT / "docs" / "proyecto2" / "DOCUMENTO.md"
    full_content = HEADER_AND_BODY + codigo_content + "\n"
    documento_path.write_text(full_content, encoding="utf-8")
    print(f"Generado con éxito: {documento_path} ({len(full_content.splitlines())} líneas)")


if __name__ == "__main__":
    main()
