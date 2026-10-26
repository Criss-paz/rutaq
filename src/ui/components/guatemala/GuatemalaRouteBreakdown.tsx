/**
 * Desglose de la mejor ruta para Transporte Express (G3).
 * Muestra:
 *   - Listado de departamentos en orden (A → B → … → Destino)
 *   - Total en grande (km)
 *   - Fórmula de distancias de los tramos (ej. 28.4 + 18.2 = 46.6 km)
 *   - Tabla de tramos (# | Desde | Hasta | Carretera | km del tramo | km acumulado)
 *   - Gestión de empates (todas las rutas mínimas empatadas seleccionables)
 *   - Mensaje claro si los departamentos no están conectados.
 *
 * Lee: `query`, `shortest`, `breakdown`, `highlightedPath`, `highlightPath`, `graph`, `departments` desde `useApp`.
 */
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';

interface GuatemalaRouteBreakdownProps {
  onOpenAssistant?: () => void;
}

export default function GuatemalaRouteBreakdown({ onOpenAssistant }: GuatemalaRouteBreakdownProps) {
  const query = useApp((s) => s.query);
  const shortest = useApp((s) => s.shortest);
  const breakdown = useApp((s) => s.breakdown);
  const highlightedPath = useApp((s) => s.highlightedPath);
  const highlightPath = useApp((s) => s.highlightPath);
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const clearQuery = useApp((s) => s.clearQuery);

  const getNodeName = (id: NodeId): string => {
    const d = departments[id];
    const n = graph.nodes.find((node) => node.id === id);
    if (d?.cabecera && n?.label && d.cabecera !== n.label) {
      return `${n.label} (${d.cabecera})`;
    }
    return n?.label ?? id;
  };

  const getDeptShortName = (id: NodeId): string => {
    return graph.nodes.find((n) => n.id === id)?.label ?? id;
  };

  // Sin consulta o consulta incompleta
  if (!query || query.kind !== 'path' || !query.target) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center gap-3 text-xs"
        data-testid="route-empty-state"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          🚚
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Asistente de Rutas «Transporte Express»
          </h2>
          <p className="mt-1 text-slate-500 max-w-sm leading-relaxed dark:text-slate-400">
            Seleccione el departamento de origen y destino para calcular la ruta más corta y ver su desglose en tramos.
          </p>
        </div>
        {onOpenAssistant && (
          <button
            type="button"
            data-testid="btn-open-assistant-breakdown"
            onClick={onOpenAssistant}
            className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            📦 Calcular mejor ruta
          </button>
        )}
      </div>
    );
  }

  // Grafo desconectado para este par
  if (shortest && shortest.length === 0) {
    return (
      <div className="p-4 text-xs" data-testid="no-route-alert">
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-xs dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1">
              <h2 className="font-bold text-sm">Sin conexión por carretera</h2>
              <p className="leading-relaxed">
                No existe conexión vial entre <strong>{getNodeName(query.source)}</strong> y{' '}
                <strong>{getNodeName(query.target)}</strong>. La red vial se encuentra desconectada para este par de
                destinos.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  data-testid="btn-clear-disconnected-query"
                  onClick={clearQuery}
                  className="min-h-[38px] rounded-lg border border-rose-300 bg-white px-3 py-1 font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
                >
                  Limpiar consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ruta(s) encontrada(s)
  const activeIndex = highlightedPath?.from === 'shortest' ? highlightedPath.index : 0;
  const currentBreakdown = breakdown?.[activeIndex] ?? breakdown?.[0];

  if (!currentBreakdown) {
    return null;
  }

  const isTied = (shortest?.length ?? 0) > 1;

  return (
    <div className="flex flex-col gap-4 p-4 text-xs" data-testid="route-breakdown-container">
      {/* Banner de empates si hay múltiples rutas mínimas con la misma distancia */}
      {isTied && shortest && (
        <div
          className="rounded-xl border border-purple-200 bg-purple-50/80 p-3 shadow-xs dark:border-purple-900/50 dark:bg-purple-950/30"
          data-testid="ties-banner"
        >
          <div className="font-bold text-purple-900 dark:text-purple-200 mb-2">
            ⭐ Se encontraron {shortest.length} rutas mínimas empatadas ({shortest[0]?.distance.toFixed(1)} km):
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Rutas empatadas">
            {shortest.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                data-testid={`btn-tie-route-${idx}`}
                aria-selected={activeIndex === idx}
                onClick={() => highlightPath({ from: 'shortest', index: idx })}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeIndex === idx
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'border border-purple-200 bg-white text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-300'
                }`}
              >
                Ruta {idx + 1} {activeIndex === idx ? '(activa)' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resumen principal: Total grande y Fórmula */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              Distancia total óptima
            </div>
            <div data-testid="route-total-distance" className="text-3xl font-black text-blue-800 dark:text-blue-200">
              {currentBreakdown.total.toFixed(1)} km
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Tramos: {currentBreakdown.legs.length} · Paradas: {currentBreakdown.nodes.length}
            </span>
          </div>
        </div>

        {/* Fórmula matemática de la suma de tramos */}
        <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 dark:border-blue-900/40">
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fórmula:</div>
          <div
            data-testid="route-formula"
            className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 break-all"
          >
            {currentBreakdown.formula}
          </div>
        </div>
      </div>

      {/* Listado de nodos en orden */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mb-2 font-bold text-slate-700 dark:text-slate-300">Secuencia de departamentos en la ruta:</div>
        <div data-testid="route-nodes-sequence" className="flex flex-wrap items-center gap-1.5 leading-relaxed">
          {currentBreakdown.nodes.map((nodeId, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === currentBreakdown.nodes.length - 1;
            return (
              <span key={`${nodeId}-${idx}`} className="inline-flex items-center gap-1.5">
                <span
                  data-testid={`route-node-pill-${nodeId}`}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold shadow-2xs ${
                    isFirst
                      ? 'bg-emerald-600 text-white'
                      : isLast
                        ? 'bg-rose-600 text-white'
                        : 'bg-white text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-80">{nodeId}</span>
                  <span>{getDeptShortName(nodeId)}</span>
                  {departments[nodeId]?.cabecera && (
                    <span className="text-[10px] opacity-80 font-normal">({departments[nodeId].cabecera})</span>
                  )}
                </span>
                {!isLast && <span className="font-bold text-slate-400">→</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Tabla detallada de tramos */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
        <table className="w-full min-w-[560px] text-left border-collapse" data-testid="table-route-legs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Desde</th>
              <th className="py-2.5 px-3">Hasta</th>
              <th className="py-2.5 px-3">Carretera</th>
              <th className="py-2.5 px-3 text-right">km del tramo</th>
              <th className="py-2.5 px-3 text-right">km acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
            {currentBreakdown.legs.map((leg, idx) => (
              <tr
                key={`${leg.edgeId}-${idx}`}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                data-testid={`leg-row-${idx}`}
              >
                <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                  {getNodeName(leg.from)}
                </td>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                  {getNodeName(leg.to)}
                </td>
                <td className="py-2.5 px-3 font-sans">
                  {leg.road ? (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {leg.road}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Red local</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                  {leg.km.toFixed(1)} km
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-blue-700 dark:text-blue-300">
                  {leg.cumulative.toFixed(1)} km
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botones de acción inferior */}
      <div className="flex items-center justify-between pt-1">
        {onOpenAssistant && (
          <button
            type="button"
            data-testid="btn-recalculate-route"
            onClick={onOpenAssistant}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            🔄 Nueva consulta de ruta
          </button>
        )}
        <button
          type="button"
          data-testid="btn-clear-route-query"
          onClick={clearQuery}
          className="min-h-[44px] rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ✕ Limpiar ruta
        </button>
      </div>
    </div>
  );
}
