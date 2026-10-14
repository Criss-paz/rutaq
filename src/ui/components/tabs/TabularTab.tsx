import { useEffect } from 'react';
import type { Label, NodeId } from '../../../core/types';
import { useApp } from '../../useApp';

export default function TabularTab() {
  const tabular = useApp((s) => s.tabular);
  const dijkstra = useApp((s) => s.dijkstra);
  const graph = useApp((s) => s.graph);
  const playback = useApp((s) => s.playback);
  const stepTo = useApp((s) => s.stepTo);
  const nextStep = useApp((s) => s.nextStep);
  const prevStep = useApp((s) => s.prevStep);
  const play = useApp((s) => s.play);
  const pause = useApp((s) => s.pause);
  const toEnd = useApp((s) => s.toEnd);
  const setSpeed = useApp((s) => s.setSpeed);
  const tabularConfig = useApp((s) => s.tabularConfig);
  const setTabularConfig = useApp((s) => s.setTabularConfig);

  // Temporizador para reproducción automática
  useEffect(() => {
    if (!playback.playing) return;
    const maxIndex = (dijkstra?.steps.length ?? 1) - 1;

    if (playback.stepIndex >= maxIndex) {
      pause();
      return;
    }

    const timer = setInterval(() => {
      const current = useApp.getState().playback.stepIndex;
      if (current >= maxIndex) {
        pause();
      } else {
        nextStep();
      }
    }, playback.speedMs);

    return () => clearInterval(timer);
  }, [playback.playing, playback.speedMs, playback.stepIndex, dijkstra?.steps.length, pause, nextStep]);

  if (!tabular || !dijkstra) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <div>
          <p className="text-base font-semibold">Sin consulta activa</p>
          <p className="mt-1">Seleccione un nodo origen en el lienzo para calcular la tabla de iteraciones.</p>
        </div>
      </div>
    );
  }

  const formatLabel = (label: Label): string => {
    if (label.dist === Infinity) return '∞';
    const distStr = String(label.dist);
    if (!label.pred) return distStr;

    switch (tabularConfig.labelFormat) {
      case 'bracket':
        return `[${distStr}, ${label.pred}]`;
      case 'slash':
        return `${distStr}/${label.pred}`;
      case 'paren':
      default:
        return `${distStr} (${label.pred})`;
    }
  };

  const getNodeLabel = (id: NodeId): string => {
    return graph.nodes.find((n) => n.id === id)?.label ?? id;
  };

  // Reconstruir camino para la tabla resumen
  const buildPathString = (target: NodeId): string => {
    if (dijkstra.labels[target]?.dist === Infinity) return 'Inalcanzable';
    const path: string[] = [];
    let curr: NodeId | null = target;
    const visited = new Set<NodeId>();

    while (curr && !visited.has(curr)) {
      visited.add(curr);
      path.unshift(getNodeLabel(curr));
      if (curr === dijkstra.source) break;
      curr = dijkstra.labels[curr]?.pred ?? null;
    }
    return path.join(' → ');
  };

  const totalSteps = dijkstra.steps.length;

  return (
    <div className="flex flex-col gap-4 p-4 text-xs">
      {/* Barra de Configuración de la Tabla (S1) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex flex-wrap items-center gap-3">
          {/* Formato de etiqueta */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-label-format" className="font-medium text-slate-600 dark:text-slate-300">
              Formato:
            </label>
            <select
              id="select-label-format"
              data-testid="select-label-format"
              value={tabularConfig.labelFormat}
              onChange={(e) => setTabularConfig({ labelFormat: e.target.value as 'paren' | 'bracket' | 'slash' })}
              aria-label="Formato de etiqueta de la tabla"
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="paren">12 (B) — Paréntesis</option>
              <option value="bracket">[12, B] — Corchetes</option>
              <option value="slash">12/B — Barra diagonal</option>
            </select>
          </div>

          {/* Tachado */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-crossout" className="font-medium text-slate-600 dark:text-slate-300">
              Tachado:
            </label>
            <select
              id="select-crossout"
              data-testid="select-crossout"
              value={tabularConfig.crossOut}
              onChange={(e) => setTabularConfig({ crossOut: e.target.value as 'column' | 'row' })}
              aria-label="Tipo de tachado"
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="column">Por columna</option>
              <option value="row">Por fila</option>
            </select>
          </div>

          {/* Repetir permanentes */}
          <label className="flex min-h-[44px] cursor-pointer items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              data-testid="toggle-repeat-permanent"
              checked={tabularConfig.repeatPermanent}
              onChange={(e) => setTabularConfig({ repeatPermanent: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Repetir permanentes</span>
          </label>

          {/* Mostrar adyacencia */}
          <label className="flex min-h-[44px] cursor-pointer items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              data-testid="toggle-adjacency"
              checked={tabularConfig.showAdjacency}
              onChange={(e) => setTabularConfig({ showAdjacency: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Matriz de adyacencia</span>
          </label>
        </div>
      </div>

      {/* Controles de Reproducción y Paso a Paso */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="btn-step-prev"
            onClick={prevStep}
            disabled={playback.stepIndex <= 0}
            aria-label="Paso anterior del algoritmo"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Paso anterior"
          >
            ◀
          </button>

          <button
            type="button"
            data-testid="btn-step-play"
            onClick={() => (playback.playing ? pause() : play())}
            aria-label={playback.playing ? 'Pausar reproducción' : 'Reproducir paso a paso'}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
            title={playback.playing ? 'Pausa' : 'Reproducir'}
          >
            {playback.playing ? '⏸' : '▶'}
          </button>

          <button
            type="button"
            data-testid="btn-step-next"
            onClick={nextStep}
            disabled={playback.stepIndex >= totalSteps - 1}
            aria-label="Paso siguiente del algoritmo"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Paso siguiente"
          >
            ▶
          </button>

          <button
            type="button"
            data-testid="btn-step-end"
            onClick={toEnd}
            aria-label="Ir al final de la ejecución"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Ir al final"
          >
            ⏭ Final
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Iteración {playback.stepIndex} de {Math.max(0, totalSteps - 1)}
          </span>

          <div className="flex items-center gap-1.5">
            <label htmlFor="slider-speed" className="text-slate-500 dark:text-slate-400">
              Velocidad:
            </label>
            <input
              id="slider-speed"
              type="range"
              min="200"
              max="2500"
              step="100"
              data-testid="slider-speed"
              value={playback.speedMs}
              onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
              aria-label="Velocidad de reproducción en milisegundos"
              className="h-2 w-24 cursor-pointer accent-blue-600"
            />
            <span className="w-12 text-slate-500 dark:text-slate-400">{(playback.speedMs / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Matriz de Adyacencia Opcional */}
      {tabularConfig.showAdjacency && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Matriz de Adyacencia (Pesos Directos)
          </div>
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <th className="p-2 font-bold text-slate-600 dark:text-slate-300">Nodo</th>
                {tabular.order.map((id) => (
                  <th key={id} className="p-2 font-bold text-slate-700 dark:text-slate-200">
                    {id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabular.order.map((rowId, i) => (
                <tr
                  key={rowId}
                  className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <td className="p-2 font-bold text-slate-700 dark:text-slate-200">{rowId}</td>
                  {tabular.order.map((colId, j) => {
                    const weight = tabular.adjacency[i]?.[j];
                    return (
                      <td key={colId} className="p-2 text-slate-600 dark:text-slate-300">
                        {i === j ? '0' : weight !== null && weight !== undefined ? `${weight}` : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla de Iteraciones (Método Tabular) */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <span>Tabla de Iteraciones — Dijkstra Paso a Paso</span>
          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
            Origen: {getNodeLabel(dijkstra.source)}
          </span>
        </div>
        <table className="w-full border-collapse text-center" data-testid="tabular-iterations-table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="p-2.5 font-bold text-slate-700 dark:text-slate-200">Iter.</th>
              <th className="p-2.5 font-bold text-slate-700 dark:text-slate-200">Nodo Permanente</th>
              {tabular.order.map((id) => (
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
            {tabular.rows.map((row) => {
              const isSelectedRow = row.iter === playback.stepIndex;

              return (
                <tr
                  key={row.iter}
                  onClick={() => stepTo(row.iter)}
                  className={`cursor-pointer border-b border-slate-100 transition-colors dark:border-slate-800 ${
                    isSelectedRow
                      ? 'bg-blue-50/80 font-semibold ring-1 ring-blue-500 dark:bg-blue-950/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  data-testid={`tabular-row-${row.iter}`}
                >
                  <td className="p-2.5 font-bold text-slate-600 dark:text-slate-400">{row.iter}</td>
                  <td className="p-2.5 font-semibold text-blue-600 dark:text-blue-400">
                    {row.current ? getNodeLabel(row.current) : '(Inicial)'}
                  </td>
                  {tabular.order.map((nodeId) => {
                    const cell = row.cells[nodeId] ?? {
                      label: { dist: Infinity, pred: null },
                      state: 'unreached',
                    };

                    let cellStyle = 'text-slate-700 dark:text-slate-300';
                    let badge = '';

                    if (cell.state === 'min') {
                      cellStyle =
                        'bg-amber-100 text-amber-950 font-bold border border-amber-300 dark:bg-amber-950/80 dark:text-amber-100 dark:border-amber-600';
                      badge = '⭐ Mínimo';
                    } else if (cell.state === 'updated') {
                      cellStyle =
                        'bg-emerald-100 text-emerald-950 font-semibold border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-600';
                      badge = 'Mejora';
                    } else if (cell.state === 'crossed') {
                      if (!tabularConfig.repeatPermanent) {
                        cellStyle = 'opacity-30 line-through text-slate-400 dark:text-slate-600';
                      } else {
                        cellStyle = 'line-through text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/40';
                      }
                    } else if (cell.state === 'unreached') {
                      cellStyle = 'text-slate-400 dark:text-slate-600 font-mono';
                    }

                    return (
                      <td key={nodeId} className={`p-2 transition-colors ${cellStyle}`}>
                        <div className="flex flex-col items-center justify-center">
                          <span>{formatLabel(cell.label)}</span>
                          {badge && isSelectedRow && (
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{badge}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tabla Resumen Final */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Resumen de Distancias Mínimas desde {getNodeLabel(dijkstra.source)}
        </div>
        <table className="w-full border-collapse text-left" data-testid="tabular-summary-table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <th className="p-2.5 font-bold text-slate-700 dark:text-slate-200">Nodo</th>
              <th className="p-2.5 font-bold text-slate-700 dark:text-slate-200">Distancia Mínima</th>
              <th className="p-2.5 font-bold text-slate-700 dark:text-slate-200">Ruta Completa</th>
            </tr>
          </thead>
          <tbody>
            {tabular.order.map((id) => {
              const label = dijkstra.labels[id];
              const dist = label?.dist;
              const isSource = id === dijkstra.source;

              return (
                <tr
                  key={id}
                  className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-100">
                    {getNodeLabel(id)} ({id})
                  </td>
                  <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {dist === Infinity ? 'Inalcanzable' : `${dist} km`}
                    {isSource && ' (Origen)'}
                  </td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-300">{buildPathString(id)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
