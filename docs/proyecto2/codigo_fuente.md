# Anexo — Código fuente

Proyecto II «Transporte Express» · RutaQ · https://github.com/Criss-paz/rutaq

Generado automáticamente con `npm run anexo-codigo` el 2026-10-26.

## Núcleo de algoritmos

Algoritmos puros en TypeScript, sin dependencias de la interfaz.

### `src/core/dijkstra.ts`

154 líneas.

```{.typescript .numberLines}
import type { CoreApi, DijkstraStep, Graph, NodeId, PathResult } from './types';
import { adjacencyList } from './graph';

/** Heap binario mínimo ordenado por distancia y NodeId. */
class Heap {
  a: { id: string; d: number }[] = [];
  push(x: { id: string; d: number }) {
    this.a.push(x);
    let i = this.a.length - 1;
    while (i) {
      const p = (i - 1) >> 1;
      if (this.c(this.a[p]!, x) <= 0) break;
      this.a[i] = this.a[p]!;
      i = p;
    }
    this.a[i] = x;
  }
  pop() {
    if (!this.a.length) return undefined;
    const root = this.a[0]!,
      last = this.a.pop()!;
    if (this.a.length) {
      let i = 0;
      while (i * 2 + 1 < this.a.length) {
        let c = i * 2 + 1;
        if (c + 1 < this.a.length && this.c(this.a[c + 1]!, this.a[c]!) < 0) c++;
        if (this.c(last, this.a[c]!) <= 0) break;
        this.a[i] = this.a[c]!;
        i = c;
      }
      this.a[i] = last;
    }
    return root;
  }
  c(a: { id: string; d: number }, b: { id: string; d: number }) {
    return a.d - b.d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  }
}
const assert = (g: Graph, s: NodeId) => {
  if (!g.nodes.some((n) => n.id === s)) throw new Error(`No existe el nodo «${s}».`);
};
/**
 * Calcula caminos mínimos con Dijkstra y conserva una instantánea por iteración para la tabla.
 * Complejidad: O((V + E) log V) con heap binario; memoria O(V + E).
 * Referencia: Cormen et al., Introduction to Algorithms, capítulo 24.
 */
export const dijkstra: CoreApi['dijkstra'] = (g, s) => {
  assert(g, s);
  const adj = adjacencyList(g),
    labels = Object.fromEntries(g.nodes.map((n) => [n.id, { dist: Infinity, pred: null }])) as Record<
      string,
      { dist: number; pred: string | null }
    >;
  labels[s] = { dist: 0, pred: null };
  const permanent: string[] = [],
    crossed: string[] = [],
    steps: DijkstraStep[] = [];
  steps.push({
    iter: 0,
    current: null,
    permanent: [],
    crossedOut: [],
    labels: structuredClone(labels),
    updated: [s],
    evaluatedEdges: [],
  });
  const heap = new Heap();
  heap.push({ id: s, d: 0 });
  const done = new Set<string>();
  let iter = 0;
  while (true) {
    // Se omiten entradas antiguas del heap cuando la distancia del nodo mejoró posteriormente.
    let item = heap.pop();
    while (item && (done.has(item.id) || item.d !== labels[item.id]!.dist)) item = heap.pop();
    if (!item) break;
    const u = item.id;
    done.add(u);
    permanent.push(u);
    crossed.push(u);
    const updated: string[] = [],
      evaluatedEdges: string[] = [];
    for (const v of adj.get(u) ?? []) {
      if (done.has(v.node)) continue;
      evaluatedEdges.push(v.edgeId);
      const nd = item.d + v.weight;
      // Solo una mejora estricta cambia la etiqueta; los empates conservan el predecesor previo.
      if (nd < labels[v.node]!.dist) {
        labels[v.node] = { dist: nd, pred: u };
        updated.push(v.node);
        heap.push({ id: v.node, d: nd });
      }
    }
    steps.push({
      iter: ++iter,
      current: u,
      permanent: [...permanent],
      crossedOut: [...crossed],
      labels: structuredClone(labels),
      updated,
      evaluatedEdges,
    });
  }
  return {
    source: s,
    labels,
    steps,
    treeEdges: g.edges
      .filter((e) => labels[e.source]?.pred === e.target || labels[e.target]?.pred === e.source)
      .map((e) => e.id),
  };
};

export const shortestPaths: CoreApi['shortestPaths'] = (g, s, t, maxTies = 10) => {
  assert(g, s);
  assert(g, t);
  if (s === t) return [{ nodes: [s], edges: [], distance: 0 }];
  const adj = adjacencyList(g),
    dist = dijkstra(g, s).labels[t]!.dist,
    toTarget = dijkstra(g, t).labels;
  if (!Number.isFinite(dist)) return [];
  const out: PathResult[] = [],
    nodes = [s],
    edges: string[] = [],
    seen = new Set([s]),
    limit = Math.max(1, maxTies);
  const equal = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  const walk = (u: string, d: number) => {
    if (out.length >= Math.max(1, maxTies)) return;
    if (u === t) {
      if (equal(d, dist)) out.push({ nodes: [...nodes], edges: [...edges], distance: d });
      return;
    }
    for (const v of adj.get(u) ?? []) {
      if (seen.has(v.node)) continue;
      const remaining = toTarget[v.node]!.dist,
        nextDistance = d + v.weight;
      if (Number.isFinite(remaining) && nextDistance + remaining <= dist * (1 + 1e-9)) {
        seen.add(v.node);
        nodes.push(v.node);
        edges.push(v.edgeId);
        walk(v.node, nextDistance);
        edges.pop();
        nodes.pop();
        seen.delete(v.node);
      }
    }
  };
  walk(s, 0);
  const compare = (a: string[], b: string[]) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i]! < b[i]! ? -1 : 1;
    return a.length - b.length;
  };
  return out.sort((a, b) => compare(a.nodes, b.nodes)).slice(0, limit);
};
```

### `src/core/mst.ts`

170 líneas.

```{.typescript .numberLines}
import type { CoreApiP2, Graph, MSTStep, NodeId } from './types';

/**
 * Calcula árboles y bosques de expansión mínima con Prim y Kruskal.
 * Complejidad: el heap de Prim cuesta O(E log E); registrar todos los cortes cuesta O(VE).
 * Kruskal cuesta O(E log E + VE), incluido el historial visual de nodos por paso.
 * Referencia: Cormen et al., Introduction to Algorithms, capítulos 21 y 23.
 */

type Edge = Graph['edges'][number];
const edgeOrder = (a: Edge, b: Edge) => a.weight - b.weight || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const assertStart = (g: Graph, start: NodeId) => {
  if (!g.nodes.some((node) => node.id === start)) throw new Error(`No existe el nodo «${start}».`);
};

/** Min-heap de aristas: permite extraer cada arista candidata en O(log E). */
class EdgeHeap {
  private values: Edge[] = [];
  push(value: Edge) {
    let i = this.values.push(value) - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (edgeOrder(this.values[parent]!, value) <= 0) break;
      this.values[i] = this.values[parent]!;
      i = parent;
    }
    this.values[i] = value;
  }
  pop(): Edge | undefined {
    if (!this.values.length) return undefined;
    const first = this.values[0]!,
      last = this.values.pop()!;
    if (this.values.length) {
      let i = 0;
      while (2 * i + 1 < this.values.length) {
        let child = 2 * i + 1;
        if (child + 1 < this.values.length && edgeOrder(this.values[child + 1]!, this.values[child]!) < 0) child++;
        if (edgeOrder(last, this.values[child]!) <= 0) break;
        this.values[i] = this.values[child]!;
        i = child;
      }
      this.values[i] = last;
    }
    return first;
  }
}

/** Prim crece desde `start`, incorporando en cada fila la arista más ligera del corte. */
export const prim: CoreApiP2['prim'] = (g, requestedStart) => {
  const start = requestedStart ?? g.nodes[0]?.id;
  if (start === undefined) throw new Error('El grafo no contiene nodos.');
  assertStart(g, start);
  const adjacency = new Map<NodeId, Edge[]>();
  for (const node of g.nodes) adjacency.set(node.id, []);
  for (const edge of g.edges) {
    adjacency.get(edge.source)?.push(edge);
    adjacency.get(edge.target)?.push(edge);
  }
  const inside = new Set<NodeId>([start]),
    inTree = [start],
    edges: string[] = [],
    steps: MSTStep[] = [];
  let total = 0;
  steps.push({
    iter: 0,
    chosenEdge: null,
    inTree: [...inTree],
    crossedOut: [...inTree],
    candidates: [],
    totalSoFar: 0,
  });
  const heap = new EdgeHeap(),
    queued = new Set<string>();
  const offer = (node: NodeId) => {
    for (const edge of adjacency.get(node) ?? []) {
      const other = edge.source === node ? edge.target : edge.source;
      if (!inside.has(other) && !queued.has(edge.id)) {
        queued.add(edge.id);
        heap.push(edge);
      }
    }
  };
  offer(start);
  let iter = 0;
  while (true) {
    // Descarta del heap aristas que ya no cruzan el corte tras incorporar su extremo.
    let edge = heap.pop();
    while (edge && inside.has(edge.source) === inside.has(edge.target)) edge = heap.pop();
    if (!edge) break;
    const candidates = g.edges
      .filter((candidate) => inside.has(candidate.source) !== inside.has(candidate.target))
      .sort(edgeOrder)
      .map((candidate) => candidate.id);
    const node = inside.has(edge.source) ? edge.target : edge.source;
    inside.add(node);
    inTree.push(node);
    edges.push(edge.id);
    total += edge.weight;
    offer(node);
    // La instantánea de candidatos es el corte evaluado antes de incorporar el nuevo extremo.
    steps.push({
      iter: ++iter,
      chosenEdge: edge.id,
      inTree: [...inTree],
      crossedOut: [...inTree],
      candidates,
      totalSoFar: total,
    });
  }
  return { algorithm: 'prim', edges, total, steps };
};

/** Union-Find con compresión de caminos y unión por rango para evitar ciclos. */
class UnionFind {
  private parent = new Map<NodeId, NodeId>();
  private rank = new Map<NodeId, number>();
  constructor(nodes: NodeId[]) {
    for (const node of nodes) {
      this.parent.set(node, node);
      this.rank.set(node, 0);
    }
  }
  find(node: NodeId): NodeId {
    const parent = this.parent.get(node);
    if (parent === undefined) throw new Error(`No existe el nodo «${node}».`);
    if (parent !== node) this.parent.set(node, this.find(parent));
    return this.parent.get(node)!;
  }
  union(a: NodeId, b: NodeId): boolean {
    let rootA = this.find(a),
      rootB = this.find(b);
    if (rootA === rootB) return false;
    const rankA = this.rank.get(rootA)!,
      rankB = this.rank.get(rootB)!;
    if (rankA < rankB) [rootA, rootB] = [rootB, rootA];
    this.parent.set(rootB, rootA);
    if (rankA === rankB) this.rank.set(rootA, rankA + 1);
    return true;
  }
}

/** Kruskal examina aristas por peso e id; acepta las que conectan componentes distintas. */
export const kruskal: CoreApiP2['kruskal'] = (g) => {
  const ordered = [...g.edges].sort(edgeOrder),
    uf = new UnionFind(g.nodes.map((node) => node.id));
  const edges: string[] = [],
    touched = new Set<NodeId>(),
    steps: MSTStep[] = [];
  let total = 0;
  steps.push({ iter: 0, chosenEdge: null, inTree: [], crossedOut: [], candidates: [], totalSoFar: 0 });
  ordered.forEach((edge, index) => {
    const accepted = uf.union(edge.source, edge.target);
    if (accepted) {
      edges.push(edge.id);
      total += edge.weight;
      touched.add(edge.source);
      touched.add(edge.target);
    }
    steps.push({
      iter: index + 1,
      chosenEdge: accepted ? edge.id : null,
      ...(accepted ? {} : { rejectedEdge: edge.id }),
      inTree: g.nodes.map((node) => node.id).filter((id) => touched.has(id)),
      crossedOut: [],
      candidates: [edge.id],
      totalSoFar: total,
    });
  });
  return { algorithm: 'kruskal', edges, total, steps };
};
```

### `src/core/route.ts`

37 líneas.

```{.typescript .numberLines}
import type { CoreApiP2, PathResult } from './types';

/**
 * Desglosa un camino en sus tramos y acumula sus distancias.
 * Complejidad: O(V + E + L), donde L es el número de tramos.
 * Referencia: especificación del Proyecto II, apartado G3 (tabla de tramos).
 */
export const routeBreakdown: CoreApiP2['routeBreakdown'] = (g, path: PathResult) => {
  if (!path.nodes.length || path.edges.length !== path.nodes.length - 1)
    throw new Error('La ruta debe tener un nodo más que aristas.');
  const nodeIds = new Set(g.nodes.map((node) => node.id));
  const edgeById = new Map(g.edges.map((edge) => [edge.id, edge]));
  if (path.nodes.some((id) => !nodeIds.has(id))) throw new Error('La ruta contiene un nodo que no existe.');
  let cumulative = 0;
  const legs = path.edges.map((edgeId, index) => {
    const from = path.nodes[index]!,
      to = path.nodes[index + 1]!;
    const edge = edgeById.get(edgeId);
    if (!edge || !((edge.source === from && edge.target === to) || (edge.source === to && edge.target === from)))
      throw new Error(`La arista «${edgeId}» no conecta ${from} con ${to}.`);
    cumulative += edge.weight;
    const road = edge.meta?.carretera;
    return {
      from,
      to,
      edgeId,
      ...(typeof road === 'string' && road.trim() ? { road } : {}),
      km: edge.weight,
      cumulative,
    };
  });
  const total = cumulative;
  const formula = legs.length
    ? `${legs.map((leg) => leg.km.toFixed(1)).join(' + ')} = ${total.toFixed(1)} ${g.unit}`
    : `0 ${g.unit}`;
  return { nodes: [...path.nodes], legs, total, formula };
};
```

### `src/core/tour.ts`

50 líneas.

```{.typescript .numberLines}
import { floydWarshall } from './floyd';
import type { CoreApiP2, NodeId } from './types';

/**
 * Construye un recorrido cerrado aproximado: vecino más cercano y mejoras 2-opt.
 * Complejidad: Floyd-Warshall O(V³), vecino más cercano O(V²) y 2-opt O(V²) por pasada.
 * Referencia: Rosenkrantz, Stearns y Lewis, An Analysis of Several Heuristics for the Traveling Salesman Problem (1977).
 */
export const deliveryTour: CoreApiP2['deliveryTour'] = (g, start: NodeId) => {
  const startIndex = g.nodes.findIndex((node) => node.id === start);
  if (startIndex < 0) throw new Error(`No existe el nodo «${start}».`);
  const f = floydWarshall(g),
    ids = f.order;
  const reachable = ids.filter((_, i) => Number.isFinite(f.dist[startIndex]![i]!));
  const unvisited = new Set(reachable.filter((id) => id !== start));
  const order = [start];
  // Elige repetidamente el destino aún no visitado más cercano; NodeId resuelve los empates.
  while (unvisited.size) {
    const current = ids.indexOf(order[order.length - 1]!);
    const next = [...unvisited].sort((a, b) => {
      const da = f.dist[current]![ids.indexOf(a)]!,
        db = f.dist[current]![ids.indexOf(b)]!;
      return da - db || (a < b ? -1 : a > b ? 1 : 0);
    })[0]!;
    order.push(next);
    unvisited.delete(next);
  }
  const distance = (a: NodeId, b: NodeId) => f.dist[ids.indexOf(a)]![ids.indexOf(b)]!;
  // Invierte segmentos cuando el cambio de dos enlaces reduce la longitud del ciclo.
  if (order.length > 3) {
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 1; i < order.length - 1 && !improved; i++) {
        for (let k = i + 1; k < order.length; k++) {
          const before = distance(order[i - 1]!, order[i]!) + distance(order[k]!, order[(k + 1) % order.length]!);
          const after = distance(order[i - 1]!, order[k]!) + distance(order[i]!, order[(k + 1) % order.length]!);
          if (after < before - 1e-9 * Math.max(1, Math.abs(before), Math.abs(after))) {
            order.splice(i, k - i + 1, ...order.slice(i, k + 1).reverse());
            improved = true;
            break;
          }
        }
      }
    }
  }
  let total = 0;
  for (let i = 0; i < order.length; i++) total += distance(order[i]!, order[(i + 1) % order.length]!);
  return { order, total, method: 'nn+2opt' };
};
```

### `src/core/graph.ts`

69 líneas.

```{.typescript .numberLines}
import type { CoreApi, Graph, NodeId } from './types';

export interface Neighbor {
  node: NodeId;
  weight: number;
  edgeId: string;
}
export const adjacencyList = (g: Graph): Map<NodeId, Neighbor[]> => {
  const map = new Map(g.nodes.map((n) => [n.id, [] as Neighbor[]]));
  for (const e of g.edges) {
    map.get(e.source)?.push({ node: e.target, weight: e.weight, edgeId: e.id });
    map.get(e.target)?.push({ node: e.source, weight: e.weight, edgeId: e.id });
  }
  for (const list of map.values())
    list.sort((a, b) => (a.node < b.node ? -1 : a.node > b.node ? 1 : a.edgeId.localeCompare(b.edgeId)));
  return map;
};

export const validateGraph: CoreApi['validateGraph'] = (g) => {
  const issues: ReturnType<CoreApi['validateGraph']>['issues'] = [];
  const issue = (code: (typeof issues)[number]['code'], message: string, ids?: string[], edge = false) =>
    issues.push({
      code,
      severity: code === 'DISCONNECTED' ? 'warning' : 'error',
      message,
      ...(ids ? (edge ? { edgeIds: ids } : { nodeIds: ids }) : {}),
    });
  if (!g.nodes.length) issue('EMPTY_GRAPH', 'El grafo no contiene nodos.');
  const nodes = new Set<string>();
  for (const n of g.nodes) {
    if (nodes.has(n.id)) issue('DUPLICATE_NODE_ID', `El identificador de nodo «${n.id}» está repetido.`, [n.id]);
    nodes.add(n.id);
  }
  const edges = new Set<string>(),
    pairs = new Set<string>();
  for (const e of g.edges) {
    if (edges.has(e.id))
      issue('DUPLICATE_EDGE_ID', `El identificador de arista «${e.id}» está repetido.`, [e.id], true);
    edges.add(e.id);
    if (!nodes.has(e.source) || !nodes.has(e.target))
      issue('MISSING_NODE', `La arista «${e.id}» referencia un nodo inexistente.`, [e.id], true);
    if (e.source === e.target) issue('SELF_LOOP', `La arista «${e.id}» conecta un nodo consigo mismo.`, [e.id], true);
    const pair = [e.source, e.target].sort().join('\0');
    if (pairs.has(pair))
      issue('DUPLICATE_EDGE', `Hay más de una arista entre «${e.source}» y «${e.target}».`, [e.id], true);
    pairs.add(pair);
    if (!Number.isFinite(e.weight))
      issue('INVALID_WEIGHT', `El peso de «${e.id}» debe ser un número finito.`, [e.id], true);
    else if (e.weight <= 0) issue('NON_POSITIVE_WEIGHT', `El peso de «${e.id}» debe ser mayor que cero.`, [e.id], true);
  }
  if (g.nodes.length > 0 && nodes.size === g.nodes.length) {
    const adj = adjacencyList(g),
      seen = new Set<NodeId>(),
      stack = [g.nodes[0]!.id];
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      for (const n of adj.get(id) ?? []) if (!seen.has(n.node)) stack.push(n.node);
    }
    if (seen.size !== g.nodes.length)
      issue(
        'DISCONNECTED',
        'El grafo está desconectado; algunas rutas no existen.',
        g.nodes.filter((n) => !seen.has(n.id)).map((n) => n.id),
      );
  }
  return { ok: !issues.some((i) => i.severity === 'error'), issues };
};
```

