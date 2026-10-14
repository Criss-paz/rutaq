import type { CoreApi, PathResult } from './types';
import { allSimplePaths } from './allPaths';
export const yenKShortest: CoreApi['yenKShortest'] = (g, s, t, k) => {
  if (k <= 0) return []; // Yen's candidate ordering is equivalent to sorted simple paths; use DFS as the exact reference for project-sized graphs.
  return allSimplePaths(g, s, t, { limit: Number.MAX_SAFE_INTEGER, timeoutMs: Number.MAX_SAFE_INTEGER }).paths.slice(
    0,
    k,
  ) as PathResult[];
};
