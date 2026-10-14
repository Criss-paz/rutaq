import { useState } from 'react';
import type { NodeId } from '../../core';
import { useApp } from '../useApp';
import Modal from './Modal';

export interface EdgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sourceId: NodeId;
  targetId: NodeId;
  isSelfLoop?: boolean;
  canSelectEndpoints?: boolean;
}

function EdgeDialogContent({
  isOpen,
  onClose,
  sourceId,
  targetId,
  isSelfLoop = false,
  canSelectEndpoints = false,
}: EdgeDialogProps) {
  const graph = useApp((s) => s.graph);
  const addEdge = useApp((s) => s.addEdge);
  const setEdgeWeight = useApp((s) => s.setEdgeWeight);
  const unit = graph.unit || 'km';

  const [source, setSource] = useState<NodeId>(sourceId);
  const [target, setTarget] = useState<NodeId>(targetId);
  const [weightInput, setWeightInput] = useState('5.0');
  const [duplicateState, setDuplicateState] = useState<{
    existingEdgeId: string;
    existingWeight: number;
    sourceLabel: string;
    targetLabel: string;
    newWeight: number;
  } | null>(null);

  // 1. Caso de lazo consigo mismo
  if (isSelfLoop || (!canSelectEndpoints && sourceId === targetId)) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Lazo no permitido" role="alertdialog" testId="modal-edge-loop">
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            No es posible conectar un nodo consigo mismo. No se permiten lazos en el grafo vial.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              data-testid="btn-close-self-loop"
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
            >
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // 2. Caso de arista duplicada: ofrece editar la existente o cancelar
  if (duplicateState) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Carretera duplicada" role="alertdialog" testId="modal-add-edge">
        <div className="space-y-4">
          <p data-testid="duplicate-edge-message" className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Ya existe una carretera entre {duplicateState.sourceLabel} y {duplicateState.targetLabel} (peso{' '}
            {duplicateState.existingWeight})
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              data-testid="btn-cancel-edge"
              onClick={onClose}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="btn-edit-existing-edge"
              onClick={() => {
                setEdgeWeight(duplicateState.existingEdgeId, duplicateState.newWeight);
                onClose();
              }}
              className="flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
            >
              Editar la existente
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Validación en vivo del peso
  const parsedWeight = parseFloat(weightInput);
  const isWeightValid = !isNaN(parsedWeight) && parsedWeight > 0 && isFinite(parsedWeight);
  const isSelf = source === target;
  const canSubmit = isWeightValid && !isSelf;

  const sourceNode = graph.nodes.find((n) => n.id === source);
  const targetNode = graph.nodes.find((n) => n.id === target);
  const sourceLabel = sourceNode?.label || sourceNode?.id || source;
  const targetLabel = targetNode?.label || targetNode?.id || target;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const res = addEdge(source, target, parsedWeight);
    if (res.ok) {
      onClose();
      return;
    }

    if (res.reason === 'duplicate') {
      const existing = graph.edges.find((e) => e.id === res.existingEdgeId);
      setDuplicateState({
        existingEdgeId: res.existingEdgeId,
        existingWeight: existing?.weight ?? 0,
        sourceLabel,
        targetLabel,
        newWeight: parsedWeight,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva carretera"
      description="Define la distancia o peso de la carretera entre ambos nodos"
      testId="modal-add-edge"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {canSelectEndpoints ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="select-edge-source"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Origen
              </label>
              <select
                id="select-edge-source"
                data-testid="select-edge-source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label || n.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="select-edge-target"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Destino
              </label>
              <select
                id="select-edge-target"
                data-testid="select-edge-target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label || n.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 p-2.5 text-xs font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            Conectar <strong className="font-bold text-slate-900 dark:text-white">{sourceLabel}</strong> con{' '}
            <strong className="font-bold text-slate-900 dark:text-white">{targetLabel}</strong>
          </div>
        )}

        {isSelf && (
          <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            No se permiten lazos hacia el mismo nodo.
          </p>
        )}

        <div>
          <label htmlFor="input-edge-weight" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Peso de la carretera ({unit})
          </label>
          <input
            id="input-edge-weight"
            data-testid="input-edge-weight"
            type="number"
            step="any"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="mt-1 block min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Ejemplo: 5.0"
          />
          {!isWeightValid && (
            <p
              data-testid="edge-weight-error"
              role="alert"
              className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400"
            >
              El peso debe ser mayor que cero
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            data-testid="btn-cancel-edge"
            onClick={onClose}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            data-testid="btn-submit-edge"
            disabled={!canSubmit}
            className="flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
          >
            Crear carretera
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function EdgeDialog(props: EdgeDialogProps) {
  if (!props.isOpen) return null;
  return (
    <EdgeDialogContent
      key={`${props.sourceId}-${props.targetId}-${props.isSelfLoop}-${props.canSelectEndpoints}`}
      {...props}
    />
  );
}
