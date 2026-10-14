import { useCallback, useMemo } from 'react';
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeChange,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react';
import type { NodeId } from '../../core/types';
import { useApp } from '../useApp';
import { CustomEdge } from './CustomEdge';
import { CustomNode } from './CustomNode';

const nodeTypes = {
  customNode: CustomNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

export default function Canvas() {
  const graph = useApp((s) => s.graph);
  const mode = useApp((s) => s.mode);
  const query = useApp((s) => s.query);
  const setTreeQuery = useApp((s) => s.setTreeQuery);
  const setPathQuery = useApp((s) => s.setPathQuery);
  const clearQuery = useApp((s) => s.clearQuery);
  const dijkstra = useApp((s) => s.dijkstra);
  const shortest = useApp((s) => s.shortest);
  const highlightedPath = useApp((s) => s.highlightedPath);
  const allPaths = useApp((s) => s.allPaths);
  const playback = useApp((s) => s.playback);
  const scale = useApp((s) => s.scale);
  const layoutSuggestion = useApp((s) => s.layoutSuggestion);
  const applySuggestedLayout = useApp((s) => s.applySuggestedLayout);
  const keepProportion = useApp((s) => s.keepProportion);
  const setKeepProportion = useApp((s) => s.setKeepProportion);
  const addNode = useApp((s) => s.addNode);
  const addEdge = useApp((s) => s.addEdge);
  const moveNodes = useApp((s) => s.moveNodes);
  const theme = useApp((s) => s.theme);

  const { fitView } = useReactFlow();

  // Determinar aristas y nodos en la ruta activa resaltada
  const activePathEdges = useMemo(() => {
    const set = new Set<string>();
    if (highlightedPath) {
      if (highlightedPath.from === 'all' && allPaths.result?.paths[highlightedPath.index]) {
        for (const e of allPaths.result.paths[highlightedPath.index]!.edges) {
          set.add(e);
        }
      } else if (highlightedPath.from === 'shortest' && shortest?.[highlightedPath.index]) {
        for (const e of shortest[highlightedPath.index]!.edges) {
          set.add(e);
        }
      }
    } else if (shortest && shortest.length > 0 && shortest[0]) {
      for (const e of shortest[0].edges) {
        set.add(e);
      }
    }
    return set;
  }, [highlightedPath, allPaths.result, shortest]);

  const activePathNodes = useMemo(() => {
    const set = new Set<string>();
    if (highlightedPath) {
      if (highlightedPath.from === 'all' && allPaths.result?.paths[highlightedPath.index]) {
        for (const n of allPaths.result.paths[highlightedPath.index]!.nodes) {
          set.add(n);
        }
      } else if (highlightedPath.from === 'shortest' && shortest?.[highlightedPath.index]) {
        for (const n of shortest[highlightedPath.index]!.nodes) {
          set.add(n);
        }
      }
    } else if (shortest && shortest.length > 0 && shortest[0]) {
      for (const n of shortest[0].nodes) {
        set.add(n);
      }
    }
    return set;
  }, [highlightedPath, allPaths.result, shortest]);

  // Paso actual en reproducción
  const currentStep = dijkstra?.steps[playback.stepIndex];
  const currentStepCurrent = currentStep?.current;
  const currentStepEvaluated = currentStep?.evaluatedEdges;
  const currentStepPermanent = currentStep?.permanent;
  const treeEdgesSet = useMemo(() => new Set(dijkstra?.treeEdges ?? []), [dijkstra?.treeEdges]);
  const evaluatedEdgesSet = useMemo(() => new Set(currentStepEvaluated ?? []), [currentStepEvaluated]);
  const permanentNodesSet = useMemo(() => new Set(currentStepPermanent ?? []), [currentStepPermanent]);

  // Mapear nodos de Graph a ReactFlow Nodes
  const rfNodes: Node[] = useMemo(() => {
    return graph.nodes.map((n) => {
      const isOrigin = query?.source === n.id;
      const isTarget = query?.kind === 'path' && query?.target === n.id;
      const isCurrent = currentStepCurrent === n.id;
      const isPermanent = permanentNodesSet.has(n.id);
      const isOnPath = activePathNodes.has(n.id);
      const dist = dijkstra?.labels[n.id]?.dist;

      return {
        id: n.id,
        type: 'customNode',
        position: { x: n.x, y: n.y },
        style: { width: n.w, height: n.h },
        data: {
          label: n.label,
          isOrigin,
          isTarget,
          isCurrent,
          isPermanent,
          isOnPath,
          dist,
        },
      };
    });
  }, [graph.nodes, query, currentStepCurrent, permanentNodesSet, activePathNodes, dijkstra?.labels]);

  // Mapear aristas de Graph a ReactFlow Edges
  const rfEdges: Edge[] = useMemo(() => {
    return graph.edges.map((e) => {
      const isOnPath = activePathEdges.has(e.id);
      const isTreeEdge = treeEdgesSet.has(e.id);
      const isEvaluated = evaluatedEdgesSet.has(e.id);

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'customEdge',
        data: {
          weight: e.weight,
          shape: e.shape,
          shapeAuto: e.shapeAuto,
          isOnPath,
          isTreeEdge,
          isEvaluated,
        },
      };
    });
  }, [graph.edges, activePathEdges, treeEdgesSet, evaluatedEdgesSet]);

  // Manejador de cambios de posición de nodos
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updatedNodes = applyNodeChanges(changes, rfNodes);
      const moves: Record<NodeId, { x: number; y: number }> = {};
      let hasPositionChange = false;

      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          moves[change.id] = change.position;
          hasPositionChange = true;
        }
      }

      if (hasPositionChange) {
        moveNodes(moves);
      }
      return updatedNodes;
    },
    [rfNodes, moveNodes],
  );

  // Manejador de conexión de nuevas aristas al arrastrar
  const onConnect = useCallback(
    (params: Connection) => {
      if (mode !== 'design') return;
      if (!params.source || !params.target) return;
      const weightStr = prompt('Ingrese el peso de la carretera en km:', '5.0');
      if (weightStr === null) return;
      const weight = parseFloat(weightStr);
      if (isNaN(weight) || weight <= 0) {
        alert('El peso debe ser un número positivo.');
        return;
      }
      const res = addEdge(params.source, params.target, weight);
      if (!res.ok) {
        if (res.reason === 'duplicate') {
          alert('Ya existe una arista entre estos dos nodos.');
        } else if (res.reason === 'self-loop') {
          alert('No se permiten lazos hacia el mismo nodo.');
        } else {
          alert('No fue posible agregar la arista.');
        }
      }
    },
    [mode, addEdge],
  );

  const handleAddNodeClick = () => {
    // Añadir nodo en una posición visible
    const x = Math.round(200 + Math.random() * 300);
    const y = Math.round(150 + Math.random() * 250);
    addNode({ x, y });
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950" data-testid="graph-canvas">
      {/* Barra Superior de Herramientas y Consulta del Lienzo */}
      <div
        data-testid="canvas-toolbar"
        className="z-10 flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white/95 px-3 py-1.5 shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95"
      >
        {/* Modos de Consulta */}
        <button
          type="button"
          data-testid="query-mode-tree"
          onClick={() => {
            const src = query?.source ?? graph.nodes[0]?.id ?? 'A';
            setTreeQuery(src);
          }}
          aria-label="Consulta F2: Árbol de caminos más cortos"
          className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden ${
            query?.kind === 'tree'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          🌳 Árbol (F2)
        </button>

        <button
          type="button"
          data-testid="query-mode-path"
          onClick={() => {
            const src = query?.source ?? graph.nodes[0]?.id ?? 'A';
            const tgt = graph.nodes.length > 1 ? (graph.nodes[graph.nodes.length - 1]?.id ?? null) : null;
            setPathQuery(src, tgt);
          }}
          aria-label="Consulta F3: Ruta entre dos nodos"
          className={`min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden ${
            query?.kind === 'path'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          📍 Ruta (F3)
        </button>

        <button
          type="button"
          data-testid="query-clear"
          onClick={clearQuery}
          aria-label="Limpiar consulta de caminos"
          className="min-h-[44px] rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Limpiar consulta"
        >
          ✕ Limpiar
        </button>

        {/* Selectores de Nodos */}
        <div className="flex items-center gap-1 pl-1">
          <label htmlFor="select-source-node" className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            De:
          </label>
          <select
            id="select-source-node"
            data-testid="select-source-node"
            value={query?.source ?? ''}
            onChange={(e) => {
              const s = e.target.value;
              if (query?.kind === 'path') {
                setPathQuery(s, query.target);
              } else {
                setTreeQuery(s);
              }
            }}
            aria-label="Nodo origen"
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {graph.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>

          {query?.kind === 'path' && (
            <>
              <label
                htmlFor="select-target-node"
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400"
              >
                A:
              </label>
              <select
                id="select-target-node"
                data-testid="select-target-node"
                value={query.target ?? ''}
                onChange={(e) => {
                  const t = e.target.value || null;
                  setPathQuery(query.source, t);
                }}
                aria-label="Nodo destino"
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">(Seleccione destino)</option>
                {graph.nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Chip de resumen de distancia */}
        {query?.kind === 'path' && query.target && shortest && shortest.length > 0 && shortest[0] && (
          <div className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 shadow-xs dark:bg-purple-950 dark:text-purple-300">
            {shortest[0].distance} km
          </div>
        )}

        {/* Controles de Diseño */}
        {mode === 'design' && (
          <>
            <button
              type="button"
              data-testid="btn-add-node"
              onClick={handleAddNodeClick}
              aria-label="Agregar un nuevo nodo al lienzo"
              className="flex min-h-[44px] items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            >
              <span>+</span> Nodo
            </button>

            <button
              type="button"
              data-testid="btn-suggest-layout"
              onClick={async () => {
                await applySuggestedLayout();
                fitView({ duration: 400 });
              }}
              aria-label="Aplicar distribución sugerida en el lienzo"
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title="Alinear nodos automáticamente según caminos más cortos"
            >
              🔄 Distribuir
            </button>

            {/* Toggle Mantener Proporción */}
            <label className="flex min-h-[44px] cursor-pointer items-center gap-1.5 px-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                data-testid="toggle-keep-proportion"
                checked={keepProportion}
                onChange={(e) => setKeepProportion(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="hidden sm:inline">Mantener proporción</span>
            </label>
          </>
        )}

        {/* Badges de Escala y Error de Ajuste (F6) */}
        <div
          data-testid="scale-badge"
          className="hidden md:flex min-h-[44px] items-center rounded-lg bg-slate-100 px-2.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          title={`Magnitud: ${scale.magnitude} · Mediana: ${(160 / scale.pxPerUnit).toFixed(1)} km`}
        >
          Escala: {scale.range}
        </div>

        <div
          data-testid="stress-error-badge"
          className="hidden md:flex min-h-[44px] items-center rounded-lg bg-slate-100 px-2.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          title="Error de proyección stress majorization: no todos los pesos son representables en un plano 2D"
        >
          Ajuste 2D: {layoutSuggestion?.stressError ?? 0}%
        </div>
      </div>

      {/* Contenedor del Lienzo ReactFlow */}
      <div className="relative flex-1 w-full overflow-hidden">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2.5}
          deleteKeyCode={mode === 'design' ? 'Delete' : null}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1.5}
            color={theme === 'dark' ? '#334155' : '#cbd5e1'}
          />
          <Controls
            showInteractive={false}
            className="!border !border-slate-200 !bg-white/90 !shadow-xs dark:!border-slate-700 dark:!bg-slate-800/90"
          />
          <MiniMap
            position="bottom-left"
            nodeColor={theme === 'dark' ? '#3b82f6' : '#2563eb'}
            maskColor={theme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(248, 250, 252, 0.7)'}
            className="hidden sm:block !rounded-lg !border !border-slate-200 !bg-white/90 dark:!border-slate-700 dark:!bg-slate-800/90"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
