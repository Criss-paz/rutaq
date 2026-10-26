// Punto de entrada público del núcleo. store/ y ui/ importan SOLO desde aquí (o desde ./types).
export * from './types';
export { validateGraph } from './graph';
export { dijkstra, shortestPaths } from './dijkstra';
export { buildTabular } from './tabular';
export { floydWarshall, floydPath } from './floyd';
export { allSimplePaths } from './allPaths';
export { yenKShortest } from './yen';
export { detectScale } from './scale';
export { suggestLayout } from './layout';
export { autoEdgeShapes } from './edgeShape';
// Proyecto II — Transporte Express
export { prim, kruskal } from './mst';
export { routeBreakdown } from './route';
export { deliveryTour } from './tour';