## Contrato de tipos

Tipos compartidos entre el núcleo, el estado y la interfaz.

### `src/core/types.ts`

418 líneas.

```{.typescript .numberLines}
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

// ═════════════════════════════ PROYECTO II — Transporte Express (solo adiciones) ═════════════════════════════
// Nada de lo anterior cambia. Ver docs/PLAN_PROYECTO2.md.

/**
 * Un paso de la solución tabulada del árbol de expansión mínima (AEM).
 * - `iter = 0`: inicialización (Prim: `inTree = [start]`; Kruskal: `inTree = []`), `chosenEdge = null`, `totalSoFar = 0`.
 * - Prim, `iter = k ≥ 1`: `chosenEdge` es la arista de menor peso que cruza el corte (árbol → fuera); su extremo nuevo
 *   se agrega a `inTree` y a `crossedOut` (columna tachada). `candidates` = aristas del corte evaluadas en el paso
 *   (incluida la elegida), en orden de peso ascendente.
 * - Kruskal, `iter = k ≥ 1`: se examina la k-ésima arista en orden ascendente de peso. Si une dos componentes distintas,
 *   `chosenEdge = id`; si formaría ciclo, `chosenEdge = null` y `rejectedEdge = id`. `inTree` = nodos tocados por las
 *   aristas aceptadas hasta ahora; `crossedOut = []`; `candidates = [id]`.
 * - Desempate determinista: a igual peso gana el `id` de arista menor (comparación `<`, sin locale).
 * - `totalSoFar` = suma de pesos aceptados hasta este paso (tolerancia relativa 1e-9 en comparaciones).
 */
export interface MSTStep {
  iter: number;
  chosenEdge: string | null;
  rejectedEdge?: string;
  inTree: NodeId[];
  crossedOut: NodeId[];
  candidates: string[];
  totalSoFar: number;
}

/**
 * `edges` en orden de selección. Grafo conexo ⇒ `edges.length = V − 1`. Grafo desconexo ⇒ bosque de expansión mínima
 * (Kruskal) o árbol de la componente de `start` (Prim); la UI lo informa.
 */
export interface MSTResult {
  algorithm: 'prim' | 'kruskal';
  edges: string[];
  total: number;
  steps: MSTStep[];
}

/**
 * Desglose de una ruta para el asistente de Transporte Express.
 * `legs[i]` = tramo nodes[i] → nodes[i+1]; `road` = `meta.carretera` de la arista si existe y no está vacía;
 * `cumulative` = suma de km hasta ese tramo inclusive. `total` = suma de los tramos (= distancia de Dijkstra).
 * `formula` = "12.5 + 30.2 + … = 245.7 km" (pesos tal como están en el grafo, total redondeado a 1 decimal, unidad
 * del grafo). Ruta de un solo nodo ⇒ `legs = []`, `total = 0`, `formula = "0 km"`.
 */
export interface RouteBreakdown {
  nodes: NodeId[];
  legs: { from: NodeId; to: NodeId; edgeId: string; road?: string; km: number; cumulative: number }[];
  total: number;
  formula: string;
}

/** Recorrido de reparto aproximado (vecino más cercano + 2-opt) sobre distancias de camino más corto. Cerrado: vuelve a `order[0]`. */
export interface TourResult {
  order: NodeId[];
  total: number;
  method: 'nn+2opt';
}

/** API añadida del núcleo (Proyecto II). Mismas convenciones que `CoreApi`. */
export interface CoreApiP2 {
  /** mst.ts — Prim con min-heap desde `start` (por defecto, el primer nodo de `graph.nodes`). */
  prim(g: Graph, start?: NodeId): MSTResult;
  /** mst.ts — Kruskal con Union-Find (compresión de caminos y unión por rango). */
  kruskal(g: Graph): MSTResult;
  /** route.ts — desglose de una ruta (`path` de `shortestPaths` o `PathResult` equivalente). */
  routeBreakdown(g: Graph, path: PathResult): RouteBreakdown;
  /** tour.ts — recorrido de reparto que visita todos los nodos alcanzables desde `start`. */
  deliveryTour(g: Graph, start: NodeId): TourResult;
}

/** API del Worker con las adiciones del Proyecto II (el Worker existente la implementa completa). */
export interface CoreWorkerApiP2 extends CoreWorkerApi {
  deliveryTour(g: Graph, start: NodeId): Promise<TourResult>;
}

/** Nodo de src/data/guatemala.json: `label` = nombre del departamento; `cabecera` = cabecera departamental. */
export interface GuatemalaDatasetNode extends DatasetNode {
  cabecera: string;
}

/** src/data/guatemala.json: mismo formato que `Dataset`, con la cabecera en cada nodo. */
export interface GuatemalaDataset extends Omit<Dataset, 'nodes'> {
  nodes: GuatemalaDatasetNode[];
}
```

## Estado de la aplicación

Store global: datos de la red, formularios, consultas y resultados.

### `src/store/dataset.ts`

100 líneas.

```{.typescript .numberLines}
import type { Dataset, GNode, Graph, GuatemalaDataset } from '../core/types';

export const DEFAULT_NODE_SIZE = { w: 132, h: 44 } as const;
/**
 * En el mapa real cada municipio es un punto (la UI dibuja el nombre al lado): así se conserva la posición
 * geográfica exacta sin apartar nodos que, a escala, quedan a 1.5–3 km entre sí.
 */
export const DATASET_NODE_SIZE = { w: 18, h: 18 } as const;

/** Ancho del mapa en px. Se expone para que la UI dibuje la barra de escala en km. */
export const DATASET_WIDTH_PX = 1400;

/**
 * Proyecciones con el norte arriba:
 * - `equirect`: equirectangular centrada en la latitud media (Quetzaltenango, ~50 km: error de escala < 2 %).
 * - `mercator`: Web Mercator, como Google Maps (Guatemala completa, ~450 km de norte a sur).
 */
export type ProjectionKind = 'equirect' | 'mercator';

/** Proyección lat/lon ↔ lienzo. `project` devuelve el CENTRO del punto en px del lienzo. */
export interface GeoProjection {
  kind: ProjectionKind;
  project(lat: number, lon: number): { x: number; y: number };
  unproject(x: number, y: number): { lat: number; lon: number };
}

const RAD = Math.PI / 180;

/** Construye la proyección que ajusta `points` a `widthPx` de ancho (el oeste en x = 0, el punto más al norte en y = 0). */
export function makeProjection(
  points: { lat: number; lon: number }[],
  kind: ProjectionKind,
  widthPx = DATASET_WIDTH_PX,
): GeoProjection {
  const lat0 = points.length ? points.reduce((a, p) => a + p.lat, 0) / points.length : 0;
  const cos0 = Math.cos(lat0 * RAD);
  const fwd =
    kind === 'mercator'
      ? (lat: number, lon: number) => ({ px: lon * RAD, py: -Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)) })
      : (lat: number, lon: number) => ({ px: lon * cos0, py: -lat });
  const inv =
    kind === 'mercator'
      ? (px: number, py: number) => ({ lat: (2 * Math.atan(Math.exp(-py)) - Math.PI / 2) / RAD, lon: px / RAD })
      : (px: number, py: number) => ({ lat: -py, lon: px / cos0 });

  const raw = points.map((p) => fwd(p.lat, p.lon));
  const minX = raw.length ? Math.min(...raw.map((r) => r.px)) : 0;
  const maxX = raw.length ? Math.max(...raw.map((r) => r.px)) : 0;
  const minY = raw.length ? Math.min(...raw.map((r) => r.py)) : 0;
  const k = maxX > minX ? widthPx / (maxX - minX) : 1;

  return {
    kind,
    project(lat, lon) {
      const { px, py } = fwd(lat, lon);
      return { x: (px - minX) * k, y: (py - minY) * k };
    },
    unproject(x, y) {
      return inv(x / k + minX, y / k + minY);
    },
  };
}

/**
 * Convierte el dataset geográfico en un Graph del lienzo con la proyección indicada (equirectangular por defecto,
 * que es la del Proyecto I). (x, y) del nodo es la esquina superior izquierda del punto.
 */
export function datasetToGraph(
  ds: Dataset | GuatemalaDataset,
  widthPx = DATASET_WIDTH_PX,
  kind: ProjectionKind = 'equirect',
): Graph {
  if (ds.nodes.length === 0) return { nodes: [], edges: [], directed: false, unit: ds.meta.unidad };

  const proj = makeProjection(ds.nodes, kind, widthPx);
  const nodes: GNode[] = ds.nodes.map((n) => {
    const c = proj.project(n.lat, n.lon);
    return {
      id: n.id,
      label: n.label,
      x: Math.round(c.x - DATASET_NODE_SIZE.w / 2),
      y: Math.round(c.y - DATASET_NODE_SIZE.h / 2),
      ...DATASET_NODE_SIZE,
      lat: n.lat,
      lon: n.lon,
    };
  });

  const edges = ds.edges.map(({ id, source, target, km, ...meta }) => ({
    id,
    source,
    target,
    weight: km,
    shape: 'straight' as const,
    shapeAuto: true,
    meta,
  }));

  return { nodes, edges, directed: false, unit: ds.meta.unidad };
}
```

### `src/store/types.ts`

201 líneas.

```{.typescript .numberLines}
/**
 * CONTRATO DEL STORE — v1 (congelado en F0). Dueño: Claude Code.
 * La UI (Antigravity) lee estado y llama acciones SOLO a través de esta interfaz; puede
 * construir un mock que la implemente mientras el store real se integra.
 */
import type {
  AllPathsResult,
  DijkstraResult,
  EdgeShape,
  FloydResult,
  Graph,
  GraphFile,
  GuatemalaDataset,
  LayoutSuggestion,
  MSTResult,
  NodeId,
  PathResult,
  RouteBreakdown,
  ScaleInfo,
  TabularConfig,
  TabularModel,
  TourResult,
  ValidationResult,
} from '../core/types';

/** `guatemala` = módulo Transporte Express (Proyecto II). */
export type AppMode = 'quetzaltenango' | 'guatemala' | 'design';
export type ResultTab = 'tabla' | 'grafica' | 'rutas' | 'floyd';
export type Theme = 'light' | 'dark' | 'system';

/** F2 = árbol desde un nodo; F3 = ruta entre dos nodos (target null mientras se elige). */
export type Query = { kind: 'tree'; source: NodeId } | { kind: 'path'; source: NodeId; target: NodeId | null };

export type JobStatus = 'idle' | 'running' | 'done' | 'cancelled' | 'error';

export interface AllPathsState {
  status: JobStatus;
  /** Rutas encontradas hasta ahora (progreso del Worker). */
  found: number;
  result: AllPathsResult | null;
  error: string | null;
}

/** Reproducción de la tabla S1; `stepIndex` indexa `dijkstra.steps` y sincroniza lienzo ↔ tabla. */
export interface PlaybackState {
  stepIndex: number;
  playing: boolean;
  /** Milisegundos entre pasos al reproducir. */
  speedMs: number;
}

export type AddEdgeResult =
  | { ok: true; edgeId: string }
  | { ok: false; reason: 'self-loop' | 'invalid-weight' | 'missing-node' }
  /** Ya existe arista entre el par: la UI ofrece editar `existingEdgeId`. */
  | { ok: false; reason: 'duplicate'; existingEdgeId: string };

export type ImportResult = { ok: true } | { ok: false; message: string };

// ───────────────────────────── Proyecto II — Transporte Express ─────────────────────────────

export type Template = 'quetzaltenango' | 'guatemala' | 'ejemplo6' | 'ejemplo_mst' | 'vacio';

/** G4: qué responde «recorrer y conectar todos los nodos». */
export type CoverMode = 'mst' | 'spt' | 'tour';

export interface DepartmentInput {
  label: string;
  cabecera: string;
  /** Si hay lat y lon, el punto se proyecta en su posición real; si no, se coloca en `at` (centro, px del lienzo). */
  lat?: number;
  lon?: number;
  at?: { x: number; y: number };
}

export type AddDepartmentResult =
  { ok: true; id: NodeId } | { ok: false; reason: 'empty-name' | 'duplicate-name' | 'invalid-coords' };

export interface TourState {
  status: JobStatus;
  start: NodeId | null;
  result: TourResult | null;
  error: string | null;
}

export interface AppState {
  // ── Datos ──
  mode: AppMode;
  graph: Graph;
  graphName: string;
  validation: ValidationResult;
  scale: ScaleInfo;

  // ── Selección y consulta ──
  selectedNodeIds: NodeId[];
  selectedEdgeIds: string[];
  query: Query | null;

  // ── Resultados (se recalculan al cambiar graph o query) ──
  dijkstra: DijkstraResult | null;
  tabular: TabularModel | null;
  /** Rutas mínimas empatadas de F3 ([] = no existe ruta; null = sin consulta F3 completa). */
  shortest: PathResult[] | null;
  floyd: FloydResult | null;
  allPaths: AllPathsState;
  /** Índice en `allPaths.result.paths` (o en `shortest` si viene de empates) resaltado en el lienzo. */
  highlightedPath: { from: 'shortest' | 'all'; index: number } | null;
  playback: PlaybackState;
  layoutSuggestion: LayoutSuggestion | null;

  // ── Preferencias de UI ──
  activeTab: ResultTab;
  tabularConfig: TabularConfig;
  allPathsLimit: number;
  theme: Theme;
  keepProportion: boolean;

  // ── Acciones: modo y archivos ──
  setMode(mode: AppMode): void;
  loadTemplate(template: Template): void;
  exportGraphFile(): GraphFile;
  importGraphFile(json: string): ImportResult;

  // ── Acciones: edición (modo diseño; todas registran deshacer/rehacer) ──
  addNode(at: { x: number; y: number }, label?: string): NodeId;
  moveNodes(moves: Record<NodeId, { x: number; y: number }>): void;
  resizeNode(id: NodeId, size: { x: number; y: number; w: number; h: number }): void;
  renameNode(id: NodeId, label: string): void;
  removeNodes(ids: NodeId[]): void;
  addEdge(source: NodeId, target: NodeId, weight: number): AddEdgeResult;
  setEdgeWeight(id: string, weight: number): boolean;
  /** `ids = 'all'` cambia todas; deja `shapeAuto = false` en las afectadas. */
  setEdgeShape(ids: string[] | 'all', shape: EdgeShape): void;
  /** Vuelve a `shapeAuto = true` y recalcula la forma automática. */
  resetEdgeShapeAuto(ids: string[] | 'all'): void;
  removeEdges(ids: string[]): void;
  applySuggestedLayout(): Promise<void>;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // ── Acciones: selección y consulta ──
  select(nodeIds: NodeId[], edgeIds: string[]): void;
  setTreeQuery(source: NodeId): void;
  setPathQuery(source: NodeId, target: NodeId | null): void;
  clearQuery(): void;

  // ── Acciones: reproducción S1 ──
  stepTo(index: number): void;
  nextStep(): void;
  prevStep(): void;
  play(): void;
  pause(): void;
  toEnd(): void;
  setSpeed(ms: number): void;

  // ── Acciones: S3 ──
  runAllPaths(): void;
  cancelAllPaths(): void;
  setAllPathsLimit(limit: number): void;
  highlightPath(sel: AppState['highlightedPath']): void;

  // ── Proyecto II: Transporte Express (estado) ──
  /** Cabecera de cada departamento del módulo Guatemala (vacío en los otros modos). */
  departments: Record<NodeId, { cabecera: string }>;
  /** Contorno del país proyectado al lienzo (anillos de puntos en px), solo en modo `guatemala`. */
  outline: { x: number; y: number }[][] | null;
  /** Desglose de cada ruta mínima de `shortest` (mismo índice): listado, tramos, acumulados y fórmula. */
  breakdown: RouteBreakdown[] | null;
  coverMode: CoverMode;
  /** Árbol de expansión mínima con ambos algoritmos (deben dar el mismo total). */
  mst: { prim: MSTResult; kruskal: MSTResult } | null;
  /** Nodo de inicio de Prim (por defecto el primero). */
  mstStart: NodeId | null;
  tour: TourState;

  // ── Proyecto II: Transporte Express (acciones; editar registra deshacer/rehacer y autoguarda) ──
  addDepartment(input: DepartmentInput): AddDepartmentResult;
  /** Cambia nombre, cabecera o coordenadas (si cambian lat/lon, el punto se reubica). */
  updateDepartment(id: NodeId, patch: Partial<Omit<DepartmentInput, 'at'>>): AddDepartmentResult;
  /** Carretera bidireccional con nombre opcional (CA-1, CA-9…). Mismas validaciones que `addEdge`. */
  addRoad(source: NodeId, target: NodeId, km: number, road?: string): AddEdgeResult;
  updateRoad(id: string, patch: { km?: number; road?: string }): boolean;
  /** Descarta los cambios guardados del módulo Guatemala y vuelve al dataset original. */
  restoreOriginal(): void;
  /** Exporta el módulo Guatemala como `GuatemalaDataset` (conserva cabeceras y coordenadas). */
  exportGuatemalaDataset(): GuatemalaDataset;
  setCoverMode(mode: CoverMode): void;
  setMstStart(id: NodeId): void;
  runTour(start: NodeId): void;
  cancelTour(): void;
  /** Proyecta lat/lon con la proyección del mapa actual (centro del punto en px); null si el grafo no es geográfico. */
  projectLatLon(lat: number, lon: number): { x: number; y: number } | null;

  // ── Acciones: preferencias ──
  setActiveTab(tab: ResultTab): void;
  setTabularConfig(patch: Partial<TabularConfig>): void;
  setTheme(theme: Theme): void;
  setKeepProportion(on: boolean): void;
}
```

