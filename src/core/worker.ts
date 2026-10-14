// Web Worker del núcleo (Comlink). Lo implementa Codex; el store lo crea con
// `new Worker(new URL('../core/worker.ts', import.meta.url), { type: 'module' })`.
import * as Comlink from 'comlink';
import type { CoreWorkerApi } from './types';
import { allSimplePaths } from './allPaths';
import { floydWarshall } from './floyd';
import { suggestLayout } from './layout';

const api: CoreWorkerApi = {
  async allSimplePaths(g, s, t, opts, onProgress) {
    return allSimplePaths(g, s, t, opts, onProgress);
  },
  async floydWarshall(g) {
    return floydWarshall(g);
  },
  async suggestLayout(g) {
    return suggestLayout(g);
  },
};

Comlink.expose(api);
