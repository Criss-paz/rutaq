import type { CoreApi, PathResult } from './types';
import { adjacencyList, type Neighbor } from './graph';
import { yenKShortest } from './yen';

const compareIds = (a: string[], b: string[]) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i]! < b[i]! ? -1 : 1;
  return a.length - b.length;
};

export const allSimplePaths: CoreApi['allSimplePaths'] = (g, s, t, opts, onProgress) => {
  if (!g.nodes.some((n) => n.id === s) || !g.nodes.some((n) => n.id === t))
    throw new Error('El nodo indicado no existe.');
  if (s === t) return { paths: [{ nodes: [s], edges: [], distance: 0 }], complete: true, method: 'dfs', totalFound: 1 };
  const adj = adjacencyList(g),
    edgeWeights = new Map(g.edges.map((e) => [e.id, e.weight]));
  const found: PathResult[] = [],
    start = Date.now(),
    limit = Math.max(1, opts.limit || 5000);
  const nodes = [s],
    edges: string[] = [],
    visited = new Set([s]);
  let distance = 0,
    expansions = 0,
    aborted = false;
  const stack: { node: string; index: number; neighbors: Neighbor[] }[] = [
    { node: s, index: 0, neighbors: adj.get(s) ?? [] },
  ];
  while (stack.length && !aborted) {
    const frame = stack.at(-1)!;
    if (frame.node === t) {
      found.push({ nodes: [...nodes], edges: [...edges], distance });
      if (found.length % 250 === 0) onProgress?.(found.length);
      if (found.length > limit) {
        aborted = true;
        break;
      }
      stack.pop();
      visited.delete(nodes.pop()!);
      if (edges.length) distance -= edgeWeights.get(edges.pop()!)!;
      continue;
    }
    if (frame.index >= frame.neighbors.length) {
      stack.pop();
      if (stack.length) {
        visited.delete(nodes.pop()!);
        distance -= edgeWeights.get(edges.pop()!)!;
      }
      continue;
    }
    const edge = frame.neighbors[frame.index++]!;
    expansions++;
    if (expansions % 1000 === 0 && Date.now() - start > opts.timeoutMs) {
      aborted = true;
      break;
    }
    if (visited.has(edge.node)) continue;
    visited.add(edge.node);
    nodes.push(edge.node);
    edges.push(edge.edgeId);
    distance += edge.weight;
    stack.push({ node: edge.node, index: 0, neighbors: adj.get(edge.node) ?? [] });
  }
  if (aborted) return { paths: yenKShortest(g, s, t, limit), complete: false, method: 'yen', totalFound: found.length };
  found.sort((a, b) => (a.distance === b.distance ? 0 : a.distance - b.distance) || compareIds(a.nodes, b.nodes));
  onProgress?.(found.length);
  return { paths: found, complete: true, method: 'dfs', totalFound: found.length };
};
