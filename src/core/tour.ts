import { floydWarshall } from './floyd';
import type { CoreApiP2, NodeId } from './types';

/**
 * Construye un recorrido cerrado aproximado: vecino más cercano y mejoras 2-opt.
 * Complejidad: Floyd-Warshall O(V³), vecino más cercano O(V²) y 2-opt O(V²) por pasada.
 * Referencia: Rosenkrantz, Stearns y Lewis, An Analysis of Several Heuristics for the Traveling Salesman Problem (1977).
 */
export const deliveryTour: CoreApiP2['deliveryTour'] = (g, start: NodeId) => {
  const startIndex = g.nodes.findIndex((node) => node.id === start);
  if (startIndex < 0) throw new Error(`No existe el nodo «${start}».`);
  const f = floydWarshall(g),
    ids = f.order;
  const reachable = ids.filter((_, i) => Number.isFinite(f.dist[startIndex]![i]!));
  const unvisited = new Set(reachable.filter((id) => id !== start));
  const order = [start];
  // Elige repetidamente el destino aún no visitado más cercano; NodeId resuelve los empates.
  while (unvisited.size) {
    const current = ids.indexOf(order[order.length - 1]!);
    const next = [...unvisited].sort((a, b) => {
      const da = f.dist[current]![ids.indexOf(a)]!,
        db = f.dist[current]![ids.indexOf(b)]!;
      return da - db || (a < b ? -1 : a > b ? 1 : 0);
    })[0]!;
    order.push(next);
    unvisited.delete(next);
  }
  const distance = (a: NodeId, b: NodeId) => f.dist[ids.indexOf(a)]![ids.indexOf(b)]!;
  // Invierte segmentos cuando el cambio de dos enlaces reduce la longitud del ciclo.
  if (order.length > 3) {
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 1; i < order.length - 1 && !improved; i++) {
        for (let k = i + 1; k < order.length; k++) {
          const before = distance(order[i - 1]!, order[i]!) + distance(order[k]!, order[(k + 1) % order.length]!);
          const after = distance(order[i - 1]!, order[k]!) + distance(order[i]!, order[(k + 1) % order.length]!);
          if (after < before - 1e-9 * Math.max(1, Math.abs(before), Math.abs(after))) {
            order.splice(i, k - i + 1, ...order.slice(i, k + 1).reverse());
            improved = true;
            break;
          }
        }
      }
    }
  }
  let total = 0;
  for (let i = 0; i < order.length; i++) total += distance(order[i]!, order[(i + 1) % order.length]!);
  return { order, total, method: 'nn+2opt' };
};
