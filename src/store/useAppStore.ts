import { create } from 'zustand';
import { temporal, type TemporalState } from 'zundo';
import * as Comlink from 'comlink';
import {
  autoEdgeShapes,
  buildTabular,
  detectScale,
  dijkstra,
  floydWarshall,
  shortestPaths,
  validateGraph,
} from '../core';
import type { CoreWorkerApi, Dataset, GEdge, Graph, GraphFile, NodeId, TabularConfig, ValidationResult } from '../core';
import { DEFAULT_NODE_SIZE, datasetToGraph } from './dataset';
import type { AllPathsState, AppMode, AppState, Query, Theme } from './types';

// ───────────────────────────── Datos empaquetados ─────────────────────────────

// glob (y no import directo) para que el build no falle mientras Gemini entrega los JSON.
const dataFiles = import.meta.glob<{ default: unknown }>('../data/*.json', { eager: true });
const dataFile = (name: string): unknown => dataFiles[`../data/${name}.json`]?.default;

const EMPTY_GRAPH: Graph = { nodes: [], edges: [], directed: false, unit: 'km' };

function templateGraph(t: 'quetzaltenango' | 'ejemplo6' | 'vacio'): { graph: Graph; name: string } {
  if (t === 'quetzaltenango') {
    const ds = dataFile('quetzaltenango') as Dataset | undefined;
    return { graph: ds ? datasetToGraph(ds) : EMPTY_GRAPH, name: ds?.meta.nombre ?? 'Quetzaltenango (sin datos)' };
  }
  if (t === 'ejemplo6') {
    const f = dataFile('ejemplo6') as GraphFile | undefined;
    return { graph: f?.graph ?? EMPTY_GRAPH, name: f?.name ?? 'Ejemplo de 6 nodos (sin datos)' };
  }
  return { graph: { ...EMPTY_GRAPH, unit: 'u' }, name: 'Mapa nuevo' };
}

// ───────────────────────────── Persistencia local ─────────────────────────────

const KEY_DESIGN = 'rutaq:design';
const KEY_PREFS = 'rutaq:prefs';

const storage = typeof localStorage === 'undefined' ? null : localStorage;

function readJson<T>(key: string): T | null {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Cuota llena o modo privado: el autoguardado es opcional.
  }
}

// ───────────────────────────── Derivados ─────────────────────────────

/** Ejecuta una función del núcleo sin dejar que un error rompa la UI. */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    console.warn('[RutaQ]', e instanceof Error ? e.message : e);
    return fallback;
  }
}

const NOT_VALIDATED: ValidationResult = { ok: false, issues: [] };

function applyAutoShapes(g: Graph): Graph {
  const shapes = safe(() => autoEdgeShapes(g), {});
  if (!g.edges.some((e) => e.shapeAuto && shapes[e.id] && shapes[e.id] !== e.shape)) return g;
  return { ...g, edges: g.edges.map((e) => (e.shapeAuto && shapes[e.id] ? { ...e, shape: shapes[e.id]! } : e)) };
}

/** Recalcula validación, escala y resultados a partir de (graph, query). */
function derive(graph: Graph, query: Query | null) {
  const ids = new Set(graph.nodes.map((n) => n.id));
  if (query && (!ids.has(query.source) || (query.kind === 'path' && query.target && !ids.has(query.target)))) {
    query = null;
  }
  const validation = safe(() => validateGraph(graph), NOT_VALIDATED);
  const scale = safe(() => detectScale(graph.edges.map((e) => e.weight)), { magnitude: 1, range: '—', pxPerUnit: 1 });
  const solvable = validation.ok && graph.nodes.length > 0;

  const floyd = solvable ? safe(() => floydWarshall(graph), null) : null;
  const dj = solvable && query ? safe(() => dijkstra(graph, query.source), null) : null;
  const tabular = dj ? safe(() => buildTabular(graph, dj), null) : null;
  const shortest =
    solvable && query?.kind === 'path' && query.target
      ? safe(() => shortestPaths(graph, query.source, query.target!), null)
      : null;

  return {
    query,
    validation,
    scale,
    floyd,
    dijkstra: dj,
    tabular,
    shortest,
    highlightedPath: null,
    allPaths: IDLE_ALL_PATHS,
    // Por defecto se muestra la solución completa; «Reproducir» reinicia desde la iteración 0.
    playback: { stepIndex: dj ? dj.steps.length - 1 : 0, playing: false, speedMs },
  };
}