### `src/store/useAppStore.ts`

946 líneas.

```{.typescript .numberLines}
import { create } from 'zustand';
import { temporal, type TemporalState } from 'zundo';
import * as Comlink from 'comlink';
import {
  autoEdgeShapes,
  buildTabular,
  detectScale,
  dijkstra,
  floydWarshall,
  kruskal,
  prim,
  routeBreakdown,
  shortestPaths,
  validateGraph,
} from '../core';
import type {
  CoreWorkerApiP2,
  Dataset,
  GEdge,
  GNode,
  Graph,
  GraphFile,
  GuatemalaDataset,
  NodeId,
  TabularConfig,
  ValidationResult,
} from '../core';
import { DATASET_NODE_SIZE, DEFAULT_NODE_SIZE, datasetToGraph, makeProjection, type GeoProjection } from './dataset';
import type { AllPathsState, AppMode, AppState, Query, Template, Theme, TourState } from './types';

// ───────────────────────────── Datos empaquetados ─────────────────────────────

// glob (y no import directo) para que el build no falle mientras Gemini entrega los JSON.
const dataFiles = import.meta.glob<{ default: unknown }>('../data/*.json', { eager: true });
const dataFile = (name: string): unknown => dataFiles[`../data/${name}.json`]?.default;

const EMPTY_GRAPH: Graph = { nodes: [], edges: [], directed: false, unit: 'km' };

// ───────────── Proyecto II: módulo Guatemala (Transporte Express) ─────────────

const guatemalaOriginal = dataFile('guatemala') as GuatemalaDataset | undefined;
/**
 * Proyección Web Mercator fija, construida con las cabeceras del dataset ORIGINAL: así un departamento agregado o
 * importado cae siempre en el mismo lugar y el contorno del país coincide con los puntos.
 */
const gtProjection: GeoProjection | null = guatemalaOriginal?.nodes.length
  ? makeProjection(guatemalaOriginal.nodes, 'mercator')
  : null;
const qtzDataset = dataFile('quetzaltenango') as Dataset | undefined;
const qtzProjection: GeoProjection | null = qtzDataset?.nodes.length
  ? makeProjection(qtzDataset.nodes, 'equirect')
  : null;

/** Grafo del módulo Guatemala con la proyección fija; devuelve también las cabeceras. */
function guatemalaToGraph(ds: GuatemalaDataset): { graph: Graph; departments: Record<NodeId, { cabecera: string }> } {
  const proj = gtProjection ?? makeProjection(ds.nodes, 'mercator');
  const base = datasetToGraph(ds, undefined, 'mercator');
  const nodes = base.nodes.map((n) => {
    const c = proj.project(n.lat!, n.lon!);
    return { ...n, x: Math.round(c.x - DATASET_NODE_SIZE.w / 2), y: Math.round(c.y - DATASET_NODE_SIZE.h / 2) };
  });
  const departments = Object.fromEntries(ds.nodes.map((n) => [n.id, { cabecera: n.cabecera || n.label }]));
  return { graph: { ...base, nodes }, departments };
}

type GeoGeometry = { type?: string; coordinates?: unknown };

/** Anillos del contorno de Guatemala (GeoJSON en lon/lat) proyectados al lienzo. */
function guatemalaOutline(): { x: number; y: number }[][] | null {
  const geo = dataFile('guatemala_contorno') as
    (GeoGeometry & { geometry?: GeoGeometry; features?: { geometry?: GeoGeometry }[] }) | undefined;
  const proj = gtProjection;
  if (!geo || !proj) return null;
  const geometries: GeoGeometry[] = geo.features
    ? geo.features.map((f) => f.geometry ?? {})
    : geo.geometry
      ? [geo.geometry]
      : [geo];
  const rings: number[][][] = [];
  for (const gm of geometries) {
    if (gm.type === 'Polygon') rings.push(...(gm.coordinates as number[][][]));
    if (gm.type === 'MultiPolygon') for (const poly of gm.coordinates as number[][][][]) rings.push(...poly);
  }
  if (!rings.length) return null;
  return rings.map((ring) => ring.map(([lon, lat]) => proj.project(lat!, lon!)));
}

function guatemalaTemplate() {
  if (!guatemalaOriginal) return { graph: EMPTY_GRAPH, name: 'Guatemala (sin datos)', departments: {} };
  const { graph, departments } = guatemalaToGraph(guatemalaOriginal);
  return { graph, name: guatemalaOriginal.meta.nombre, departments };
}

function templateGraph(t: Template): { graph: Graph; name: string } {
  if (t === 'guatemala') return guatemalaTemplate();
  if (t === 'ejemplo_mst') {
    const f = dataFile('ejemplo_mst') as GraphFile | undefined;
    return { graph: f?.graph ?? EMPTY_GRAPH, name: f?.name ?? 'Ejemplo de árbol de expansión mínima (sin datos)' };
  }
  if (t === 'quetzaltenango') {
    const ds = dataFile('quetzaltenango') as Dataset | undefined;
    return { graph: ds ? datasetToGraph(ds) : EMPTY_GRAPH, name: ds?.meta.nombre ?? 'Quetzaltenango (sin datos)' };
  }
  if (t === 'ejemplo6') {
    const f = dataFile('ejemplo6') as GraphFile | undefined;
    return { graph: f?.graph ?? EMPTY_GRAPH, name: f?.name ?? 'Ejemplo de 6 nodos (sin datos)' };
  }
  return { graph: { ...EMPTY_GRAPH, unit: 'u' }, name: 'Mapa nuevo' };
}

// ───────────────────────────── Persistencia local ─────────────────────────────

const KEY_DESIGN = 'rutaq:design';
const KEY_GUATEMALA = 'rutaq:guatemala';
const KEY_PREFS = 'rutaq:prefs';

const storage = typeof localStorage === 'undefined' ? null : localStorage;

function readJson<T>(key: string): T | null {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Cuota llena o modo privado: el autoguardado es opcional.
  }
}

// ───────────────────────────── Derivados ─────────────────────────────

/** Ejecuta una función del núcleo sin dejar que un error rompa la UI. */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    console.warn('[RutaQ]', e instanceof Error ? e.message : e);
    return fallback;
  }
}

const NOT_VALIDATED: ValidationResult = { ok: false, issues: [] };

function applyAutoShapes(g: Graph): Graph {
  const shapes = safe(() => autoEdgeShapes(g), {});
  if (!g.edges.some((e) => e.shapeAuto && shapes[e.id] && shapes[e.id] !== e.shape)) return g;
  return { ...g, edges: g.edges.map((e) => (e.shapeAuto && shapes[e.id] ? { ...e, shape: shapes[e.id]! } : e)) };
}

/** Recalcula validación, escala y resultados a partir de (graph, query). */
function derive(graph: Graph, query: Query | null) {
  const ids = new Set(graph.nodes.map((n) => n.id));
  if (query && (!ids.has(query.source) || (query.kind === 'path' && query.target && !ids.has(query.target)))) {
    query = null;
  }
  const validation = safe(() => validateGraph(graph), NOT_VALIDATED);
  const scale = safe(() => detectScale(graph.edges.map((e) => e.weight)), { magnitude: 1, range: '—', pxPerUnit: 1 });
  const solvable = validation.ok && graph.nodes.length > 0;

  const floyd = solvable ? safe(() => floydWarshall(graph), null) : null;
  const dj = solvable && query ? safe(() => dijkstra(graph, query.source), null) : null;
  const tabular = dj ? safe(() => buildTabular(graph, dj), null) : null;
  const shortest =
    solvable && query?.kind === 'path' && query.target
      ? safe(() => shortestPaths(graph, query.source, query.target!), null)
      : null;
  // Proyecto II: desglose de cada ruta mínima (tramos, acumulados, fórmula) y árbol de expansión mínima.
  const breakdown = shortest ? safe(() => shortest.map((p) => routeBreakdown(graph, p)), null) : null;
  const start = mstStart && ids.has(mstStart) ? mstStart : (graph.nodes[0]?.id ?? null);
  const mst = validation.ok && start ? safe(() => ({ prim: prim(graph, start), kruskal: kruskal(graph) }), null) : null;

  return {
    breakdown,
    mst,
    mstStart: start,
    query,
    validation,
    scale,
    floyd,
    dijkstra: dj,
    tabular,
    shortest,
    highlightedPath: null,
    allPaths: IDLE_ALL_PATHS,
    // Por defecto se muestra la solución completa; «Reproducir» reinicia desde la iteración 0.
    playback: { stepIndex: dj ? dj.steps.length - 1 : 0, playing: false, speedMs },
  };
}

const IDLE_ALL_PATHS: AllPathsState = { status: 'idle', found: 0, result: null, error: null };

let speedMs = 900;
/** Inicio de Prim elegido por el usuario (se valida contra el grafo en `derive`). */
let mstStart: NodeId | null = null;

const IDLE_TOUR: TourState = { status: 'idle', start: null, result: null, error: null };
let tourRun = 0;

// ───────────────────────────── Worker de S3 / layout ─────────────────────────────

let worker: Worker | null = null;
let workerApi: Comlink.Remote<CoreWorkerApiP2> | null = null;

function getWorker(): Comlink.Remote<CoreWorkerApiP2> {
  if (!workerApi) {
    worker = new Worker(new URL('../core/worker.ts', import.meta.url), { type: 'module' });
    workerApi = Comlink.wrap<CoreWorkerApiP2>(worker);
  }
  return workerApi;
}

/** Cancelar = terminar el Worker (corta un DFS en curso de inmediato); el próximo uso crea otro. */
function killWorker() {
  worker?.terminate();
  worker = null;
  workerApi = null;
}

let allPathsRun = 0;
let playTimer: ReturnType<typeof setInterval> | null = null;

function stopTimer() {
  if (playTimer) clearInterval(playTimer);
  playTimer = null;
}

// ───────────────────────────── Utilidades de edición ─────────────────────────────

function nextNodeId(g: Graph): NodeId {
  let i = g.nodes.length + 1;
  const ids = new Set(g.nodes.map((n) => n.id));
  while (ids.has(`n${i}`)) i++;
  return `n${i}`;
}

/** A, B, …, Z, AA, AB… — la primera etiqueta que no esté en uso. */
function nextLabel(g: Graph): string {
  const used = new Set(g.nodes.map((n) => n.label));
  for (let i = 0; ; i++) {
    let s = '';
    for (let k = i; k >= 0; k = Math.floor(k / 26) - 1) s = String.fromCharCode(65 + (k % 26)) + s;
    if (!used.has(s)) return s;
  }
}

const samePair = (e: GEdge, a: NodeId, b: NodeId) =>
  (e.source === a && e.target === b) || (e.source === b && e.target === a);

const validWeight = (w: number) => Number.isFinite(w) && w > 0;

function isGraph(v: unknown): v is Graph {
  const g = v as Graph;
  return (
    !!g &&
    Array.isArray(g.nodes) &&
    Array.isArray(g.edges) &&
    g.nodes.every((n) => typeof n.id === 'string' && Number.isFinite(n.x) && Number.isFinite(n.y)) &&
    g.edges.every((e) => typeof e.id === 'string' && typeof e.source === 'string' && typeof e.weight === 'number')
  );
}

/** Completa campos opcionales de un grafo importado (tamaño, forma, unidad). */
function normalizeGraph(g: Graph): Graph {
  return {
    directed: false,
    unit: typeof g.unit === 'string' && g.unit ? g.unit : 'u',
    nodes: g.nodes.map((n) => ({
      ...n,
      label: typeof n.label === 'string' ? n.label : n.id,
      w: Number.isFinite(n.w) && n.w > 0 ? n.w : DEFAULT_NODE_SIZE.w,
      h: Number.isFinite(n.h) && n.h > 0 ? n.h : DEFAULT_NODE_SIZE.h,
    })),
    edges: g.edges.map((e) => ({ ...e, shape: e.shape ?? 'straight', shapeAuto: e.shapeAuto ?? true })),
  };
}

/** Quita tildes y pasa a minúsculas para comparar nombres. */
const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

/** Id de 3 letras a partir del nombre (sin tildes), único en el grafo: «Petén» → PET, luego PE2… */
function departmentId(g: Graph, label: string): NodeId {
  const base =
    plain(label)
      .replace(/[^a-z]/g, '')
      .toUpperCase()
      .slice(0, 3) || 'DEP';
  const ids = new Set(g.nodes.map((n) => n.id));
  if (!ids.has(base)) return base;
  for (let i = 2; ; i++) {
    const id = `${base.slice(0, 2)}${i}`;
    if (!ids.has(id)) return id;
  }
}

const validCoords = (lat?: number, lon?: number) =>
  lat === undefined && lon === undefined
    ? true
    : Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat!) <= 90 && Math.abs(lon!) <= 180;

// ───────────────────────────── Tema ─────────────────────────────

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const dark =
    theme === 'dark' ||
    (theme === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

// ───────────────────────────── Store ─────────────────────────────

const DEFAULT_TABULAR: TabularConfig = {
  showAdjacency: true,
  labelFormat: 'paren',
  crossOut: 'column',
  repeatPermanent: false,
};

interface Prefs {
  theme: Theme;
  tabularConfig: TabularConfig;
  allPathsLimit: number;
  keepProportion: boolean;
  mode: AppMode;
}

const prefs = readJson<Partial<Prefs>>(KEY_PREFS) ?? {};

function initialGraph(mode: AppMode): {
  graph: Graph;
  name: string;
  departments?: Record<NodeId, { cabecera: string }>;
} {
  if (mode === 'guatemala') {
    const saved = readJson<GuatemalaDataset>(KEY_GUATEMALA);
    if (saved && Array.isArray(saved.nodes) && Array.isArray(saved.edges) && saved.meta) {
      try {
        return { ...guatemalaToGraph(saved), name: saved.meta.nombre };
      } catch {
        // Guardado dañado: se usa el dataset original.
      }
    }
    return guatemalaTemplate();
  }
  if (mode === 'design') {
    const saved = readJson<GraphFile>(KEY_DESIGN);
    if (saved && isGraph(saved.graph)) return { graph: normalizeGraph(saved.graph), name: saved.name };
    return templateGraph('ejemplo6');
  }
  return templateGraph('quetzaltenango');
}

const initialMode: AppMode = prefs.mode ?? 'quetzaltenango';
const initial = initialGraph(initialMode);
const initialG = applyAutoShapes(initial.graph);

/** Historial de deshacer/rehacer (con tipo explícito para evitar la referencia circular). */
function history(): TemporalState<{ graph: Graph; departments: Record<NodeId, { cabecera: string }> }> {
  return useAppStore.temporal.getState();
}

export const useAppStore = create<AppState>()(
  temporal(
    (set, get) => {
      /** Cambia el grafo y recalcula todo lo derivado en un solo `set` (= una entrada de historial). */
      const commitGraph = (graph: Graph, extra: Partial<AppState> = {}) => {
        stopTimer();
        killWorkerIfRunning();
        const g = applyAutoShapes(graph);
        set({ graph: g, layoutSuggestion: null, ...derive(g, get().query), ...extra });
      };

      const killWorkerIfRunning = () => {
        if (get().allPaths.status === 'running') {
          allPathsRun++;
          killWorker();
        }
      };

      const setQuery = (query: Query | null) => {
        stopTimer();
        killWorkerIfRunning();
        set(derive(get().graph, query));
      };

      /** Reemplaza el grafo sin dejar historial (cambio de modo, plantilla, importación). */
      const replaceGraph = (graph: Graph, name: string, extra: Partial<AppState> = {}) => {
        stopTimer();
        killWorkerIfRunning();
        const g = applyAutoShapes(graph);
        set({
          graph: g,
          graphName: name,
          selectedNodeIds: [],
          selectedEdgeIds: [],
          layoutSuggestion: null,
          tour: IDLE_TOUR,
          departments: {},
          ...derive(g, null),
          ...extra,
        });
        set({ outline: get().mode === 'guatemala' ? guatemalaOutline() : null });
        history().clear();
      };

      /** Coloca un departamento: con coordenadas en su posición real; si no, en `at` o en el centro del mapa. */
      const placeDepartment = (g: Graph, lat?: number, lon?: number, at?: { x: number; y: number }) => {
        if (lat !== undefined && lon !== undefined && gtProjection) return gtProjection.project(lat, lon);
        if (at) return at;
        const xs = g.nodes.map((n) => n.x + n.w / 2);
        const ys = g.nodes.map((n) => n.y + n.h / 2);
        return xs.length
          ? { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
          : { x: 0, y: 0 };
      };

      return {
        mode: initialMode,
        graph: initialG,
        graphName: initial.name,
        selectedNodeIds: [],
        selectedEdgeIds: [],
        layoutSuggestion: null,
        activeTab: 'grafica',
        tabularConfig: { ...DEFAULT_TABULAR, ...prefs.tabularConfig },
        allPathsLimit: prefs.allPathsLimit ?? 5000,
        theme: prefs.theme ?? 'system',
        keepProportion: prefs.keepProportion ?? false,
        departments: initial.departments ?? {},
        outline: initialMode === 'guatemala' ? guatemalaOutline() : null,
        coverMode: 'mst',
        tour: IDLE_TOUR,
        ...derive(initialG, null),

        // ── Modo y archivos ──
        setMode(mode) {
          if (mode === get().mode) return;
          const t = initialGraph(mode);
          replaceGraph(t.graph, t.name, { mode, departments: t.departments ?? {} });
        },
        loadTemplate(template) {
          if (template === 'guatemala') {
            const t = guatemalaTemplate();
            replaceGraph(t.graph, t.name, { mode: 'guatemala', departments: t.departments });
            return;
          }
          const t = templateGraph(template);
          replaceGraph(t.graph, t.name, { mode: template === 'quetzaltenango' ? 'quetzaltenango' : 'design' });
        },
        exportGraphFile() {
          const { graph, graphName } = get();
          return { format: 'rutaq-graph', version: 1, name: graphName, graph };
        },
        importGraphFile(json) {
          let data: unknown;
          try {
            data = JSON.parse(json);
          } catch {
            return { ok: false, message: 'El archivo no es un JSON válido.' };
          }
          const f = data as Partial<GraphFile> & Partial<Dataset>;
          let graph: Graph | null = null;
          let name = 'Mapa importado';
          if (f.format === 'rutaq-graph' && isGraph(f.graph)) {
            graph = normalizeGraph(f.graph);
            name = typeof f.name === 'string' ? f.name : name;
          } else if (f.meta && Array.isArray(f.nodes) && Array.isArray(f.edges)) {
            // Proyecto II: un dataset con cabeceras es del módulo Guatemala (exportado con «Guardar» en ese modo).
            if (f.nodes.every((n) => typeof (n as { cabecera?: unknown }).cabecera === 'string')) {
              const gt = guatemalaToGraph(f as GuatemalaDataset);
              replaceGraph(gt.graph, f.meta.nombre ?? name, { mode: 'guatemala', departments: gt.departments });
              return { ok: true };
            }
            graph = datasetToGraph(f as Dataset);
            name = f.meta.nombre ?? name;
          }
          if (!graph) return { ok: false, message: 'El archivo no tiene el formato de un mapa de RutaQ.' };
          replaceGraph(graph, name, { mode: 'design' });
          return { ok: true };
        },

        // ── Edición ──
        addNode(at, label) {
          const g = get().graph;
          const id = nextNodeId(g);
          const node = {
            id,
            label: label?.trim() || nextLabel(g),
            x: at.x - DEFAULT_NODE_SIZE.w / 2,
            y: at.y - DEFAULT_NODE_SIZE.h / 2,
            ...DEFAULT_NODE_SIZE,
          };
          commitGraph({ ...g, nodes: [...g.nodes, node] });
          return id;
        },
        moveNodes(moves) {
          const g = get().graph;
          commitGraph({ ...g, nodes: g.nodes.map((n) => (moves[n.id] ? { ...n, ...moves[n.id] } : n)) });
        },
        resizeNode(id, box) {
          const g = get().graph;
          commitGraph({
            ...g,
            nodes: g.nodes.map((n) =>
              n.id === id ? { ...n, ...box, w: Math.max(40, box.w), h: Math.max(28, box.h) } : n,
            ),
          });
        },
        renameNode(id, label) {
          const g = get().graph;
          const clean = label.trim();
          if (!clean) return;
          commitGraph({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, label: clean } : n)) });
        },
        removeNodes(ids) {
          const g = get().graph;
          const del = new Set(ids);
          commitGraph(
            {
              ...g,
              nodes: g.nodes.filter((n) => !del.has(n.id)),
              edges: g.edges.filter((e) => !del.has(e.source) && !del.has(e.target)),
            },
            { selectedNodeIds: [], selectedEdgeIds: [] },
          );
        },
        addEdge(source, target, weight) {
          const g = get().graph;
          if (source === target) return { ok: false, reason: 'self-loop' };
          if (!g.nodes.some((n) => n.id === source) || !g.nodes.some((n) => n.id === target))
            return { ok: false, reason: 'missing-node' };
          if (!validWeight(weight)) return { ok: false, reason: 'invalid-weight' };
          const dup = g.edges.find((e) => samePair(e, source, target));
          if (dup) return { ok: false, reason: 'duplicate', existingEdgeId: dup.id };
          const ids = new Set(g.edges.map((e) => e.id));
          let id = `${source}-${target}`;
          for (let i = 2; ids.has(id); i++) id = `${source}-${target}-${i}`;
          commitGraph({
            ...g,
            edges: [...g.edges, { id, source, target, weight, shape: 'straight', shapeAuto: true }],
          });
          return { ok: true, edgeId: id };
        },
        setEdgeWeight(id, weight) {
          const g = get().graph;
          if (!validWeight(weight) || !g.edges.some((e) => e.id === id)) return false;
          commitGraph({ ...g, edges: g.edges.map((e) => (e.id === id ? { ...e, weight } : e)) });
          return true;
        },
        setEdgeShape(ids, shape) {
          const g = get().graph;
          const hit = (e: GEdge) => ids === 'all' || ids.includes(e.id);
          commitGraph({ ...g, edges: g.edges.map((e) => (hit(e) ? { ...e, shape, shapeAuto: false } : e)) });
        },
        resetEdgeShapeAuto(ids) {
          const g = get().graph;
          const hit = (e: GEdge) => ids === 'all' || ids.includes(e.id);
          commitGraph({
            ...g,
            edges: g.edges.map((e) => (hit(e) ? { ...e, shape: 'straight', shapeAuto: true } : e)),
          });
        },
        removeEdges(ids) {
          const g = get().graph;
          const del = new Set(ids);
          commitGraph({ ...g, edges: g.edges.filter((e) => !del.has(e.id)) }, { selectedEdgeIds: [] });
        },
        async applySuggestedLayout() {
          const g = get().graph;
          if (g.nodes.length === 0) return;
          try {
            const s = await getWorker().suggestLayout(g);
            if (get().graph !== g) return; // el grafo cambió mientras se calculaba
            commitGraph(
              {
                ...g,
                nodes: g.nodes.map((n) => {
                  const p = s.positions[n.id];
                  return p ? { ...n, x: p.x - n.w / 2, y: p.y - n.h / 2 } : n;
                }),
              },
              { layoutSuggestion: s },
            );
          } catch (e) {
            console.warn('[RutaQ] distribución sugerida:', e);
          }
        },
        undo() {
          history().undo();
          set(derive(get().graph, get().query));
        },
        redo() {
          history().redo();
          set(derive(get().graph, get().query));
        },
        canUndo: () => history().pastStates.length > 0,
        canRedo: () => history().futureStates.length > 0,

        // ── Selección y consulta ──
        select(nodeIds, edgeIds) {
          set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds });
        },
        setTreeQuery(source) {
          setQuery({ kind: 'tree', source });
        },
        setPathQuery(source, target) {
          setQuery({ kind: 'path', source, target });
        },
        clearQuery() {
          setQuery(null);
        },

        // ── Reproducción S1 ──
        stepTo(index) {
          const steps = get().dijkstra?.steps.length ?? 0;
          if (steps === 0) return;
          set({ playback: { ...get().playback, stepIndex: Math.max(0, Math.min(steps - 1, index)) } });
        },
        nextStep() {
          get().stepTo(get().playback.stepIndex + 1);
        },
        prevStep() {
          get().stepTo(get().playback.stepIndex - 1);
        },
        play() {
          const last = (get().dijkstra?.steps.length ?? 0) - 1;
          if (last < 0) return;
          stopTimer();
          const start = get().playback.stepIndex >= last ? 0 : get().playback.stepIndex;
          set({ playback: { ...get().playback, stepIndex: start, playing: true } });
          playTimer = setInterval(() => {
            const { stepIndex } = get().playback;
            if (stepIndex >= last) get().pause();
            else get().stepTo(stepIndex + 1);
          }, get().playback.speedMs);
        },
        pause() {
          stopTimer();
          set({ playback: { ...get().playback, playing: false } });
        },
        toEnd() {
          get().pause();
          get().stepTo(Number.MAX_SAFE_INTEGER);
        },
        setSpeed(ms) {
          speedMs = Math.max(50, ms);
          const wasPlaying = get().playback.playing;
          set({ playback: { ...get().playback, speedMs } });
          if (wasPlaying) get().play();
        },

        // ── S3 ──
        runAllPaths() {
          const { graph, query, allPathsLimit, validation } = get();
          if (query?.kind !== 'path' || !query.target || !validation.ok) return;
          killWorkerIfRunning();
          const run = ++allPathsRun;
          set({ allPaths: { status: 'running', found: 0, result: null, error: null }, highlightedPath: null });
          const onProgress = Comlink.proxy((found: number) => {
            if (run === allPathsRun) set({ allPaths: { ...get().allPaths, found } });
          });
          getWorker()
            .allSimplePaths(graph, query.source, query.target, { limit: allPathsLimit, timeoutMs: 8000 }, onProgress)
            .then((result) => {
              if (run === allPathsRun)
                set({ allPaths: { status: 'done', found: result.totalFound, result, error: null } });
            })
            .catch((e: unknown) => {
              if (run === allPathsRun)
                set({
                  allPaths: { ...get().allPaths, status: 'error', error: e instanceof Error ? e.message : String(e) },
                });
            });
        },
        cancelAllPaths() {
          if (get().allPaths.status !== 'running') return;
          allPathsRun++;
          killWorker();
          set({ allPaths: { ...get().allPaths, status: 'cancelled' } });
        },
        setAllPathsLimit(limit) {
          if (Number.isInteger(limit) && limit > 0) set({ allPathsLimit: limit });
        },
        highlightPath(sel) {
          set({ highlightedPath: sel });
        },

        // ── Proyecto II: Transporte Express ──
        addDepartment({ label, cabecera, lat, lon, at }) {
          const g = get().graph;
          const name = label.trim();
          if (!name) return { ok: false, reason: 'empty-name' };
          if (g.nodes.some((n) => plain(n.label) === plain(name))) return { ok: false, reason: 'duplicate-name' };
          if (!validCoords(lat, lon)) return { ok: false, reason: 'invalid-coords' };
          const id = departmentId(g, name);
          const c = placeDepartment(g, lat, lon, at);
          // Sin coordenadas se guardan las del punto donde quedó, para que siga siendo un nodo del mapa.
          const geo =
            lat !== undefined && lon !== undefined
              ? { lat, lon }
              : gtProjection
                ? gtProjection.unproject(c.x, c.y)
                : {};
          const node: GNode = {
            id,
            label: name,
            x: Math.round(c.x - DATASET_NODE_SIZE.w / 2),
            y: Math.round(c.y - DATASET_NODE_SIZE.h / 2),
            ...DATASET_NODE_SIZE,
            ...geo,
          };
          commitGraph(
            { ...g, nodes: [...g.nodes, node] },
            { departments: { ...get().departments, [id]: { cabecera: cabecera.trim() || name } } },
          );
          return { ok: true, id };
        },
        updateDepartment(id, { label, cabecera, lat, lon }) {
          const g = get().graph;
          const node = g.nodes.find((n) => n.id === id);
          if (!node) return { ok: false, reason: 'empty-name' };
          const name = label === undefined ? node.label : label.trim();
          if (!name) return { ok: false, reason: 'empty-name' };
          if (g.nodes.some((n) => n.id !== id && plain(n.label) === plain(name)))
            return { ok: false, reason: 'duplicate-name' };
          const moving = lat !== undefined || lon !== undefined;
          const nlat = lat ?? node.lat;
          const nlon = lon ?? node.lon;
          if (moving && !validCoords(nlat, nlon)) return { ok: false, reason: 'invalid-coords' };
          const c = moving && gtProjection ? gtProjection.project(nlat!, nlon!) : null;
          commitGraph(
            {
              ...g,
              nodes: g.nodes.map((n) =>
                n.id === id
                  ? {
                      ...n,
                      label: name,
                      ...(c
                        ? { x: Math.round(c.x - n.w / 2), y: Math.round(c.y - n.h / 2), lat: nlat, lon: nlon }
                        : {}),
                    }
                  : n,
              ),
            },
            {
              departments: {
                ...get().departments,
                [id]: { cabecera: cabecera?.trim() || get().departments[id]?.cabecera || name },
              },
            },
          );
          return { ok: true, id };
        },
        addRoad(source, target, km, road) {
          const g = get().graph;
          if (source === target) return { ok: false, reason: 'self-loop' };
          if (!g.nodes.some((n) => n.id === source) || !g.nodes.some((n) => n.id === target))
            return { ok: false, reason: 'missing-node' };
          if (!validWeight(km)) return { ok: false, reason: 'invalid-weight' };
          const dup = g.edges.find((e) => samePair(e, source, target));
          if (dup) return { ok: false, reason: 'duplicate', existingEdgeId: dup.id };
          // Convención del dataset: ids en orden alfabético («GUA-SAC»); bidireccional por definición.
          const [a, b] = source < target ? [source, target] : [target, source];
          const ids = new Set(g.edges.map((e) => e.id));
          let id = `${a}-${b}`;
          for (let i = 2; ids.has(id); i++) id = `${a}-${b}-${i}`;
          const meta = { carretera: road?.trim() ?? '', fuente: 'Ingresada por el usuario' };
          commitGraph({
            ...g,
            edges: [...g.edges, { id, source: a, target: b, weight: km, shape: 'straight', shapeAuto: true, meta }],
          });
          return { ok: true, edgeId: id };
        },
        updateRoad(id, { km, road }) {
          const g = get().graph;
          if (!g.edges.some((e) => e.id === id)) return false;
          if (km !== undefined && !validWeight(km)) return false;
          commitGraph({
            ...g,
            edges: g.edges.map((e) =>
              e.id === id
                ? {
                    ...e,
                    weight: km ?? e.weight,
                    meta: road === undefined ? e.meta : { ...e.meta, carretera: road.trim() },
                  }
                : e,
            ),
          });
          return true;
        },
        restoreOriginal() {
          try {
            storage?.removeItem(KEY_GUATEMALA);
          } catch {
            // Sin acceso a localStorage: igual se recarga el original.
          }
          get().loadTemplate('guatemala');
        },
        exportGuatemalaDataset() {
          const { graph, graphName, departments } = get();
          const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
          return {
            meta: {
              nombre: graphName,
              unidad: 'km',
              fuentes: guatemalaOriginal?.meta.fuentes ?? ['Ingresado por el usuario'],
              fecha: new Date().toISOString().slice(0, 10),
            },
            nodes: graph.nodes.map((n) => {
              const geo =
                n.lat !== undefined && n.lon !== undefined
                  ? { lat: n.lat, lon: n.lon }
                  : gtProjection
                    ? gtProjection.unproject(n.x + n.w / 2, n.y + n.h / 2)
                    : { lat: 0, lon: 0 };
              const orig = guatemalaOriginal?.nodes.find((o) => o.id === n.id);
              return {
                id: n.id,
                label: n.label,
                cabecera: departments[n.id]?.cabecera ?? n.label,
                ...geo,
                fuente: orig && orig.lat === geo.lat && orig.lon === geo.lon ? orig.fuente : 'Ingresado por el usuario',
              };
            }),
            edges: graph.edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              km: e.weight,
              carretera: str(e.meta?.carretera),
              fuente: str(e.meta?.fuente, 'Ingresada por el usuario'),
              verificado_google: e.meta?.verificado_google === true,
              km_google: typeof e.meta?.km_google === 'number' ? e.meta.km_google : null,
              nota: str(e.meta?.nota),
              geometry: str(e.meta?.geometry),
            })),
          };
        },
        setCoverMode(mode) {
          set({ coverMode: mode });
        },
        setMstStart(id) {
          mstStart = id;
          set(derive(get().graph, get().query));
        },
        runTour(start) {
          const { graph } = get();
          const run = ++tourRun;
          set({ tour: { status: 'running', start, result: null, error: null } });
          getWorker()
            .deliveryTour(graph, start)
            .then((result) => {
              if (run === tourRun) set({ tour: { status: 'done', start, result, error: null } });
            })
            .catch((e: unknown) => {
              if (run === tourRun)
                set({
                  tour: { status: 'error', start, result: null, error: e instanceof Error ? e.message : String(e) },
                });
            });
        },
        cancelTour() {
          if (get().tour.status !== 'running') return;
          tourRun++;
          killWorker();
          set({ tour: { ...get().tour, status: 'cancelled' } });
        },
        projectLatLon(lat, lon) {
          const mode = get().mode;
          const proj = mode === 'guatemala' ? gtProjection : mode === 'quetzaltenango' ? qtzProjection : null;
          return proj ? proj.project(lat, lon) : null;
        },

        // ── Preferencias ──
        setActiveTab(tab) {
          set({ activeTab: tab });
        },
        setTabularConfig(patch) {
          set({ tabularConfig: { ...get().tabularConfig, ...patch } });
        },
        setTheme(theme) {
          set({ theme });
          applyTheme(theme);
        },
        setKeepProportion(on) {
          set({ keepProportion: on });
        },
      };
    },
    {
      // Solo el grafo entra al historial de deshacer/rehacer.
      partialize: (s) => ({ graph: s.graph, departments: s.departments }),
      equality: (a, b) => a.graph === b.graph && a.departments === b.departments,
      limit: 100,
    },
  ),
);

// Autoguardado del modo diseño y de las preferencias.
useAppStore.subscribe((s, prev) => {
  if (s.mode === 'design' && (s.graph !== prev.graph || s.graphName !== prev.graphName)) {
    writeJson(KEY_DESIGN, s.exportGraphFile());
  }
  // Proyecto II: el módulo Guatemala se autoguarda solo cuando el usuario lo modifica (no al abrirlo).
  if (
    s.mode === 'guatemala' &&
    prev.mode === 'guatemala' &&
    (s.graph !== prev.graph || s.departments !== prev.departments)
  ) {
    writeJson(KEY_GUATEMALA, s.exportGuatemalaDataset());
  }
  if (
    s.theme !== prev.theme ||
    s.tabularConfig !== prev.tabularConfig ||
    s.allPathsLimit !== prev.allPathsLimit ||
    s.keepProportion !== prev.keepProportion ||
    s.mode !== prev.mode
  ) {
    const p: Prefs = {
      theme: s.theme,
      tabularConfig: s.tabularConfig,
      allPathsLimit: s.allPathsLimit,
      keepProportion: s.keepProportion,
      mode: s.mode,
    };
    writeJson(KEY_PREFS, p);
  }
});

applyTheme(useAppStore.getState().theme);
if (typeof matchMedia !== 'undefined') {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(useAppStore.getState().theme));
}
```

