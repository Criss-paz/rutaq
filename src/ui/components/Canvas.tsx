import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  type Node,
  type NodeChange,
  ReactFlow,
  useReactFlow,
  useStore,
  useViewport,
} from '@xyflow/react';
import type { GNode } from '../../core/types';
import { useApp } from '../useApp';
import { type EdgeWeightsMode, useUiStore } from '../uiStore';
import { CustomEdge } from './CustomEdge';
import { CustomNode } from './CustomNode';
import EdgeDialog from './EdgeDialog';

const nodeTypes = {
  customNode: CustomNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

function overlaps(
  b1: { l: number; t: number; r: number; b: number },
  b2: { l: number; t: number; r: number; b: number },
  pad = 2,
) {
  return !(b1.r + pad <= b2.l || b1.l >= b2.r + pad || b1.b + pad <= b2.t || b1.t >= b2.b + pad);
}

type LabelDir = 'right' | 'left' | 'top' | 'bottom';
type Box = { l: number; t: number; r: number; b: number };

/** Ancho real en px de un texto con la tipografía de la app (se cachea); respaldo aproximado sin DOM. */
const textWidthCache = new Map<string, number>();
let measureCtx: CanvasRenderingContext2D | null | undefined;
function textWidth(text: string, font: string, fallbackPerChar: number): number {
  const key = `${font}|${text}`;
  const hit = textWidthCache.get(key);
  if (hit !== undefined) return hit;
  if (measureCtx === undefined) {
    measureCtx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  }
  let w = text.length * fallbackPerChar;
  if (measureCtx) {
    const family = typeof document === 'undefined' ? 'sans-serif' : getComputedStyle(document.body).fontFamily;
    measureCtx.font = `${font} ${family}`;
    w = measureCtx.measureText(text).width;
  }
  textWidthCache.set(key, w);
  return w;
}

function overlapArea(box: Box, others: Box[]): number {
  let area = 0;
  for (const o of others) {
    const w = Math.min(box.r, o.r) - Math.max(box.l, o.l);
    const h = Math.min(box.b, o.b) - Math.max(box.t, o.t);
    if (w > 0 && h > 0) area += w * h;
  }
  return area;
}

interface MapLabelLayout {
  placements: Record<string, LabelDir>;
  hiddenLabels: Set<string>;
  hiddenWeights: Set<string>;
}

/**
 * Coloca los nombres del mapa como un mapa real: el texto mide siempre ~12 px en pantalla (en el lienzo crece
 * 1/zoom al alejar), así que al alejar caben menos nombres. Se colocan por prioridad (consulta, nodo actual,
 * seleccionados, luego los municipios con más carreteras) en la primera dirección libre; si ninguna está libre,
 * el nombre se oculta (los prioritarios nunca). Después se colocan los pesos de las aristas importantes y se
 * ocultan los que chocarían con un nombre u otro peso. Al acercar, aparecen los demás.
 */
function computeMapLabelLayout(
  nodes: GNode[],
  edges: { id: string; source: string; target: string; weight: number }[],
  zoom: number,
  priority: string[],
  weightEdges: Set<string>,
  unit: string,
  viewportWidth: number,
): MapLabelLayout {
  const layout: MapLabelLayout = { placements: {}, hiddenLabels: new Set(), hiddenWeights: new Set() };
  const mapNodes = nodes.filter((n) => n.lat != null && n.lon != null);
  if (mapNodes.length === 0) return layout;

  const s = 1 / Math.min(zoom, 1);
  const gap = 4 * s;
  const lh = 16 * s;

  const dots: (Box & { id: string })[] = mapNodes.map((n) => ({
    id: n.id,
    l: n.x,
    t: n.y,
    r: n.x + n.w,
    b: n.y + n.h,
  }));
  const placed: Box[] = [];
  // El lienzo se ajusta a los puntos (fitView, centrado): a cada lado del mapa queda un margen libre que depende del
  // ancho visible. Un nombre que sobresalga de ese margen quedaría cortado.
  const minL = Math.min(...dots.map((d) => d.l));
  const maxR = Math.max(...dots.map((d) => d.r));
  // Si el mapa ya no cabe a lo ancho (zoom acercado), el usuario desplaza el lienzo: no hay borde que respetar.
  const visibleWidth = viewportWidth / zoom;
  const margin = visibleWidth > maxR - minL ? Math.max(0, (visibleWidth - (maxR - minL)) / 2 - 8 * s) : Infinity;
  const free = (box: Box, ownId?: string) =>
    box.l >= minL - margin &&
    box.r <= maxR + margin &&
    !dots.some((d) => d.id !== ownId && overlaps(box, d, 2 * s)) &&
    !placed.some((p) => overlaps(box, p, 2 * s));

  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  const prio = new Map(priority.map((id, i) => [id, i]));
  const xs = mapNodes.map((n) => n.x + n.w / 2);
  const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const order = [...mapNodes].sort(
    (a, b) =>
      (prio.get(a.id) ?? Infinity) - (prio.get(b.id) ?? Infinity) ||
      (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) ||
      (a.id < b.id ? -1 : 1),
  );

  for (const n of order) {
    const lw = (textWidth(n.label, '700 12px', 7.6) + 6) * s;
    const cx = n.x + n.w / 2;
    const cy = n.y + n.h / 2;
    const boxes: Record<LabelDir, Box> = {
      right: { l: n.x + n.w + gap, t: cy - lh / 2, r: n.x + n.w + gap + lw, b: cy + lh / 2 },
      left: { l: n.x - gap - lw, t: cy - lh / 2, r: n.x - gap, b: cy + lh / 2 },
      top: { l: cx - lw / 2, t: n.y - gap - lh, r: cx + lw / 2, b: n.y - gap },
      bottom: { l: cx - lw / 2, t: n.y + n.h + gap, r: cx + lw / 2, b: n.y + n.h + gap + lh },
    };
    // En la mitad derecha del mapa el nombre prefiere ir a la izquierda (y viceversa) para no salirse del lienzo.
    const dirs: LabelDir[] = cx > midX ? ['left', 'right', 'top', 'bottom'] : ['right', 'left', 'top', 'bottom'];
    const dir = dirs.find((d) => free(boxes[d], n.id));
    if (dir) {
      layout.placements[n.id] = dir;
      placed.push(boxes[dir]);
    } else if (prio.has(n.id)) {
      // Prioritario sin hueco libre: la dirección que menos se encima.
      const best = dirs.reduce((m, d) => (overlapArea(boxes[d], placed) < overlapArea(boxes[m], placed) ? d : m));
      layout.placements[n.id] = best;
      placed.push(boxes[best]);
    } else {
      layout.hiddenLabels.add(n.id);
    }
  }

  const byId = new Map(mapNodes.map((n) => [n.id, n]));
  for (const e of edges) {
    if (!weightEdges.has(e.id)) continue;
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    if (!a || !b) continue;
    const mx = (a.x + a.w / 2 + b.x + b.w / 2) / 2;
    const my = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
    const w = (textWidth(`${e.weight} ${unit}`, '600 11px', 6.6) + 6) * s;
    const h = 14 * s;
    const box = { l: mx - w / 2, t: my - h / 2, r: mx + w / 2, b: my + h / 2 };
    if (free(box)) placed.push(box);
    else layout.hiddenWeights.add(e.id);
  }
  return layout;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeProjectionFactor(nodes: GNode[]): number {
  const geoNodes = nodes.filter((n) => n.lat != null && n.lon != null);
  if (geoNodes.length < 2) return 30.4;

  let minNode = geoNodes[0]!;
  let maxNode = geoNodes[0]!;
  for (const n of geoNodes) {
    if (n.x < minNode.x) minNode = n;
    if (n.x > maxNode.x) maxNode = n;
  }

  const distPx = Math.hypot(maxNode.x - minNode.x, maxNode.y - minNode.y);
  const distKm = haversineKm(minNode.lat!, minNode.lon!, maxNode.lat!, maxNode.lon!);
  if (distKm <= 0) return 30.4;
  return distPx / distKm;
}

function MapOrientationAndScale({ nodes }: { nodes: GNode[] }) {
  const { zoom } = useViewport();
  const factor = useMemo(() => computeProjectionFactor(nodes), [nodes]);

  const pxPerKm = factor * zoom;
  const candidates = [1, 2, 5, 10, 20];
  let bestL = 5;
  let minDiff = Infinity;
  for (const c of candidates) {
    const diff = Math.abs(c * pxPerKm - 80);
    if (diff < minDiff) {
      minDiff = diff;
      bestL = c;
    }
  }
  const barWidth = Math.max(30, Math.min(220, Math.round(bestL * pxPerKm)));

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
      {/* Rosa de los vientos */}
      <div
        data-testid="compass-rose"
        aria-label="Rosa de los vientos: Norte arriba"
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white/92 shadow-md backdrop-blur-xs select-none dark:border-slate-700 dark:bg-slate-800/92"
      >
        <span className="absolute top-0.5 text-[10px] font-black text-rose-600 dark:text-rose-400">N</span>
        <span className="absolute bottom-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">S</span>
        <span className="absolute right-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">E</span>
        <span className="absolute left-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">O</span>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
          <polygon points="12,3 15,12 12,10" fill="#e11d48" />
          <polygon points="12,3 9,12 12,10" fill="#fb7185" />
          <polygon points="12,21 15,12 12,14" fill="#64748b" />
          <polygon points="12,21 9,12 12,14" fill="#94a3b8" />
          <circle cx="12" cy="12" r="1.5" fill="#0f172a" />
        </svg>
      </div>

      {/* Barra de escala en km */}
      <div
        data-testid="scale-bar"
        aria-label={`Escala del mapa: ${bestL} kilómetros`}
        className="pointer-events-auto flex flex-col items-center rounded-md border border-slate-200 bg-white/92 px-2.5 py-1 shadow-md backdrop-blur-xs select-none dark:border-slate-700 dark:bg-slate-800/92"
      >
        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{bestL} km</span>
        <div
          className="mt-0.5 h-1.5 border-b-2 border-l-2 border-r-2 border-slate-800 dark:border-slate-200 transition-all duration-100"
          style={{ width: `${barWidth}px` }}
        />
      </div>
    </div>
  );
}

interface CanvasFlowProps {
  rfNodes: Node[];
  rfEdges: Edge[];
  onConnect: (params: Connection) => void;
  canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
  isMapMode: boolean;
  graphNodes: GNode[];
}

function CanvasFlow({ rfNodes, rfEdges, onConnect, canvasWrapperRef, isMapMode, graphNodes }: CanvasFlowProps) {
  const mode = useApp((s) => s.mode);
  const graph = useApp((s) => s.graph);
  const theme = useApp((s) => s.theme);
  const keepProportion = useApp((s) => s.keepProportion);
  const scale = useApp((s) => s.scale);
  const moveNodes = useApp((s) => s.moveNodes);
  const selectedNodeIds = useApp((s) => s.selectedNodeIds);
  const selectedEdgeIds = useApp((s) => s.selectedEdgeIds);
  const select = useApp((s) => s.select);
  const mobileSheetPos = useUiStore((s) => s.mobileSheetPos);
  const isDesktopCollapsed = useUiStore((s) => s.isDesktopCollapsed);

  // Estados locales independientes para cada instancia del grafo
  const [dragOverrides, setDragOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const [nodeDimensions, setNodeDimensions] = useState<Record<string, { width: number; height: number }>>({});

  const { fitView } = useReactFlow();

  const handleFitView = useCallback(
    (duration = 0) => {
      fitView({ padding: 0.15, duration });
    },
    [fitView],
  );

  // 1. Al montar el lienzo
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitView(0);
    }, 50);
    return () => clearTimeout(timer);
  }, [handleFitView]);

  // 2. Al cambiar número de nodos/aristas en edición
  const prevNodesCountRef = useRef(graph.nodes.length);
  const prevEdgesCountRef = useRef(graph.edges.length);
  useEffect(() => {
    if (prevNodesCountRef.current !== graph.nodes.length || prevEdgesCountRef.current !== graph.edges.length) {
      prevNodesCountRef.current = graph.nodes.length;
      prevEdgesCountRef.current = graph.edges.length;
      handleFitView(0);
    }
  }, [graph.nodes.length, graph.edges.length, handleFitView]);

  // 3. Al cambiar posición de la hoja inferior / colapsar el panel lateral
  const prevSheetPosRef = useRef(mobileSheetPos);
  const prevCollapsedRef = useRef(isDesktopCollapsed);
  useEffect(() => {
    if (prevSheetPosRef.current !== mobileSheetPos || prevCollapsedRef.current !== isDesktopCollapsed) {
      prevSheetPosRef.current = mobileSheetPos;
      prevCollapsedRef.current = isDesktopCollapsed;
      handleFitView(0);
    }
  }, [mobileSheetPos, isDesktopCollapsed, handleFitView]);

  // 4. Al cambiar el tamaño del lienzo (ResizeObserver)
  useEffect(() => {
    if (!canvasWrapperRef.current) return;
    const ro = new ResizeObserver(() => {
      handleFitView(0);
    });
    ro.observe(canvasWrapperRef.current);
    return () => ro.disconnect();
  }, [canvasWrapperRef, handleFitView]);

  const validNodeIds = useMemo(() => new Set(graph.nodes.map((n) => n.id)), [graph.nodes]);

  // Manejador durante el arrastre: actualiza ÚNICAMENTE el estado local de React Flow
  // para evitar saturar el historial de deshacer/rehacer y no recalcular el store en cada píxel.
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      let hasPosChanges = false;
      let hasDimChanges = false;
      const newPositions: Record<string, { x: number; y: number }> = {};
      const newDimensions: Record<string, { width: number; height: number }> = {};
      const selectChanges: { id: string; selected: boolean }[] = [];

      for (const change of changes) {
        const changeId = 'id' in change ? change.id : change.type === 'add' ? change.item.id : undefined;
        if (!changeId || !validNodeIds.has(changeId)) continue;

        if (change.type === 'position') {
          if (change.dragging && change.position) {
            newPositions[change.id] = change.position;
            hasPosChanges = true;
          } else if (change.dragging === false) {
            setDragOverrides((prev) => {
              if (!prev[change.id]) return prev;
              const next = { ...prev };
              delete next[change.id];
              return next;
            });
          }
        } else if (change.type === 'dimensions' && change.dimensions) {
          newDimensions[change.id] = change.dimensions;
          hasDimChanges = true;
        } else if (change.type === 'select') {
          selectChanges.push({ id: change.id, selected: change.selected });
        }
      }

      if (hasPosChanges) {
        setDragOverrides((prev) => ({ ...prev, ...newPositions }));
      }
      if (hasDimChanges) {
        setNodeDimensions((prev) => {
          let changed = false;
          for (const [id, dims] of Object.entries(newDimensions)) {
            const cur = prev[id];
            if (!cur || cur.width !== dims.width || cur.height !== dims.height) {
              changed = true;
              break;
            }
          }
          return changed ? { ...prev, ...newDimensions } : prev;
        });
      }
      if (selectChanges.length > 0) {
        const nextSelected = new Set(selectedNodeIds);
        for (const sc of selectChanges) {
          if (sc.selected) nextSelected.add(sc.id);
          else nextSelected.delete(sc.id);
        }
        select(Array.from(nextSelected), selectedEdgeIds);
      }
    },
    [validNodeIds, selectedNodeIds, selectedEdgeIds, select],
  );

  // Al soltar el nodo (onNodeDragStop): se registra una única entrada en el historial de deshacer.
  // Regla de Mantener Proporción (keepProportion):
  // Si está activa y scale.pxPerUnit > 0, se busca el vecino conectado más cercano. Se calcula el
  // ángulo entre dicho vecino y la posición soltada, y se proyecta la nueva posición del nodo a
  // la distancia euclídea exacta (peso × scale.pxPerUnit) sobre dicha semirrecta.
  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      let finalX = node.position.x;
      let finalY = node.position.y;

      if (keepProportion && scale.pxPerUnit > 0) {
        const incidentEdges = graph.edges.filter((e) => e.source === node.id || e.target === node.id);

        if (incidentEdges.length > 0) {
          const nodeW = node.measured?.width ?? (typeof node.style?.width === 'number' ? node.style.width : 132);
          const nodeH = node.measured?.height ?? (typeof node.style?.height === 'number' ? node.style.height : 44);
          const curCenterX = finalX + nodeW / 2;
          const curCenterY = finalY + nodeH / 2;

          let bestNeighbor: { cx: number; cy: number; targetDist: number } | null = null;
          let minDistance = Infinity;

          for (const e of incidentEdges) {
            const neighborId = e.source === node.id ? e.target : e.source;
            const neighborNode = graph.nodes.find((n) => n.id === neighborId);
            if (!neighborNode) continue;

            const nCenterX = neighborNode.x + neighborNode.w / 2;
            const nCenterY = neighborNode.y + neighborNode.h / 2;
            const dist = Math.hypot(curCenterX - nCenterX, curCenterY - nCenterY);
            const targetDist = e.weight * scale.pxPerUnit;

            if (dist < minDistance) {
              minDistance = dist;
              bestNeighbor = { cx: nCenterX, cy: nCenterY, targetDist };
            }
          }

          if (bestNeighbor) {
            const dx = curCenterX - bestNeighbor.cx;
            const dy = curCenterY - bestNeighbor.cy;
            const angle = Math.atan2(dy, dx);
            const projCenterX = bestNeighbor.cx + bestNeighbor.targetDist * Math.cos(angle);
            const projCenterY = bestNeighbor.cy + bestNeighbor.targetDist * Math.sin(angle);
            finalX = projCenterX - nodeW / 2;
            finalY = projCenterY - nodeH / 2;
          }
        }
      }

      moveNodes({
        [node.id]: {
          x: Math.round(finalX),
          y: Math.round(finalY),
        },
      });

      setDragOverrides((prev) => {
        if (!prev[node.id]) return prev;
        const next = { ...prev };
        delete next[node.id];
        return next;
      });
    },
    [keepProportion, scale.pxPerUnit, graph.edges, graph.nodes, moveNodes],
  );

  // Derivar los nodos que recibe React Flow: store (rfNodes) + overrides de arrastre + medidas
  const nodes: Node[] = useMemo(() => {
    return rfNodes.map((n) => {
      const overridePos = dragOverrides[n.id];
      const measured = nodeDimensions[n.id];

      if (!overridePos && !measured) {
        return n;
      }

      return {
        ...n,
        position: overridePos ? { ...overridePos } : n.position,
        measured: measured ? { ...measured } : n.measured,
      };
    });
  }, [rfNodes, dragOverrides, nodeDimensions]);

  return (
    <div className="relative flex-1 w-full overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
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
          position="bottom-left"
          className="!m-3 !overflow-hidden !rounded-lg !border !border-slate-200 !bg-white/95 !shadow-md dark:!border-slate-700 dark:!bg-slate-800/95 [&>button]:!border-b [&>button]:!border-slate-200 dark:[&>button]:!border-slate-700 [&>button]:!bg-white dark:[&>button]:!bg-slate-800 [&>button]:!text-slate-700 dark:[&>button]:!text-slate-200 [&>button:hover]:!bg-slate-100 dark:[&>button:hover]:!bg-slate-700 [&>button>svg]:!fill-current"
        />
        {isMapMode && <MapOrientationAndScale nodes={graphNodes} />}
      </ReactFlow>
    </div>
  );
}

