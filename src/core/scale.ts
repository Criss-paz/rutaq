import type { CoreApi } from './types';

export const detectScale: CoreApi['detectScale'] = (weights) => {
  const valid = weights.filter((w) => Number.isFinite(w) && w > 0).sort((a, b) => a - b);
  const max = valid.at(-1) ?? 1;
  const middle = valid.length >> 1;
  const median = valid.length % 2 ? valid[middle]! : ((valid[middle - 1] ?? 0) + (valid[middle] ?? 0)) / 2;
  const magnitude = Math.max(1, 10 ** Math.ceil(Math.log10(max)));
  const formatted = String(magnitude).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return { magnitude, range: `1–${formatted}`, pxPerUnit: 160 / (median || 1) };
};
