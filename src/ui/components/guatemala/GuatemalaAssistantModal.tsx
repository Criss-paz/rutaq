/**
 * Diálogo asistente de dos pasos para el cálculo de la mejor ruta (G3).
 * Pregunta:
 *   Paso 1: «¿Dónde se encuentra el paquete?» (origen)
 *   Paso 2: «¿A qué departamento debe llegar?» (destino)
 * Incluye filtro de búsqueda reactivo por nombre de departamento o cabecera departamental.
 *
 * Lee y modifica: `graph.nodes`, `departments`, `setPathQuery` desde `useApp`.
 */
import { useMemo, useState } from 'react';
import type { NodeId } from '../../../core/types';
import { useApp } from '../../useApp';
import Modal from '../Modal';

interface GuatemalaAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCalculated?: () => void;
}

export default function GuatemalaAssistantModal({ isOpen, onClose, onCalculated }: GuatemalaAssistantModalProps) {
  const graph = useApp((s) => s.graph);
  const departments = useApp((s) => s.departments);
  const setPathQuery = useApp((s) => s.setPathQuery);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSource, setSelectedSource] = useState<NodeId | null>(null);
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');

  const resetState = () => {
    setStep(1);
    setSelectedSource(null);
    setSourceSearch('');
    setTargetSearch('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Departamentos para el paso 1 filtrados por búsqueda
  const filteredSources = useMemo(() => {
    const term = sourceSearch.trim().toLowerCase();
    return graph.nodes.filter((n) => {
      const label = n.label.toLowerCase();
      const cabecera = (departments[n.id]?.cabecera ?? '').toLowerCase();
      return !term || label.includes(term) || cabecera.includes(term);
    });
  }, [graph.nodes, departments, sourceSearch]);

  // Departamentos para el paso 2 (excluyendo el origen) filtrados por búsqueda
  const filteredTargets = useMemo(() => {
    const term = targetSearch.trim().toLowerCase();
    return graph.nodes.filter((n) => {
      if (n.id === selectedSource) return false;
      const label = n.label.toLowerCase();
      const cabecera = (departments[n.id]?.cabecera ?? '').toLowerCase();
      return !term || label.includes(term) || cabecera.includes(term);
    });
  }, [graph.nodes, departments, selectedSource, targetSearch]);

  const handleSelectSource = (id: NodeId) => {
    setSelectedSource(id);
    setStep(2);
  };

  const handleSelectTarget = (id: NodeId) => {
    if (!selectedSource) return;
    setPathQuery(selectedSource, id);
    handleClose();
    if (onCalculated) onCalculated();
  };

  const sourceNode = graph.nodes.find((n) => n.id === selectedSource);
  const sourceCabecera = selectedSource ? departments[selectedSource]?.cabecera : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Asistente de Envíos — Transporte Express"
      testId="modal-assistant"
    >
      <div className="flex flex-col gap-4 text-xs" data-testid="assistant-wizard">
        {/* Barra de progreso de pasos */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {step === 1 ? '1' : '✓'}
            </span>
            <span
              className={`font-semibold ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}
            >
              ¿Dónde está el paquete?
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-700">→</span>

          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              2
            </span>
            <span
              className={`font-semibold ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}
            >
              ¿A dónde debe llegar?
            </span>
          </div>
        </div>

        {/* PASO 1: ORIGEN */}
        {step === 1 && (
          <div className="flex flex-col gap-3" data-testid="assistant-step-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                1. ¿Dónde se encuentra el paquete?
              </h2>
              <span className="text-slate-500">{filteredSources.length} departamentos</span>
            </div>

            {/* Buscador de origen */}
            <input
              type="text"
              data-testid="input-assistant-source-search"
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              placeholder="Buscar departamento o cabecera…"
              autoFocus
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            {/* Listado interactivo de departamentos origen */}
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-1 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800/60">
              {filteredSources.map((n) => {
                const cab = departments[n.id]?.cabecera ?? n.label;
                return (
                  <button
                    key={n.id}
                    type="button"
                    data-testid={`btn-select-source-${n.id}`}
                    onClick={() => handleSelectSource(n.id)}
                    className="flex min-h-[44px] w-full items-center justify-between px-3 py-2 text-left rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{n.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Cabecera: {cab}</div>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {n.id}
                    </span>
                  </button>
                );
              })}
              {filteredSources.length === 0 && (
                <div className="p-4 text-center text-slate-500">No se encontraron departamentos coincidentes.</div>
              )}
            </div>
          </div>
        )}

        {/* PASO 2: DESTINO */}
        {step === 2 && (
          <div className="flex flex-col gap-3" data-testid="assistant-step-2">
            {/* Origen fijado con opción de cambiar */}
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
              <div>
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Origen fijado:</span>
                <div className="font-bold text-emerald-950 dark:text-emerald-100">
                  {sourceNode?.label} ({sourceCabecera})
                </div>
              </div>
              <button
                type="button"
                data-testid="btn-change-source"
                onClick={() => setStep(1)}
                className="min-h-[36px] rounded-md px-2.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
              >
                Cambiar origen
              </button>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                2. ¿A qué departamento debe llegar?
              </h2>
              <span className="text-slate-500">{filteredTargets.length} disponibles</span>
            </div>

            {/* Buscador de destino */}
            <input
              type="text"
              data-testid="input-assistant-target-search"
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              placeholder="Buscar departamento o cabecera destino…"
              autoFocus
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            {/* Listado interactivo de departamentos destino */}
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-1 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800/60">
              {filteredTargets.map((n) => {
                const cab = departments[n.id]?.cabecera ?? n.label;
                return (
                  <button
                    key={n.id}
                    type="button"
                    data-testid={`btn-select-target-${n.id}`}
                    onClick={() => handleSelectTarget(n.id)}
                    className="flex min-h-[44px] w-full items-center justify-between px-3 py-2 text-left rounded-md hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{n.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Cabecera: {cab}</div>
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {n.id}
                    </span>
                  </button>
                );
              })}
              {filteredTargets.length === 0 && (
                <div className="p-4 text-center text-slate-500">No se encontraron departamentos coincidentes.</div>
              )}
            </div>
          </div>
        )}

        {/* Botones inferiores */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            data-testid="btn-cancel-assistant"
            onClick={handleClose}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
