/**
 * CONTRATO DE RutaQ — v1 (congelado en la Fase F0).
 *
 * Dueño: Claude Code (orquestador). Ningún agente modifica este archivo sin aprobación;
 * las dudas o propuestas de cambio se anotan en docs/agentes/<agente>.md.
 *
 * Convenciones globales:
 * - Distancia inalcanzable = `Infinity` (nunca `null` ni -1). Se transfiere bien a Workers
 *   (structured clone); al serializar a JSON se debe convertir explícitamente.
 * - Desempate determinista: ante distancias iguales gana el `NodeId` menor por comparación
 *   de cadenas (`a < b`, sin locale). Aplica al nodo que se vuelve permanente y al orden de rutas.
 * - Predecesor: una etiqueta solo cambia ante una mejora ESTRICTA (como en el método tabular a mano);
 *   ante un empate se conserva el predecesor que ya tenía.
 * - Comparaciones de distancias acumuladas con tolerancia relativa 1e-9 (sumas de decimales).
 * - Todas las funciones del núcleo son puras: no mutan el `Graph` recibido.
 * - Los grafos son no dirigidos: una arista {source, target} se recorre en ambos sentidos.
 */

export type NodeId = string;
export type EdgeShape = 'straight' | 'bezier' | 'arc' | 'step' | 'smoothstep';

/** Nodo del lienzo. (x, y) es la esquina superior izquierda en px; (w, h) su tamaño en px. */
export interface GNode {
  id: NodeId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  lat?: number;
  lon?: number;
}

/**
 * Arista no dirigida. `weight` > 0 en la unidad del grafo.
 * `shapeAuto = true` → `autoEdgeShapes` puede cambiar su forma; `false` → la fijó el usuario.
 * `meta` guarda datos del dataset (carretera, fuente, km_google, nota, geometry…).
 */
export interface GEdge {
  id: string;
  source: NodeId;
  target: NodeId;
  weight: number;
  shape: EdgeShape;
  shapeAuto: boolean;
  meta?: Record<string, unknown>;
}

export interface Graph {
  nodes: GNode[];
  edges: GEdge[];
  directed: false;
  unit: string;
}

// ───────────────────────────── Dijkstra ─────────────────────────────

/** Etiqueta del método tabular: distancia acumulada y nodo predecesor. */
export interface Label {
  dist: number;
  pred: NodeId | null;
}

/**
 * Un paso del método tabular.
 * - `iter = 0` es la inicialización: `current = null`, origen con `{dist: 0, pred: null}`,
 *   el resto `{dist: Infinity, pred: null}`, `permanent = []`, `updated = [origen]`.
 * - `iter = k ≥ 1`: `current` es el nodo con la etiqueta temporal mínima, que se vuelve permanente.
 *   `permanent` y `crossedOut` incluyen a `current` (crossedOut = columnas tachadas; hoy coincide
 *   con permanent pero se mantiene separado para variantes del método).
 *   `labels` es la instantánea DESPUÉS de relajar los vecinos de `current`.
 *   `updated` = nodos cuya etiqueta cambió en este paso (mejora estricta).
 *   `evaluatedEdges` = ids de aristas de `current` hacia vecinos no permanentes examinadas.
 * - El algoritmo termina cuando no quedan temporales finitas; los nodos inalcanzables
 *   nunca se vuelven permanentes y conservan `dist = Infinity`.
 */
export interface DijkstraStep {
  iter: number;
  current: NodeId | null;
  permanent: NodeId[];
  crossedOut: NodeId[];
  labels: Record<NodeId, Label>;
  updated: NodeId[];
  evaluatedEdges: string[];
}

/** `treeEdges` = ids de las aristas (pred(v), v) del árbol de caminos más cortos. */
export interface DijkstraResult {
  source: NodeId;
  labels: Record<NodeId, Label>;
  steps: DijkstraStep[];
  treeEdges: string[];
}

/** Camino simple: `nodes` incluye origen y destino; `edges.length = nodes.length - 1`. */
export interface PathResult {
  nodes: NodeId[];
  edges: string[];
  distance: number;
}

// ───────────────────────────── Método tabular (S1) ─────────────────────────────

/**
 * Estado visual de una casilla de la tabla de iteraciones.
 * - `min`: la etiqueta temporal mínima elegida en esta fila (se vuelve permanente).
 * - `updated`: la etiqueta mejoró en esta fila.
 * - `crossed`: la columna ya estaba tachada (nodo permanente en una fila anterior).
 * - `unreached`: sin etiqueta finita todavía.
 * - `normal`: etiqueta temporal sin cambios.
 */
