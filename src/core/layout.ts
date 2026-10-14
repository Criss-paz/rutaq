import type { CoreApi } from './types';
import { floydWarshall } from './floyd';
import { detectScale } from './scale';

export const suggestLayout: CoreApi['suggestLayout'] = (g) => {
  const scale = detectScale(g.edges.map((e) => e.weight));
  const f = floydWarshall(g),
    positions: Record<string, { x: number; y: number }> = {},
    unseen = new Set(f.order);
  let offset = 0;
  while (unseen.size) {
    const root = unseen.values().next().value as string;
    const ri = f.order.indexOf(root);
    const component = f.order.filter((_, j) => Number.isFinite(f.dist[ri]![j]));
    component.forEach((id) => unseen.delete(id));
    const radius = Math.max(100, component.length * 35);
    component.forEach((id, i) => {
      const a = (2 * Math.PI * i) / component.length;
      positions[id] = { x: offset + radius + radius * Math.cos(a), y: radius + radius * Math.sin(a) };
    });
    offset += 2 * radius + 180;
  }
  let error = 0,
    total = 0;
  for (let i = 0; i < f.order.length; i++)
    for (let j = i + 1; j < f.order.length; j++) {
      const d = f.dist[i]![j]!;
      if (!Number.isFinite(d)) continue;
      const a = positions[f.order[i]!]!,
        b = positions[f.order[j]!]!;
      const delta = Math.hypot(a.x - b.x, a.y - b.y) / scale.pxPerUnit - d;
      error += delta * delta;
      total += d * d;
    }
  return { positions, stressError: total ? 100 * Math.sqrt(error / total) : 0, scale };
};
