import type { Dataset, GNode, Graph, GuatemalaDataset } from '../core/types';

export const DEFAULT_NODE_SIZE = { w: 132, h: 44 } as const;
/**
 * En el mapa real cada municipio es un punto (la UI dibuja el nombre al lado): así se conserva la posición
 * geográfica exacta sin apartar nodos que, a escala, quedan a 1.5–3 km entre sí.
 */
export const DATASET_NODE_SIZE = { w: 18, h: 18 } as const;

/** Ancho del mapa en px. Se expone para que la UI dibuje la barra de escala en km. */
export const DATASET_WIDTH_PX = 1400;

/**
 * Proyecciones con el norte arriba:
 * - `equirect`: equirectangular centrada en la latitud media (Quetzaltenango, ~50 km: error de escala < 2 %).
 * - `mercator`: Web Mercator, como Google Maps (Guatemala completa, ~450 km de norte a sur).
 */
export type ProjectionKind = 'equirect' | 'mercator';

/** Proyección lat/lon ↔ lienzo. `project` devuelve el CENTRO del punto en px del lienzo. */
export interface GeoProjection {
  kind: ProjectionKind;
  project(lat: number, lon: number): { x: number; y: number };
  unproject(x: number, y: number): { lat: number; lon: number };
}

const RAD = Math.PI / 180;

/** Construye la proyección que ajusta `points` a `widthPx` de ancho (el oeste en x = 0, el punto más al norte en y = 0). */
export function makeProjection(
  points: { lat: number; lon: number }[],
  kind: ProjectionKind,
  widthPx = DATASET_WIDTH_PX,
): GeoProjection {
  const lat0 = points.length ? points.reduce((a, p) => a + p.lat, 0) / points.length : 0;
  const cos0 = Math.cos(lat0 * RAD);
  const fwd =
    kind === 'mercator'
      ? (lat: number, lon: number) => ({ px: lon * RAD, py: -Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2)) })
      : (lat: number, lon: number) => ({ px: lon * cos0, py: -lat });
  const inv =
    kind === 'mercator'
      ? (px: number, py: number) => ({ lat: (2 * Math.atan(Math.exp(-py)) - Math.PI / 2) / RAD, lon: px / RAD })
      : (px: number, py: number) => ({ lat: -py, lon: px / cos0 });

  const raw = points.map((p) => fwd(p.lat, p.lon));
  const minX = raw.length ? Math.min(...raw.map((r) => r.px)) : 0;
  const maxX = raw.length ? Math.max(...raw.map((r) => r.px)) : 0;
  const minY = raw.length ? Math.min(...raw.map((r) => r.py)) : 0;
  const k = maxX > minX ? widthPx / (maxX - minX) : 1;

  return {
    kind,
    project(lat, lon) {
      const { px, py } = fwd(lat, lon);
      return { x: (px - minX) * k, y: (py - minY) * k };
    },
    unproject(x, y) {
      return inv(x / k + minX, y / k + minY);
    },
  };
}

/**
 * Convierte el dataset geográfico en un Graph del lienzo con la proyección indicada (equirectangular por defecto,
 * que es la del Proyecto I). (x, y) del nodo es la esquina superior izquierda del punto.
 */
export function datasetToGraph(
  ds: Dataset | GuatemalaDataset,
  widthPx = DATASET_WIDTH_PX,
  kind: ProjectionKind = 'equirect',
): Graph {
  if (ds.nodes.length === 0) return { nodes: [], edges: [], directed: false, unit: ds.meta.unidad };

  const proj = makeProjection(ds.nodes, kind, widthPx);
  const nodes: GNode[] = ds.nodes.map((n) => {
    const c = proj.project(n.lat, n.lon);
    return {
      id: n.id,
      label: n.label,
      x: Math.round(c.x - DATASET_NODE_SIZE.w / 2),
      y: Math.round(c.y - DATASET_NODE_SIZE.h / 2),
      ...DATASET_NODE_SIZE,
      lat: n.lat,
      lon: n.lon,
    };
  });

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