export type TabularCellState = 'normal' | 'min' | 'updated' | 'crossed' | 'unreached';

export interface TabularCell {
  label: Label;
  state: TabularCellState;
}

/** Fila `iter` de la tabla; corresponde 1:1 con `DijkstraResult.steps[iter]`. */
export interface TabularRow {
  iter: number;
  current: NodeId | null;
  cells: Record<NodeId, TabularCell>;
}

/**
 * Modelo completo de la tabla S1. `order` = orden de columnas (orden de `graph.nodes`).
 * `adjacency[i][j]` = peso de la arista entre order[i] y order[j], o `null` si no conectan
 * (la diagonal también es `null`). El formateo de texto lo hace la UI con `TabularConfig`.
 */
export interface TabularModel {
  source: NodeId;
  order: NodeId[];
  adjacency: (number | null)[][];
  rows: TabularRow[];
}

/** Opciones de presentación de S1 (ajustables cuando Cris confirme el formato del catedrático). */
export interface TabularConfig {
  showAdjacency: boolean;
  /** `paren` → "12 (B)" · `bracket` → "[12, B]" · `slash` → "12/B" */
  labelFormat: 'paren' | 'bracket' | 'slash';
  crossOut: 'column' | 'row';
  /** Repetir en filas posteriores la etiqueta de columnas ya tachadas. */
  repeatPermanent: boolean;
}

// ───────────────────────────── Floyd-Warshall ─────────────────────────────

/**
 * `order` = orden de índices (orden de `graph.nodes`).
 * `dist` = matriz final; `next[i][j]` = índice del siguiente nodo desde i hacia j (null si no hay camino o i = j).
 * `matrices` = [D⁽⁰⁾, D⁽¹⁾, …, D⁽ⁿ⁾]; D⁽⁰⁾ es la matriz de pesos (0 en diagonal, Infinity sin arista),
 * D⁽ᵏ⁾ usa como intermedios los primeros k nodos de `order`. Longitud = n + 1.
 */
export interface FloydResult {
  order: NodeId[];
  dist: number[][];
  next: (number | null)[][];
  matrices: number[][][];
}

// ───────────────────────────── Todas las rutas (S3) ─────────────────────────────

/**
 * `limit`: máximo de rutas a listar (por defecto 5 000). Si el DFS encuentra más de `limit`
 * rutas o supera `timeoutMs`, se abandona y se devuelven las `limit` más cortas con Yen.
 */
export interface AllPathsOptions {
  limit: number;
  timeoutMs: number;
}

/**
 * `paths` ordenadas por distancia ascendente (desempate: secuencia de ids lexicográfica).
 * `complete = true` ⇔ `paths` contiene TODOS los caminos simples (method = 'dfs').
 * `totalFound`: con complete = true, el total exacto; si no, los encontrados por el DFS antes
 * de abandonar (cota inferior del total, sirve para el aviso "más de N rutas").
 */
export interface AllPathsResult {
  paths: PathResult[];
  complete: boolean;
  method: 'dfs' | 'yen';
  totalFound: number;
}

// ───────────────────────────── Escala y distribución (F6) ─────────────────────────────

/**
 * `magnitude = 10^ceil(log10(peso_máx))` (mínimo 1) · `range` = texto para la UI, p. ej. "1–1 000".
 * `pxPerUnit` = 160 / mediana de los pesos (la arista mediana mide ~160 px).
 */
export interface ScaleInfo {
  magnitude: number;
  range: string;
  pxPerUnit: number;
}

/**
 * Posiciones sugeridas (centro del nodo, en px) por stress majorization con distancias objetivo
 * = caminos más cortos × pxPerUnit. `stressError` en % (0–100):
 * 100 · sqrt( Σ (‖pᵢ − pⱼ‖/pxPerUnit − dᵢⱼ)² / Σ dᵢⱼ² ) sobre pares conectados i < j.
 */
export interface LayoutSuggestion {
  positions: Record<NodeId, { x: number; y: number }>;
  stressError: number;
  scale: ScaleInfo;
}

// ───────────────────────────── Validación ─────────────────────────────

export type ValidationCode =
  | 'EMPTY_GRAPH'
  | 'DUPLICATE_NODE_ID'
  | 'DUPLICATE_EDGE_ID'
  | 'MISSING_NODE'
  | 'SELF_LOOP'
  | 'DUPLICATE_EDGE'
  | 'NON_POSITIVE_WEIGHT'
  | 'INVALID_WEIGHT'
  | 'DISCONNECTED';

