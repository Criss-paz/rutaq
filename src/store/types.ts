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
  GuatemalaDataset,
  LayoutSuggestion,
  MSTResult,
  NodeId,
  PathResult,
  RouteBreakdown,
  ScaleInfo,
  TabularConfig,
  TabularModel,
  TourResult,
  ValidationResult,
} from '../core/types';

/** `guatemala` = módulo Transporte Express (Proyecto II). */
export type AppMode = 'quetzaltenango' | 'guatemala' | 'design';
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

// ───────────────────────────── Proyecto II — Transporte Express ─────────────────────────────

export type Template = 'quetzaltenango' | 'guatemala' | 'ejemplo6' | 'ejemplo_mst' | 'vacio';

/** G4: qué responde «recorrer y conectar todos los nodos». */
export type CoverMode = 'mst' | 'spt' | 'tour';

export interface DepartmentInput {
  label: string;
  cabecera: string;
  /** Si hay lat y lon, el punto se proyecta en su posición real; si no, se coloca en `at` (centro, px del lienzo). */
  lat?: number;
  lon?: number;
  at?: { x: number; y: number };
}

export type AddDepartmentResult =
  { ok: true; id: NodeId } | { ok: false; reason: 'empty-name' | 'duplicate-name' | 'invalid-coords' };

export interface TourState {
  status: JobStatus;
  start: NodeId | null;
  result: TourResult | null;
  error: string | null;
}

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
  loadTemplate(template: Template): void;
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

  // ── Proyecto II: Transporte Express (estado) ──
  /** Cabecera de cada departamento del módulo Guatemala (vacío en los otros modos). */
  departments: Record<NodeId, { cabecera: string }>;
  /** Contorno del país proyectado al lienzo (anillos de puntos en px), solo en modo `guatemala`. */
  outline: { x: number; y: number }[][] | null;
  /** Desglose de cada ruta mínima de `shortest` (mismo índice): listado, tramos, acumulados y fórmula. */
  breakdown: RouteBreakdown[] | null;
  coverMode: CoverMode;
  /** Árbol de expansión mínima con ambos algoritmos (deben dar el mismo total). */
  mst: { prim: MSTResult; kruskal: MSTResult } | null;
  /** Nodo de inicio de Prim (por defecto el primero). */
  mstStart: NodeId | null;
  tour: TourState;

  // ── Proyecto II: Transporte Express (acciones; editar registra deshacer/rehacer y autoguarda) ──
  addDepartment(input: DepartmentInput): AddDepartmentResult;
  /** Cambia nombre, cabecera o coordenadas (si cambian lat/lon, el punto se reubica). */
  updateDepartment(id: NodeId, patch: Partial<Omit<DepartmentInput, 'at'>>): AddDepartmentResult;
  /** Carretera bidireccional con nombre opcional (CA-1, CA-9…). Mismas validaciones que `addEdge`. */
  addRoad(source: NodeId, target: NodeId, km: number, road?: string): AddEdgeResult;
  updateRoad(id: string, patch: { km?: number; road?: string }): boolean;
  /** Descarta los cambios guardados del módulo Guatemala y vuelve al dataset original. */
  restoreOriginal(): void;
  /** Exporta el módulo Guatemala como `GuatemalaDataset` (conserva cabeceras y coordenadas). */
  exportGuatemalaDataset(): GuatemalaDataset;
  setCoverMode(mode: CoverMode): void;
  setMstStart(id: NodeId): void;
  runTour(start: NodeId): void;
  cancelTour(): void;
  /** Proyecta lat/lon con la proyección del mapa actual (centro del punto en px); null si el grafo no es geográfico. */
  projectLatLon(lat: number, lon: number): { x: number; y: number } | null;

  // ── Acciones: preferencias ──
  setActiveTab(tab: ResultTab): void;
  setTabularConfig(patch: Partial<TabularConfig>): void;
  setTheme(theme: Theme): void;
  setKeepProportion(on: boolean): void;
}
