import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Graph } from '../../src/core/types';
import { prim, kruskal } from '../../src/core/mst';
import { routeBreakdown } from '../../src/core/route';
import { deliveryTour } from '../../src/core/tour';
import { dijkstra } from '../../src/core/dijkstra';
import { floydWarshall } from '../../src/core/floyd';

const makeGraph = (n: number, raw: [number, number, number, string][]): Graph => ({
  directed: false,
  unit: 'km',
  nodes: Array.from({ length: n }, (_, i) => ({ id: String(i), label: `N${i}`, x: i * 20, y: 0, w: 20, h: 20 })),
  edges: raw.map(([a, b, weight, id]) => ({
    id,
    source: String(a),
    target: String(b),
    weight,
    shape: 'straight',
    shapeAuto: true,
    meta: { carretera: `R-${id}` },
  })),
});
const randomGraph = (n: number, raw: [number, number, number][]): Graph => {
  const pairs = new Set<string>();
  const edges: [number, number, number, string][] = [];
  for (const [a, b, w] of raw) {
    if (a >= n || b >= n || a === b) continue;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (pairs.has(key)) continue;
    pairs.add(key);
    edges.push([a, b, w, `e${edges.length}`]);
  }
  return makeGraph(n, edges);
};
const isForest = (g: Graph, ids: string[]) => {
  const parent = new Map(g.nodes.map((node) => [node.id, node.id]));
  const find = (id: string): string =>
    parent.get(id) === id ? id : (parent.set(id, find(parent.get(id)!)), parent.get(id)!);
  for (const id of ids) {
    const edge = g.edges.find((item) => item.id === id)!;
    const a = find(edge.source),
      b = find(edge.target);
    if (a === b) return false;
    parent.set(a, b);
  }
  return true;
};
const bruteMst = (g: Graph): number => {
  const target = g.nodes.length - 1;
  let best = Infinity;
  const choose = (at: number, picked: string[], sum: number) => {
    if (picked.length === target) {
      if (sum < best && isForest(g, picked)) best = sum;
      return;
    }
    for (let i = at; i <= g.edges.length - (target - picked.length); i++)
      choose(i + 1, [...picked, g.edges[i]!.id], sum + g.edges[i]!.weight);
  };
  if (!target) return 0;
  choose(0, [], 0);
  return best;
};

