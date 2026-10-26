/**
 * Pestaña de solución tabulada paso a paso del Algoritmo de Prim (AEM).
 * Muestra el proceso de corte iterativo: la arista mínima que cruza el corte hacia un nodo no visitado,
 * el nuevo nodo incorporado, las columnas tachadas y el total acumulado en kilómetros.
 *
 * Lee: `mst.prim`, `graph`, `departments`, `mstStart`, `setMstStart` desde `useApp`.
 */
import { useEffect, useState } from 'react';
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';

export default function PrimTab() {
  const mst = useApp((s) => s.mst);
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const mstStart = useApp((s) => s.mstStart);
  const setMstStart = useApp((s) => s.setMstStart);

  const prim = mst?.prim;
  const steps = prim?.steps ?? [];
  const totalSteps = steps.length;
  const lastStepIndex = Math.max(0, totalSteps - 1);

  const [stepOverride, setStepOverride] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs] = useState<number>(800);

  const currentStepIndex = stepOverride !== null ? Math.min(stepOverride, lastStepIndex) : lastStepIndex;

  // Reproducción paso a paso
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStepOverride((prev) => {
        const current = prev !== null ? prev : lastStepIndex;
        if (current >= lastStepIndex) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, speedMs);
    return () => clearInterval(timer);
  }, [isPlaying, lastStepIndex, speedMs]);

  if (!prim || steps.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>No hay cálculo de árbol de expansión mínima disponible.</p>
      </div>
    );
  }

  const getNodeName = (id: NodeId): string => {
    const d = departments[id];
    const n = graph.nodes.find((node) => node.id === id);
    if (d?.cabecera && n?.label && d.cabecera !== n.label) {
      return `${n.label} (${d.cabecera})`;
    }
    return n?.label ?? id;
  };

  const getEdgeInfo = (edgeId: string | null) => {
    if (!edgeId) return null;
    const edge = graph.edges.find((e) => e.id === edgeId);
    if (!edge) return { id: edgeId, source: '', target: '', weight: 0, road: '' };
    const srcName = graph.nodes.find((n) => n.id === edge.source)?.label ?? edge.source;
    const tgtName = graph.nodes.find((n) => n.id === edge.target)?.label ?? edge.target;
    const road = edge.meta?.carretera ? ` (${edge.meta.carretera})` : '';
    return {
      id: edge.id,
      source: srcName,
      target: tgtName,
      weight: edge.weight,
      road,
    };
  };

  const currentStep = steps[currentStepIndex] ?? steps[0]!;

  return (
    <div className="flex flex-col gap-3 p-3 text-xs" data-testid="prim-tab-container">
      {/* Controles superiores: selector de inicio y reproducción */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60">
        {/* Selector de nodo inicial de Prim */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="prim-start-select" className="font-semibold text-slate-700 dark:text-slate-300">
            Nodo inicial:
          </label>
          <select
            id="prim-start-select"
            data-testid="select-prim-start"
            value={mstStart ?? graph.nodes[0]?.id ?? ''}
            onChange={(e) => setMstStart(e.target.value)}
            className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {graph.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} {departments[n.id]?.cabecera ? `(${departments[n.id]?.cabecera})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Controles de reproducción */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="btn-prim-prev"
            onClick={() => setStepOverride(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex <= 0}
            aria-label="Paso anterior de Prim"
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Paso anterior"
          >
            ◀
          </button>
          <button
            type="button"
            data-testid="btn-prim-play"
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                if (currentStepIndex >= totalSteps - 1) setStepOverride(0);
                setIsPlaying(true);
              }
            }}
            aria-label={isPlaying ? 'Pausa' : 'Reproducir'}
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-xs hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            type="button"
            data-testid="btn-prim-next"
            onClick={() => setStepOverride(Math.min(totalSteps - 1, currentStepIndex + 1))}
            disabled={currentStepIndex >= totalSteps - 1}
            aria-label="Paso siguiente de Prim"
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Paso siguiente"
          >
            ▶
          </button>
          <button
            type="button"
            data-testid="btn-prim-end"
            onClick={() => {
              setIsPlaying(false);
              setStepOverride(totalSteps - 1);
            }}
            aria-label="Ir al final de Prim"
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-slate-300 bg-white font-bold text-slate-700 shadow-xs hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Solución final"
          >
            ⏭
          </button>
          <span className="ml-2 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
            Paso {currentStepIndex} de {totalSteps - 1}
          </span>
        </div>
      </div>

      {/* Resumen del paso activo */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-bold">Iteración {currentStep.iter}: </span>
            {currentStep.chosenEdge ? (
              <span>
                Arista elegida:{' '}
                <strong className="underline">
                  {getEdgeInfo(currentStep.chosenEdge)?.source} ↔ {getEdgeInfo(currentStep.chosenEdge)?.target}
                </strong>{' '}
                ({getEdgeInfo(currentStep.chosenEdge)?.weight} km{getEdgeInfo(currentStep.chosenEdge)?.road})
              </span>
            ) : (
              <span>
                Nodo inicial: <strong>{getNodeName(currentStep.inTree[0] ?? '')}</strong>
              </span>
            )}
          </div>
          <div className="font-bold">
            Total hasta aquí: <span className="font-mono text-sm">{currentStep.totalSoFar.toFixed(1)} km</span>
          </div>
        </div>
      </div>

      {/* Tabla de pasos completa con fila actual resaltada */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs dark:border-slate-800">
        <table className="w-full min-w-[620px] text-left border-collapse" data-testid="table-prim-steps">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <th className="py-2 px-2.5 w-10 text-center">#</th>
              <th className="py-2 px-2.5">Arista mínima (Corte)</th>
              <th className="py-2 px-2.5">Nodo incorporado</th>
              <th className="py-2 px-2.5">Columnas tachadas</th>
              <th className="py-2 px-2.5 text-right">km tramo</th>
              <th className="py-2 px-2.5 text-right">Total acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-[11px] dark:divide-slate-800">
            {steps.map((st, idx) => {
              const isSelected = idx === currentStepIndex;
              const edgeInfo = getEdgeInfo(st.chosenEdge);
              const newlyAddedNode = st.inTree[st.inTree.length - 1];

              return (
                <tr
                  key={st.iter}
                  onClick={() => setStepOverride(idx)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-100 font-semibold text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-100'
                      : idx % 2 === 0
                        ? 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                        : 'bg-slate-50/60 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800/60'
                  }`}
                  data-testid={`prim-row-${st.iter}`}
                >
                  <td className="py-2 px-2.5 text-center font-bold text-slate-600 dark:text-slate-400">{st.iter}</td>
                  <td className="py-2 px-2.5 font-sans">
                    {edgeInfo ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-800 dark:text-emerald-300">
                        {edgeInfo.source} ↔ {edgeInfo.target}
                        {edgeInfo.road && <span className="text-[10px] text-slate-500">{edgeInfo.road}</span>}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Inicio (árbol vacío)</span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 font-sans font-medium">
                    {newlyAddedNode ? getNodeName(newlyAddedNode) : '—'}
                  </td>
                  <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">
                    <span className="line-through">{st.crossedOut.join(', ')}</span>
                  </td>
                  <td className="py-2 px-2.5 text-right font-medium">
                    {edgeInfo ? `${edgeInfo.weight.toFixed(1)} km` : '0.0 km'}
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
