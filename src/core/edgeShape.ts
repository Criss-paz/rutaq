import type { CoreApi, EdgeShape } from './types';

type Point = { x: number; y: number };
const segmentCrossesRect = (a: Point, b: Point, rect: { left: number; right: number; top: number; bottom: number }) => {
  let lo = 0,
    hi = 1;
  const dx = b.x - a.x,
    dy = b.y - a.y;
  for (const [p, q] of [
    [-dx, a.x - rect.left],
    [dx, rect.right - a.x],
    [-dy, a.y - rect.top],
    [dy, rect.bottom - a.y],
  ] as [number, number][]) {
    if (Math.abs(p) < 1e-12) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) lo = Math.max(lo, r);
    else hi = Math.min(hi, r);
    if (lo > hi) return false;
  }
  return hi > 1e-9 && lo < 1 - 1e-9 && hi - lo > 1e-9;
};

const overlaps = (a: Point, b: Point, c: Point, d: Point) => {
  const ux = b.x - a.x,
    uy = b.y - a.y,
    vx = d.x - c.x,
    vy = d.y - c.y;
  const length = Math.hypot(ux, uy);
  if (!length || Math.abs(ux * vy - uy * vx) > 1e-9 * length * Math.hypot(vx, vy)) return false;
  if (Math.abs(ux * (c.y - a.y) - uy * (c.x - a.x)) > 1e-9 * length * Math.hypot(c.x - a.x, c.y - a.y)) return false;
  const uxUnit = ux / length,
    uyUnit = uy / length;
  const cProjection = (c.x - a.x) * uxUnit + (c.y - a.y) * uyUnit;
  const dProjection = (d.x - a.x) * uxUnit + (d.y - a.y) * uyUnit;
  return Math.min(length, Math.max(cProjection, dProjection)) - Math.max(0, Math.min(cProjection, dProjection)) > 1e-9;
};

export const autoEdgeShapes: CoreApi['autoEdgeShapes'] = (g) => {
  const out: Record<string, EdgeShape> = {},
    nodeById = new Map(g.nodes.map((n) => [n.id, n]));
  const centers = new Map(g.nodes.map((n) => [n.id, { x: n.x + n.w / 2, y: n.y + n.h / 2 }]));
  const autoEdges = g.edges.filter((e) => e.shapeAuto);
  for (const edge of autoEdges) {
    const source = nodeById.get(edge.source),
      target = nodeById.get(edge.target);
    if (!source || !target) {
      out[edge.id] = 'straight';
      continue;
    }
    const a = centers.get(edge.source)!,
      b = centers.get(edge.target)!;
    const throughNode = g.nodes.some((node) => {
      if (node.id === edge.source || node.id === edge.target) return false;
      const center = centers.get(node.id)!;
      return segmentCrossesRect(a, b, {
        left: center.x - node.w / 2,
        right: center.x + node.w / 2,
        top: center.y - node.h / 2,
        bottom: center.y + node.h / 2,
      });
    });
    let overlap = false;
    for (const other of g.edges) {
      if (other.id === edge.id) continue;
      const c = centers.get(other.source),
        d = centers.get(other.target);
      if (c && d && overlaps(a, b, c, d)) {
        overlap = true;
        break;
      }
    }
    out[edge.id] = overlap ? 'arc' : throughNode ? 'bezier' : 'straight';
  }
  return out;
};