const IDLE_ALL_PATHS: AllPathsState = { status: 'idle', found: 0, result: null, error: null };

let speedMs = 900;

// ───────────────────────────── Worker de S3 / layout ─────────────────────────────

let worker: Worker | null = null;
let workerApi: Comlink.Remote<CoreWorkerApi> | null = null;

function getWorker(): Comlink.Remote<CoreWorkerApi> {
  if (!workerApi) {
    worker = new Worker(new URL('../core/worker.ts', import.meta.url), { type: 'module' });
    workerApi = Comlink.wrap<CoreWorkerApi>(worker);
  }
  return workerApi;
}

/** Cancelar = terminar el Worker (corta un DFS en curso de inmediato); el próximo uso crea otro. */
function killWorker() {
  worker?.terminate();
  worker = null;
  workerApi = null;
}

let allPathsRun = 0;
let playTimer: ReturnType<typeof setInterval> | null = null;

function stopTimer() {
  if (playTimer) clearInterval(playTimer);
  playTimer = null;
}

// ───────────────────────────── Utilidades de edición ─────────────────────────────

function nextNodeId(g: Graph): NodeId {
  let i = g.nodes.length + 1;
  const ids = new Set(g.nodes.map((n) => n.id));
  while (ids.has(`n${i}`)) i++;
  return `n${i}`;
}

/** A, B, …, Z, AA, AB… — la primera etiqueta que no esté en uso. */
function nextLabel(g: Graph): string {
  const used = new Set(g.nodes.map((n) => n.label));
  for (let i = 0; ; i++) {
    let s = '';
    for (let k = i; k >= 0; k = Math.floor(k / 26) - 1) s = String.fromCharCode(65 + (k % 26)) + s;
    if (!used.has(s)) return s;
  }
}

const samePair = (e: GEdge, a: NodeId, b: NodeId) =>
  (e.source === a && e.target === b) || (e.source === b && e.target === a);

const validWeight = (w: number) => Number.isFinite(w) && w > 0;

function isGraph(v: unknown): v is Graph {
  const g = v as Graph;
  return (
    !!g &&
    Array.isArray(g.nodes) &&
    Array.isArray(g.edges) &&
    g.nodes.every((n) => typeof n.id === 'string' && Number.isFinite(n.x) && Number.isFinite(n.y)) &&
    g.edges.every((e) => typeof e.id === 'string' && typeof e.source === 'string' && typeof e.weight === 'number')
  );
}

/** Completa campos opcionales de un grafo importado (tamaño, forma, unidad). */
function normalizeGraph(g: Graph): Graph {
  return {
    directed: false,
    unit: typeof g.unit === 'string' && g.unit ? g.unit : 'u',
    nodes: g.nodes.map((n) => ({
      ...n,
      label: typeof n.label === 'string' ? n.label : n.id,
      w: Number.isFinite(n.w) && n.w > 0 ? n.w : DEFAULT_NODE_SIZE.w,
      h: Number.isFinite(n.h) && n.h > 0 ? n.h : DEFAULT_NODE_SIZE.h,
    })),
    edges: g.edges.map((e) => ({ ...e, shape: e.shape ?? 'straight', shapeAuto: e.shapeAuto ?? true })),
  };
}

