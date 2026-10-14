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

### Pendiente

### Decisiones

### Dudas
