/**
 * Pestaña principal de cobertura y optimización de red (G4).
 * Permite seleccionar entre tres modos de conexión departamental:
 * (a) «Red mínima que conecta todos los departamentos (Prim / Kruskal)» — predeterminada
 * (b) «Rutas más cortas desde la bodega»
 * (c) «Recorrido de reparto (aproximación heurística)»
 *
 * Lee: `coverMode`, `setCoverMode`, `mst`, `dijkstra`, `setTreeQuery`, `tour`, `runTour`, `cancelTour`,
 * `graph`, `departments` desde `useApp`.
 */
import { useMemo, useState } from 'react';
import type { NodeId } from '../../../core/types';
import type { CoverMode } from '../../../store/types';
import { useApp } from '../../useApp';
import KruskalTab from './KruskalTab';
import PrimTab from './PrimTab';

export default function MstTab() {
  const coverMode = useApp((s) => s.coverMode);
  const setCoverMode = useApp((s) => s.setCoverMode);
  const mst = useApp((s) => s.mst);
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const dijkstra = useApp((s) => s.dijkstra);
  const query = useApp((s) => s.query);
  const setTreeQuery = useApp((s) => s.setTreeQuery);
  const tour = useApp((s) => s.tour);
  const runTour = useApp((s) => s.runTour);
  const cancelTour = useApp((s) => s.cancelTour);

  // Sub-pestaña activa dentro de la Red Mínima (AEM): 'prim' | 'kruskal' | 'aristas'
  const [mstAlgorithmTab, setMstAlgorithmTab] = useState<'prim' | 'kruskal' | 'aristas'>('prim');

  // Estado para la bodega (F2) y para el inicio del recorrido de reparto
  const [selectedBodega, setSelectedBodega] = useState<NodeId>(
    query?.kind === 'tree' ? query.source : (graph.nodes[0]?.id ?? 'GUA'),
  );
  const [selectedTourStart, setSelectedTourStart] = useState<NodeId>(graph.nodes[0]?.id ?? 'GUA');

  const getNodeName = (id: NodeId): string => {
    const d = departments[id];
    const n = graph.nodes.find((node) => node.id === id);
    if (d?.cabecera && n?.label && d.cabecera !== n.label) {
      return `${n.label} (${d.cabecera})`;
    }
    return n?.label ?? id;
  };

  // Distancias desde la bodega ordenadas de menor a mayor
  const bodegaDistances = useMemo(() => {
    if (!dijkstra || query?.kind !== 'tree') return [];
    return graph.nodes
      .filter((n) => n.id !== dijkstra.source)
      .map((n) => {
        const dist = dijkstra.labels[n.id]?.dist ?? Infinity;
        return {
          id: n.id,
          label: n.label,
          cabecera: departments[n.id]?.cabecera ?? n.label,
          dist,
        };
      })
      .sort((a, b) => a.dist - b.dist);
  }, [dijkstra, query, graph.nodes, departments]);

  const primTotal = mst?.prim.total ?? 0;
  const kruskalTotal = mst?.kruskal.total ?? 0;
  const totalsMatch = Math.abs(primTotal - kruskalTotal) < 1e-4;

  return (
    <div className="flex flex-col gap-4 p-4 text-xs" data-testid="mst-tab-container">
      {/* Selector superior de modo de cobertura G4 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <label htmlFor="cover-mode-select" className="block mb-1.5 font-bold text-slate-800 dark:text-slate-200">
          Tipo de cobertura de red (G4):
        </label>
        <select
          id="cover-mode-select"
          data-testid="select-cover-mode"
          value={coverMode}
          onChange={(e) => setCoverMode(e.target.value as CoverMode)}
          aria-label="Tipo de cobertura de red"
          className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="mst">
            (a) Red mínima que conecta todos los departamentos (Prim / Kruskal) — Predeterminada
          </option>
          <option value="spt">(b) Rutas más cortas desde la bodega</option>
          <option value="tour">(c) Recorrido de reparto (aproximación heurística)</option>
        </select>
      </div>

      {/* CASO A: RED MÍNIMA (AEM) CON PRIM Y KRUSKAL */}
      {coverMode === 'mst' && (
        <div className="flex flex-col gap-3">
          {/* Tarjeta de verificación cruzada y total */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div>
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                Árbol de Expansión Mínima (AEM)
              </div>
              <div
                data-testid="mst-total-distance"
                className="text-2xl font-black text-emerald-900 dark:text-emerald-100"
              >
                {primTotal.toFixed(1)} km
              </div>
            </div>

            <div
              data-testid="mst-same-total-notice"
              className="rounded-lg border border-emerald-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-slate-900/80 dark:text-emerald-200"
            >
              {totalsMatch ? (
                <span>
                  ✓ Verificación cruzada: Prim ({primTotal.toFixed(1)} km) y Kruskal ({kruskalTotal.toFixed(1)} km)
                  coinciden exactamente.
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300">
                  ⚠️ Atención: Los totales de Prim y Kruskal difieren.
                </span>
              )}
            </div>
          </div>

          {/* Selector de sub-pestañas: Prim, Kruskal, Lista de aristas */}
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
            <button
              type="button"
              role="tab"
              data-testid="tab-mst-prim"
              aria-selected={mstAlgorithmTab === 'prim'}
              onClick={() => setMstAlgorithmTab('prim')}
              className={`flex-1 min-h-[38px] rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                mstAlgorithmTab === 'prim'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Prim (Paso a paso)
            </button>
            <button
              type="button"
              role="tab"
              data-testid="tab-mst-kruskal"
              aria-selected={mstAlgorithmTab === 'kruskal'}
              onClick={() => setMstAlgorithmTab('kruskal')}
              className={`flex-1 min-h-[38px] rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                mstAlgorithmTab === 'kruskal'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Kruskal (Aristas ordenadas)
            </button>
            <button
              type="button"
              role="tab"
              data-testid="tab-mst-edges"
              aria-selected={mstAlgorithmTab === 'aristas'}
              onClick={() => setMstAlgorithmTab('aristas')}
              className={`flex-1 min-h-[38px] rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                mstAlgorithmTab === 'aristas'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Carreteras del árbol ({mst?.prim.edges.length ?? 0})
            </button>
          </div>

          {/* Contenido de la sub-pestaña activa */}
          {mstAlgorithmTab === 'prim' && <PrimTab />}
          {mstAlgorithmTab === 'kruskal' && <KruskalTab />}
          {mstAlgorithmTab === 'aristas' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
              <table className="w-full text-left border-collapse" data-testid="table-mst-edges">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <th className="py-2 px-3 w-10">#</th>
                    <th className="py-2 px-3">Conexión departamental</th>
                    <th className="py-2 px-3">Carretera</th>
                    <th className="py-2 px-3 text-right">km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
                  {mst?.prim.edges.map((edgeId, i) => {
                    const edge = graph.edges.find((e) => e.id === edgeId);
                    if (!edge) return null;
                    const src = graph.nodes.find((n) => n.id === edge.source);
                    const tgt = graph.nodes.find((n) => n.id === edge.target);
                    return (
                      <tr key={edgeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {src?.label ?? edge.source} ↔ {tgt?.label ?? edge.target}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                          {(typeof edge.meta?.carretera === 'string' ? edge.meta.carretera : '') || '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          {edge.weight.toFixed(1)} km
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CASO B: RUTAS MÁS CORTAS DESDE LA BODEGA (SPT) */}
      {coverMode === 'spt' && (
        <div className="flex flex-col gap-3" data-testid="spt-section">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <label htmlFor="select-spt-bodega" className="font-bold text-blue-950 dark:text-blue-200">
                Bodega central (Origen):
              </label>
              <select
                id="select-spt-bodega"
                data-testid="select-spt-bodega"
                value={selectedBodega}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedBodega(id);
                  setTreeQuery(id);
                }}
                className="min-h-[44px] rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({departments[n.id]?.cabecera || n.label})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              data-testid="btn-apply-spt"
              onClick={() => setTreeQuery(selectedBodega)}
              className="min-h-[44px] rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Calcular árbol de rutas
            </button>
          </div>

          {/* Tabla de distancias a los otros 21 departamentos */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
            <table className="w-full text-left border-collapse" data-testid="table-spt-distances">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <th className="py-2 px-3 w-10">#</th>
                  <th className="py-2 px-3">Departamento destino</th>
                  <th className="py-2 px-3">Cabecera</th>
                  <th className="py-2 px-3 text-right">Distancia más corta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
                {bodegaDistances.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">{item.label}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">{item.cabecera}</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-700 dark:text-blue-300">
                      {item.dist === Infinity ? 'Inalcanzable' : `${item.dist.toFixed(1)} km`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASO C: RECORRIDO DE REPARTO (APROXIMACIÓN HEURÍSTICA) */}
      {coverMode === 'tour' && (
        <div className="flex flex-col gap-3" data-testid="tour-section">
          {/* Aviso informativo de heurística */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <span className="text-base">💡</span>
              <div>
                <p className="font-bold">Aproximación heurística (Problema del Repartidor / TSP)</p>
                <p className="mt-0.5 leading-relaxed text-slate-600 dark:text-slate-300">
                  Visita todos los departamentos alcanzables y regresa al punto de partida. Utiliza el método del
                  <strong> vecino más cercano</strong> seguido de refinamiento local <strong>2-opt</strong> sobre las
                  distancias mínimas de Dijkstra. No garantiza el óptimo global absoluto pero ofrece una ruta eficiente
                  en tiempo polinomial.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de inicio del recorrido */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2">
              <label htmlFor="select-tour-start" className="font-bold text-slate-800 dark:text-slate-200">
                Punto de partida:
              </label>
              <select
                id="select-tour-start"
                data-testid="select-tour-start"
                value={selectedTourStart}
                onChange={(e) => setSelectedTourStart(e.target.value)}
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({departments[n.id]?.cabecera || n.label})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {tour.status === 'running' ? (
                <button
                  type="button"
                  data-testid="btn-cancel-tour"
                  onClick={cancelTour}
                  className="min-h-[44px] rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
                >
                  Cancelar cálculo
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="btn-run-tour"
                  onClick={() => runTour(selectedTourStart)}
                  className="min-h-[44px] rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  🚚 Calcular recorrido de reparto
                </button>
              )}
            </div>
          </div>

          {/* Estado del cálculo */}
          {tour.status === 'running' && (
            <div
              className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500"
              data-testid="tour-running"
            >
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              <span>Optimizando recorrido con vecino más cercano y 2-opt…</span>
            </div>
          )}

          {tour.status === 'error' && (
            <div
              className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              data-testid="tour-error"
            >
              Error al calcular el recorrido: {tour.error}
            </div>
          )}

          {tour.status === 'done' && tour.result && (
            <div
              className="flex flex-col gap-3 rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 dark:border-purple-900/50 dark:bg-purple-950/20"
              data-testid="tour-result-container"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  Recorrido completo calculado ({tour.result.order.length} paradas):
                </span>
                <span data-testid="tour-total-km" className="text-xl font-black text-purple-700 dark:text-purple-300">
                  {tour.result.total.toFixed(1)} km
                </span>
              </div>

              {/* Lista numerada de paradas del recorrido */}
              <div className="overflow-x-auto rounded-lg border border-purple-200 bg-white p-2.5 dark:border-purple-900/60 dark:bg-slate-900">
                <ol className="divide-y divide-slate-100 text-xs dark:divide-slate-800" data-testid="tour-stops-list">
                  {tour.result.order.map((nodeId, idx) => (
                    <li key={`${nodeId}-${idx}`} className="flex items-center justify-between py-1 px-1">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{getNodeName(nodeId)}</span>
                      </span>
                      {idx === 0 && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Salida
                        </span>
                      )}
                      {tour.result && idx === tour.result.order.length - 1 && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Retorno
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