// ───────────────────────────── Tema ─────────────────────────────

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const dark =
    theme === 'dark' ||
    (theme === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

// ───────────────────────────── Store ─────────────────────────────

const DEFAULT_TABULAR: TabularConfig = {
  showAdjacency: true,
  labelFormat: 'paren',
  crossOut: 'column',
  repeatPermanent: false,
};

interface Prefs {
  theme: Theme;
  tabularConfig: TabularConfig;
  allPathsLimit: number;
  keepProportion: boolean;
  mode: AppMode;
}

const prefs = readJson<Partial<Prefs>>(KEY_PREFS) ?? {};

function initialGraph(mode: AppMode) {
  if (mode === 'design') {
    const saved = readJson<GraphFile>(KEY_DESIGN);
    if (saved && isGraph(saved.graph)) return { graph: normalizeGraph(saved.graph), name: saved.name };
    return templateGraph('ejemplo6');
  }
  return templateGraph('quetzaltenango');
}

const initialMode: AppMode = prefs.mode ?? 'quetzaltenango';
const initial = initialGraph(initialMode);
const initialG = applyAutoShapes(initial.graph);

/** Historial de deshacer/rehacer (con tipo explícito para evitar la referencia circular). */
function history(): TemporalState<{ graph: Graph }> {
  return useAppStore.temporal.getState();
}

export const useAppStore = create<AppState>()(
  temporal(
    (set, get) => {
      /** Cambia el grafo y recalcula todo lo derivado en un solo `set` (= una entrada de historial). */
      const commitGraph = (graph: Graph, extra: Partial<AppState> = {}) => {
        stopTimer();
        killWorkerIfRunning();
        const g = applyAutoShapes(graph);
        set({ graph: g, layoutSuggestion: null, ...derive(g, get().query), ...extra });
      };

      const killWorkerIfRunning = () => {
        if (get().allPaths.status === 'running') {
          allPathsRun++;
          killWorker();
        }
      };

      const setQuery = (query: Query | null) => {
        stopTimer();
        killWorkerIfRunning();
        set(derive(get().graph, query));
      };

      /** Reemplaza el grafo sin dejar historial (cambio de modo, plantilla, importación). */
      const replaceGraph = (graph: Graph, name: string, extra: Partial<AppState> = {}) => {
        stopTimer();
        killWorkerIfRunning();
        const g = applyAutoShapes(graph);
        set({
          graph: g,
          graphName: name,
          selectedNodeIds: [],
          selectedEdgeIds: [],
          layoutSuggestion: null,
          ...derive(g, null),
          ...extra,
        });
        history().clear();
      };

      return {
        mode: initialMode,
        graph: initialG,
        graphName: initial.name,
        selectedNodeIds: [],
        selectedEdgeIds: [],
        layoutSuggestion: null,
        activeTab: 'grafica',
        tabularConfig: { ...DEFAULT_TABULAR, ...prefs.tabularConfig },
        allPathsLimit: prefs.allPathsLimit ?? 5000,
        theme: prefs.theme ?? 'system',
        keepProportion: prefs.keepProportion ?? false,
        ...derive(initialG, null),

        // ── Modo y archivos ──
        setMode(mode) {
          if (mode === get().mode) return;
          const t = initialGraph(mode);
          replaceGraph(t.graph, t.name, { mode });
        },
        loadTemplate(template) {
          const t = templateGraph(template);
          replaceGraph(t.graph, t.name, { mode: template === 'quetzaltenango' ? 'quetzaltenango' : 'design' });
        },
        exportGraphFile() {
          const { graph, graphName } = get();
          return { format: 'rutaq-graph', version: 1, name: graphName, graph };
        },
        importGraphFile(json) {
          let data: unknown;
          try {
            data = JSON.parse(json);
          } catch {
            return { ok: false, message: 'El archivo no es un JSON válido.' };
          }
          const f = data as Partial<GraphFile> & Partial<Dataset>;
          let graph: Graph | null = null;
          let name = 'Mapa importado';
          if (f.format === 'rutaq-graph' && isGraph(f.graph)) {
            graph = normalizeGraph(f.graph);
            name = typeof f.name === 'string' ? f.name : name;
          } else if (f.meta && Array.isArray(f.nodes) && Array.isArray(f.edges)) {
            graph = datasetToGraph(f as Dataset);
            name = f.meta.nombre ?? name;
          }
          if (!graph) return { ok: false, message: 'El archivo no tiene el formato de un mapa de RutaQ.' };
          replaceGraph(graph, name, { mode: 'design' });
          return { ok: true };
        },

        // ── Edición ──
        addNode(at, label) {
          const g = get().graph;
          const id = nextNodeId(g);
          const node = {
            id,
            label: label?.trim() || nextLabel(g),
            x: at.x - DEFAULT_NODE_SIZE.w / 2,
            y: at.y - DEFAULT_NODE_SIZE.h / 2,
            ...DEFAULT_NODE_SIZE,
          };
          commitGraph({ ...g, nodes: [...g.nodes, node] });
          return id;
        },
        moveNodes(moves) {
          const g = get().graph;
          commitGraph({ ...g, nodes: g.nodes.map((n) => (moves[n.id] ? { ...n, ...moves[n.id] } : n)) });
        },
        resizeNode(id, box) {
          const g = get().graph;
          commitGraph({
            ...g,
            nodes: g.nodes.map((n) =>
              n.id === id ? { ...n, ...box, w: Math.max(40, box.w), h: Math.max(28, box.h) } : n,
            ),
          });
        },
        renameNode(id, label) {
          const g = get().graph;
          const clean = label.trim();
          if (!clean) return;
          commitGraph({ ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, label: clean } : n)) });
        },
        removeNodes(ids) {
          const g = get().graph;
          const del = new Set(ids);
          commitGraph(
            {
              ...g,
              nodes: g.nodes.filter((n) => !del.has(n.id)),
              edges: g.edges.filter((e) => !del.has(e.source) && !del.has(e.target)),
            },
            { selectedNodeIds: [], selectedEdgeIds: [] },
          );
        },
        addEdge(source, target, weight) {
          const g = get().graph;
          if (source === target) return { ok: false, reason: 'self-loop' };
          if (!g.nodes.some((n) => n.id === source) || !g.nodes.some((n) => n.id === target))
            return { ok: false, reason: 'missing-node' };
          if (!validWeight(weight)) return { ok: false, reason: 'invalid-weight' };
          const dup = g.edges.find((e) => samePair(e, source, target));
          if (dup) return { ok: false, reason: 'duplicate', existingEdgeId: dup.id };
          const ids = new Set(g.edges.map((e) => e.id));
          let id = `${source}-${target}`;
          for (let i = 2; ids.has(id); i++) id = `${source}-${target}-${i}`;
          commitGraph({
            ...g,
            edges: [...g.edges, { id, source, target, weight, shape: 'straight', shapeAuto: true }],
          });
          return { ok: true, edgeId: id };
        },
        setEdgeWeight(id, weight) {
          const g = get().graph;
          if (!validWeight(weight) || !g.edges.some((e) => e.id === id)) return false;
          commitGraph({ ...g, edges: g.edges.map((e) => (e.id === id ? { ...e, weight } : e)) });
          return true;
        },
        setEdgeShape(ids, shape) {
          const g = get().graph;
          const hit = (e: GEdge) => ids === 'all' || ids.includes(e.id);
          commitGraph({ ...g, edges: g.edges.map((e) => (hit(e) ? { ...e, shape, shapeAuto: false } : e)) });
        },
        resetEdgeShapeAuto(ids) {
          const g = get().graph;
          const hit = (e: GEdge) => ids === 'all' || ids.includes(e.id);
          commitGraph({
            ...g,
            edges: g.edges.map((e) => (hit(e) ? { ...e, shape: 'straight', shapeAuto: true } : e)),
          });
        },
        removeEdges(ids) {
          const g = get().graph;
          const del = new Set(ids);
          commitGraph({ ...g, edges: g.edges.filter((e) => !del.has(e.id)) }, { selectedEdgeIds: [] });
        },
        async applySuggestedLayout() {
          const g = get().graph;
          if (g.nodes.length === 0) return;
          try {
            const s = await getWorker().suggestLayout(g);
            if (get().graph !== g) return; // el grafo cambió mientras se calculaba
            commitGraph(
              {
                ...g,
                nodes: g.nodes.map((n) => {
                  const p = s.positions[n.id];
                  return p ? { ...n, x: p.x - n.w / 2, y: p.y - n.h / 2 } : n;
                }),
              },
              { layoutSuggestion: s },
            );
          } catch (e) {
            console.warn('[RutaQ] distribución sugerida:', e);
          }
        },
        undo() {
          history().undo();
          set(derive(get().graph, get().query));
        },
        redo() {
          history().redo();
          set(derive(get().graph, get().query));
        },
        canUndo: () => history().pastStates.length > 0,
        canRedo: () => history().futureStates.length > 0,

        // ── Selección y consulta ──
        select(nodeIds, edgeIds) {
          set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds });
        },
        setTreeQuery(source) {
          setQuery({ kind: 'tree', source });
        },
        setPathQuery(source, target) {
          setQuery({ kind: 'path', source, target });
        },
        clearQuery() {
          setQuery(null);
        },

        // ── Reproducción S1 ──
        stepTo(index) {
          const steps = get().dijkstra?.steps.length ?? 0;
          if (steps === 0) return;
          set({ playback: { ...get().playback, stepIndex: Math.max(0, Math.min(steps - 1, index)) } });
        },
        nextStep() {
          get().stepTo(get().playback.stepIndex + 1);
        },
        prevStep() {
          get().stepTo(get().playback.stepIndex - 1);
        },
        play() {
          const last = (get().dijkstra?.steps.length ?? 0) - 1;
          if (last < 0) return;
          stopTimer();
          const start = get().playback.stepIndex >= last ? 0 : get().playback.stepIndex;
          set({ playback: { ...get().playback, stepIndex: start, playing: true } });
          playTimer = setInterval(() => {
            const { stepIndex } = get().playback;
            if (stepIndex >= last) get().pause();
            else get().stepTo(stepIndex + 1);
          }, get().playback.speedMs);
        },
        pause() {
          stopTimer();
          set({ playback: { ...get().playback, playing: false } });
        },
        toEnd() {
          get().pause();
          get().stepTo(Number.MAX_SAFE_INTEGER);
        },
        setSpeed(ms) {
          speedMs = Math.max(50, ms);
          const wasPlaying = get().playback.playing;
          set({ playback: { ...get().playback, speedMs } });
          if (wasPlaying) get().play();
        },

        // ── S3 ──
        runAllPaths() {
          const { graph, query, allPathsLimit, validation } = get();
          if (query?.kind !== 'path' || !query.target || !validation.ok) return;
          killWorkerIfRunning();
          const run = ++allPathsRun;
          set({ allPaths: { status: 'running', found: 0, result: null, error: null }, highlightedPath: null });
          const onProgress = Comlink.proxy((found: number) => {
            if (run === allPathsRun) set({ allPaths: { ...get().allPaths, found } });
          });
          getWorker()
            .allSimplePaths(graph, query.source, query.target, { limit: allPathsLimit, timeoutMs: 8000 }, onProgress)
            .then((result) => {
              if (run === allPathsRun)
                set({ allPaths: { status: 'done', found: result.totalFound, result, error: null } });
            })
            .catch((e: unknown) => {
              if (run === allPathsRun)
                set({
                  allPaths: { ...get().allPaths, status: 'error', error: e instanceof Error ? e.message : String(e) },
                });
            });
        },
        cancelAllPaths() {
          if (get().allPaths.status !== 'running') return;
          allPathsRun++;
          killWorker();
          set({ allPaths: { ...get().allPaths, status: 'cancelled' } });
        },
        setAllPathsLimit(limit) {
          if (Number.isInteger(limit) && limit > 0) set({ allPathsLimit: limit });
        },
        highlightPath(sel) {
          set({ highlightedPath: sel });
        },

        // ── Preferencias ──
        setActiveTab(tab) {
          set({ activeTab: tab });
        },
        setTabularConfig(patch) {
          set({ tabularConfig: { ...get().tabularConfig, ...patch } });
        },
        setTheme(theme) {
          set({ theme });
          applyTheme(theme);
        },
        setKeepProportion(on) {
          set({ keepProportion: on });
        },
      };
    },
    {
      // Solo el grafo entra al historial de deshacer/rehacer.
      partialize: (s) => ({ graph: s.graph }),
      equality: (a, b) => a.graph === b.graph,
      limit: 100,
    },
  ),
);

// Autoguardado del modo diseño y de las preferencias.
useAppStore.subscribe((s, prev) => {
  if (s.mode === 'design' && (s.graph !== prev.graph || s.graphName !== prev.graphName)) {
    writeJson(KEY_DESIGN, s.exportGraphFile());
  }
  if (
    s.theme !== prev.theme ||
    s.tabularConfig !== prev.tabularConfig ||
    s.allPathsLimit !== prev.allPathsLimit ||
    s.keepProportion !== prev.keepProportion ||
    s.mode !== prev.mode
  ) {
    const p: Prefs = {
      theme: s.theme,
      tabularConfig: s.tabularConfig,
      allPathsLimit: s.allPathsLimit,
      keepProportion: s.keepProportion,
      mode: s.mode,
    };
    writeJson(KEY_PREFS, p);
  }
});

applyTheme(useAppStore.getState().theme);
if (typeof matchMedia !== 'undefined') {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(useAppStore.getState().theme));
}
