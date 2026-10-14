import type { Dataset, GNode, Graph } from '../core/types';

export const DEFAULT_NODE_SIZE = { w: 132, h: 44 } as const;

/**
 * Convierte el dataset geográfico en un Graph del lienzo. Proyección equirectangular centrada
 * en el centroide (suficiente para un departamento de ~2 000 km²) escalada a `widthPx` de ancho;
 * el norte queda arriba. (x, y) es la esquina superior izquierda del nodo.
 */
export function datasetToGraph(ds: Dataset, widthPx = 1400): Graph {
  if (ds.nodes.length === 0) return { nodes: [], edges: [], directed: false, unit: ds.meta.unidad };

  const lat0 = ds.nodes.reduce((a, n) => a + n.lat, 0) / ds.nodes.length;
  const cos0 = Math.cos((lat0 * Math.PI) / 180);
  const raw = ds.nodes.map((n) => ({ n, px: n.lon * cos0, py: -n.lat }));
  const minX = Math.min(...raw.map((r) => r.px));
  const maxX = Math.max(...raw.map((r) => r.px));
  const minY = Math.min(...raw.map((r) => r.py));
  const k = maxX > minX ? widthPx / (maxX - minX) : 1;

  const nodes: GNode[] = raw.map(({ n, px, py }) => ({
    id: n.id,
    label: n.label,
    x: Math.round((px - minX) * k - DEFAULT_NODE_SIZE.w / 2),
    y: Math.round((py - minY) * k - DEFAULT_NODE_SIZE.h / 2),
    ...DEFAULT_NODE_SIZE,
    lat: n.lat,
    lon: n.lon,
  }));

  const edges = ds.edges.map(({ id, source, target, km, ...meta }) => ({
    id,
    source,
    target,
    weight: km,
    shape: 'straight' as const,
    shapeAuto: true,
    meta,
  }));

  return { nodes, edges, directed: false, unit: ds.meta.unidad };
}
