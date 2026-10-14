import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Graph } from '../../src/core/types';
import { dijkstra, shortestPaths } from '../../src/core/dijkstra';
import { floydWarshall, floydPath } from '../../src/core/floyd';
import { allSimplePaths } from '../../src/core/allPaths';
import { yenKShortest } from '../../src/core/yen';
import { validateGraph } from '../../src/core/graph';
import { detectScale } from '../../src/core/scale';
import { buildTabular } from '../../src/core/tabular';
import { suggestLayout } from '../../src/core/layout';
import { autoEdgeShapes } from '../../src/core/edgeShape';
const graph = (n: number, pairs: [number, number, number][]): Graph => ({
  directed: false,
  unit: 'km',
  nodes: Array.from({ length: n }, (_, i) => ({ id: String(i), label: String(i), x: i * 50, y: 0, w: 30, h: 30 })),
  edges: pairs.map(([a, b, w], i) => ({
    id: `e${i}`,
    source: String(a),
    target: String(b),
    weight: w,
    shape: 'straight',
    shapeAuto: true,
  })),
});
describe('núcleo de rutas', () => {
  it('resuelve el ejemplo, los empates y Floyd', () => {
    const g = graph(4, [
      [0, 1, 1],
      [1, 3, 1],
      [0, 2, 1],
      [2, 3, 1],
    ]);
    expect(dijkstra(g, '0').labels['3']?.dist).toBe(2);
    expect(shortestPaths(g, '0', '3')).toHaveLength(2);
    const f = floydWarshall(g);
    expect(floydPath(g, f, '0', '3')?.distance).toBe(2);
    expect(f.matrices).toHaveLength(5);
  });
  it('maneja un nodo, desconexión, decimal y s=t', () => {
    const g = graph(2, [[0, 1, 0.25]]);
    expect(dijkstra(g, '0').steps[0]?.iter).toBe(0);
    expect(dijkstra(g, '0').labels['1']?.dist).toBe(0.25);
    expect(shortestPaths(g, '0', '0')[0]?.distance).toBe(0);
    expect(allSimplePaths(graph(2, []), '0', '1', { limit: 10, timeoutMs: 100 }).paths).toEqual([]);
  });
  it('compara Dijkstra, Floyd, fuerza bruta y Yen en 500 grafos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 }),
        fc.array(fc.tuple(fc.nat(6), fc.nat(6), fc.integer({ min: 1, max: 9 })), { maxLength: 15 }),
        (n, raw) => {
          const pairs = raw
            .filter(([a, b]) => a < n && b < n && a !== b)
            .map(([a, b, w]) => [a, b, w] as [number, number, number]);
          const seen = new Set<string>();
          const edges = pairs.filter(([a, b]) => {
            const k = [a, b].sort().join(':');
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          const g = graph(n, edges),
            f = floydWarshall(g);
          for (let i = 0; i < n; i++) {
            const d = dijkstra(g, String(i));
            for (let j = 0; j < n; j++) expect(d.labels[String(j)]?.dist).toBe(f.dist[i]?.[j]);
          }
          const paths = allSimplePaths(g, '0', String(n - 1), { limit: 10000, timeoutMs: 1000 });
          expect(paths.paths[0]?.distance ?? Infinity).toBe(dijkstra(g, '0').labels[String(n - 1)]?.dist);
          expect(yenKShortest(g, '0', String(n - 1), 20).map((p) => p.distance)).toEqual(
            paths.paths.slice(0, 20).map((p) => p.distance),
          );
        },
      ),
      { numRuns: 500 },
    );
  });
  it('valida estructura, escala y peso', () => {
    const g = graph(2, [[0, 1, 0]]);
    expect(validateGraph(g).issues.map((x) => x.code)).toContain('NON_POSITIVE_WEIGHT');
    expect(detectScale([1, 1000]).magnitude).toBe(1000);
    expect(buildTabular(g, dijkstra(g, '0')).rows.length).toBeGreaterThan(0);
    expect(suggestLayout(g).positions['1']).toBeDefined();
    expect(autoEdgeShapes(g)).toEqual({ e0: 'straight' });
  });
  it('detecta todos los códigos de validación', () => {
    const bad = graph(2, [
      [0, 0, -1],
      [0, 1, Infinity],
      [0, 1, 2],
    ]);
    bad.nodes.push({ ...bad.nodes[0]!, label: 'duplicado' });
    bad.edges[1]!.id = bad.edges[0]!.id;
    bad.edges.push({ id: 'missing', source: 'x', target: '1', weight: 2, shape: 'straight', shapeAuto: true });
    expect(validateGraph(bad).issues.map((x) => x.code)).toEqual(
      expect.arrayContaining([
        'DUPLICATE_NODE_ID',
        'DUPLICATE_EDGE_ID',
        'MISSING_NODE',
        'SELF_LOOP',
        'DUPLICATE_EDGE',
        'NON_POSITIVE_WEIGHT',
        'INVALID_WEIGHT',
      ]),
    );
    expect(validateGraph(graph(0, [])).issues[0]?.code).toBe('EMPTY_GRAPH');
    expect(validateGraph(graph(2, [])).issues[0]?.severity).toBe('warning');
  });
  it('enumera caminos, limita a Yen y detecta formas solapadas', () => {
    const g = graph(4, [
      [0, 1, 1],
      [1, 3, 1],
      [0, 2, 2],
      [2, 3, 2],
      [1, 2, 1],
    ]);
    const complete = allSimplePaths(g, '0', '3', { limit: 30, timeoutMs: 500 });
    expect(complete.complete).toBe(true);
    expect(complete.paths.every((p) => new Set(p.nodes).size === p.nodes.length)).toBe(true);
    const limited = allSimplePaths(g, '0', '3', { limit: 1, timeoutMs: 500 });
    expect(limited.method).toBe('yen');
    expect(limited.paths.length).toBe(1);
    expect(yenKShortest(g, '0', '3', 0)).toEqual([]);
    const crossing = graph(4, [
      [0, 1, 1],
      [2, 3, 1],
    ]);
    crossing.nodes[0]!.x = 0;
    crossing.nodes[0]!.y = 0;
    crossing.nodes[1]!.x = 100;
    crossing.nodes[1]!.y = 100;
    crossing.nodes[2]!.x = 0;
    crossing.nodes[2]!.y = 100;
    crossing.nodes[3]!.x = 100;
    crossing.nodes[3]!.y = 0;
    expect(autoEdgeShapes(crossing)).toEqual({ e0: 'bezier', e1: 'bezier' });
    crossing.edges[0]!.shapeAuto = false;
    expect(autoEdgeShapes(crossing)).not.toHaveProperty('e0');
    const through = graph(3, [[0, 1, 1]]);
    through.nodes[0]!.x = 0;
    through.nodes[1]!.x = 100;
    through.nodes[2]!.x = 50;
    expect(autoEdgeShapes(through).e0).toBe('bezier');
  });
  it('maneja entradas límite y componentes aislados', () => {
    const g = graph(3, [[0, 1, 2]]),
      f = floydWarshall(g);
    expect(floydPath(g, f, '0', '2')).toBeNull();
    expect(() => floydPath(g, f, 'missing', '2')).toThrow();
    expect(shortestPaths(g, '0', '2')).toEqual([]);
    expect(allSimplePaths(g, '0', '0', { limit: 3, timeoutMs: 10 }).complete).toBe(true);
    expect(() => allSimplePaths(g, 'missing', '0', { limit: 3, timeoutMs: 10 })).toThrow();
    expect(suggestLayout(g).positions['2']).toBeDefined();
    expect(detectScale([]).magnitude).toBe(1);
    expect(detectScale([-2, Number.NaN, 2]).magnitude).toBe(10);
    const parallel = graph(2, [
      [0, 1, 1],
      [0, 1, 3],
    ]);
    expect(floydWarshall(parallel).dist[0]?.[1]).toBe(1);
    expect(() => dijkstra(g, 'ausente')).toThrow();
    expect(allSimplePaths(g, '0', '2', { limit: 2, timeoutMs: -1 }).method).toBe('yen');
    const dense = graph(
      7,
      Array.from({ length: 7 }, (_, a) =>
        Array.from({ length: 7 }, (_, b) => [a, b, 1] as [number, number, number]).filter(([a, b]) => a < b),
      ).flat(),
    );
    const reports: number[] = [];
    expect(allSimplePaths(dense, '0', '6', { limit: 1000, timeoutMs: 1000 }, (n) => reports.push(n)).totalFound).toBe(
      326,
    );
    expect(reports).toContain(250);
  });
});
