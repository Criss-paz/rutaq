/**
 * Modo Presentación a pantalla completa para el módulo Guatemala (G5).
 * Oculta los paneles secundarios (barra superior estándar, panel de pestañas),
 * maximiza el mapa a pantalla completa y muestra una tarjeta flotante de alta legibilidad
 * con el resultado activo (ruta óptima o red mínima) en tipografía grande (1280×720 y 1920×1080).
 * Permite cambiar entre los ejemplos rápidos y salir presionando la tecla Escape o el botón de salida.
 *
 * Lee: `mode`, `query`, `shortest`, `breakdown`, `mst`, `coverMode`, `setPathQuery`, `setCoverMode`, `clearQuery` desde `useApp`.
 */
import { useEffect } from 'react';
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';

interface GuatemalaPresentationProps {
  isOpen: boolean;
  onExit: () => void;
}

export default function GuatemalaPresentation({ isOpen, onExit }: GuatemalaPresentationProps) {
  const query = useApp((s) => s.query);
  const shortest = useApp((s) => s.shortest);
  const breakdown = useApp((s) => s.breakdown);
  const mst = useApp((s) => s.mst);
  const coverMode = useApp((s) => s.coverMode);
  const graph = useApp((s) => s.graph);
  const setPathQuery = useApp((s) => s.setPathQuery);
  const setCoverMode = useApp((s) => s.setCoverMode);
  const clearQuery = useApp((s) => s.clearQuery);

  // Escuchar tecla Escape para salir de presentación
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onExit]);

  if (!isOpen) return null;

  const getNodeLabel = (id: NodeId): string => {
    return graph.nodes.find((n) => n.id === id)?.label ?? id;
  };

  const currentBreakdown = breakdown?.[0];
  const isPathActive = query?.kind === 'path' && query.target && shortest && shortest.length > 0;
  const isMstActive = coverMode === 'mst' || !isPathActive;

  return (
    <div
      data-testid="guatemala-presentation-overlay"
      className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none"
    >
      {/* Barra superior flotante de la presentación */}
      <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-5 py-3 shadow-2xl backdrop-blur-md text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-lg text-white shadow-md">
            TE
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">Transporte Express — Guatemala</h1>
            <p className="text-xs text-slate-400">Modo Presentación · Red Vial Nacional de 22 Departamentos</p>
          </div>
        </div>

        {/* Ejemplos rápidos en presentación */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Ejemplos rápidos">
          <button
            type="button"
            data-testid="btn-pres-que-iza"
            onClick={() => setPathQuery('QUE', 'IZA')}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              query?.kind === 'path' && query.source === 'QUE' && query.target === 'IZA'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            QUE → IZA
          </button>
          <button
            type="button"
            data-testid="btn-pres-gua-pet"
            onClick={() => setPathQuery('GUA', 'PET')}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              query?.kind === 'path' && query.source === 'GUA' && query.target === 'PET'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            GUA → PET
          </button>
          <button
            type="button"
            data-testid="btn-pres-sma-jut"
            onClick={() => setPathQuery('SMA', 'JUT')}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              query?.kind === 'path' && query.source === 'SMA' && query.target === 'JUT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            SMA → JUT
          </button>
          <button
            type="button"
            data-testid="btn-pres-mst"
            onClick={() => {
              setCoverMode('mst');
              clearQuery();
            }}
            className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              coverMode === 'mst' && !query
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            🌳 Red Mínima
          </button>
        </div>

        {/* Botón salir de presentación */}
        <button
          type="button"
          data-testid="btn-exit-presentation"
          onClick={onExit}
          className="min-h-[44px] rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          ✕ Salir (Esc)
        </button>
      </header>

      {/* Tarjeta flotante inferior de resultados en gran tamaño */}
      <div className="pointer-events-auto max-w-xl self-start rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md text-white">
        {isPathActive && currentBreakdown ? (
          <div className="space-y-3" data-testid="pres-route-card">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Mejor ruta calculada (Dijkstra)
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentBreakdown.legs.length} tramos</span>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div className="text-2xl sm:text-3xl font-black text-white">
                {getNodeLabel(currentBreakdown.nodes[0]!)} →{' '}
                {getNodeLabel(currentBreakdown.nodes[currentBreakdown.nodes.length - 1]!)}
              </div>
              <div
                data-testid="pres-total-distance"
                className="text-3xl sm:text-4xl font-black text-blue-400 font-mono"
              >
                {currentBreakdown.total.toFixed(1)} km
              </div>
            </div>

            <div className="text-sm font-mono text-slate-300 bg-slate-800/80 rounded-lg p-2.5 break-all">
              {currentBreakdown.formula}
            </div>

            {/* Secuencia resumida de departamentos */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-200 pt-1">
              {currentBreakdown.nodes.map((nodeId, i) => (
                <span key={`${nodeId}-${i}`} className="inline-flex items-center gap-1.5">
                  <span className="rounded-md bg-slate-800 px-2 py-1 border border-slate-700">
                    {getNodeLabel(nodeId)}
                  </span>
                  {i < currentBreakdown.nodes.length - 1 && <span className="text-slate-500">→</span>}
                </span>
              ))}
            </div>
          </div>
        ) : isMstActive && mst ? (
          <div className="space-y-3" data-testid="pres-mst-card">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Red Mínima Departamental (Prim / Kruskal)
              </span>
              <span className="text-xs text-emerald-300 font-mono">
                {mst ? `${mst.prim.edges.length} carreteras` : '21 carreteras'}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div className="text-xl sm:text-2xl font-black text-white">Conexión completa de los 22 departamentos</div>
              <div data-testid="pres-mst-total" className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                {mst.prim.total.toFixed(1)} km
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ✓ Algoritmos de Prim y Kruskal verificados: ambos conectan todos los departamentos con un coste total
              idéntico de <strong>{mst.prim.total.toFixed(1)} km</strong> y {mst.prim.edges.length} carreteras sin
              formar ciclos.
            </p>
          </div>
        ) : (
          <div className="text-sm text-slate-300">
            Selecciona un ejemplo rápido arriba para proyectar los resultados.
          </div>
        )}
      </div>
    </div>
  );
}
