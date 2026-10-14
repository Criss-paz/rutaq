import type { CoreApi } from './types';
export const floydWarshall: CoreApi['floydWarshall'] = (g) => {
  const order = g.nodes.map((n) => n.id),
    n = order.length,
    ix = new Map(order.map((id, i) => [id, i]));
  let d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  const next: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
  for (const e of g.edges) {
    const a = ix.get(e.source),
      b = ix.get(e.target);
    if (a === undefined || b === undefined) continue;
    if (e.weight < d[a]![b]!) {
      d[a]![b] = d[b]![a] = e.weight;
      next[a]![b] = b;
      next[b]![a] = a;
    }
  }
  const matrices = [d.map((r) => [...r])];
  for (let k = 0; k < n; k++) {
    const nd = d.map((r) => [...r]);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (d[i]![k]! + d[k]![j]! < nd[i]![j]!) {
          nd[i]![j] = d[i]![k]! + d[k]![j]!;
          next[i]![j] = next[i]![k]!;
        }
    d = nd;
    matrices.push(d.map((r) => [...r]));
  }
  return { order, dist: d, next, matrices };
};
export const floydPath: CoreApi['floydPath'] = (g, f, s, t) => {
  const a = f.order.indexOf(s),
    b = f.order.indexOf(t);
  if (a < 0 || b < 0) throw new Error('El nodo indicado no existe en Floyd-Warshall.');
  if (a === b) return { nodes: [s], edges: [], distance: 0 };
  if (f.next[a]![b] === null) return null;
  let i = a;
  const nodes = [s],
    edges: string[] = [];
  for (let guard = 0; guard < f.order.length && i !== b; guard++) {
    const j = f.next[i]![b];
    if (j == null) return null;
    const u = f.order[i]!,
      v = f.order[j]!,
      e = g.edges.find((x) => (x.source === u && x.target === v) || (x.target === u && x.source === v));
    if (!e) return null;
    edges.push(e.id);
    nodes.push(v);
    i = j;
  }
  return i === b ? { nodes, edges, distance: f.dist[a]![b]! } : null;
};