describe('Proyecto II: MST, desglose y recorrido', () => {
  it('Prim y Kruskal coinciden en al menos 500 grafos aleatorios y producen bosques sin ciclos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }),
        fc.array(fc.tuple(fc.nat(7), fc.nat(7), fc.integer({ min: 1, max: 20 })), { maxLength: 24 }),
        (n, raw) => {
          const base = randomGraph(n, raw);
          const pairs: [number, number, number, string][] = base.edges.map((edge) => [
            Number(edge.source),
            Number(edge.target),
            edge.weight,
            edge.id,
          ]);
          for (let i = 1; i < n; i++) {
            if (!pairs.some(([a, b]) => (a === i - 1 && b === i) || (a === i && b === i - 1)))
              pairs.push([i - 1, i, 1 + i, `bridge${i}`]);
          }
          const g = makeGraph(n, pairs);
          const p = prim(g),
            k = kruskal(g);
          expect(p.total).toBe(k.total);
          expect(isForest(g, p.edges)).toBe(true);
          expect(isForest(g, k.edges)).toBe(true);
          expect(p.steps.slice(1).every((step, i) => step.crossedOut.length === i + 2)).toBe(true);
          expect(
            k.steps.slice(1).every((step) => (step.chosenEdge === null) === (step.rejectedEdge !== undefined)),
          ).toBe(true);
          expect(p.edges.length).toBe(n - 1);
          expect(k.edges.length).toBe(n - 1);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('coincide con fuerza bruta en grafos conexos de hasta seis nodos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 6 }),
        fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 5, maxLength: 20 }),
        (n, weights) => {
          const edges: [number, number, number, string][] = [];
          for (let i = 1; i < n; i++) edges.push([i - 1, i, weights[i - 1]!, `tree${i}`]);
          for (let a = 0; a < n; a++)
            for (let b = a + 2; b < n; b++)
              if ((a + b) % 2 === 0) edges.push([a, b, weights[(a + b) % weights.length]!, `x${a}-${b}`]);
          const g = makeGraph(n, edges),
            expected = bruteMst(g);
          expect(prim(g).total).toBe(expected);
          expect(kruskal(g).total).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('maneja nodo único, componente desconectada, empate y orden por id', () => {
    const one = makeGraph(1, []);
    expect(prim(one)).toMatchObject({ edges: [], total: 0 });
    expect(kruskal(one)).toMatchObject({ edges: [], total: 0 });
    const tie = makeGraph(4, [
      [0, 1, 1, 'z'],
      [0, 2, 1, 'a'],
      [1, 2, 1, 'b'],
      [2, 3, 4, 'c'],
    ]);
    expect(prim(tie).edges).toEqual(['a', 'b', 'c'].slice(0, 2).concat('c'));
    expect(kruskal(tie).edges).toEqual(['a', 'b', 'c']);
    const disconnected = makeGraph(4, [
      [0, 1, 2, 'ab'],
      [2, 3, 1, 'cd'],
    ]);
    expect(prim(disconnected).edges).toEqual(['ab']);
    expect(kruskal(disconnected).edges).toEqual(['cd', 'ab']);
    expect(() => prim(one, 'missing')).toThrow();
    const invalidEdge = makeGraph(2, [[0, 1, 1, 'edge']]);
    invalidEdge.edges[0]!.target = 'missing';
    expect(() => kruskal(invalidEdge)).toThrow();
  });

  it('desglosa los tramos, acumula y forma la expresión en la unidad del grafo', () => {
    const g = makeGraph(3, [
      [0, 1, 12.5, 'a'],
      [1, 2, 30.2, 'b'],
    ]);
    const result = routeBreakdown(g, { nodes: ['0', '1', '2'], edges: ['a', 'b'], distance: 42.7 });
    expect(result.legs.map((leg) => leg.cumulative)).toEqual([12.5, 42.7]);
    expect(result.legs[0]?.road).toBe('R-a');
    expect(result.total).toBe(dijkstra(g, '0').labels['2']?.dist);
    expect(result.formula).toBe('12.5 + 30.2 = 42.7 km');
    expect(routeBreakdown(g, { nodes: ['0'], edges: [], distance: 0 }).formula).toBe('0 km');
    expect(() => routeBreakdown(g, { nodes: ['0', '2'], edges: ['a'], distance: 0 })).toThrow();
    const withoutRoad = makeGraph(2, [[0, 1, 3, 'no-road']]);
    withoutRoad.edges[0]!.meta = {};
    expect(
      routeBreakdown(withoutRoad, { nodes: ['0', '1'], edges: ['no-road'], distance: 3 }).legs[0],
    ).not.toHaveProperty('road');
  });

  it('visita una vez cada nodo alcanzable, cierra el tour y 2-opt no empeora al vecino cercano', () => {
    const g = makeGraph(6, [
      [0, 1, 2, 'a'],
      [1, 2, 2, 'b'],
      [2, 3, 2, 'c'],
      [3, 4, 2, 'd'],
      [4, 0, 15, 'e'],
      [0, 2, 3, 'f'],
      [1, 3, 3, 'g'],
      [2, 4, 3, 'h'],
      [4, 5, 1, 'i'],
    ]);
    const result = deliveryTour(g, '0'),
      f = floydWarshall(g),
      order = result.order;
    expect(new Set(order).size).toBe(6);
    expect(order[0]).toBe('0');
    expect(result.total).toBe(
      order.reduce(
        (sum, node, i) => sum + f.dist[order.indexOf(node)]![order.indexOf(order[(i + 1) % order.length]!)]!,
        0,
      ),
    );
    let nearest = 0;
    for (let i = 0; i < order.length; i++)
      nearest += f.dist[f.order.indexOf(order[i]!)]![f.order.indexOf(order[(i + 1) % order.length]!)]!;
    expect(result.total).toBeLessThanOrEqual(nearest);
    const disconnected = makeGraph(3, [[0, 1, 1, 'x']]);
    expect(deliveryTour(disconnected, '0').order).toEqual(['0', '1']);
    const triangle = makeGraph(3, [
      [0, 1, 1, 'a'],
      [0, 2, 1, 'b'],
      [1, 2, 1, 'c'],
    ]);
    expect(deliveryTour(triangle, '0').order).toEqual(['0', '1', '2']);
    expect(() => deliveryTour(g, 'nope')).toThrow();
  });

  it('resuelve un recorrido de 22 nodos en menos de un segundo', () => {
    const edges: [number, number, number, string][] = [];
    for (let a = 0; a < 22; a++)
      for (let b = a + 1; b < 22; b++) edges.push([a, b, 1 + ((a * 19 + b * 31) % 97), `e${a}-${b}`]);
    const g = makeGraph(22, edges),
      started = performance.now();
    const result = deliveryTour(g, '0');
    expect(result.order).toHaveLength(22);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
