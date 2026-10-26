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