/** `DISCONNECTED` es `warning` (el grafo se puede resolver; F3 informa "No existe ruta"); el resto `error`. */
export interface ValidationIssue {
  code: ValidationCode;
  severity: 'error' | 'warning';
  /** Mensaje en español, listo para mostrar. */
  message: string;
  nodeIds?: NodeId[];
  edgeIds?: string[];
}

/** `ok` ⇔ no hay issues con severity 'error'. */
export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

// ───────────────────────────── API del núcleo ─────────────────────────────

/**
 * Firmas públicas de src/core. Cada módulo exporta su función tipada contra esta interfaz,
 * p. ej. `export const dijkstra: CoreApi['dijkstra'] = (g, s) => …`.
 * Precondición común: el grafo pasó `validateGraph` sin errores y los NodeId existen;
 * si no, la función lanza `Error` con mensaje en español.
 */
export interface CoreApi {
  /** graph.ts */
  validateGraph(g: Graph): ValidationResult;
  /** dijkstra.ts — min-heap, O((V+E) log V), con todos los pasos. */
  dijkstra(g: Graph, s: NodeId): DijkstraResult;
  /**
   * dijkstra.ts — TODAS las rutas mínimas empatadas de s a t (máx. `maxTies`, por defecto 10),
   * en orden lexicográfico de secuencia. `[]` si no hay ruta. s = t → una ruta de distancia 0.
   */
  shortestPaths(g: Graph, s: NodeId, t: NodeId, maxTies?: number): PathResult[];
  /** tabular.ts */
  buildTabular(g: Graph, result: DijkstraResult): TabularModel;
  /** floyd.ts */
  floydWarshall(g: Graph): FloydResult;
  /** floyd.ts — reconstruye el camino i→j desde `next`; `null` si no hay. */
  floydPath(g: Graph, f: FloydResult, s: NodeId, t: NodeId): PathResult | null;
  /** allPaths.ts — DFS con backtracking; cae a Yen según `AllPathsOptions`. `onProgress(encontradas)`. */
  allSimplePaths(
    g: Graph,
    s: NodeId,
    t: NodeId,
    opts: AllPathsOptions,
    onProgress?: (found: number) => void,
  ): AllPathsResult;
  /** yen.ts — los k caminos simples más cortos, en orden exacto. */
  yenKShortest(g: Graph, s: NodeId, t: NodeId, k: number): PathResult[];
  /** scale.ts */
  detectScale(weights: number[]): ScaleInfo;
  /** layout.ts — stress majorization. */
  suggestLayout(g: Graph): LayoutSuggestion;
  /** edgeShape.ts — forma sugerida SOLO para aristas con shapeAuto = true (id → forma). */
  autoEdgeShapes(g: Graph): Record<string, EdgeShape>;
}

/**
 * API expuesta por src/core/worker.ts vía Comlink. Cancelar = `worker.terminate()` y crear
 * uno nuevo (lo gestiona el store), por eso no hay método `cancel`.
 */
export interface CoreWorkerApi {
  allSimplePaths(
    g: Graph,
    s: NodeId,
    t: NodeId,
    opts: AllPathsOptions,
    onProgress?: (found: number) => void,
  ): Promise<AllPathsResult>;
  floydWarshall(g: Graph): Promise<FloydResult>;
  suggestLayout(g: Graph): Promise<LayoutSuggestion>;
}

// ───────────────────────────── Archivos de datos ─────────────────────────────

/** Archivo de grafo guardado/cargado por el usuario y formato de src/data/ejemplo6.json. */
export interface GraphFile {
  format: 'rutaq-graph';
  version: 1;
  name: string;
  graph: Graph;
}

/** Nodo de src/data/quetzaltenango.json (sección 3.3 del plan). */
export interface DatasetNode {
  id: NodeId;
  label: string;
  lat: number;
  lon: number;
  fuente: string;
}

/** Arista de src/data/quetzaltenango.json. `geometry` = polyline codificada (precisión 5). */
export interface DatasetEdge {
  id: string;
  source: NodeId;
  target: NodeId;
  km: number;
  carretera: string;
  fuente: string;
  verificado_google: boolean;
  km_google: number | null;
  nota: string;
  geometry: string;
}

export interface Dataset {
  meta: { nombre: string; unidad: 'km'; fuentes: string[]; fecha: string };
  nodes: DatasetNode[];
  edges: DatasetEdge[];
}
