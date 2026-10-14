import type { CoreApi, EdgeShape, GEdge, Graph } from './types';
const crossing = (a: GEdge, b: GEdge, g: Graph) => {
  const A = g.nodes.find((n) => n.id === a.source)!,
    B = g.nodes.find((n) => n.id === a.target)!,
    C = g.nodes.find((n) => n.id === b.source)!,
    D = g.nodes.find((n) => n.id === b.target)!;
  const orient = (p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return orient(A, B, C) * orient(A, B, D) < 0 && orient(C, D, A) * orient(C, D, B) < 0;
};
export const autoEdgeShapes: CoreApi['autoEdgeShapes'] = (g) => {
  const out: Record<string, EdgeShape> = {};
  for (const e of g.edges) {
    if (!e.shapeAuto) continue;
    const A = g.nodes.find((n) => n.id === e.source),
      B = g.nodes.find((n) => n.id === e.target);
    if (!A || !B) {
      out[e.id] = 'straight';
      continue;
    }
    const dx = B.x - A.x,
      dy = B.y - A.y,
      len = dx * dx + dy * dy;
    const through = g.nodes.some(
      (n) =>
        n.id !== A.id &&
        n.id !== B.id &&
        len &&
        ((n.x - A.x) * dx + (n.y - A.y) * dy) / len > 0 &&
        ((n.x - A.x) * dx + (n.y - A.y) * dy) / len < 1 &&
        Math.abs(dx * (n.y - A.y) - dy * (n.x - A.x)) / Math.sqrt(len) < Math.max(n.w, n.h) / 2,
    );
    const overlap = g.edges.some(
      (o) =>
        o.id !== e.id && ![o.source, o.target].some((id) => [e.source, e.target].includes(id)) && crossing(e, o, g),
    );
    out[e.id] = through || overlap ? 'bezier' : 'straight';
  }
  return out;
};