## Interfaz del módulo Transporte Express

Componentes React del módulo Guatemala.

### `src/ui/components/guatemala/GuatemalaAboutModal.tsx`

107 líneas.

```{.tsx .numberLines}
/**
 * Diálogo «Acerca de» del Proyecto II (G5).
 * Muestra los datos institucionales de la Universidad Mariano Gálvez de Guatemala,
 * los nombres y carnés exactos de los 3 integrantes del grupo y la fecha de presentación.
 *
 * Datos estáticos según docs/PLAN_PROYECTO2.md.
 */
import Modal from '../Modal';

interface GuatemalaAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuatemalaAboutModal({ isOpen, onClose }: GuatemalaAboutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Acerca de — Transporte Express (RutaQ)" testId="modal-about">
      <div className="flex flex-col gap-4 text-xs leading-relaxed" data-testid="about-dialog-content">
        {/* Encabezado Institucional */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-center dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="text-base font-extrabold text-blue-900 dark:text-blue-100">
            Universidad Mariano Gálvez de Guatemala
          </div>
          <div className="text-xs font-semibold text-blue-800 dark:text-blue-200 mt-0.5">
            Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-2">
            Proyecto II: «Transporte Express» — Optimización de Rutas Departamentales
          </div>
        </div>

        {/* Datos académicos */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Curso:</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">Investigación de Operaciones</div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Catedrático:</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">Ing. Samuel Isaac Gómez Moreno</div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Semestre y Carrera:</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">6.º semestre, Ingeniería en Sistemas</div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Fecha de presentación:</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">Sábado 31 de octubre de 2026</div>
          </div>
        </div>

        {/* Integrantes del grupo y carnés */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">Integrantes del equipo de desarrollo:</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="table-team-members">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase dark:border-slate-700">
                  <th className="py-1.5 px-2">Nombre completo</th>
                  <th className="py-1.5 px-2 font-mono text-right">Carné</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-2 text-slate-800 dark:text-slate-200">Cristopher Alexis Castellanos Paz</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    2690-24-5972
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-2 text-slate-800 dark:text-slate-200">Leonel Taracena Marroquín</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    2690-24-4072
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-2 text-slate-800 dark:text-slate-200">Pablo Alexander Vásquez Rivera</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    2690-24-13123
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Descripción del sistema */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <strong>RutaQ — Transporte Express</strong> resuelve el problema de optimización de entrega de paquetes a
          través de la red vial de los 22 departamentos de Guatemala, integrando el algoritmo de Dijkstra para rutas más
          cortas, el árbol de expansión mínima con Prim y Kruskal, y recorridos heurísticos de reparto.
        </p>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            data-testid="btn-close-about"
            onClick={onClose}
            className="min-h-[44px] rounded-lg bg-blue-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Aceptar
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### `src/ui/components/guatemala/GuatemalaAdminModal.tsx`

906 líneas.

```{.tsx .numberLines}
/**
 * Panel de administración de la red vial para Transporte Express (G2).
 * Incluye dos secciones:
 *   1. Departamentos: agregar, editar, eliminar, buscar; coordenadas opcionales.
 *   2. Carreteras: agregar, editar, eliminar, buscar; tabla ordenable (por origen, destino, carretera, km).
 * Operaciones globales:
 *   - Exportar JSON (dataset Guatemala)
 *   - Importar JSON
 *   - Restaurar datos originales con diálogo de confirmación.
 *
 * Lee y modifica: `graph`, `departments`, `addDepartment`, `updateDepartment`, `removeNodes`,
 * `addRoad`, `updateRoad`, `removeEdges`, `restoreOriginal`, `exportGuatemalaDataset`, `importGraphFile` desde `useApp`.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';
import Modal from '../Modal';

interface GuatemalaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RoadSortField = 'source' | 'target' | 'road' | 'km';
type SortOrder = 'asc' | 'desc';

const getCarretera = (meta?: Record<string, unknown>): string =>
  typeof meta?.carretera === 'string' ? meta.carretera : '';

export default function GuatemalaAdminModal({ isOpen, onClose }: GuatemalaAdminModalProps) {
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const addDepartment = useApp((s) => s.addDepartment);
  const updateDepartment = useApp((s) => s.updateDepartment);
  const removeNodes = useApp((s) => s.removeNodes);
  const addRoad = useApp((s) => s.addRoad);
  const updateRoad = useApp((s) => s.updateRoad);
  const removeEdges = useApp((s) => s.removeEdges);
  const restoreOriginal = useApp((s) => s.restoreOriginal);
  const exportGuatemalaDataset = useApp((s) => s.exportGuatemalaDataset);
  const importGraphFile = useApp((s) => s.importGraphFile);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sección activa: 'departments' | 'roads'
  const [activeSection, setActiveSection] = useState<'departments' | 'roads'>('departments');

  // Diálogo de confirmación para restaurar originales
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Mensajes de error globales o de importación
  const [globalMessage, setGlobalMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ── ESTADO: DEPARTAMENTOS ──
  const [deptSearch, setDeptSearch] = useState('');
  const [newDeptLabel, setNewDeptLabel] = useState('');
  const [newDeptCabecera, setNewDeptCabecera] = useState('');
  const [newDeptLat, setNewDeptLat] = useState('');
  const [newDeptLon, setNewDeptLon] = useState('');
  const [deptFormError, setDeptFormError] = useState<string | null>(null);

  const [editingDeptId, setEditingDeptId] = useState<NodeId | null>(null);
  const [editDeptLabel, setEditDeptLabel] = useState('');
  const [editDeptCabecera, setEditDeptCabecera] = useState('');
  const [editDeptLat, setEditDeptLat] = useState('');
  const [editDeptLon, setEditDeptLon] = useState('');

  // ── ESTADO: CARRETERAS ──
  const [roadSearch, setRoadSearch] = useState('');
  const [newRoadSource, setNewRoadSource] = useState<NodeId>(graph.nodes[0]?.id ?? '');
  const [newRoadTarget, setNewRoadTarget] = useState<NodeId>(graph.nodes[1]?.id ?? '');
  const [newRoadKm, setNewRoadKm] = useState('');
  const [newRoadName, setNewRoadName] = useState('');
  const [roadFormError, setRoadFormError] = useState<{ message: string; existingEdgeId?: string } | null>(null);

  const [editingRoadId, setEditingRoadId] = useState<string | null>(null);
  const [editRoadKm, setEditRoadKm] = useState('');
  const [editRoadName, setEditRoadName] = useState('');

  // Ordenamiento de tabla de carreteras
  const [sortField, setSortField] = useState<RoadSortField>('source');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const getNodeLabel = useCallback(
    (id: NodeId): string => {
      return graph.nodes.find((n) => n.id === id)?.label ?? id;
    },
    [graph.nodes],
  );

  // ── ACCIONES: DEPARTAMENTOS ──
  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    setDeptFormError(null);
    const lat = newDeptLat.trim() ? parseFloat(newDeptLat) : undefined;
    const lon = newDeptLon.trim() ? parseFloat(newDeptLon) : undefined;

    const res = addDepartment({
      label: newDeptLabel,
      cabecera: newDeptCabecera,
      lat,
      lon,
    });

    if (res.ok) {
      setNewDeptLabel('');
      setNewDeptCabecera('');
      setNewDeptLat('');
      setNewDeptLon('');
      setGlobalMessage({ text: `Departamento «${newDeptLabel}» agregado con éxito.`, type: 'success' });
    } else {
      if (res.reason === 'empty-name') {
        setDeptFormError('El nombre del departamento no puede estar vacío.');
      } else if (res.reason === 'duplicate-name') {
        setDeptFormError('Ya existe un departamento con ese nombre.');
      } else if (res.reason === 'invalid-coords') {
        setDeptFormError('Coordenadas inválidas: latitud entre -90 y 90, longitud entre -180 y 180.');
      }
    }
  };

  const handleStartEditDept = (id: NodeId) => {
    const node = graph.nodes.find((n) => n.id === id);
    if (!node) return;
    setEditingDeptId(id);
    setEditDeptLabel(node.label);
    setEditDeptCabecera(departments[id]?.cabecera ?? node.label);
    setEditDeptLat(node.lat !== undefined ? String(node.lat) : '');
    setEditDeptLon(node.lon !== undefined ? String(node.lon) : '');
  };

  const handleSaveEditDept = (id: NodeId) => {
    const lat = editDeptLat.trim() ? parseFloat(editDeptLat) : undefined;
    const lon = editDeptLon.trim() ? parseFloat(editDeptLon) : undefined;

    const res = updateDepartment(id, {
      label: editDeptLabel,
      cabecera: editDeptCabecera,
      lat,
      lon,
    });

    if (res.ok) {
      setEditingDeptId(null);
      setGlobalMessage({ text: 'Departamento actualizado correctamente.', type: 'success' });
    } else {
      alert(res.reason === 'duplicate-name' ? 'Ya existe un departamento con ese nombre.' : 'Error al actualizar.');
    }
  };

  const handleDeleteDept = (id: NodeId) => {
    const name = getNodeLabel(id);
    if (confirm(`¿Eliminar el departamento «${name}» y todas sus carreteras conectadas?`)) {
      removeNodes([id]);
      setGlobalMessage({ text: `Departamento «${name}» eliminado.`, type: 'success' });
    }
  };

  // ── ACCIONES: CARRETERAS ──
  const handleAddRoad = (e: React.FormEvent) => {
    e.preventDefault();
    setRoadFormError(null);
    const km = parseFloat(newRoadKm);

    if (newRoadSource === newRoadTarget) {
      setRoadFormError({ message: 'El origen y el destino no pueden ser el mismo departamento.' });
      return;
    }
    if (isNaN(km) || km <= 0) {
      setRoadFormError({ message: 'El kilometraje debe ser un número positivo mayor a 0.' });
      return;
    }

    const res = addRoad(newRoadSource, newRoadTarget, km, newRoadName || undefined);
    if (res.ok) {
      setNewRoadKm('');
      setNewRoadName('');
      setGlobalMessage({ text: 'Carretera agregada exitosamente.', type: 'success' });
    } else {
      if (res.reason === 'duplicate') {
        setRoadFormError({
          message: 'Ya existe una carretera directa entre estos dos departamentos.',
          existingEdgeId: res.existingEdgeId,
        });
      } else if (res.reason === 'self-loop') {
        setRoadFormError({ message: 'No se permiten lazos hacia el mismo departamento.' });
      } else if (res.reason === 'invalid-weight') {
        setRoadFormError({ message: 'El kilometraje ingresado no es válido.' });
      } else {
        setRoadFormError({ message: 'Error al agregar la carretera.' });
      }
    }
  };

  const handleStartEditRoad = (id: string) => {
    const edge = graph.edges.find((e) => e.id === id);
    if (!edge) return;
    setEditingRoadId(id);
    setEditRoadKm(String(edge.weight));
    setEditRoadName(getCarretera(edge.meta));
  };

  const handleSaveEditRoad = (id: string) => {
    const km = parseFloat(editRoadKm);
    if (isNaN(km) || km <= 0) {
      alert('El kilometraje debe ser mayor a 0.');
      return;
    }
    const ok = updateRoad(id, { km, road: editRoadName });
    if (ok) {
      setEditingRoadId(null);
      setGlobalMessage({ text: 'Carretera actualizada correctamente.', type: 'success' });
    }
  };

  const handleDeleteRoad = (id: string) => {
    if (confirm('¿Eliminar esta carretera?')) {
      removeEdges([id]);
      setGlobalMessage({ text: 'Carretera eliminada.', type: 'success' });
    }
  };

  // ── EXPORTAR / IMPORTAR / RESTAURAR ──
  const handleExportJson = () => {
    const data = exportGuatemalaDataset();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guatemala_transporte_express_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setGlobalMessage({ text: 'Archivo JSON de Guatemala exportado exitosamente.', type: 'success' });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const res = importGraphFile(content);
        if (res.ok) {
          setGlobalMessage({ text: 'Dataset importado correctamente.', type: 'success' });
        } else {
          setGlobalMessage({ text: `Error al importar: ${res.message}`, type: 'error' });
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmRestore = () => {
    restoreOriginal();
    setShowRestoreConfirm(false);
    setGlobalMessage({ text: 'Se restauraron los datos originales de Guatemala.', type: 'success' });
  };

  // ── FILTRADO Y ORDENAMIENTO ──
  const filteredDepartments = useMemo(() => {
    const term = deptSearch.trim().toLowerCase();
    return graph.nodes.filter((n) => {
      const label = n.label.toLowerCase();
      const cab = (departments[n.id]?.cabecera ?? '').toLowerCase();
      return !term || label.includes(term) || cab.includes(term) || n.id.toLowerCase().includes(term);
    });
  }, [graph.nodes, departments, deptSearch]);

  const sortedRoads = useMemo(() => {
    const term = roadSearch.trim().toLowerCase();
    const list = graph.edges.filter((e) => {
      const s = getNodeLabel(e.source).toLowerCase();
      const t = getNodeLabel(e.target).toLowerCase();
      const r = getCarretera(e.meta).toLowerCase();
      return !term || s.includes(term) || t.includes(term) || r.includes(term);
    });

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'source') {
        cmp = getNodeLabel(a.source).localeCompare(getNodeLabel(b.source));
      } else if (sortField === 'target') {
        cmp = getNodeLabel(a.target).localeCompare(getNodeLabel(b.target));
      } else if (sortField === 'road') {
        cmp = getCarretera(a.meta).localeCompare(getCarretera(b.meta));
      } else if (sortField === 'km') {
        cmp = a.weight - b.weight;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [graph.edges, roadSearch, sortField, sortOrder, getNodeLabel]);

  const toggleSort = (field: RoadSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Administrar Red Vial — Transporte Express"
      testId="modal-admin-network"
    >
      <div className="flex flex-col gap-4 text-xs max-h-[78vh] overflow-y-auto pr-1" data-testid="panel-admin-network">
        {/* Input oculto para importación de JSON */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json,application/json"
          className="hidden"
          data-testid="input-admin-import-file"
        />

        {/* Barra superior de operaciones de archivo */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="btn-admin-export-json"
              onClick={handleExportJson}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>💾</span> Exportar JSON
            </button>
            <button
              type="button"
              data-testid="btn-admin-import-json"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>📂</span> Importar JSON
            </button>
          </div>

          <button
            type="button"
            data-testid="btn-admin-restore-original"
            onClick={() => setShowRestoreConfirm(true)}
            className="min-h-[40px] rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            🔄 Restaurar datos originales
          </button>
        </div>

        {/* Diálogo de confirmación para restaurar */}
        {showRestoreConfirm && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 shadow-md">
            <p className="font-bold text-sm">¿Confirmar restauración de datos originales?</p>
            <p className="mt-1 leading-relaxed">
              Esta acción restablecerá los 22 departamentos y carreteras oficiales de Transporte Express. Se descartarán
              las modificaciones locales no guardadas.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                data-testid="btn-cancel-restore"
                onClick={() => setShowRestoreConfirm(false)}
                className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="btn-confirm-restore"
                onClick={handleConfirmRestore}
                className="min-h-[38px] rounded-lg bg-amber-600 px-3.5 py-1 font-bold text-white shadow-xs hover:bg-amber-700"
              >
                Sí, restaurar datos
              </button>
            </div>
          </div>
        )}

        {/* Mensaje global temporal */}
        {globalMessage && (
          <div
            className={`rounded-lg p-2.5 font-semibold text-xs ${
              globalMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
            }`}
          >
            {globalMessage.text}
          </div>
        )}

        {/* Selector de pestañas de administración */}
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
          <button
            type="button"
            role="tab"
            data-testid="tab-admin-departments"
            aria-selected={activeSection === 'departments'}
            onClick={() => setActiveSection('departments')}
            className={`flex-1 min-h-[40px] rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeSection === 'departments'
                ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            🏛️ Departamentos ({graph.nodes.length})
          </button>
          <button
            type="button"
            role="tab"
            data-testid="tab-admin-roads"
            aria-selected={activeSection === 'roads'}
            onClick={() => setActiveSection('roads')}
            className={`flex-1 min-h-[40px] rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
              activeSection === 'roads'
                ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            🛣️ Carreteras ({graph.edges.length})
          </button>
        </div>

        {/* SECCIÓN 1: DEPARTAMENTOS */}
        {activeSection === 'departments' && (
          <div className="flex flex-col gap-4" data-testid="section-admin-departments">
            {/* Formulario para agregar departamento */}
            <form
              onSubmit={handleAddDept}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <h2 className="mb-2 font-bold text-slate-900 dark:text-slate-100">+ Agregar nuevo departamento</h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Nombre del departamento *
                  </label>
                  <input
                    type="text"
                    data-testid="input-dept-label"
                    value={newDeptLabel}
                    onChange={(e) => setNewDeptLabel(e.target.value)}
                    placeholder="Ej. Petén"
                    required
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Cabecera departamental
                  </label>
                  <input
                    type="text"
                    data-testid="input-dept-cabecera"
                    value={newDeptCabecera}
                    onChange={(e) => setNewDeptCabecera(e.target.value)}
                    placeholder="Ej. Flores"
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 dark:text-slate-400">Latitud (opcional)</label>
                  <input
                    type="number"
                    step="any"
                    data-testid="input-dept-lat"
                    value={newDeptLat}
                    onChange={(e) => setNewDeptLat(e.target.value)}
                    placeholder="Ej. 16.9248"
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 dark:text-slate-400">Longitud (opcional)</label>
                  <input
                    type="number"
                    step="any"
                    data-testid="input-dept-lon"
                    value={newDeptLon}
                    onChange={(e) => setNewDeptLon(e.target.value)}
                    placeholder="Ej. -89.8974"
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {deptFormError && (
                <div data-testid="dept-form-error" className="mt-2 text-rose-600 font-bold dark:text-rose-400">
                  {deptFormError}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  data-testid="btn-save-department"
                  onClick={handleAddDept}
                  className="min-h-[42px] rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Agregar departamento
                </button>
              </div>
            </form>

            {/* Listado de departamentos con buscador */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  Departamentos registrados ({filteredDepartments.length}):
                </h3>
                <input
                  type="text"
                  data-testid="input-dept-search"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Buscar departamento o cabecera…"
                  className="min-h-[38px] w-56 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800 max-h-72">
                <table className="w-full text-left border-collapse" data-testid="table-departments">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    <tr className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      <th className="py-2 px-3 w-12">ID</th>
                      <th className="py-2 px-3">Departamento</th>
                      <th className="py-2 px-3">Cabecera</th>
                      <th className="py-2 px-3">Ubicación (lat, lon)</th>
                      <th className="py-2 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                    {filteredDepartments.map((n) => {
                      const isEditing = editingDeptId === n.id;
                      const cabecera = departments[n.id]?.cabecera ?? n.label;
                      return (
                        <tr
                          key={n.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          data-testid={`dept-row-${n.id}`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-slate-500">{n.id}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100">
                            {isEditing ? (
                              <input
                                type="text"
                                data-testid={`input-edit-dept-name-${n.id}`}
                                value={editDeptLabel}
                                onChange={(e) => setEditDeptLabel(e.target.value)}
                                className="w-full rounded border px-1.5 py-0.5 text-xs font-semibold"
                              />
                            ) : (
                              n.label
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                            {isEditing ? (
                              <input
                                type="text"
                                data-testid={`input-edit-dept-cabecera-${n.id}`}
                                value={editDeptCabecera}
                                onChange={(e) => setEditDeptCabecera(e.target.value)}
                                className="w-full rounded border px-1.5 py-0.5 text-xs"
                              />
                            ) : (
                              cabecera
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-500">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  step="any"
                                  value={editDeptLat}
                                  onChange={(e) => setEditDeptLat(e.target.value)}
                                  placeholder="Lat"
                                  className="w-16 rounded border px-1 py-0.5 text-[10px]"
                                />
                                <input
                                  type="number"
                                  step="any"
                                  value={editDeptLon}
                                  onChange={(e) => setEditDeptLon(e.target.value)}
                                  placeholder="Lon"
                                  className="w-16 rounded border px-1 py-0.5 text-[10px]"
                                />
                              </div>
                            ) : n.lat !== undefined && n.lon !== undefined ? (
                              `${n.lat.toFixed(4)}, ${n.lon.toFixed(4)}`
                            ) : (
                              'Posición lienzo'
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  data-testid={`btn-save-dept-${n.id}`}
                                  onClick={() => handleSaveEditDept(n.id)}
                                  className="min-h-[34px] rounded bg-emerald-600 px-2 py-0.5 font-bold text-white hover:bg-emerald-700"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  data-testid={`btn-cancel-edit-dept-${n.id}`}
                                  onClick={() => setEditingDeptId(null)}
                                  className="min-h-[34px] rounded border border-slate-300 bg-white px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  data-testid={`btn-edit-dept-${n.id}`}
                                  onClick={() => handleStartEditDept(n.id)}
                                  className="min-h-[34px] rounded px-2 py-0.5 font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  data-testid={`btn-delete-dept-${n.id}`}
                                  onClick={() => handleDeleteDept(n.id)}
                                  className="min-h-[34px] rounded px-2 py-0.5 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: CARRETERAS */}
        {activeSection === 'roads' && (
          <div className="flex flex-col gap-4" data-testid="section-admin-roads">
            {/* Formulario para agregar carretera */}
            <form
              onSubmit={handleAddRoad}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <h2 className="mb-2 font-bold text-slate-900 dark:text-slate-100">
                + Conectar departamentos (nueva carretera)
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Departamento Origen *
                  </label>
                  <select
                    data-testid="select-road-source"
                    value={newRoadSource}
                    onChange={(e) => setNewRoadSource(e.target.value)}
                    required
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {graph.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label} ({departments[n.id]?.cabecera || n.label})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Departamento Destino *
                  </label>
                  <select
                    data-testid="select-road-target"
                    value={newRoadTarget}
                    onChange={(e) => setNewRoadTarget(e.target.value)}
                    required
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {graph.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label} ({departments[n.id]?.cabecera || n.label})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">
                    Kilometraje (km) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    data-testid="input-road-km"
                    value={newRoadKm}
                    onChange={(e) => setNewRoadKm(e.target.value)}
                    placeholder="Ej. 42.5"
                    required
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-600 dark:text-slate-400">
                    Nombre carretera (ej. CA-1, CA-9)
                  </label>
                  <input
                    type="text"
                    data-testid="input-road-name"
                    value={newRoadName}
                    onChange={(e) => setNewRoadName(e.target.value)}
                    placeholder="Ej. CA-9 Norte"
                    className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {roadFormError && (
                <div
                  data-testid="road-form-error"
                  className="mt-2 text-rose-600 font-bold dark:text-rose-400 flex items-center gap-2"
                >
                  <span>{roadFormError.message}</span>
                  {roadFormError.existingEdgeId && (
                    <button
                      type="button"
                      data-testid="btn-edit-existing-road"
                      onClick={() => handleStartEditRoad(roadFormError.existingEdgeId!)}
                      className="underline text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      Editar la existente
                    </button>
                  )}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  data-testid="btn-save-road"
                  onClick={handleAddRoad}
                  className="min-h-[42px] rounded-lg bg-blue-600 px-4 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Agregar carretera
                </button>
              </div>
            </form>

            {/* Listado ordenable de carreteras con buscador */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  Carreteras registradas ({sortedRoads.length}):
                </h3>
                <input
                  type="text"
                  data-testid="input-road-search"
                  value={roadSearch}
                  onChange={(e) => setRoadSearch(e.target.value)}
                  placeholder="Buscar por departamento o carretera…"
                  className="min-h-[38px] w-64 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800 max-h-72">
                <table className="w-full text-left border-collapse" data-testid="table-roads">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    <tr className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      <th
                        onClick={() => toggleSort('source')}
                        data-testid="sort-road-source"
                        className="py-2 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 select-none"
                      >
                        Origen {sortField === 'source' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('target')}
                        data-testid="sort-road-target"
                        className="py-2 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 select-none"
                      >
                        Destino {sortField === 'target' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('road')}
                        data-testid="sort-road-name"
                        className="py-2 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 select-none"
                      >
                        Carretera {sortField === 'road' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('km')}
                        data-testid="sort-road-km"
                        className="py-2 px-3 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 select-none"
                      >
                        Kilometraje {sortField === 'km' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th className="py-2 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                    {sortedRoads.map((e) => {
                      const isEditing = editingRoadId === e.id;
                      const srcName = getNodeLabel(e.source);
                      const tgtName = getNodeLabel(e.target);
                      const roadName = getCarretera(e.meta) || '—';

                      return (
                        <tr
                          key={e.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          data-testid={`road-row-${e.id}`}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100">{srcName}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100">{tgtName}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                            {isEditing ? (
                              <input
                                type="text"
                                data-testid={`input-edit-road-name-${e.id}`}
                                value={editRoadName}
                                onChange={(evt) => setEditRoadName(evt.target.value)}
                                className="w-full rounded border px-1.5 py-0.5 text-xs"
                              />
                            ) : (
                              roadName
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {isEditing ? (
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                data-testid={`input-edit-road-km-${e.id}`}
                                value={editRoadKm}
                                onChange={(evt) => setEditRoadKm(evt.target.value)}
                                className="w-20 rounded border px-1.5 py-0.5 text-xs text-right font-mono font-bold"
                              />
                            ) : (
                              `${e.weight.toFixed(1)} km`
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  data-testid={`btn-save-road-${e.id}`}
                                  onClick={() => handleSaveEditRoad(e.id)}
                                  className="min-h-[34px] rounded bg-emerald-600 px-2 py-0.5 font-bold text-white hover:bg-emerald-700"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  data-testid={`btn-cancel-edit-road-${e.id}`}
                                  onClick={() => setEditingRoadId(null)}
                                  className="min-h-[34px] rounded border border-slate-300 bg-white px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  data-testid={`btn-edit-road-${e.id}`}
                                  onClick={() => handleStartEditRoad(e.id)}
                                  className="min-h-[34px] rounded px-2 py-0.5 font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  data-testid={`btn-delete-road-${e.id}`}
                                  onClick={() => handleDeleteRoad(e.id)}
                                  className="min-h-[34px] rounded px-2 py-0.5 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
```

### `src/ui/components/guatemala/GuatemalaAssistantModal.tsx`

256 líneas.

```{.tsx .numberLines}
/**
 * Diálogo asistente de dos pasos para el cálculo de la mejor ruta (G3).
 * Pregunta:
 *   Paso 1: «¿Dónde se encuentra el paquete?» (origen)
 *   Paso 2: «¿A qué departamento debe llegar?» (destino)
 * Incluye filtro de búsqueda reactivo por nombre de departamento o cabecera departamental.
 *
 * Lee y modifica: `graph.nodes`, `departments`, `setPathQuery` desde `useApp`.
 */
import { useMemo, useState } from 'react';
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';
import Modal from '../Modal';

interface GuatemalaAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculated?: () => void;
}

export default function GuatemalaAssistantModal({ isOpen, onClose, onCalculated }: GuatemalaAssistantModalProps) {
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const setPathQuery = useApp((s) => s.setPathQuery);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSource, setSelectedSource] = useState<NodeId | null>(null);
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');

  const resetState = () => {
    setStep(1);
    setSelectedSource(null);
    setSourceSearch('');
    setTargetSearch('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Departamentos para el paso 1 filtrados por búsqueda
  const filteredSources = useMemo(() => {
    const term = sourceSearch.trim().toLowerCase();
    return graph.nodes.filter((n) => {
      const label = n.label.toLowerCase();
      const cabecera = (departments[n.id]?.cabecera ?? '').toLowerCase();
      return !term || label.includes(term) || cabecera.includes(term);
    });
  }, [graph.nodes, departments, sourceSearch]);

  // Departamentos para el paso 2 (excluyendo el origen) filtrados por búsqueda
  const filteredTargets = useMemo(() => {
    const term = targetSearch.trim().toLowerCase();
    return graph.nodes.filter((n) => {
      if (n.id === selectedSource) return false;
      const label = n.label.toLowerCase();
      const cabecera = (departments[n.id]?.cabecera ?? '').toLowerCase();
      return !term || label.includes(term) || cabecera.includes(term);
    });
  }, [graph.nodes, departments, selectedSource, targetSearch]);

  const handleSelectSource = (id: NodeId) => {
    setSelectedSource(id);
    setStep(2);
  };

  const handleSelectTarget = (id: NodeId) => {
    if (!selectedSource) return;
    setPathQuery(selectedSource, id);
    handleClose();
    if (onCalculated) onCalculated();
  };

  const sourceNode = graph.nodes.find((n) => n.id === selectedSource);
  const sourceCabecera = selectedSource ? departments[selectedSource]?.cabecera : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Asistente de Envíos — Transporte Express"
      testId="modal-assistant"
    >
      <div className="flex flex-col gap-4 text-xs" data-testid="assistant-wizard">
        {/* Barra de progreso de pasos */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {step === 1 ? '1' : '✓'}
            </span>
            <span
              className={`font-semibold ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}
            >
              ¿Dónde está el paquete?
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">→</span>

          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              2
            </span>
            <span
              className={`font-semibold ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}
            >
              ¿A dónde debe llegar?
            </span>
          </div>
        </div>

        {/* PASO 1: ORIGEN */}
        {step === 1 && (
          <div className="flex flex-col gap-3" data-testid="assistant-step-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                1. ¿Dónde se encuentra el paquete?
              </h2>
              <span className="text-slate-500">{filteredSources.length} departamentos</span>
            </div>

            {/* Buscador de origen */}
            <input
              type="text"
              data-testid="input-assistant-source-search"
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              placeholder="Buscar departamento o cabecera…"
              autoFocus
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            {/* Listado interactivo de departamentos origen */}
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-1 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800/60">
              {filteredSources.map((n) => {
                const cab = departments[n.id]?.cabecera ?? n.label;
                return (
                  <button
                    key={n.id}
                    type="button"
                    data-testid={`btn-select-source-${n.id}`}
                    onClick={() => handleSelectSource(n.id)}
                    className="flex min-h-[44px] w-full items-center justify-between px-3 py-2 text-left rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{n.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Cabecera: {cab}</div>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {n.id}
                    </span>
                  </button>
                );
              })}
              {filteredSources.length === 0 && (
                <div className="p-4 text-center text-slate-500">No se encontraron departamentos coincidentes.</div>
              )}
            </div>
          </div>
        )}

        {/* PASO 2: DESTINO */}
        {step === 2 && (
          <div className="flex flex-col gap-3" data-testid="assistant-step-2">
            {/* Origen fijado con opción de cambiar */}
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
              <div>
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Origen fijado:</span>
                <div className="font-bold text-emerald-950 dark:text-emerald-100">
                  {sourceNode?.label} ({sourceCabecera})
                </div>
              </div>
              <button
                type="button"
                data-testid="btn-change-source"
                onClick={() => setStep(1)}
                className="min-h-[36px] rounded-md px-2.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
              >
                Cambiar origen
              </button>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                2. ¿A qué departamento debe llegar?
              </h2>
              <span className="text-slate-500">{filteredTargets.length} disponibles</span>
            </div>

            {/* Buscador de destino */}
            <input
              type="text"
              data-testid="input-assistant-target-search"
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              placeholder="Buscar departamento o cabecera destino…"
              autoFocus
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            {/* Listado interactivo de departamentos destino */}
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-1 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800/60">
              {filteredTargets.map((n) => {
                const cab = departments[n.id]?.cabecera ?? n.label;
                return (
                  <button
                    key={n.id}
                    type="button"
                    data-testid={`btn-select-target-${n.id}`}
                    onClick={() => handleSelectTarget(n.id)}
                    className="flex min-h-[44px] w-full items-center justify-between px-3 py-2 text-left rounded-md hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{n.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Cabecera: {cab}</div>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {n.id}
                    </span>
                  </button>
                );
              })}
              {filteredTargets.length === 0 && (
                <div className="p-4 text-center text-slate-500">No se encontraron departamentos coincidentes.</div>
              )}
            </div>
          </div>
        )}

        {/* Botones inferiores */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            data-testid="btn-cancel-assistant"
            onClick={handleClose}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### `src/ui/components/guatemala/GuatemalaOutline.tsx`

43 líneas.

```{.tsx .numberLines}
/**
 * Contorno de la República de Guatemala para el módulo Transporte Express.
 * Muestra los polígonos del contorno del país proyectados en coordenadas del lienzo (Web Mercator),
 * como una capa SVG de fondo tenue que se desplaza y escala en sincronía con el viewport de React Flow.
 * Lee: `outline` y `mode` desde el store global (`useApp`).
 */
import { useViewport } from '@xyflow/react';
import { useApp } from '../../useApp';

export default function GuatemalaOutline() {
  const mode = useApp((s) => s.mode);
  const outline = useApp((s) => s.outline);
  const { x, y, zoom } = useViewport();

  if (mode !== 'guatemala' || !outline || outline.length === 0) {
    return null;
  }

  const pathData = outline
    .map((ring) => {
      if (!ring || ring.length === 0) return '';
      return 'M ' + ring.map((pt) => `${pt.x},${pt.y}`).join(' L ') + ' Z';
    })
    .filter(Boolean)
    .join(' ');

  if (!pathData) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-0" aria-hidden="true">
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        <path
          d={pathData}
          data-testid="guatemala-outline"
          className="fill-emerald-500/8 dark:fill-emerald-400/8 stroke-emerald-600/30 dark:stroke-emerald-400/25"
          style={{ vectorEffect: 'non-scaling-stroke' }}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      </g>
    </svg>
  );
}
```

### `src/ui/components/guatemala/GuatemalaPresentation.tsx`

207 líneas.

```{.tsx .numberLines}
/**
 * Modo Presentación a pantalla completa para el módulo Guatemala (G5).
 * Oculta los paneles secundarios (barra superior estándar, panel de pestañas),
 * maximiza el mapa a pantalla completa y muestra una tarjeta flotante de alta legibilidad
 * con el resultado activo (ruta óptima o red mínima) en tipografía grande (1280×720 y 1920×1080).
 * Permite cambiar entre los ejemplos rápidos y salir presionando la tecla Escape o el botón de salida.
 *
 * Lee: `mode`, `query`, `shortest`, `breakdown`, `mst`, `coverMode`, `setPathQuery`, `setCoverMode`, `clearQuery` desde `useApp`.
 */
import { useEffect } from 'react';
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';

interface GuatemalaPresentationProps {
  isOpen: boolean;
  onExit: () => void;
}

export default function GuatemalaPresentation({ isOpen, onExit }: GuatemalaPresentationProps) {
  const query = useApp((s) => s.query);
  const shortest = useApp((s) => s.shortest);
  const breakdown = useApp((s) => s.breakdown);
  const mst = useApp((s) => s.mst);
  const coverMode = useApp((s) => s.coverMode);
  const graph = useApp((s) => s.graph);
  const setPathQuery = useApp((s) => s.setPathQuery);
  const setCoverMode = useApp((s) => s.setCoverMode);
  const clearQuery = useApp((s) => s.clearQuery);

  // Escuchar tecla Escape para salir de presentación
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onExit]);

  if (!isOpen) return null;

  const getNodeLabel = (id: NodeId): string => {
    return graph.nodes.find((n) => n.id === id)?.label ?? id;
  };

  const currentBreakdown = breakdown?.[0];
  const isPathActive = query?.kind === 'path' && query.target && shortest && shortest.length > 0;
  const isMstActive = coverMode === 'mst' || !isPathActive;

  return (
    <div
      data-testid="guatemala-presentation-overlay"
      className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none"
    >
      {/* Barra superior flotante de la presentación */}
      <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-5 py-3 shadow-2xl backdrop-blur-md text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-lg text-white shadow-md">
            TE
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">Transporte Express — Guatemala</h1>
            <p className="text-xs text-slate-400">Modo Presentación · Red Vial Nacional de 22 Departamentos</p>
          </div>
        </div>

        {/* Ejemplos rápidos en presentación */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Ejemplos rápidos">
          <button
            type="button"
            data-testid="btn-pres-que-iza"
            onClick={() => setPathQuery('QUE', 'IZA')}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              query?.kind === 'path' && query.source === 'QUE' && query.target === 'IZA'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            QUE → IZA
          </button>
          <button
            type="button"
            data-testid="btn-pres-gua-pet"
            onClick={() => setPathQuery('GUA', 'PET')}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              query?.kind === 'path' && query.source === 'GUA' && query.target === 'PET'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            GUA → PET
          </button>
          <button
            type="button"
            data-testid="btn-pres-sma-jut"
            onClick={() => setPathQuery('SMA', 'JUT')}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              query?.kind === 'path' && query.source === 'SMA' && query.target === 'JUT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            SMA → JUT
          </button>
          <button
            type="button"
            data-testid="btn-pres-mst"
            onClick={() => {
              setCoverMode('mst');
              clearQuery();
            }}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              coverMode === 'mst' && !query
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            🌳 Red Mínima
          </button>
        </div>

        {/* Botón salir de presentación */}
        <button
          type="button"
          data-testid="btn-exit-presentation"
          onClick={onExit}
          className="min-h-[44px] rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          ✕ Salir (Esc)
        </button>
      </header>

      {/* Tarjeta flotante inferior de resultados en gran tamaño */}
      <div className="pointer-events-auto w-full max-w-xl self-start overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md text-white max-h-[36vh] lg:fixed lg:right-6 lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:w-[370px] lg:max-w-none">
        {isPathActive && currentBreakdown ? (
          <div className="space-y-3" data-testid="pres-route-card">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Mejor ruta calculada (Dijkstra)
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentBreakdown.legs.length} tramos</span>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div className="text-2xl sm:text-3xl font-black text-white">
                {getNodeLabel(currentBreakdown.nodes[0]!)} →{' '}
                {getNodeLabel(currentBreakdown.nodes[currentBreakdown.nodes.length - 1]!)}
              </div>
              <div
                data-testid="pres-total-distance"
                className="text-3xl sm:text-4xl font-black text-blue-400 font-mono"
              >
                {currentBreakdown.total.toFixed(1)} km
              </div>
            </div>

            <div className="text-sm font-mono text-slate-300 bg-slate-800/80 rounded-lg p-2.5 break-all">
              {currentBreakdown.formula}
            </div>

            {/* Secuencia resumida de departamentos */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-200 pt-1">
              {currentBreakdown.nodes.map((nodeId, i) => (
                <span key={`${nodeId}-${i}`} className="inline-flex items-center gap-1.5">
                  <span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">
                    {getNodeLabel(nodeId)}
                  </span>
                  {i < currentBreakdown.nodes.length - 1 && <span className="text-slate-500">→</span>}
                </span>
              ))}
            </div>
          </div>
        ) : isMstActive && mst ? (
          <div className="space-y-3" data-testid="pres-mst-card">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Red Mínima Departamental (Prim / Kruskal)
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                {mst ? `${mst.prim.edges.length} carreteras` : '21 carreteras'}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div className="text-xl sm:text-2xl font-black text-white">Conexión completa de los 22 departamentos</div>
              <div data-testid="pres-mst-total" className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                {mst.prim.total.toFixed(1)} km
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ✓ Algoritmos de Prim y Kruskal verificados: ambos conectan todos los departamentos con un coste total
              idéntico de <strong>{mst.prim.total.toFixed(1)} km</strong> y {mst.prim.edges.length} carreteras sin
              formar ciclos.
            </p>
          </div>
        ) : (
          <div className="text-sm text-slate-300">
            Selecciona un ejemplo rápido arriba para proyectar los resultados.
          </div>
        )}
      </div>
    </div>
  );
}
```

### `src/ui/components/guatemala/GuatemalaRouteBreakdown.tsx`

283 líneas.

```{.tsx .numberLines}
/**
 * Desglose de la mejor ruta para Transporte Express (G3).
 * Muestra:
 *   - Listado de departamentos en orden (A → B → … → Destino)
 *   - Total en grande (km)
 *   - Fórmula de distancias de los tramos (ej. 28.4 + 18.2 = 46.6 km)
 *   - Tabla de tramos (# | Desde | Hasta | Carretera | km del tramo | km acumulado)
 *   - Gestión de empates (todas las rutas mínimas empatadas seleccionables)
 *   - Mensaje claro si los departamentos no están conectados.
 *
 * Lee: `query`, `shortest`, `breakdown`, `highlightedPath`, `highlightPath`, `graph`, `departments` desde `useApp`.
 */
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';

interface GuatemalaRouteBreakdownProps {
  onOpenAssistant?: () => void;
}

export default function GuatemalaRouteBreakdown({ onOpenAssistant }: GuatemalaRouteBreakdownProps) {
  const query = useApp((s) => s.query);
  const shortest = useApp((s) => s.shortest);
  const breakdown = useApp((s) => s.breakdown);
  const highlightedPath = useApp((s) => s.highlightedPath);
  const highlightPath = useApp((s) => s.highlightPath);
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const clearQuery = useApp((s) => s.clearQuery);

  const getNodeName = (id: NodeId): string => {
    const d = departments[id];
    const n = graph.nodes.find((node) => node.id === id);
    if (d?.cabecera && n?.label && d.cabecera !== n.label) {
      return `${n.label} (${d.cabecera})`;
    }
    return n?.label ?? id;
  };

  const getDeptShortName = (id: NodeId): string => {
    return graph.nodes.find((n) => n.id === id)?.label ?? id;
  };

  // Sin consulta o consulta incompleta
  if (!query || query.kind !== 'path' || !query.target) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center gap-3 text-xs"
        data-testid="route-empty-state"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          🚚
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Asistente de Rutas «Transporte Express»
          </h2>
          <p className="mt-1 text-slate-500 max-w-sm leading-relaxed dark:text-slate-400">
            Seleccione el departamento de origen y destino para calcular la ruta más corta y ver su desglose en tramos.
          </p>
        </div>
        {onOpenAssistant && (
          <button
            type="button"
            data-testid="btn-open-assistant-breakdown"
            onClick={onOpenAssistant}
            className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            📦 Calcular mejor ruta
          </button>
        )}
      </div>
    );
  }

  // Grafo desconectado para este par
  if (shortest && shortest.length === 0) {
    return (
      <div className="p-4 text-xs" data-testid="no-route-alert">
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1">
              <h2 className="font-bold text-sm">Sin conexión por carretera</h2>
              <p className="leading-relaxed">
                No existe conexión vial entre <strong>{getNodeName(query.source)}</strong> y{' '}
                <strong>{getNodeName(query.target)}</strong>. La red vial se encuentra desconectada para este par de
                destinos.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  data-testid="btn-clear-disconnected-query"
                  onClick={clearQuery}
                  className="min-h-[38px] rounded-lg border border-rose-300 bg-white px-3 py-1 font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
                >
                  Limpiar consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ruta(s) encontrada(s)
  const activeIndex = highlightedPath?.from === 'shortest' ? highlightedPath.index : 0;
  const currentBreakdown = breakdown?.[activeIndex] ?? breakdown?.[0];

  if (!currentBreakdown) {
    return null;
  }

  const isTied = (shortest?.length ?? 0) > 1;

  return (
    <div className="flex flex-col gap-4 p-4 text-xs" data-testid="route-breakdown-container">
      {/* Banner de empates si hay múltiples rutas mínimas con la misma distancia */}
      {isTied && shortest && (
        <div
          className="rounded-xl border border-purple-200 bg-purple-50/80 p-3 shadow-xs dark:border-purple-900/50 dark:bg-purple-950/30"
          data-testid="ties-banner"
        >
          <div className="font-bold text-purple-900 dark:text-purple-200 mb-2">
            ⭐ Se encontraron {shortest.length} rutas mínimas empatadas ({shortest[0]?.distance.toFixed(1)} km):
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Rutas empatadas">
            {shortest.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                data-testid={`btn-tie-route-${idx}`}
                aria-selected={activeIndex === idx}
                onClick={() => highlightPath({ from: 'shortest', index: idx })}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeIndex === idx
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'border border-purple-200 bg-white text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-300'
                }`}
              >
                Ruta {idx + 1} {activeIndex === idx ? '(activa)' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resumen principal: Total grande y Fórmula */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              Distancia total óptima
            </div>
            <div data-testid="route-total-distance" className="text-3xl font-black text-blue-800 dark:text-blue-200">
              {currentBreakdown.total.toFixed(1)} km
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Tramos: {currentBreakdown.legs.length} · Paradas: {currentBreakdown.nodes.length}
            </span>
          </div>
        </div>

        {/* Fórmula matemática de la suma de tramos */}
        <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 dark:border-blue-900/40">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fórmula:</div>
          <div
            data-testid="route-formula"
            className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 break-all"
          >
            {currentBreakdown.formula}
          </div>
        </div>
      </div>

      {/* Listado de nodos en orden */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mb-2 font-bold text-slate-700 dark:text-slate-300">Secuencia de departamentos en la ruta:</div>
        <div data-testid="route-nodes-sequence" className="flex flex-wrap items-center gap-1.5 leading-relaxed">
          {currentBreakdown.nodes.map((nodeId, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === currentBreakdown.nodes.length - 1;
            return (
              <span key={`${nodeId}-${idx}`} className="inline-flex items-center gap-1.5">
                <span
                  data-testid={`route-node-pill-${nodeId}`}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold shadow-2xs ${
                    isFirst
                      ? 'bg-emerald-600 text-white'
                      : isLast
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-80">{nodeId}</span>
                  <span>{getDeptShortName(nodeId)}</span>
                  {departments[nodeId]?.cabecera && (
                    <span className="text-[10px] opacity-80 font-normal">({departments[nodeId].cabecera})</span>
                  )}
                </span>
                {!isLast && <span className="font-bold text-slate-400">→</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tabla detallada de tramos */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
        <table className="w-full min-w-[560px] text-left border-collapse" data-testid="table-route-legs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Desde</th>
              <th className="py-2.5 px-3">Hasta</th>
              <th className="py-2.5 px-3">Carretera</th>
              <th className="py-2.5 px-3 text-right">km del tramo</th>
              <th className="py-2.5 px-3 text-right">km acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
            {currentBreakdown.legs.map((leg, idx) => (
              <tr
                key={`${leg.edgeId}-${idx}`}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                data-testid={`leg-row-${idx}`}
              >
                <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                  {getNodeName(leg.from)}
                </td>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                  {getNodeName(leg.to)}
                </td>
                <td className="py-2.5 px-3 font-sans">
                  {leg.road ? (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {leg.road}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Red local</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                  {leg.km.toFixed(1)} km
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-blue-700 dark:text-blue-300">
                  {leg.cumulative.toFixed(1)} km
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botones de acción inferior */}
      <div className="flex items-center justify-between pt-1">
        {onOpenAssistant && (
          <button
            type="button"
            data-testid="btn-recalculate-route"
            onClick={onOpenAssistant}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            🔄 Nueva consulta de ruta
          </button>
        )}
        <button
          type="button"
          data-testid="btn-clear-route-query"
          onClick={clearQuery}
          className="min-h-[44px] rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ✕ Limpiar ruta
        </button>
      </div>
    </div>
  );
}
```

### `src/ui/components/guatemala/GuatemalaToolbar.tsx`

150 líneas.

```{.tsx .numberLines}
/**
 * Barra de herramientas complementaria para el módulo Guatemala — Transporte Express (G1–G5).
 * Proporciona acceso directo a:
 *   - Botón destacado «Calcular mejor ruta» (asistente de dos pasos G3)
 *   - Ejemplos rápidos (QUE→IZA, GUA→PET, SMA→JUT, Red mínima)
 *   - Botón «Administrar red» (G2)
 *   - Botón «Modo presentación» (G5)
 *   - Botón «Acerca de» (G5)
 *
 * Lee y modifica: `query`, `setPathQuery`, `coverMode`, `setCoverMode`, `clearQuery` desde `useApp`.
 */
import { useApp } from '../../useApp';

interface GuatemalaToolbarProps {
  onOpenAssistant: () => void;
  onOpenAdmin: () => void;
  onOpenAbout: () => void;
  onStartPresentation: () => void;
}

export default function GuatemalaToolbar({
  onOpenAssistant,
  onOpenAdmin,
  onOpenAbout,
  onStartPresentation,
}: GuatemalaToolbarProps) {
  const query = useApp((s) => s.query);
  const setPathQuery = useApp((s) => s.setPathQuery);
  const coverMode = useApp((s) => s.coverMode);
  const setCoverMode = useApp((s) => s.setCoverMode);
  const clearQuery = useApp((s) => s.clearQuery);

  return (
    <div
      data-testid="guatemala-toolbar"
      className="shrink-0 flex items-center gap-2 border-b border-blue-100 bg-blue-50/70 px-2 py-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 sm:flex-wrap sm:justify-between sm:px-3 sm:py-1.5"
    >
      {/* Botón principal del Asistente */}
      <button
        type="button"
        data-testid="btn-calculate-route"
        onClick={onOpenAssistant}
        className="shrink-0 flex min-h-[38px] items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span>📦</span>
        <span className="whitespace-nowrap">Calcular mejor ruta</span>
      </button>

      {/* Separador sutil en escritorio */}
      <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

      {/* Fila con desplazamiento horizontal en móvil para ejemplos y acciones secundarias */}
      <div className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar py-0.5 sm:flex-initial sm:overflow-visible sm:py-0">
        <span className="hidden lg:inline text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-0.5">
          Ejemplos:
        </span>
        <button
          type="button"
          data-testid="btn-example-que-iza"
          onClick={() => setPathQuery('QUE', 'IZA')}
          title="Quetzaltenango a Puerto Barrios (QUE → IZA)"
          className={`shrink-0 min-h-[36px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            query?.kind === 'path' && query.source === 'QUE' && query.target === 'IZA'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          QUE → IZA
        </button>
        <button
          type="button"
          data-testid="btn-example-gua-pet"
          onClick={() => setPathQuery('GUA', 'PET')}
          title="Ciudad de Guatemala a Flores (GUA → PET)"
          className={`shrink-0 min-h-[36px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            query?.kind === 'path' && query.source === 'GUA' && query.target === 'PET'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          GUA → PET
        </button>
        <button
          type="button"
          data-testid="btn-example-sma-jut"
          onClick={() => setPathQuery('SMA', 'JUT')}
          title="San Marcos a Jutiapa (SMA → JUT)"
          className={`shrink-0 min-h-[36px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            query?.kind === 'path' && query.source === 'SMA' && query.target === 'JUT'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          SMA → JUT
        </button>
        <button
          type="button"
          data-testid="btn-example-mst"
          onClick={() => {
            setCoverMode('mst');
            clearQuery();
          }}
          title="Red mínima completa con Prim y Kruskal"
          className={`shrink-0 min-h-[36px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            coverMode === 'mst' && !query
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          🌳 Red Mínima
        </button>

        <span className="shrink-0 text-slate-300 dark:text-slate-700 sm:hidden">|</span>

        {/* Acciones de gestión, presentación e información */}
        <button
          type="button"
          data-testid="btn-admin-network"
          onClick={onOpenAdmin}
          className="shrink-0 flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="Administrar departamentos y carreteras"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Administrar red</span>
        </button>

        <button
          type="button"
          data-testid="btn-presentation-mode"
          onClick={onStartPresentation}
          className="shrink-0 flex min-h-[36px] items-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
          title="Modo pantalla completa para exposición"
        >
          <span>📽️</span>
          <span className="hidden sm:inline">Presentación</span>
        </button>

        <button
          type="button"
          data-testid="btn-about"
          onClick={onOpenAbout}
          className="shrink-0 flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          title="Acerca de los desarrolladores e institución"
        >
          ℹ️
        </button>
      </div>
    </div>
  );
}
```

### `src/ui/components/tabs/MstTab.tsx`

407 líneas.

```{.tsx .numberLines}
/**
 * Pestaña principal de cobertura y optimización de red (G4).
 * Permite seleccionar entre tres modos de conexión departamental:
 * (a) «Red mínima que conecta todos los departamentos (Prim / Kruskal)» — predeterminada
 * (b) «Rutas más cortas desde la bodega»
 * (c) «Recorrido de reparto (aproximación heurística)»
 *
 * Lee: `coverMode`, `setCoverMode`, `mst`, `dijkstra`, `setTreeQuery`, `tour`, `runTour`, `cancelTour`,
 * `graph`, `departments` desde `useApp`.
 */
import { useMemo, useState } from 'react';
import type { NodeId } from '../../../core/types';
import type { CoverMode } from '../../../store/types';
import { useApp } from '../../useApp';
import KruskalTab from './KruskalTab';
import PrimTab from './PrimTab';

export default function MstTab() {
  const coverMode = useApp((s) => s.coverMode);
  const setCoverMode = useApp((s) => s.setCoverMode);
  const mst = useApp((s) => s.mst);
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const dijkstra = useApp((s) => s.dijkstra);
  const query = useApp((s) => s.query);
  const setTreeQuery = useApp((s) => s.setTreeQuery);
  const tour = useApp((s) => s.tour);
  const runTour = useApp((s) => s.runTour);
  const cancelTour = useApp((s) => s.cancelTour);

  // Sub-pestaña activa dentro de la Red Mínima (AEM): 'prim' | 'kruskal' | 'aristas'
  const [mstAlgorithmTab, setMstAlgorithmTab] = useState<'prim' | 'kruskal' | 'aristas'>('prim');

  // Estado para la bodega (F2) y para el inicio del recorrido de reparto
  const [selectedBodega, setSelectedBodega] = useState<NodeId>(
    query?.kind === 'tree' ? query.source : (graph.nodes[0]?.id ?? 'GUA'),
  );
  const [selectedTourStart, setSelectedTourStart] = useState<NodeId>(graph.nodes[0]?.id ?? 'GUA');

  const getNodeName = (id: NodeId): string => {
    const d = departments[id];
    const n = graph.nodes.find((node) => node.id === id);
    if (d?.cabecera && n?.label && d.cabecera !== n.label) {
      return `${n.label} (${d.cabecera})`;
    }
    return n?.label ?? id;
  };

  // Distancias desde la bodega ordenadas de menor a mayor
  const bodegaDistances = useMemo(() => {
    if (!dijkstra || query?.kind !== 'tree') return [];
    return graph.nodes
      .filter((n) => n.id !== dijkstra.source)
      .map((n) => {
        const dist = dijkstra.labels[n.id]?.dist ?? Infinity;
        return {
          id: n.id,
          label: n.label,
          cabecera: departments[n.id]?.cabecera ?? n.label,
          dist,
        };
      })
      .sort((a, b) => a.dist - b.dist);
  }, [dijkstra, query, graph.nodes, departments]);

  const primTotal = mst?.prim.total ?? 0;
  const kruskalTotal = mst?.kruskal.total ?? 0;
  const totalsMatch = Math.abs(primTotal - kruskalTotal) < 1e-4;

  return (
    <div className="flex flex-col gap-4 p-4 text-xs" data-testid="mst-tab-container">
      {/* Selector superior de modo de cobertura G4 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <label htmlFor="cover-mode-select" className="block mb-1.5 font-bold text-slate-800 dark:text-slate-200">
          Tipo de cobertura de red (G4):
        </label>
        <select
          id="cover-mode-select"
          data-testid="select-cover-mode"
          value={coverMode}
          onChange={(e) => setCoverMode(e.target.value as CoverMode)}
          aria-label="Tipo de cobertura de red"
          className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="mst">
            (a) Red mínima que conecta todos los departamentos (Prim / Kruskal) — Predeterminada
          </option>
          <option value="spt">(b) Rutas más cortas desde la bodega</option>
          <option value="tour">(c) Recorrido de reparto (aproximación heurística)</option>
        </select>
      </div>

      {/* CASO A: RED MÍNIMA (AEM) CON PRIM Y KRUSKAL */}
      {coverMode === 'mst' && (
        <div className="flex flex-col gap-3">
          {/* Tarjeta de verificación cruzada y total */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div>
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                Árbol de Expansión Mínima (AEM)
              </div>
              <div
                data-testid="mst-total-distance"
                className="text-2xl font-black text-emerald-900 dark:text-emerald-100"
              >
                {primTotal.toFixed(1)} km
              </div>
            </div>

            <div
              data-testid="mst-same-total-notice"
              className="rounded-lg border border-emerald-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-slate-900/80 dark:text-emerald-200"
            >
              {totalsMatch ? (
                <span>
                  ✓ Verificación cruzada: Prim ({primTotal.toFixed(1)} km) y Kruskal ({kruskalTotal.toFixed(1)} km)
                  coinciden exactamente.
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300">
                  ⚠️ Atención: Los totales de Prim y Kruskal difieren.
                </span>
              )}
            </div>
          </div>

          {/* Selector de sub-pestañas: Prim, Kruskal, Lista de aristas */}
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
            <button
              type="button"
              role="tab"
              data-testid="tab-mst-prim"
              aria-selected={mstAlgorithmTab === 'prim'}
              onClick={() => setMstAlgorithmTab('prim')}
              className={`flex-1 min-h-[38px] rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                mstAlgorithmTab === 'prim'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Prim (Paso a paso)
            </button>
            <button
              type="button"
              role="tab"
              data-testid="tab-mst-kruskal"
              aria-selected={mstAlgorithmTab === 'kruskal'}
              onClick={() => setMstAlgorithmTab('kruskal')}
              className={`flex-1 min-h-[38px] rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                mstAlgorithmTab === 'kruskal'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Kruskal (Aristas ordenadas)
            </button>
            <button
              type="button"
              role="tab"
              data-testid="tab-mst-edges"
              aria-selected={mstAlgorithmTab === 'aristas'}
              onClick={() => setMstAlgorithmTab('aristas')}
              className={`flex-1 min-h-[38px] rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                mstAlgorithmTab === 'aristas'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Carreteras del árbol ({mst?.prim.edges.length ?? 0})
            </button>
          </div>

          {/* Contenido de la sub-pestaña activa */}
          {mstAlgorithmTab === 'prim' && <PrimTab />}
          {mstAlgorithmTab === 'kruskal' && <KruskalTab />}
          {mstAlgorithmTab === 'aristas' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
              <table className="w-full text-left border-collapse" data-testid="table-mst-edges">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <th className="py-2 px-3 w-10">#</th>
                    <th className="py-2 px-3">Conexión departamental</th>
                    <th className="py-2 px-3">Carretera</th>
                    <th className="py-2 px-3 text-right">km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
                  {mst?.prim.edges.map((edgeId, i) => {
                    const edge = graph.edges.find((e) => e.id === edgeId);
                    if (!edge) return null;
                    const src = graph.nodes.find((n) => n.id === edge.source);
                    const tgt = graph.nodes.find((n) => n.id === edge.target);
                    return (
                      <tr key={edgeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {src?.label ?? edge.source} ↔ {tgt?.label ?? edge.target}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                          {(typeof edge.meta?.carretera === 'string' ? edge.meta.carretera : '') || '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          {edge.weight.toFixed(1)} km
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CASO B: RUTAS MÁS CORTAS DESDE LA BODEGA (SPT) */}
      {coverMode === 'spt' && (
        <div className="flex flex-col gap-3" data-testid="spt-section">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <label htmlFor="select-spt-bodega" className="font-bold text-blue-950 dark:text-blue-200">
                Bodega central (Origen):
              </label>
              <select
                id="select-spt-bodega"
                data-testid="select-spt-bodega"
                value={selectedBodega}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedBodega(id);
                  setTreeQuery(id);
                }}
                className="min-h-[44px] rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({departments[n.id]?.cabecera || n.label})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              data-testid="btn-apply-spt"
              onClick={() => setTreeQuery(selectedBodega)}
              className="min-h-[44px] rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Calcular árbol de rutas
            </button>
          </div>

          {/* Tabla de distancias a los otros 21 departamentos */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
            <table className="w-full text-left border-collapse" data-testid="table-spt-distances">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <th className="py-2 px-3 w-10">#</th>
                  <th className="py-2 px-3">Departamento destino</th>
                  <th className="py-2 px-3">Cabecera</th>
                  <th className="py-2 px-3 text-right">Distancia más corta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
                {bodegaDistances.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">{item.label}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">{item.cabecera}</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-700 dark:text-blue-300">
                      {item.dist === Infinity ? 'Inalcanzable' : `${item.dist.toFixed(1)} km`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASO C: RECORRIDO DE REPARTO (APROXIMACIÓN HEURÍSTICA) */}
      {coverMode === 'tour' && (
        <div className="flex flex-col gap-3" data-testid="tour-section">
          {/* Aviso informativo de heurística */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <span className="text-base">💡</span>
              <div>
                <p className="font-bold">Aproximación heurística (Problema del Repartidor / TSP)</p>
                <p className="mt-0.5 leading-relaxed text-slate-600 dark:text-slate-300">
                  Visita todos los departamentos alcanzables y regresa al punto de partida. Utiliza el método del
                  <strong> vecino más cercano</strong> seguido de refinamiento local <strong>2-opt</strong> sobre las
                  distancias mínimas de Dijkstra. No garantiza el óptimo global absoluto pero ofrece una ruta eficiente
                  en tiempo polinomial.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de inicio del recorrido */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2">
              <label htmlFor="select-tour-start" className="font-bold text-slate-800 dark:text-slate-200">
                Punto de partida:
              </label>
              <select
                id="select-tour-start"
                data-testid="select-tour-start"
                value={selectedTourStart}
                onChange={(e) => setSelectedTourStart(e.target.value)}
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({departments[n.id]?.cabecera || n.label})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {tour.status === 'running' ? (
                <button
                  type="button"
                  data-testid="btn-cancel-tour"
                  onClick={cancelTour}
                  className="min-h-[44px] rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
                >
                  Cancelar cálculo
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="btn-run-tour"
                  onClick={() => runTour(selectedTourStart)}
                  className="min-h-[44px] rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  🚚 Calcular recorrido de reparto
                </button>
              )}
            </div>
          </div>

          {/* Estado del cálculo */}
          {tour.status === 'running' && (
            <div
              className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500"
              data-testid="tour-running"
            >
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              <span>Optimizando recorrido con vecino más cercano y 2-opt…</span>
            </div>
          )}

          {tour.status === 'error' && (
            <div
              className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              data-testid="tour-error"
            >
              Error al calcular el recorrido: {tour.error}
            </div>
          )}

          {tour.status === 'done' && tour.result && (
            <div
              className="flex flex-col gap-3 rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 dark:border-purple-900/50 dark:bg-purple-950/20"
              data-testid="tour-result-container"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  Recorrido completo calculado ({tour.result.order.length} paradas):
                </span>
                <span data-testid="tour-total-km" className="text-xl font-black text-purple-700 dark:text-purple-300">
                  {tour.result.total.toFixed(1)} km
                </span>
              </div>

              {/* Lista numerada de paradas del recorrido */}
              <div className="overflow-x-auto rounded-lg border border-purple-200 bg-white p-2.5 dark:border-purple-900/60 dark:bg-slate-900">
                <ol className="divide-y divide-slate-100 text-xs dark:divide-slate-800" data-testid="tour-stops-list">
                  {tour.result.order.map((nodeId, idx) => (
                    <li key={`${nodeId}-${idx}`} className="flex items-center justify-between py-1 px-1">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{getNodeName(nodeId)}</span>
                      </span>
                      {idx === 0 && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Salida
                        </span>
                      )}
                      {tour.result && idx === tour.result.order.length - 1 && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Retorno
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### `src/ui/components/tabs/PrimTab.tsx`

253 líneas.

```{.tsx .numberLines}
/**
 * Pestaña de solución tabulada paso a paso del Algoritmo de Prim (AEM).
 * Muestra el proceso de corte iterativo: la arista mínima que cruza el corte hacia un nodo no visitado,
 * el nuevo nodo incorporado, las columnas tachadas y el total acumulado en kilómetros.
 *
 * Lee: `mst.prim`, `graph`, `departments`, `mstStart`, `setMstStart` desde `useApp`.
 */
import { useEffect, useState } from 'react';
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';

export default function PrimTab() {
  const mst = useApp((s) => s.mst);
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const mstStart = useApp((s) => s.mstStart);
  const setMstStart = useApp((s) => s.setMstStart);

  const prim = mst?.prim;
  const steps = prim?.steps ?? [];
  const totalSteps = steps.length;
  const lastStepIndex = Math.max(0, totalSteps - 1);

  const [stepOverride, setStepOverride] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs] = useState<number>(800);

  const currentStepIndex = stepOverride !== null ? Math.min(stepOverride, lastStepIndex) : lastStepIndex;

  // Reproducción paso a paso
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStepOverride((prev) => {
        const current = prev !== null ? prev : lastStepIndex;
        if (current >= lastStepIndex) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, speedMs);
    return () => clearInterval(timer);
  }, [isPlaying, lastStepIndex, speedMs]);

  if (!prim || steps.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>No hay cálculo de árbol de expansión mínima disponible.</p>
      </div>
    );
  }

  const getNodeName = (id: NodeId): string => {
    const d = departments[id];
    const n = graph.nodes.find((node) => node.id === id);
    if (d?.cabecera && n?.label && d.cabecera !== n.label) {
      return `${n.label} (${d.cabecera})`;
    }
    return n?.label ?? id;
  };

  const getEdgeInfo = (edgeId: string | null) => {
    if (!edgeId) return null;
    const edge = graph.edges.find((e) => e.id === edgeId);
    if (!edge) return { id: edgeId, source: '', target: '', weight: 0, road: '' };
    const srcName = graph.nodes.find((n) => n.id === edge.source)?.label ?? edge.source;
    const tgtName = graph.nodes.find((n) => n.id === edge.target)?.label ?? edge.target;
    const road = edge.meta?.carretera ? ` (${edge.meta.carretera})` : '';
    return {
      id: edge.id,
      source: srcName,
      target: tgtName,
      weight: edge.weight,
      road,
    };
  };

  const currentStep = steps[currentStepIndex] ?? steps[0]!;

  return (
    <div className="flex flex-col gap-3 p-3 text-xs" data-testid="prim-tab-container">
      {/* Controles superiores: selector de inicio y reproducción */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
        {/* Selector de nodo inicial de Prim */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="prim-start-select" className="font-semibold text-slate-700 dark:text-slate-300">
            Nodo inicial:
          </label>
          <select
            id="prim-start-select"
            data-testid="select-prim-start"
            value={mstStart ?? graph.nodes[0]?.id ?? ''}
            onChange={(e) => setMstStart(e.target.value)}
            className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {graph.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} {departments[n.id]?.cabecera ? `(${departments[n.id]?.cabecera})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Controles de reproducción */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="btn-prim-prev"
            onClick={() => setStepOverride(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex <= 0}
            aria-label="Paso anterior de Prim"
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Paso anterior"
          >
            ◀
          </button>
          <button
            type="button"
            data-testid="btn-prim-play"
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                if (currentStepIndex >= totalSteps - 1) setStepOverride(0);
                setIsPlaying(true);
              }
            }}
            aria-label={isPlaying ? 'Pausa' : 'Reproducir'}
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-xs hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            type="button"
            data-testid="btn-prim-next"
            onClick={() => setStepOverride(Math.min(totalSteps - 1, currentStepIndex + 1))}
            disabled={currentStepIndex >= totalSteps - 1}
            aria-label="Paso siguiente de Prim"
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Paso siguiente"
          >
            ▶
          </button>
          <button
            type="button"
            data-testid="btn-prim-end"
            onClick={() => {
              setIsPlaying(false);
              setStepOverride(totalSteps - 1);
            }}
            aria-label="Ir al final de Prim"
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Solución final"
          >
            ⏭
          </button>
          <span className="ml-2 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
            Paso {currentStepIndex} de {totalSteps - 1}
          </span>
        </div>
      </div>

      {/* Resumen del paso activo */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-bold">Iteración {currentStep.iter}: </span>
            {currentStep.chosenEdge ? (
              <span>
                Arista elegida:{' '}
                <strong className="underline">
                  {getEdgeInfo(currentStep.chosenEdge)?.source} ↔ {getEdgeInfo(currentStep.chosenEdge)?.target}
                </strong>{' '}
                ({getEdgeInfo(currentStep.chosenEdge)?.weight.toFixed(1)} km{getEdgeInfo(currentStep.chosenEdge)?.road})
              </span>
            ) : (
              <span>
                Nodo inicial: <strong>{getNodeName(currentStep.inTree[0] ?? '')}</strong>
              </span>
            )}
          </div>
          <div className="font-bold">
            Total hasta aquí: <span className="font-mono text-sm">{currentStep.totalSoFar.toFixed(1)} km</span>
          </div>
        </div>
      </div>

      {/* Tabla de pasos completa con fila actual resaltada */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
        <table className="w-full min-w-[620px] text-left border-collapse" data-testid="table-prim-steps">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <th className="py-2 px-2.5 w-10 text-center">#</th>
              <th className="py-2 px-2.5">Arista mínima (Corte)</th>
              <th className="py-2 px-2.5">Nodo incorporado</th>
              <th className="py-2 px-2.5">Columnas tachadas</th>
              <th className="py-2 px-2.5 text-right">km tramo</th>
              <th className="py-2 px-2.5 text-right">Total acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
            {steps.map((st, idx) => {
              const isSelected = idx === currentStepIndex;
              const edgeInfo = getEdgeInfo(st.chosenEdge);
              const newlyAddedNode = st.inTree[st.inTree.length - 1];

              return (
                <tr
                  key={st.iter}
                  onClick={() => setStepOverride(idx)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-100 font-semibold text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-100'
                      : idx % 2 === 0
                        ? 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                        : 'bg-slate-50/60 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800/60'
                  }`}
                  data-testid={`prim-row-${st.iter}`}
                >
                  <td className="py-2 px-2.5 text-center font-bold text-slate-600 dark:text-slate-400">{st.iter}</td>
                  <td className="py-2 px-2.5 font-sans">
                    {edgeInfo ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-800 dark:text-emerald-300">
                        {edgeInfo.source} ↔ {edgeInfo.target}
                        {edgeInfo.road && <span className="text-[10px] text-slate-500">{edgeInfo.road}</span>}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Inicio (árbol vacío)</span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 font-sans font-medium">
                    {newlyAddedNode ? getNodeName(newlyAddedNode) : '—'}
                  </td>
                  <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">
                    <span className="line-through">{st.crossedOut.join(', ')}</span>
                  </td>
                  <td className="py-2 px-2.5 text-right font-medium">
                    {edgeInfo ? `${edgeInfo.weight.toFixed(1)} km` : '0.0 km'}
                  </td>
                  <td className="py-2 px-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                    {st.totalSoFar.toFixed(1)} km
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### `src/ui/components/tabs/KruskalTab.tsx`

139 líneas.

```{.tsx .numberLines}
/**
 * Pestaña de solución tabulada del Algoritmo de Kruskal (AEM).
 * Muestra las aristas ordenadas de menor a mayor peso y la decisión de aceptación o rechazo
 * (por formación de ciclo con Union-Find), junto con el total acumulado en kilómetros.
 *
 * Lee: `mst.kruskal`, `graph`, `departments` desde `useApp`.
 */
import { useApp } from '../../useApp';

export default function KruskalTab() {
  const mst = useApp((s) => s.mst);
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);

  const kruskal = mst?.kruskal;
  const steps = kruskal?.steps ?? [];

  if (!kruskal || steps.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>No hay cálculo de Kruskal disponible.</p>
      </div>
    );
  }

  // Descartamos el paso inicial (iter 0) para mostrar directamente la evaluación de cada arista
  const evalSteps = steps.filter((s) => s.iter > 0);

  const getEdgeDetails = (edgeId: string) => {
    const edge = graph.edges.find((e) => e.id === edgeId);
    if (!edge) return { id: edgeId, source: '', target: '', weight: 0, road: '' };
    const src = graph.nodes.find((n) => n.id === edge.source);
    const tgt = graph.nodes.find((n) => n.id === edge.target);
    const srcName = src
      ? `${src.label}${departments[src.id]?.cabecera ? ` (${departments[src.id]?.cabecera})` : ''}`
      : edge.source;
    const tgtName = tgt
      ? `${tgt.label}${departments[tgt.id]?.cabecera ? ` (${departments[tgt.id]?.cabecera})` : ''}`
      : edge.target;
    return {
      id: edge.id,
      source: srcName,
      target: tgtName,
      weight: edge.weight,
      road: (typeof edge.meta?.carretera === 'string' ? edge.meta.carretera : '') || '—',
    };
  };

  const totalAccepted = kruskal.edges.length;
  const totalRejected = evalSteps.length - totalAccepted;

  return (
    <div className="flex flex-col gap-3 p-3 text-xs" data-testid="kruskal-tab-container">
      {/* Resumen estadístico de Kruskal */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Aristas evaluadas</div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{evalSteps.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Aceptadas (árbol)</div>
          <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{totalAccepted}</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 dark:border-rose-900/40 dark:bg-rose-950/30">
          <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300">Rechazadas (ciclo)</div>
          <div className="text-lg font-bold text-rose-800 dark:text-rose-200">{totalRejected}</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
          <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300">Total del árbol</div>
          <div className="text-lg font-extrabold text-blue-800 dark:text-blue-200">{kruskal.total.toFixed(1)} km</div>
        </div>
      </div>

      {/* Tabla ordenada de aristas examinadas */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
        <table className="w-full min-w-[620px] text-left border-collapse" data-testid="table-kruskal-steps">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <th className="py-2 px-2.5 w-10 text-center">#</th>
              <th className="py-2 px-2.5">Arista (Origen ↔ Destino)</th>
              <th className="py-2 px-2.5">Carretera</th>
              <th className="py-2 px-2.5 text-right">km</th>
              <th className="py-2 px-2.5 text-center">Decisión Union-Find</th>
              <th className="py-2 px-2.5 text-right">Total acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
            {evalSteps.map((st) => {
              const edgeId = st.chosenEdge ?? st.rejectedEdge ?? '';
              const details = getEdgeDetails(edgeId);
              const isAccepted = Boolean(st.chosenEdge);

              return (
                <tr
                  key={st.iter}
                  className={`transition-colors ${
                    isAccepted
                      ? 'bg-emerald-50/50 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40'
                      : 'bg-rose-50/30 hover:bg-rose-100/40 dark:bg-rose-950/15 dark:hover:bg-rose-950/30 opacity-75'
                  }`}
                  data-testid={`kruskal-row-${st.iter}`}
                >
                  <td className="py-2 px-2.5 text-center font-bold text-slate-600 dark:text-slate-400">{st.iter}</td>
                  <td className="py-2 px-2.5 font-sans font-medium">
                    <span
                      className={
                        isAccepted
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'line-through text-slate-500 dark:text-slate-400'
                      }
                    >
                      {details.source} ↔ {details.target}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 font-sans text-slate-600 dark:text-slate-400">{details.road}</td>
                  <td className="py-2 px-2.5 text-right font-medium">{details.weight.toFixed(1)} km</td>
                  <td className="py-2 px-2.5 text-center font-sans">
                    {isAccepted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        ✓ Aceptada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                        ✗ Ciclo (rechazada)
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                    {st.totalSoFar.toFixed(1)} km
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

