/**
 * Pestaña de solución tabulada del Algoritmo de Kruskal (AEM).
 * Muestra las aristas ordenadas de menor a mayor peso y la decisión de aceptación o rechazo
 * (por formación de ciclo con Union-Find), junto con el total acumulado en kilómetros.
 *
 * Lee: `mst.kruskal`, `graph`, `departments` desde `useApp`.
 */
import { useApp } from '../../useApp';

export default function KruskalTab() {
  const mst = useApp((s) => s.mst);
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);

  const kruskal = mst?.kruskal;
  const steps = kruskal?.steps ?? [];

  if (!kruskal || steps.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>No hay cálculo de Kruskal disponible.</p>
      </div>
    );
  }

  // Descartamos el paso inicial (iter 0) para mostrar directamente la evaluación de cada arista
  const evalSteps = steps.filter((s) => s.iter > 0);

  const getEdgeDetails = (edgeId: string) => {
    const edge = graph.edges.find((e) => e.id === edgeId);
    if (!edge) return { id: edgeId, source: '', target: '', weight: 0, road: '' };
    const src = graph.nodes.find((n) => n.id === edge.source);
    const tgt = graph.nodes.find((n) => n.id === edge.target);
    const srcName = src
      ? `${src.label}${departments[src.id]?.cabecera ? ` (${departments[src.id]?.cabecera})` : ''}`
      : edge.source;
    const tgtName = tgt
      ? `${tgt.label}${departments[tgt.id]?.cabecera ? ` (${departments[tgt.id]?.cabecera})` : ''}`
      : edge.target;
    return {
      id: edge.id,
      source: srcName,
      target: tgtName,
      weight: edge.weight,
      road: (typeof edge.meta?.carretera === 'string' ? edge.meta.carretera : '') || '—',
    };
  };

  const totalAccepted = kruskal.edges.length;
  const totalRejected = evalSteps.length - totalAccepted;

  return (
    <div className="flex flex-col gap-3 p-3 text-xs" data-testid="kruskal-tab-container">
      {/* Resumen estadístico de Kruskal */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Aristas evaluadas</div>
          <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{evalSteps.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Aceptadas (árbol)</div>
          <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{totalAccepted}</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 dark:border-rose-900/40 dark:bg-rose-950/30">
          <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300">Rechazadas (ciclo)</div>
          <div className="text-lg font-bold text-rose-800 dark:text-rose-200">{totalRejected}</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
          <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300">Total del árbol</div>
          <div className="text-lg font-extrabold text-blue-800 dark:text-blue-200">{kruskal.total.toFixed(1)} km</div>
        </div>
      </div>

      {/* Tabla ordenada de aristas examinadas */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
        <table className="w-full min-w-[620px] text-left border-collapse" data-testid="table-kruskal-steps">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <th className="py-2 px-2.5 w-10 text-center">#</th>
              <th className="py-2 px-2.5">Arista (Origen ↔ Destino)</th>
              <th className="py-2 px-2.5">Carretera</th>
              <th className="py-2 px-2.5 text-right">km</th>
              <th className="py-2 px-2.5 text-center">Decisión Union-Find</th>
              <th className="py-2 px-2.5 text-right">Total acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
            {evalSteps.map((st) => {
              const edgeId = st.chosenEdge ?? st.rejectedEdge ?? '';
              const details = getEdgeDetails(edgeId);
              const isAccepted = Boolean(st.chosenEdge);

              return (
                <tr
                  key={st.iter}
                  className={`transition-colors ${
                    isAccepted
                      ? 'bg-emerald-50/50 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40'
                      : 'bg-rose-50/30 hover:bg-rose-100/40 dark:bg-rose-950/15 dark:hover:bg-rose-950/30 opacity-75'
                  }`}
                  data-testid={`kruskal-row-${st.iter}`}
                >
                  <td className="py-2 px-2.5 text-center font-bold text-slate-600 dark:text-slate-400">{st.iter}</td>
                  <td className="py-2 px-2.5 font-sans font-medium">
                    <span
                      className={
                        isAccepted
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'line-through text-slate-500 dark:text-slate-400'
                      }
                    >
                      {details.source} ↔ {details.target}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 font-sans text-slate-600 dark:text-slate-400">{details.road}</td>
                  <td className="py-2 px-2.5 text-right font-medium">{details.weight.toFixed(1)} km</td>
                  <td className="py-2 px-2.5 text-center font-sans">
                    {isAccepted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        ✓ Aceptada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                        ✗ Ciclo (rechazada)
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                    {st.totalSoFar.toFixed(1)} km
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
