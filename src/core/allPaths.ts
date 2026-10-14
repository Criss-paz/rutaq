import type { CoreApi, PathResult } from './types';
import { adjacencyList } from './graph';
import { yenKShortest } from './yen';
export const allSimplePaths: CoreApi['allSimplePaths'] = (g, s, t, opts, onProgress) => {
  if (!g.nodes.some((n) => n.id === s) || !g.nodes.some((n) => n.id === t))
    throw new Error('El nodo indicado no existe.');
  if (s === t) return { paths: [{ nodes: [s], edges: [], distance: 0 }], complete: true, method: 'dfs', totalFound: 1 };
  const adj = adjacencyList(g),
    found: PathResult[] = [],
    start = Date.now(),
    limit = Math.max(1, opts.limit || 5000);
  let aborted = false;
  const walk = (u: string, nodes: string[], edges: string[], distance: number) => {
    if (aborted) return;
    if (Date.now() - start > (opts.timeoutMs || Infinity) || found.length > limit) {
      aborted = true;
      return;
    }
    if (u === t) {
      found.push({ nodes: [...nodes], edges: [...edges], distance });
      if (found.length % 250 === 0) onProgress?.(found.length);
      return;
    }
    for (const v of adj.get(u) ?? [])
      if (!nodes.includes(v.node)) walk(v.node, [...nodes, v.node], [...edges, v.edgeId], distance + v.weight);
  };
  walk(s, [s], [], 0);
  if (aborted) return { paths: yenKShortest(g, s, t, limit), complete: false, method: 'yen', totalFound: found.length };
  found.sort((a, b) => a.distance - b.distance || a.nodes.join('\0').localeCompare(b.nodes.join('\0')));
  onProgress?.(found.length);
  return { paths: found, complete: true, method: 'dfs', totalFound: found.length };
};
