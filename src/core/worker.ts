// Web Worker del núcleo (Comlink). Lo implementa Codex; el store lo crea con
// `new Worker(new URL('../core/worker.ts', import.meta.url), { type: 'module' })`.
import * as Comlink from 'comlink';
import type { CoreWorkerApiP2 } from './types';
import { allSimplePaths } from './allPaths';
import { floydWarshall } from './floyd';
import { suggestLayout } from './layout';
import { deliveryTour } from './tour';

const api: CoreWorkerApiP2 = {
  async allSimplePaths(g, s, t, opts, onProgress) {
    return allSimplePaths(g, s, t, opts, onProgress);
  },
  async floydWarshall(g) {
    return floydWarshall(g);
  },
  async suggestLayout(g) {
    return suggestLayout(g);
  },
  // Proyecto II: recorrido de reparto (heurística costosa, fuera del hilo de la interfaz).
  async deliveryTour(g, start) {
    return deliveryTour(g, start);
  },
};

Comlink.expose(api);
