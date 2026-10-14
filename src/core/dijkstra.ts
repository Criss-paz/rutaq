import type { CoreApi, DijkstraStep, Graph, NodeId, PathResult } from './types';
import { adjacencyList } from './graph';

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
