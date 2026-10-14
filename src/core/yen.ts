import type { CoreApi, PathResult } from './types';
import { adjacencyList } from './graph';

const EPS = 1e-9;
const equal = (a: number, b: number) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b));
const compareIds = (a: string[], b: string[]) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i]! < b[i]! ? -1 : 1;
  }
  return a.length - b.length;
};
const comparePaths = (a: PathResult, b: PathResult) =>
  (equal(a.distance, b.distance) ? 0 : a.distance - b.distance) || compareIds(a.nodes, b.nodes);

class PathHeap {
  values: PathResult[] = [];
  push(p: PathResult) {
    let i = this.values.push(p) - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (comparePaths(this.values[parent]!, p) <= 0) break;
      this.values[i] = this.values[parent]!;
      i = parent;
    }
    this.values[i] = p;
  }
  pop() {
    if (!this.values.length) return undefined;
    const first = this.values[0]!,
      last = this.values.pop()!;
    if (this.values.length) {
      let i = 0;
      while (i * 2 + 1 < this.values.length) {
        let child = i * 2 + 1;
        if (child + 1 < this.values.length && comparePaths(this.values[child + 1]!, this.values[child]!) < 0) child++;
        if (comparePaths(last, this.values[child]!) <= 0) break;
        this.values[i] = this.values[child]!;
        i = child;
      }
      this.values[i] = last;
    }
    return first;
  }
}

const shortestPath = (
  adj: ReturnType<typeof adjacencyList>,
  s: string,
  t: string,
  bannedNodes: Set<string>,
  bannedEdges: Set<string>,
): PathResult | null => {
  if (bannedNodes.has(s) || bannedNodes.has(t)) return null;
  const heap = new PathHeap(),
    best = new Map<string, PathResult>();
  const initial = { nodes: [s], edges: [], distance: 0 };
  best.set(s, initial);
  heap.push(initial);
  while (heap.values.length) {
    const path = heap.pop()!;
    const current = path.nodes.at(-1)!;
    if (best.get(current) !== path) continue;
    if (current === t) return path;
    for (const edge of adj.get(current) ?? []) {
      if (bannedEdges.has(edge.edgeId) || bannedNodes.has(edge.node) || path.nodes.includes(edge.node)) continue;
      const candidate = {
        nodes: [...path.nodes, edge.node],
        edges: [...path.edges, edge.edgeId],
        distance: path.distance + edge.weight,
      };
      const old = best.get(edge.node);
      if (
        !old ||
        (!equal(candidate.distance, old.distance) && candidate.distance < old.distance) ||
        (equal(candidate.distance, old.distance) && compareIds(candidate.nodes, old.nodes) < 0)
      ) {
        best.set(edge.node, candidate);
        heap.push(candidate);
      }
    }
  }
  return null;
};

export const yenKShortest: CoreApi['yenKShortest'] = (g, s, t, k) => {
  if (!g.nodes.some((n) => n.id === s) || !g.nodes.some((n) => n.id === t))
    throw new Error('El nodo indicado no existe.');
  if (k <= 0) return [];
  if (s === t) return [{ nodes: [s], edges: [], distance: 0 }];
  const adj = adjacencyList(g),
    edgeWeights = new Map(g.edges.map((e) => [e.id, e.weight]));
  const first = shortestPath(adj, s, t, new Set(), new Set());
  if (!first) return [];
  const accepted: PathResult[] = [first],
    candidates = new PathHeap(),
    generated = new Set([first.nodes.join('\0')]);
  const bannedByPrefix = new Map<string, Set<string>>();
  const indexAccepted = (path: PathResult) => {
    for (let i = 0; i < path.edges.length; i++) {
      const key = path.nodes.slice(0, i + 1).join('\0');
      let ids = bannedByPrefix.get(key);
      if (!ids) {
        ids = new Set();
        bannedByPrefix.set(key, ids);
      }
      ids.add(path.edges[i]!);
    }
  };
  indexAccepted(first);
  while (accepted.length < k) {
    const previous = accepted.at(-1)!;
    for (let spurIndex = 0; spurIndex < previous.nodes.length - 1; spurIndex++) {
      const rootNodes = previous.nodes.slice(0, spurIndex + 1),
        rootEdges = previous.edges.slice(0, spurIndex);
      const bannedEdges = bannedByPrefix.get(rootNodes.join('\0')) ?? new Set<string>();
      const bannedNodes = new Set(rootNodes.slice(0, -1));
      const spur = shortestPath(adj, rootNodes.at(-1)!, t, bannedNodes, bannedEdges);
      if (!spur) continue;
      const nodes = [...rootNodes.slice(0, -1), ...spur.nodes],
        edges = [...rootEdges, ...spur.edges],
        key = nodes.join('\0');
      if (generated.has(key)) continue;
      generated.add(key);
      const distance = edges.reduce((sum, id) => sum + edgeWeights.get(id)!, 0);
      candidates.push({ nodes, edges, distance });
    }
    const next = candidates.pop();
    if (!next) break;
    accepted.push(next);
    indexAccepted(next);
  }
  return accepted;
};
