# Codex — Motor de algoritmos y verificación

**Rama:** `feat/codex-core` · **Carpetas propias:** `src/core/` (excepto `types.ts` e `index.ts`), `tests/unit/` (excepto `tests/unit/store/`), `verification/`.
**Contrato:** `src/core/types.ts` (v1, congelado). Lee los comentarios JSDoc: definen la semántica exacta de cada campo (pasos de Dijkstra, `Infinity`, desempate por id, `matrices` de Floyd, `stressError`, etc.).

## Encargo

Reemplaza los stubs de `src/core/*.ts` manteniendo el patrón `export const f: CoreApi['f'] = …`.

1. `graph.ts` — lista de adyacencia a partir de `Graph` (helper interno exportable) y `validateGraph` con todos los `ValidationCode`; mensajes en español; `DISCONNECTED` es `warning`.
2. `dijkstra.ts` — min-heap propio, O((V+E) log V), desempate determinista por id. `steps` según el JSDoc de `DijkstraStep` (paso 0 = inicialización). `treeEdges`. `shortestPaths` devuelve todas las rutas mínimas empatadas (hasta `maxTies`, por defecto 10).
3. `tabular.ts` — `buildTabular` → `TabularModel` (matriz de adyacencia + filas con estados `min/updated/crossed/unreached/normal`).
4. `floyd.ts` — `floydWarshall` con `next` y `matrices` D⁽⁰⁾…D⁽ⁿ⁾; `floydPath`.
5. `allPaths.ts` — DFS con backtracking, `limit` y `timeoutMs`; si se excede, devuelve Yen con k = `limit` (`complete: false`, `method: 'yen'`). Llama `onProgress` con moderación (p. ej. cada 250 rutas). `yen.ts` — K caminos más cortos exactos.
6. `scale.ts`, `layout.ts` (stress majorization, distancias objetivo = caminos más cortos; componentes desconectadas separadas sin solaparse), `edgeShape.ts` (recta por defecto; curva/arco si la recta atraviesa otro nodo o se encima con otra arista).
7. `worker.ts` ya está cableado con Comlink; ajústalo solo si hace falta (sin cambiar `CoreWorkerApi`).

## Pruebas (`tests/unit/`)

- Grafos a mano con resultado conocido, grafo desconectado, empates, un solo nodo, pesos decimales, s = t.
- Propiedades con fast-check (**≥ 500 grafos aleatorios**): Dijkstra == Floyd == fuerza bruta; la primera ruta de `allSimplePaths` tiene la distancia de Dijkstra; ninguna ruta repite nodos; Yen devuelve distancias no decrecientes y coincide con el DFS completo en grafos pequeños.
- `validateGraph`: un caso por cada `ValidationCode`.
- Cobertura de `src/core` ≥ 90 % (`npm run test:coverage`, umbrales ya configurados).

## Verificación teórica (`verification/`)

`verify.py` con networkx: ejemplo de 6 nodos y Quetzaltenango (todos los pares) → `verification/resultados.csv` + reporte; sale con código ≠ 0 si la coincidencia no es 100 %. Para obtener la salida del programa, exporta desde TS un JSON (p. ej. un script `verification/export.ts` ejecutado con `npx vite-node` o `npx tsx`) y compáralo en Python. La CI ejecuta `verify.py` automáticamente cuando exista.

## Criterio de aceptación (puerta F1)

`npm run lint && npm run typecheck && npm run test && npm run test:coverage && npm run build` en verde, sin tocar archivos fuera de tus carpetas.

---

## Reporte (lo llena Codex)

### Hecho

- Implementados lista de adyacencia, validación, Dijkstra con pasos y heap, rutas mínimas empatadas, modelo tabular, Floyd-Warshall y reconstrucción de rutas, enumeración DFS con progreso y fallback, escala, sugerencia de posiciones y formas automáticas.
- Añadidas pruebas unitarias y de propiedades con 500 grafos aleatorios; se comparan Dijkstra, Floyd, enumeración y rutas limitadas.
- Añadida verificación networkx que genera CSV y reporte; cotejó 36/36 pares del grafo de prueba. Se creó `.venv` con las dependencias de `verification/requirements.txt`.
- En Ronda 2 pasaron lint, typecheck, test, cobertura (96.8 % statements, 90.34 % branches, 96.9 % funciones, 98.22 % líneas), format:check y build.
- Ronda 2: Yen clásico con heap, candidatos deduplicados y desempate lexicográfico; rejilla 7×7 devuelve 5 000 rutas y el fallback de DFS a Yen en menos de 5 s.
- Ronda 2: SMACOF determinista con pesos `d⁻²`, iteraciones hasta convergencia o 300 ciclos, centros como salida y componentes separados en horizontal.
- Ronda 2: aristas automáticas usan rectángulos centrados, ignoran cruces simples, detectan tramos colineales encimados y seleccionan `arc`; rutas mínimas usan tolerancia 1e-9 y poda al destino.
- Ronda 2: DFS usa pila mutable y `Set`, revisa el tiempo cada 1 000 expansiones; matriz tabular usa mapa de aristas; rangos de escala usan espacios independientes del locale.

### Pendiente

- Los datasets `src/data/ejemplo6.json` y `src/data/quetzaltenango.json` todavía no existen, por lo que la verificación de esos archivos queda pendiente hasta que los publique Gemini.
- La salida de verificación al momento de la corrida compara 36/36 pares del grafo interno; los dos datasets opcionales se procesarán automáticamente cuando aparezcan.

### Decisiones

- Desempate de nodos y rutas por comparación lexicográfica de ids; pesos iguales no reemplazan predecesores en Dijkstra.
- SMACOF optimiza el cierre de distancias de caminos más cortos tal como define el contrato; se valida con una métrica euclidiana exacta y otra métrica de cuatro nodos que no se representa exactamente en 2D.

### Dudas

- Hay una contradicción matemática en la prueba solicitada de “triángulo que viola la desigualdad triangular con stressError > 0”: las distancias de caminos más cortos siempre cumplen esa desigualdad, porque el camino directo mínimo no supera el recorrido por el tercer nodo. Para mantener el objetivo contractual, la implementación optimiza esas distancias; cambiar a pesos directos para forzar el caso alteraría el objetivo especificado.
