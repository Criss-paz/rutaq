import type { CoreApi } from './types';
export const detectScale: CoreApi['detectScale'] = (weights) => {
  const valid = weights.filter((w) => Number.isFinite(w) && w > 0).sort((a, b) => a - b),
    max = valid.at(-1) ?? 1,
    med =
      valid.length % 2
        ? valid[(valid.length - 1) >> 1]!
        : (valid[valid.length / 2 - 1]! + valid[valid.length / 2]!) / 2,
    magnitude = Math.max(1, 10 ** Math.ceil(Math.log10(max)));
  return { magnitude, range: `1–${magnitude.toLocaleString('es-GT')}`, pxPerUnit: 160 / (med || 1) };
};
