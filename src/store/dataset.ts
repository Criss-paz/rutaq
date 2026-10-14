import type { Dataset, GNode, Graph } from '../core/types';

export const DEFAULT_NODE_SIZE = { w: 132, h: 44 } as const;
/** Más compactos en el mapa real: 24 municipios deben leerse sin alejar demasiado el zoom. */
export const DATASET_NODE_SIZE = { w: 112, h: 36 } as const;

/**
 * Convierte el dataset geográfico en un Graph del lienzo. Proyección equirectangular centrada
 * en el centroide (suficiente para un departamento de ~2 000 km²) escalada a `widthPx` de ancho;
 * el norte queda arriba. (x, y) es la esquina superior izquierda del nodo.
 */
export function datasetToGraph(ds: Dataset, widthPx = 1100): Graph {
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
    x: Math.round((px - minX) * k - DATASET_NODE_SIZE.w / 2),
    y: Math.round((py - minY) * k - DATASET_NODE_SIZE.h / 2),
    ...DATASET_NODE_SIZE,
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

  separateNodes(nodes);
  return { nodes, edges, directed: false, unit: ds.meta.unidad };
}

/**
 * Las cabeceras del altiplano están a 2–3 km entre sí: proyectadas, sus cajas se enciman.
 * Empuja cada par encimado a lo largo de la recta que une sus centros (mínimo desplazamiento,
 * determinista), así se conserva la forma geográfica del departamento.
 */
export function separateNodes(nodes: GNode[], gap = 16, maxIter = 300): void {
  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const dx = b.x + b.w / 2 - (a.x + a.w / 2);
        const dy = b.y + b.h / 2 - (a.y + a.h / 2);
        const overlapX = (a.w + b.w) / 2 + gap - Math.abs(dx);
        const overlapY = (a.h + b.h) / 2 + gap - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        // Se separa por el eje que requiere menos movimiento.
        if (overlapX / Math.max(1, Math.abs(dx)) < overlapY / Math.max(1, Math.abs(dy))) {
          const s = (dx >= 0 ? 1 : -1) * (overlapX / 2);
          a.x -= s;
          b.x += s;
        } else {
          const s = (dy >= 0 ? 1 : -1) * (overlapY / 2);
          a.y -= s;
          b.y += s;
        }
        moved = true;
      }
    if (!moved) break;
  }
  for (const n of nodes) {
    n.x = Math.round(n.x);
    n.y = Math.round(n.y);
  }
}
