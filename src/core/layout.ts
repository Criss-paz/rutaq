import type { CoreApi, NodeId } from './types';
import { floydWarshall } from './floyd';
import { detectScale } from './scale';

const solve = (matrix: number[][], vector: number[]) => {
  const n = vector.length,
    a = matrix.map((row, i) => [...row, vector[i]!]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(a[row]![col]!) > Math.abs(a[pivot]![col]!)) pivot = row;
    [a[col], a[pivot]] = [a[pivot]!, a[col]!];
    const divisor = a[col]![col]!;
    if (Math.abs(divisor) < 1e-12) continue;
    for (let j = col; j <= n; j++) a[col]![j] = a[col]![j]! / divisor;
    for (let row = 0; row < n; row++)
      if (row !== col) {
        const factor = a[row]![col]!;
        for (let j = col; j <= n; j++) a[row]![j] = a[row]![j]! - factor * a[col]![j]!;
      }
  }
  return a.map((row) => row[n]!);
};

const layoutComponent = (
  ids: NodeId[],
  distances: number[][],
  indices: Map<NodeId, number>,
  initial: { x: number; y: number }[],
) => {
  const n = ids.length;
  if (n <= 1) return initial;
  const weights = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const d = distances[indices.get(ids[i]!)!]![indices.get(ids[j]!)!]!;
      const w = 1 / (d * d);
      weights[i]![j] = weights[j]![i] = w;
    }
  const laplacian = Array.from({ length: n - 1 }, (_, i) =>
    Array.from({ length: n - 1 }, (_, j) => {
      if (i === j) return weights[i]!.reduce((sum, w) => sum + w, 0);
      return -weights[i]![j]!;
    }),
  );
  let xs = initial.map((p) => p.x),
    ys = initial.map((p) => p.y);
  if (xs.every((x) => x === xs[0]) && ys.every((y) => y === ys[0])) {
    const radius = Math.max(1, ...distances.flat().filter(Number.isFinite)) / 2;
    xs = ids.map((_, i) => radius * Math.cos((2 * Math.PI * i) / n));
    ys = ids.map((_, i) => radius * Math.sin((2 * Math.PI * i) / n));
  }
  const center = (values: number[]) => {
    const mean = values.reduce((sum, x) => sum + x, 0) / n;
    return values.map((x) => x - mean);
  };
  xs = center(xs);
  ys = center(ys);
  for (let iter = 0; iter < 300; iter++) {
    const bx = Array(n).fill(0) as number[],
      by = Array(n).fill(0) as number[];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (i !== j) {
          const globalI = indices.get(ids[i]!)!,
            globalJ = indices.get(ids[j]!)!;
          const target = distances[globalI]![globalJ]!;
          const radius = Math.hypot(xs[i]! - xs[j]!, ys[i]! - ys[j]!);
          const ratio = radius > 1e-12 ? (weights[i]![j]! * target) / radius : 0;
          bx[i] = bx[i]! + ratio * (xs[i]! - xs[j]!);
          by[i] = by[i]! + ratio * (ys[i]! - ys[j]!);
        }
    const nx = [...solve(laplacian, bx.slice(0, -1)), 0],
      ny = [...solve(laplacian, by.slice(0, -1)), 0];
    const nextX = center(nx),
      nextY = center(ny);
    let movement = 0,
      norm = 0;
    for (let i = 0; i < n; i++) {
      movement += (nextX[i]! - xs[i]!) ** 2 + (nextY[i]! - ys[i]!) ** 2;
      norm += xs[i]! ** 2 + ys[i]! ** 2;
    }
    xs = nextX;
    ys = nextY;
    if (Math.sqrt(movement) <= 1e-4 * Math.max(1, Math.sqrt(norm))) break;
  }
  return ids.map((_, i) => ({ x: xs[i]!, y: ys[i]! }));
};

export const suggestLayout: CoreApi['suggestLayout'] = (g) => {
  const scale = detectScale(g.edges.map((e) => e.weight)),
    floyd = floydWarshall(g),
    index = new Map(floyd.order.map((id, i) => [id, i]));
  const positions: Record<string, { x: number; y: number }> = {},
    nodeById = new Map(g.nodes.map((node) => [node.id, node]));
  const unseen = new Set(floyd.order);
  let componentOffset = 0;
  while (unseen.size) {
    const root = unseen.values().next().value as NodeId,
      ri = index.get(root)!;
    const component = floyd.order.filter((_, j) => Number.isFinite(floyd.dist[ri]![j]!));
    component.forEach((id) => unseen.delete(id));
    const localDistances = floyd.dist.map((row) => row.map((d) => (Number.isFinite(d) ? d * scale.pxPerUnit : d)));
    const initial = component.map((id) => {
      const n = nodeById.get(id)!;
      return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
    });
    const points = layoutComponent(component, localDistances, index, initial);
    const left = Math.min(...points.map((p, i) => p.x - nodeById.get(component[i]!)!.w / 2));
    const shift = componentOffset - left;
    points.forEach((p, i) => {
      positions[component[i]!] = { x: p.x + shift, y: p.y };
    });
    componentOffset = Math.max(...points.map((p, i) => p.x + shift + nodeById.get(component[i]!)!.w / 2)) + 80;
  }
  let sum = 0,
    squares = 0;
  for (let i = 0; i < floyd.order.length; i++)
    for (let j = i + 1; j < floyd.order.length; j++) {
      const d = floyd.dist[i]![j]!;
      if (!Number.isFinite(d)) continue;
      const a = positions[floyd.order[i]!]!,
        b = positions[floyd.order[j]!]!;
      const error = Math.hypot(a.x - b.x, a.y - b.y) / scale.pxPerUnit - d;
      sum += error * error;
      squares += d * d;
    }
  return { positions, stressError: squares ? 100 * Math.sqrt(sum / squares) : 0, scale };
};
