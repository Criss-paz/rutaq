import type { CoreApi, Label, TabularModel } from './types';
export const buildTabular: CoreApi['buildTabular'] = (g, result) => {
  const order = g.nodes.map((n) => n.id),
    adjacency = g.nodes.map((a) =>
      g.nodes.map((b) => {
        const e = g.edges.find(
          (x) => (x.source === a.id && x.target === b.id) || (x.target === a.id && x.source === b.id),
        );
        return e?.weight ?? null;
      }),
    );
  return {
    source: result.source,
    order,
    adjacency,
    rows: result.steps.map((step) => ({
      iter: step.iter,
      current: step.current,
      cells: Object.fromEntries(
        order.map((id) => {
          const label: Label = step.labels[id] ?? { dist: Infinity, pred: null };
          let state: 'normal' | 'min' | 'updated' | 'crossed' | 'unreached' = 'normal';
          if (!Number.isFinite(label.dist)) state = 'unreached';
          else if (step.iter > 0 && id === step.current) state = 'min';
          else if (step.updated.includes(id)) state = 'updated';
          else if (step.iter > 0 && step.permanent.includes(id)) state = 'crossed';
          return [id, { label: { ...label }, state }];
        }),
      ),
    })),
  } as TabularModel;
};
