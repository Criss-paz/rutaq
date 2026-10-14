/**
 * CONTRATO DEL STORE — v1 (congelado en F0). Dueño: Claude Code.
 * La UI (Antigravity) lee estado y llama acciones SOLO a través de esta interfaz; puede
 * construir un mock que la implemente mientras el store real se integra.
 */
import type {
  AllPathsResult,
  DijkstraResult,
  EdgeShape,
  FloydResult,
  Graph,
  GraphFile,
  LayoutSuggestion,
  NodeId,
  PathResult,
  ScaleInfo,
  TabularConfig,
  TabularModel,
  ValidationResult,
} from '../core/types';

export type AppMode = 'quetzaltenango' | 'design';
export type ResultTab = 'tabla' | 'grafica' | 'rutas' | 'floyd';
export type Theme = 'light' | 'dark' | 'system';

/** F2 = árbol desde un nodo; F3 = ruta entre dos nodos (target null mientras se elige). */
export type Query = { kind: 'tree'; source: NodeId } | { kind: 'path'; source: NodeId; target: NodeId | null };

export type JobStatus = 'idle' | 'running' | 'done' | 'cancelled' | 'error';

export interface AllPathsState {
  status: JobStatus;
  /** Rutas encontradas hasta ahora (progreso del Worker). */
  found: number;
  result: AllPathsResult | null;
  error: string | null;
}

/** Reproducción de la tabla S1; `stepIndex` indexa `dijkstra.steps` y sincroniza lienzo ↔ tabla. */
export interface PlaybackState {
  stepIndex: number;
  playing: boolean;
  /** Milisegundos entre pasos al reproducir. */
  speedMs: number;
}

export type AddEdgeResult =
  | { ok: true; edgeId: string }
  | { ok: false; reason: 'self-loop' | 'invalid-weight' | 'missing-node' }
  /** Ya existe arista entre el par: la UI ofrece editar `existingEdgeId`. */
  | { ok: false; reason: 'duplicate'; existingEdgeId: string };

export type ImportResult = { ok: true } | { ok: false; message: string };

export interface AppState {
  // ── Datos ──
  mode: AppMode;
  graph: Graph;
  graphName: string;
  validation: ValidationResult;
  scale: ScaleInfo;

  // ── Selección y consulta ──
  selectedNodeIds: NodeId[];
  selectedEdgeIds: string[];
  query: Query | null;

  // ── Resultados (se recalculan al cambiar graph o query) ──
  dijkstra: DijkstraResult | null;
  tabular: TabularModel | null;
  /** Rutas mínimas empatadas de F3 ([] = no existe ruta; null = sin consulta F3 completa). */
  shortest: PathResult[] | null;
  floyd: FloydResult | null;
  allPaths: AllPathsState;
  /** Índice en `allPaths.result.paths` (o en `shortest` si viene de empates) resaltado en el lienzo. */
  highlightedPath: { from: 'shortest' | 'all'; index: number } | null;
  playback: PlaybackState;
  layoutSuggestion: LayoutSuggestion | null;

  // ── Preferencias de UI ──
  activeTab: ResultTab;
  tabularConfig: TabularConfig;
  allPathsLimit: number;
  theme: Theme;
  keepProportion: boolean;

  // ── Acciones: modo y archivos ──
  setMode(mode: AppMode): void;
  loadTemplate(template: 'quetzaltenango' | 'ejemplo6' | 'vacio'): void;
  exportGraphFile(): GraphFile;
  importGraphFile(json: string): ImportResult;

  // ── Acciones: edición (modo diseño; todas registran deshacer/rehacer) ──
  addNode(at: { x: number; y: number }, label?: string): NodeId;
  moveNodes(moves: Record<NodeId, { x: number; y: number }>): void;
  resizeNode(id: NodeId, size: { x: number; y: number; w: number; h: number }): void;
  renameNode(id: NodeId, label: string): void;
  removeNodes(ids: NodeId[]): void;
  addEdge(source: NodeId, target: NodeId, weight: number): AddEdgeResult;
  setEdgeWeight(id: string, weight: number): boolean;
  /** `ids = 'all'` cambia todas; deja `shapeAuto = false` en las afectadas. */
  setEdgeShape(ids: string[] | 'all', shape: EdgeShape): void;
  /** Vuelve a `shapeAuto = true` y recalcula la forma automática. */
  resetEdgeShapeAuto(ids: string[] | 'all'): void;
  removeEdges(ids: string[]): void;
  applySuggestedLayout(): Promise<void>;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // ── Acciones: selección y consulta ──
  select(nodeIds: NodeId[], edgeIds: string[]): void;
  setTreeQuery(source: NodeId): void;
  setPathQuery(source: NodeId, target: NodeId | null): void;
  clearQuery(): void;

  // ── Acciones: reproducción S1 ──
  stepTo(index: number): void;
  nextStep(): void;
  prevStep(): void;
  play(): void;
  pause(): void;
  toEnd(): void;
  setSpeed(ms: number): void;

  // ── Acciones: S3 ──
  runAllPaths(): void;
  cancelAllPaths(): void;
  setAllPathsLimit(limit: number): void;
  highlightPath(sel: AppState['highlightedPath']): void;

  // ── Acciones: preferencias ──
  setActiveTab(tab: ResultTab): void;
  setTabularConfig(patch: Partial<TabularConfig>): void;
  setTheme(theme: Theme): void;
  setKeepProportion(on: boolean): void;
}
