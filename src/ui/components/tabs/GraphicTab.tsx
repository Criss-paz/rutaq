import { useApp } from '../../useApp';

export default function GraphicTab() {
  const query = useApp((s) => s.query);
  const shortest = useApp((s) => s.shortest);
  const highlightedPath = useApp((s) => s.highlightedPath);
  const highlightPath = useApp((s) => s.highlightPath);
  const graph = useApp((s) => s.graph);
  const scale = useApp((s) => s.scale);
  const layoutSuggestion = useApp((s) => s.layoutSuggestion);
  const applySuggestedLayout = useApp((s) => s.applySuggestedLayout);
  const keepProportion = useApp((s) => s.keepProportion);
  const setKeepProportion = useApp((s) => s.setKeepProportion);

  const unit = graph.unit || 'km';

  const getNodeLabel = (id: string): string => {
    return graph.nodes.find((n) => n.id === id)?.label ?? id;
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-xs">
      {/* Resumen de la Solución Gráfica (S2) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Solución Gráfica Sincronizada con el Lienzo
        </h3>

        {query?.kind === 'path' ? (
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Ruta consultada:</span>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                Origen: {getNodeLabel(query.source)}
              </span>
              <span>→</span>
              <span className="rounded-md bg-rose-100 px-2 py-0.5 font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                Destino: {query.target ? getNodeLabel(query.target) : '(No seleccionado)'}
              </span>
            </div>

            {shortest && shortest.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2.5">
                {shortest.length > 1 && (
                  <div
                    data-testid="ties-alert"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200"
                  >
                    <span>
                      ℹ Empate detectado: existen {shortest.length} rutas mínimas con la misma distancia (
                      {shortest[0]?.distance} {unit}). Se muestran todas:
                    </span>
                    {highlightedPath?.from === 'shortest' && (
                      <button
                        type="button"
                        data-testid="btn-show-all-tied"
                        onClick={() => highlightPath(null)}
                        className="min-h-[44px] rounded-md bg-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-950 hover:bg-amber-300 dark:bg-amber-900 dark:text-amber-100"
                      >
                        Ver todas en lienzo
                      </button>
                    )}
                  </div>
                )}

                {shortest.map((path, idx) => {
                  const isSelected = highlightedPath?.from === 'shortest' && highlightedPath.index === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      data-testid={`shortest-path-${idx}`}
                      onClick={() => {
                        if (isSelected) {
                          highlightPath(null);
                        } else {
                          highlightPath({ from: 'shortest', index: idx });
                        }
                      }}
                      className={`flex min-h-[44px] w-full flex-col gap-1.5 rounded-lg border p-3 text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-hidden ${
                        isSelected
                          ? 'border-purple-600 bg-purple-100 ring-2 ring-purple-500 text-purple-950 dark:bg-purple-900/60 dark:text-purple-100 dark:border-purple-400'
                          : 'border-purple-200 bg-purple-50/80 text-purple-950 hover:bg-purple-100/70 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-100 dark:hover:bg-purple-900/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {shortest.length > 1 && (
                            <span className="rounded-md bg-purple-600 px-2 py-0.5 text-xs font-bold text-white">
                              Ruta {idx + 1}
                            </span>
                          )}
                          <span className="text-base font-bold">
                            Distancia Total: {path.distance} {unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                            {path.nodes.length - 1} tramos
                          </span>
                          {shortest.length > 1 && (
                            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {idx === 0 ? '━ Trazo sólido' : '┅ Trazo discontinuo'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs font-medium">
                        Secuencia:{' '}
                        <span className="font-semibold">{path.nodes.map((n) => getNodeLabel(n)).join(' → ')}</span>
                      </div>
                      {isSelected && (
                        <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
                          ✓ Ruta resaltada en el mapa (clic para deseleccionar)
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : query.target ? (
              <div className="mt-2 rounded-lg bg-rose-50 p-3 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                No existe ruta entre {getNodeLabel(query.source)} y {getNodeLabel(query.target)}.
              </div>
            ) : null}
          </div>
        ) : query?.kind === 'tree' ? (
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Árbol de Caminos Más Cortos desde:
              </span>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                {getNodeLabel(query.source)}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Todas las carreteras que forman parte del árbol de Dijkstra están resaltadas en azul en el lienzo. Las
              distancias mínimas calculadas se muestran en las etiquetas de cada nodo.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Haga clic en un nodo del lienzo o utilice los botones superiores para seleccionar una consulta.
          </p>
        )}
      </div>

      {/* Leyenda de Colores */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <h4 className="font-bold text-slate-700 dark:text-slate-200">Leyenda Visual del Grafo</h4>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-950" />
            <span className="text-slate-600 dark:text-slate-300">Nodo Origen (A)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-rose-500 bg-rose-100 dark:bg-rose-950" />
            <span className="text-slate-600 dark:text-slate-300">Nodo Destino (B)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-amber-500 bg-amber-100 animate-pulse dark:bg-amber-950" />
            <span className="text-slate-600 dark:text-slate-300">Nodo Actual (Paso)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-950" />
            <span className="text-slate-600 dark:text-slate-300">Nodo Permanente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-purple-500 bg-purple-100 dark:bg-purple-950" />
            <span className="text-slate-600 dark:text-slate-300">Nodo en Ruta Mínima</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1 w-6 bg-purple-600" />
            <span className="text-slate-600 dark:text-slate-300">Carretera en Ruta</span>
          </div>
        </div>
      </div>

      {/* Escala y Distribución Geométrica (F6) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-200">Escala y Distribución Geométrica (F6)</h4>
            <p className="text-slate-500 dark:text-slate-400">
              Detección de orden de magnitud y ajuste 2D mediante stress majorization.
            </p>
          </div>
          <button
            type="button"
            data-testid="btn-apply-layout"
            onClick={applySuggestedLayout}
            aria-label="Aplicar distribución sugerida"
            className="min-h-[44px] rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Aplicar distribución sugerida
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Magnitud Detectada</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{scale.range}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Píxeles por Unidad</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">
              ~{Math.round(scale.pxPerUnit)} px / {unit}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Error de Ajuste (Stress)</div>
            <div className="font-bold text-slate-800 dark:text-slate-100">{layoutSuggestion?.stressError ?? 0}%</div>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500 italic dark:text-slate-400">
          Nota: No todos los pesos de carreteras son exactamente representables en un plano bidimensional euclidiano
          debido a la topología y curvatura de la red.
        </p>

        <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-2 text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={keepProportion}
            onChange={(e) => setKeepProportion(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Mantener proporción entre distancias al mover nodos</span>
        </label>
      </div>
    </div>
  );
}