export default function Canvas() {
  const graph = useApp((s) => s.graph);
  const mode = useApp((s) => s.mode);
  const graphName = useApp((s) => s.graphName);
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
  const selectedNodeIds = useApp((s) => s.selectedNodeIds);
  const selectedEdgeIds = useApp((s) => s.selectedEdgeIds);

  const [edgeDialogState, setEdgeDialogState] = useState<{
    isOpen: boolean;
    sourceId: string;
    targetId: string;
    isSelfLoop?: boolean;
    canSelectEndpoints?: boolean;
  }>({
    isOpen: false,
    sourceId: '',
    targetId: '',
    isSelfLoop: false,
    canSelectEndpoints: false,
  });

  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const { zoom } = useViewport();
  const viewportWidth = useStore((st) => st.width);

  const isMapMode = useMemo(() => graph.nodes.some((n) => n.lat != null && n.lon != null), [graph.nodes]);
  const edgeWeightsMode = useUiStore((s) => s.edgeWeightsMode);
  const setEdgeWeightsMode = useUiStore((s) => s.setEdgeWeightsMode);

  // Determinar aristas y nodos en la ruta activa resaltada
  // Si no hay selección explícita y hay empates en shortest (shortest.length > 1),
  // se resaltan todas las rutas empatadas: la primera sólida y las demás discontinuas.
  const { activePathEdges, dashedPathEdges, activePathNodes } = useMemo(() => {
    const activeEdges = new Set<string>();
    const dashedEdges = new Set<string>();
    const activeNodes = new Set<string>();

    if (highlightedPath) {
      if (highlightedPath.from === 'all' && allPaths.result?.paths[highlightedPath.index]) {
        const p = allPaths.result.paths[highlightedPath.index]!;
        for (const e of p.edges) activeEdges.add(e);
        for (const n of p.nodes) activeNodes.add(n);
      } else if (highlightedPath.from === 'shortest' && shortest?.[highlightedPath.index]) {
        const p = shortest[highlightedPath.index]!;
        for (const e of p.edges) activeEdges.add(e);
        for (const n of p.nodes) activeNodes.add(n);
      }
    } else if (shortest && shortest.length > 0) {
      // Sin selección explícita: primera ruta con trazo sólido
      const first = shortest[0];
      if (first) {
        for (const e of first.edges) activeEdges.add(e);
        for (const n of first.nodes) activeNodes.add(n);
      }
      // Rutas empatadas adicionales con trazo discontinuo
      if (shortest.length > 1) {
        for (let i = 1; i < shortest.length; i++) {
          const other = shortest[i];
          if (!other) continue;
          for (const n of other.nodes) activeNodes.add(n);
          for (const e of other.edges) {
            if (!activeEdges.has(e)) {
              dashedEdges.add(e);
            }
          }
        }
      }
    }

    return {
      activePathEdges: activeEdges,
      dashedPathEdges: dashedEdges,
      activePathNodes: activeNodes,
    };
  }, [highlightedPath, allPaths.result, shortest]);

  // Paso actual en reproducción
  const currentStep = dijkstra?.steps[playback.stepIndex];
  const currentStepCurrent = currentStep?.current;
  const currentStepEvaluated = currentStep?.evaluatedEdges;
  const currentStepPermanent = currentStep?.permanent;
  const treeEdgesSet = useMemo(() => new Set(dijkstra?.treeEdges ?? []), [dijkstra?.treeEdges]);
  const evaluatedEdgesSet = useMemo(() => new Set(currentStepEvaluated ?? []), [currentStepEvaluated]);
  const permanentNodesSet = useMemo(() => new Set(currentStepPermanent ?? []), [currentStepPermanent]);

  // Colocación de nombres y pesos del mapa según el zoom (cuantizado a pasos de 0.05).
  const zoomStep = Math.round(zoom * 20) / 20;
  const mapLayout = useMemo(() => {
    const priority = [
      ...(query?.source ? [query.source] : []),
      ...(query?.kind === 'path' && query.target ? [query.target] : []),
      ...activePathNodes,
      ...(currentStepCurrent ? [currentStepCurrent] : []),
      ...selectedNodeIds,
    ];
    const weightEdges = new Set<string>([
      ...activePathEdges,
      ...dashedPathEdges,
      ...(query?.kind === 'tree' ? treeEdgesSet : []),
      ...evaluatedEdgesSet,
      ...selectedEdgeIds,
    ]);
    return computeMapLabelLayout(
      graph.nodes,
      graph.edges,
      zoomStep,
      priority,
      weightEdges,
      graph.unit || 'km',
      viewportWidth,
    );
  }, [
    graph.nodes,
    graph.edges,
    graph.unit,
    zoomStep,
    viewportWidth,
    query,
    activePathNodes,
    activePathEdges,
    dashedPathEdges,
    treeEdgesSet,
    evaluatedEdgesSet,
    currentStepCurrent,
    selectedNodeIds,
    selectedEdgeIds,
  ]);
  const labelPlacements = mapLayout.placements;

  // Mapear nodos de Graph a ReactFlow Nodes (base del store)
  const rfNodes: Node[] = useMemo(() => {
    return graph.nodes.map((n) => {
      const isOrigin = query?.source === n.id;
      const isTarget = query?.kind === 'path' && query?.target === n.id;
      const isCurrent = currentStepCurrent === n.id;
      const isPermanent = permanentNodesSet.has(n.id);
      const isOnPath = activePathNodes.has(n.id);
      const dist = dijkstra?.labels[n.id]?.dist;
      const isNodeMap = Boolean(n.lat != null && n.lon != null);

      return {
        id: n.id,
        type: 'customNode',
        position: { x: n.x, y: n.y },
        style: { width: n.w, height: n.h },
        selected: selectedNodeIds.includes(n.id),
        data: {
          label: n.label,
          isOrigin,
          isTarget,
          isCurrent,
          isPermanent,
          isOnPath,
          dist,
          isMapMode: isNodeMap,
          labelPosition: labelPlacements[n.id] || 'right',
          labelHidden: mapLayout.hiddenLabels.has(n.id),
        },
      };
    });
  }, [
    graph.nodes,
    query,
    currentStepCurrent,
    permanentNodesSet,
    activePathNodes,
    dijkstra?.labels,
    selectedNodeIds,
    labelPlacements,
    mapLayout,
  ]);

  // Mapear aristas de Graph a ReactFlow Edges
  const rfEdges: Edge[] = useMemo(() => {
    return graph.edges.map((e) => {
      const isSolidPath = activePathEdges.has(e.id);
      const isDashedPath = dashedPathEdges.has(e.id);
      const isOnPath = isSolidPath || isDashedPath;
      const isTiedDashed = isDashedPath;
      const isTreeEdge = query?.kind === 'tree' && treeEdgesSet.has(e.id);
      const isEvaluated = evaluatedEdgesSet.has(e.id);

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'customEdge',
        selected: selectedEdgeIds.includes(e.id),
        data: {
          weight: e.weight,
          shape: e.shape,
          shapeAuto: e.shapeAuto,
          isOnPath,
          isTiedDashed,
          isTreeEdge,
          isEvaluated,
          unit: graph.unit || 'km',
          isMapMode,
          weightHidden: mapLayout.hiddenWeights.has(e.id),
        },
      };
    });
  }, [
    mapLayout,
    graph.edges,
    graph.unit,
    activePathEdges,
    dashedPathEdges,
    treeEdgesSet,
    evaluatedEdgesSet,
    selectedEdgeIds,
    isMapMode,
    query?.kind,
  ]);

  // Manejador de conexión de nuevas aristas al arrastrar
  const onConnect = useCallback(
    (params: Connection) => {
      if (mode !== 'design') return;
      if (!params.source || !params.target) return;
      setEdgeDialogState({
        isOpen: true,
        sourceId: params.source,
        targetId: params.target,
        isSelfLoop: params.source === params.target,
        canSelectEndpoints: false,
      });
    },
    [mode],
  );

  const handleAddNodeClick = () => {
    // Añadir nodo en una posición visible
    const x = Math.round(200 + Math.random() * 300);
    const y = Math.round(150 + Math.random() * 250);
    addNode({ x, y });
  };

  return (
    <div
      ref={canvasWrapperRef}
      className="relative flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950"
      data-testid="graph-canvas"
    >
      {/* Barra Superior de Herramientas y Consulta del Lienzo */}
      <div
        data-testid="canvas-toolbar"
        className="shrink-0 z-10 flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-white/95 px-3 py-1.5 shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95"
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
          <label htmlFor="select-source-node" className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
              <label htmlFor="select-target-node" className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
          <div
            data-testid="path-distance-badge"
            className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 shadow-xs dark:bg-purple-950 dark:text-purple-300"
          >
            {highlightedPath?.from === 'shortest' && shortest[highlightedPath.index]
              ? `${shortest[highlightedPath.index]!.distance} ${graph.unit || 'km'}${shortest.length > 1 ? ` · Ruta ${highlightedPath.index + 1} de ${shortest.length}` : ''}`
              : !highlightedPath && shortest.length > 1
                ? `${shortest[0].distance} ${graph.unit || 'km'} · ${shortest.length} rutas empatadas`
                : `${shortest[0].distance} ${graph.unit || 'km'}`}
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
              data-testid="btn-add-edge"
              onClick={() => {
                if (graph.nodes.length < 2) return;
                const src = selectedNodeIds[0] ?? graph.nodes[0]!.id;
                const tgt = selectedNodeIds[1] ?? graph.nodes.find((n) => n.id !== src)?.id ?? graph.nodes[1]!.id;
                setEdgeDialogState({
                  isOpen: true,
                  sourceId: src,
                  targetId: tgt,
                  isSelfLoop: false,
                  canSelectEndpoints: true,
                });
              }}
              aria-label="Agregar una nueva carretera entre nodos"
              className="flex min-h-[44px] items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden"
            >
              <span>+</span> Carretera
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
            <label className="flex min-h-[44px] cursor-pointer items-center gap-1.5 px-2 text-xs font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                data-testid="toggle-keep-proportion"
                aria-label="Mantener proporción"
                checked={keepProportion}
                onChange={(e) => setKeepProportion(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="whitespace-nowrap">Mantener proporción</span>
            </label>
          </>
        )}

        {/* Selector de visibilidad de pesos de aristas */}
        <div className="flex items-center gap-1 pl-1">
          <label htmlFor="select-edge-weights-mode" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Pesos:
          </label>
          <select
            id="select-edge-weights-mode"
            data-testid="select-edge-weights-mode"
            value={edgeWeightsMode}
            onChange={(e) => setEdgeWeightsMode(e.target.value as EdgeWeightsMode)}
            aria-label="Visibilidad de pesos de aristas"
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="auto">Pesos: automático</option>
            <option value="all">Pesos: todos</option>
            <option value="hidden">Pesos: ocultos</option>
          </select>
        </div>

        {/* Badges de Escala y Error de Ajuste (F6) */}
        <div
          data-testid="scale-badge"
          className="hidden md:flex min-h-[44px] items-center rounded-lg bg-slate-100 px-2.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          title={`Magnitud: ${scale.magnitude} · Mediana: ${(160 / scale.pxPerUnit).toFixed(1)} ${graph.unit || 'km'}`}
        >
          Escala: {scale.range}
        </div>

        <div
          data-testid="stress-error-badge"
          className="hidden md:flex min-h-[44px] items-center rounded-lg bg-slate-100 px-2.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          title="Error de proyección stress majorization: no todos los pesos son representables en un plano 2D"
        >
          Ajuste 2D: {layoutSuggestion?.stressError ?? 0}%
        </div>
      </div>

      {/* Contenedor del Lienzo ReactFlow - remontado por identidad de grafo (mode + graphName) */}
      <CanvasFlow
        key={`${mode}-${graphName}`}
        rfNodes={rfNodes}
        rfEdges={rfEdges}
        onConnect={onConnect}
        canvasWrapperRef={canvasWrapperRef}
        isMapMode={isMapMode}
        graphNodes={graph.nodes}
      />

      <EdgeDialog
        isOpen={edgeDialogState.isOpen}
        onClose={() => setEdgeDialogState((prev) => ({ ...prev, isOpen: false }))}
        sourceId={edgeDialogState.sourceId}
        targetId={edgeDialogState.targetId}
        isSelfLoop={edgeDialogState.isSelfLoop}
        canSelectEndpoints={edgeDialogState.canSelectEndpoints}
      />
    </div>
  );
}
