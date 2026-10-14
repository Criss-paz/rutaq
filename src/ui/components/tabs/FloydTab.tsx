import { useState } from 'react';
import { useApp } from '../../useApp';

export default function FloydTab() {
  const floyd = useApp((s) => s.floyd);
  const graph = useApp((s) => s.graph);

  const [k, setK] = useState<number>(() => (floyd?.matrices.length ? floyd.matrices.length - 1 : 0));

  if (!floyd || floyd.matrices.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <div>
          <p className="text-base font-semibold">Sin datos de Floyd-Warshall</p>
          <p className="mt-1">El grafo debe contener nodos para calcular las matrices de Floyd-Warshall.</p>
        </div>
      </div>
    );
  }

  const n = floyd.order.length;
  const maxK = floyd.matrices.length - 1;
  const currentK = Math.min(k, maxK);

  const currentMatrix = floyd.matrices[currentK] ?? [];
  const prevMatrix = currentK > 0 ? floyd.matrices[currentK - 1] : null;

  const getNodeLabel = (id: string): string => {
    return graph.nodes.find((node) => node.id === id)?.label ?? id;
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-xs">
      {/* Controles del Selector de k */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="floyd-k-prev"
            onClick={() => setK(Math.max(0, currentK - 1))}
            disabled={currentK <= 0}
            aria-label="Matriz anterior k-1"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ◀ Anterior
          </button>

          <div className="flex items-center gap-1.5">
            <label htmlFor="floyd-k-selector" className="font-semibold text-slate-700 dark:text-slate-200">
              Paso k:
            </label>
            <select
              id="floyd-k-selector"
              data-testid="floyd-k-selector"
              value={currentK}
              onChange={(e) => setK(parseInt(e.target.value, 10))}
              aria-label="Seleccionar matriz D(k) de Floyd-Warshall"
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1 font-bold text-blue-600 shadow-xs dark:border-slate-600 dark:bg-slate-800 dark:text-blue-400"
            >
              <option value="0">D⁽⁰⁾ — Pesos Directos Iniciales</option>
              {Array.from({ length: n }, (_, i) => {
                const intermediate = floyd.order[i] ?? `v${i + 1}`;
                return (
                  <option key={i + 1} value={i + 1}>
                    D⁽{i + 1}⁾ — Vía {getNodeLabel(intermediate)} ({intermediate})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            data-testid="floyd-k-next"
            onClick={() => setK(Math.min(maxK, currentK + 1))}
            disabled={currentK >= maxK}
            aria-label="Matriz siguiente k+1"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Siguiente ▶
          </button>
        </div>

        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {currentK === 0 ? (
            <span>Matriz inicial de distancias directas</span>
          ) : (
            <span>
              Intermedios evaluados: 1 a {currentK} (hasta {getNodeLabel(floyd.order[currentK - 1] ?? '')})
            </span>
          )}
        </div>
      </div>

      {/* Matriz D(k) */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <span>Matriz de Distancias D⁽{currentK}⁾</span>
          <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
            {currentK > 0 && '■ Celdas resaltadas indican mejora respecto a D⁽ᵏ⁻¹⁾'}
          </span>
        </div>

        <table className="w-full border-collapse text-center" data-testid="floyd-matrix-table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="p-2.5 font-bold text-slate-600 dark:text-slate-300">Origen \ Destino</th>
              {floyd.order.map((id) => (
                <th key={id} className="p-2.5 font-bold text-slate-700 dark:text-slate-200">
                  <div>{id}</div>
                  <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                    {getNodeLabel(id)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {floyd.order.map((rowId, i) => (
              <tr
                key={rowId}
                className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
              >
                <td className="p-2.5 font-bold text-slate-700 dark:text-slate-200">
                  <div>{rowId}</div>
                  <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                    {getNodeLabel(rowId)}
                  </div>
                </td>

                {floyd.order.map((colId, j) => {
                  const currVal = currentMatrix[i]?.[j] ?? Infinity;
                  const prevVal = prevMatrix ? (prevMatrix[i]?.[j] ?? Infinity) : currVal;
                  const improved = currentK > 0 && currVal < prevVal;

                  let cellClass = 'p-2.5 text-slate-700 dark:text-slate-300';
                  if (i === j) {
                    cellClass += ' font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40';
                  } else if (improved) {
                    cellClass +=
                      ' font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-600';
                  } else if (currVal === Infinity) {
                    cellClass += ' text-slate-400 dark:text-slate-600 font-mono';
                  }

                  return (
                    <td
                      key={colId}
                      className={cellClass}
                      title={improved ? `Mejora: ${prevVal} → ${currVal}` : undefined}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span>{currVal === Infinity ? '∞' : `${currVal}`}</span>
                        {improved && (
                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                            ↓ {prevVal}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
