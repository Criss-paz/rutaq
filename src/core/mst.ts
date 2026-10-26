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
