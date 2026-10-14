import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useApp } from '../../useApp';

export default function AllPathsTab() {
  const allPaths = useApp((s) => s.allPaths);
  const query = useApp((s) => s.query);
  const graph = useApp((s) => s.graph);
  const allPathsLimit = useApp((s) => s.allPathsLimit);
  const setAllPathsLimit = useApp((s) => s.setAllPathsLimit);
  const runAllPaths = useApp((s) => s.runAllPaths);
  const cancelAllPaths = useApp((s) => s.cancelAllPaths);
  const highlightedPath = useApp((s) => s.highlightedPath);
  const highlightPath = useApp((s) => s.highlightPath);

  const parentRef = useRef<HTMLDivElement>(null);

  const paths = allPaths.result?.paths ?? [];
  const minDistance = paths[0]?.distance ?? 0;

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: paths.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 8,
  });

  const getNodeLabel = (id: string): string => {
    return graph.nodes.find((n) => n.id === id)?.label ?? id;
  };

  const handleExportCsv = () => {
    if (paths.length === 0) return;
    const headers = ['#', 'Origen', 'Destino', 'Secuencia_Nodos', 'Tramos', 'Distancia_km', 'Diferencia_km'];
    const rows = paths.map((p, idx) => {
      const orig = p.nodes[0] ? getNodeLabel(p.nodes[0]) : '';
      const dest = p.nodes[p.nodes.length - 1] ? getNodeLabel(p.nodes[p.nodes.length - 1]!) : '';
      const seq = p.nodes.map((n) => getNodeLabel(n)).join(' -> ');
      const diff = Math.max(0, p.distance - minDistance).toFixed(1);
      return [idx + 1, `"${orig}"`, `"${dest}"`, `"${seq}"`, p.nodes.length - 1, p.distance, diff];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rutas_${query?.source}_a_${query?.kind === 'path' ? query.target : 'todos'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!query || query.kind !== 'path' || !query.target) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <div>
          <p className="text-base font-semibold">Consulta F3 requerida</p>
          <p className="mt-1">
            Seleccione tanto un nodo origen como un nodo destino en el lienzo para enumerar todos los caminos simples.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      {/* Barra de Controles y Progreso */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de límite */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-paths-limit" className="font-medium text-slate-600 dark:text-slate-300">
              Límite:
            </label>
            <select
              id="select-paths-limit"
              data-testid="select-paths-limit"
              value={allPathsLimit}
              onChange={(e) => setAllPathsLimit(parseInt(e.target.value, 10))}
              aria-label="Límite máximo de rutas a calcular"
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="100">100 rutas</option>
              <option value="500">500 rutas</option>
              <option value="1000">1 000 rutas</option>
              <option value="5000">5 000 rutas</option>
            </select>
          </div>

          {/* Botones de acción */}
          <button
            type="button"
            data-testid="btn-run-all-paths"
            onClick={runAllPaths}
            disabled={allPaths.status === 'running'}
            aria-label="Ejecutar búsqueda de todos los caminos simples"
            className="min-h-[44px] rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {allPaths.status === 'running' ? 'Buscando...' : 'Re-ejecutar'}
          </button>

          {allPaths.status === 'running' && (
            <button
              type="button"
              data-testid="btn-cancel-all-paths"
              onClick={cancelAllPaths}
              aria-label="Cancelar búsqueda en ejecución"
              className="min-h-[44px] rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 font-bold text-rose-700 shadow-xs hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            data-testid="btn-export-csv"
            onClick={handleExportCsv}
            disabled={paths.length === 0}
            aria-label="Exportar resultados a archivo CSV"
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            📊 Exportar CSV
          </button>
        </div>

        {/* Indicador de Estado y Conteo */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {allPaths.status === 'running'
              ? `Explorando... (${allPaths.found} encontradas)`
              : allPaths.status === 'cancelled'
                ? `Búsqueda cancelada (${paths.length} cargadas)`
                : `${paths.length} rutas encontradas`}
          </span>
          {allPaths.result && !allPaths.result.complete && (
            <span
              className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200"
              title="Se excedió el límite configurado; mostrando las K rutas más cortas calculadas con el algoritmo de Yen."
            >
              Límite alcanzado (Yen)
            </span>
          )}
        </div>
      </div>

      {/* Lista Virtualizada con TanStack Virtual */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
        {/* Cabecera fija de la tabla */}
        <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6">Secuencia de Nodos</div>
          <div className="col-span-1 text-center">Tramos</div>
          <div className="col-span-2 text-right">Distancia</div>
          <div className="col-span-2 text-right">Diferencia</div>
        </div>

        {/* Contenedor con scroll para virtualización */}
        <div ref={parentRef} data-testid="all-paths-virtual-list" className="h-[360px] overflow-auto">
          {paths.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-slate-500">
              No se encontraron caminos simples entre estos dos nodos.
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const path = paths[virtualRow.index];
                if (!path) return null;
                const isShortest = Math.abs(path.distance - minDistance) < 1e-6;
                const diff = (path.distance - minDistance).toFixed(1);
                const isHighlighted = highlightedPath?.from === 'all' && highlightedPath.index === virtualRow.index;

                return (
                  <div
                    key={virtualRow.index}
                    data-testid={`path-row-${virtualRow.index}`}
                    onClick={() => highlightPath({ from: 'all', index: virtualRow.index })}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`grid cursor-pointer grid-cols-12 items-center border-b border-slate-100 px-3 transition-colors dark:border-slate-800 ${
                      isHighlighted
                        ? 'bg-purple-100/90 font-semibold text-purple-950 dark:bg-purple-950/70 dark:text-purple-100'
                        : isShortest
                          ? 'bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="col-span-1 flex items-center justify-center font-bold text-slate-500">
                      {virtualRow.index + 1}
                      {isShortest && <span className="ml-1 text-amber-500">⭐</span>}
                    </div>

                    <div className="col-span-6 truncate font-medium text-slate-800 dark:text-slate-100">
                      {path.nodes.map((n) => getNodeLabel(n)).join(' → ')}
                    </div>

                    <div className="col-span-1 text-center font-mono text-slate-600 dark:text-slate-400">
                      {path.nodes.length - 1}
                    </div>

                    <div className="col-span-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {path.distance} km
                    </div>

                    <div className="col-span-2 text-right font-mono text-slate-600 dark:text-slate-400">
                      {isShortest ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">+0.0 km</span>
                      ) : (
                        `+${diff} km`
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
