import { readFile, writeFile } from 'node:fs/promises';
import { dijkstra } from '../src/core/dijkstra';
import type { Graph } from '../src/core/types';

const example: Graph = {
  directed: false,
  unit: 'km',
  nodes: ['A', 'B', 'C', 'D', 'E', 'F'].map((id, i) => ({ id, label: id, x: i * 100, y: 0, w: 40, h: 40 })),
  edges: [
    ['AB', 'A', 'B', 7],
    ['AC', 'A', 'C', 9],
    ['AF', 'A', 'F', 14],
    ['BC', 'B', 'C', 10],
    ['BD', 'B', 'D', 15],
    ['CD', 'C', 'D', 11],
    ['CF', 'C', 'F', 2],
    ['DE', 'D', 'E', 6],
    ['EF', 'E', 'F', 9],
  ].map(([id, source, target, weight]) => ({
    id: String(id),
    source: String(source),
    target: String(target),
    weight: Number(weight),
    shape: 'straight' as const,
    shapeAuto: true,
  })),
};
const files = ['src/data/ejemplo6.json', 'src/data/quetzaltenango.json'];
const out: Record<string, unknown> = {};
for (const file of files) {
  try {
    const raw = JSON.parse(await readFile(file, 'utf8'));
    let g = (raw.graph ?? raw) as Graph;
    if (Array.isArray(g.nodes) && Array.isArray(g.edges) && !('directed' in g)) {
      const dataset = raw as {
        nodes: { id: string; label?: string }[];
        edges: { id: string; source: string; target: string; weight?: number; km?: number }[];
      };
      g = {
        directed: false,
        unit: 'km',
        nodes: dataset.nodes.map((n, i) => ({ id: n.id, label: n.label ?? n.id, x: i * 20, y: 0, w: 30, h: 30 })),
        edges: dataset.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          weight: e.weight ?? e.km ?? 0,
          shape: 'straight',
          shapeAuto: true,
        })),
      } as Graph;
    }
    if (!Array.isArray(g.nodes) || !Array.isArray(g.edges)) continue;
    out[file] = g;
  } catch {
    /* optional datasets */
  }
}
out['grafo-prueba'] = example;
for (const [name, g] of Object.entries(out) as [string, Graph][])
  out[name] = { graph: g, distances: Object.fromEntries(g.nodes.map((n) => [n.id, dijkstra(g, n.id).labels])) };
out['grafo-prueba'] = {
  graph: example,
  distances: Object.fromEntries(example.nodes.map((n) => [n.id, dijkstra(example, n.id).labels])),
};
await writeFile('verification/programa.json', JSON.stringify(out));
