import { create } from 'zustand';
import { temporal, type TemporalState } from 'zundo';
import * as Comlink from 'comlink';
import {
  autoEdgeShapes,
  buildTabular,
  detectScale,
  dijkstra,
  floydWarshall,
  kruskal,
  prim,
  routeBreakdown,
  shortestPaths,
  validateGraph,
} from '../core';
import type {
  CoreWorkerApiP2,
  Dataset,
  GEdge,
  GNode,
  Graph,
  GraphFile,
  GuatemalaDataset,
  NodeId,
  TabularConfig,
  ValidationResult,
} from '../core';
import { DATASET_NODE_SIZE, DEFAULT_NODE_SIZE, datasetToGraph, makeProjection, type GeoProjection } from './dataset';
import type { AllPathsState, AppMode, AppState, Query, Template, Theme, TourState } from './types';

// ───────────────────────────── Datos empaquetados ─────────────────────────────

// glob (y no import directo) para que el build no falle mientras Gemini entrega los JSON.
const dataFiles = import.meta.glob<{ default: unknown }>('../data/*.json', { eager: true });
const dataFile = (name: string): unknown => dataFiles[`../data/${name}.json`]?.default;

const EMPTY_GRAPH: Graph = { nodes: [], edges: [], directed: false, unit: 'km' };

// ───────────── Proyecto II: módulo Guatemala (Transporte Express) ─────────────

const guatemalaOriginal = dataFile('guatemala') as GuatemalaDataset | undefined;
/**
 * Proyección Web Mercator fija, construida con las cabeceras del dataset ORIGINAL: así un departamento agregado o
 * importado cae siempre en el mismo lugar y el contorno del país coincide con los puntos.
 */
const gtProjection: GeoProjection | null = guatemalaOriginal?.nodes.length
  ? makeProjection(guatemalaOriginal.nodes, 'mercator')
  : null;
const qtzDataset = dataFile('quetzaltenango') as Dataset | undefined;
const qtzProjection: GeoProjection | null = qtzDataset?.nodes.length
  ? makeProjection(qtzDataset.nodes, 'equirect')
  : null;

/** Grafo del módulo Guatemala con la proyección fija; devuelve también las cabeceras. */
function guatemalaToGraph(ds: GuatemalaDataset): { graph: Graph; departments: Record<NodeId, { cabecera: string }> } {
  const proj = gtProjection ?? makeProjection(ds.nodes, 'mercator');
  const base = datasetToGraph(ds, undefined, 'mercator');
  const nodes = base.nodes.map((n) => {
    const c = proj.project(n.lat!, n.lon!);
    return { ...n, x: Math.round(c.x - DATASET_NODE_SIZE.w / 2), y: Math.round(c.y - DATASET_NODE_SIZE.h / 2) };
  });
  const departments = Object.fromEntries(ds.nodes.map((n) => [n.id, { cabecera: n.cabecera || n.label }]));
  return { graph: { ...base, nodes }, departments };
}

type GeoGeometry = { type?: string; coordinates?: unknown };

/** Anillos del contorno de Guatemala (GeoJSON en lon/lat) proyectados al lienzo. */
function guatemalaOutline(): { x: number; y: number }[][] | null {
  const geo = dataFile('guatemala_contorno') as
    (GeoGeometry & { geometry?: GeoGeometry; features?: { geometry?: GeoGeometry }[] }) | undefined;
  const proj = gtProjection;
  if (!geo || !proj) return null;
  const geometries: GeoGeometry[] = geo.features
    ? geo.features.map((f) => f.geometry ?? {})
    : geo.geometry
      ? [geo.geometry]
      : [geo];
  const rings: number[][][] = [];
  for (const gm of geometries) {
    if (gm.type === 'Polygon') rings.push(...(gm.coordinates as number[][][]));
    if (gm.type === 'MultiPolygon') for (const poly of gm.coordinates as number[][][][]) rings.push(...poly);
  }
  if (!rings.length) return null;
  return rings.map((ring) => ring.map(([lon, lat]) => proj.project(lat!, lon!)));
}

function guatemalaTemplate() {
  if (!guatemalaOriginal) return { graph: EMPTY_GRAPH, name: 'Guatemala (sin datos)', departments: {} };
  const { graph, departments } = guatemalaToGraph(guatemalaOriginal);
  return { graph, name: guatemalaOriginal.meta.nombre, departments };
}

function templateGraph(t: Template): { graph: Graph; name: string } {
  if (t === 'guatemala') return guatemalaTemplate();
  if (t === 'ejemplo_mst') {
    const f = dataFile('ejemplo_mst') as GraphFile | undefined;
    return { graph: f?.graph ?? EMPTY_GRAPH, name: f?.name ?? 'Ejemplo de árbol de expansión mínima (sin datos)' };
  }
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
const KEY_GUATEMALA = 'rutaq:guatemala';
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
  // Proyecto II: desglose de cada ruta mínima (tramos, acumulados, fórmula) y árbol de expansión mínima.
  const breakdown = shortest ? safe(() => shortest.map((p) => routeBreakdown(graph, p)), null) : null;
  const start = mstStart && ids.has(mstStart) ? mstStart : (graph.nodes[0]?.id ?? null);
  const mst = validation.ok && start ? safe(() => ({ prim: prim(graph, start), kruskal: kruskal(graph) }), null) : null;

  return {
    breakdown,
    mst,
    mstStart: start,
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
/** Inicio de Prim elegido por el usuario (se valida contra el grafo en `derive`). */
let mstStart: NodeId | null = null;

const IDLE_TOUR: TourState = { status: 'idle', start: null, result: null, error: null };
let tourRun = 0;

// ───────────────────────────── Worker de S3 / layout ─────────────────────────────

let worker: Worker | null = null;
let workerApi: Comlink.Remote<CoreWorkerApiP2> | null = null;

function getWorker(): Comlink.Remote<CoreWorkerApiP2> {
  if (!workerApi) {
    worker = new Worker(new URL('../core/worker.ts', import.meta.url), { type: 'module' });
    workerApi = Comlink.wrap<CoreWorkerApiP2>(worker);
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

/** Quita tildes y pasa a minúsculas para comparar nombres. */
const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

/** Id de 3 letras a partir del nombre (sin tildes), único en el grafo: «Petén» → PET, luego PE2… */
function departmentId(g: Graph, label: string): NodeId {
  const base =
    plain(label)
      .replace(/[^a-z]/g, '')
      .toUpperCase()
      .slice(0, 3) || 'DEP';
  const ids = new Set(g.nodes.map((n) => n.id));
  if (!ids.has(base)) return base;
  for (let i = 2; ; i++) {
    const id = `${base.slice(0, 2)}${i}`;
    if (!ids.has(id)) return id;
  }
}

const validCoords = (lat?: number, lon?: number) =>
  lat === undefined && lon === undefined
    ? true
    : Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat!) <= 90 && Math.abs(lon!) <= 180;

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

function initialGraph(mode: AppMode): {
  graph: Graph;
  name: string;
  departments?: Record<NodeId, { cabecera: string }>;
} {
  if (mode === 'guatemala') {
    const saved = readJson<GuatemalaDataset>(KEY_GUATEMALA);
    if (saved && Array.isArray(saved.nodes) && Array.isArray(saved.edges) && saved.meta) {
      try {
        return { ...guatemalaToGraph(saved), name: saved.meta.nombre };
      } catch {
        // Guardado dañado: se usa el dataset original.
      }
    }
    return guatemalaTemplate();
  }
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
function history(): TemporalState<{ graph: Graph; departments: Record<NodeId, { cabecera: string }> }> {
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
          tour: IDLE_TOUR,
          departments: {},
          ...derive(g, null),
          ...extra,
        });
        set({ outline: get().mode === 'guatemala' ? guatemalaOutline() : null });
        history().clear();
      };

      /** Coloca un departamento: con coordenadas en su posición real; si no, en `at` o en el centro del mapa. */
      const placeDepartment = (g: Graph, lat?: number, lon?: number, at?: { x: number; y: number }) => {
        if (lat !== undefined && lon !== undefined && gtProjection) return gtProjection.project(lat, lon);
        if (at) return at;
        const xs = g.nodes.map((n) => n.x + n.w / 2);
        const ys = g.nodes.map((n) => n.y + n.h / 2);
        return xs.length
          ? { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
          : { x: 0, y: 0 };
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
        departments: initial.departments ?? {},
        outline: initialMode === 'guatemala' ? guatemalaOutline() : null,
        coverMode: 'mst',
        tour: IDLE_TOUR,
        ...derive(initialG, null),

        // ── Modo y archivos ──
        setMode(mode) {
          if (mode === get().mode) return;
          const t = initialGraph(mode);
          replaceGraph(t.graph, t.name, { mode, departments: t.departments ?? {} });
        },
        loadTemplate(template) {
          if (template === 'guatemala') {
            const t = guatemalaTemplate();
            replaceGraph(t.graph, t.name, { mode: 'guatemala', departments: t.departments });
            return;
          }
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
            // Proyecto II: un dataset con cabeceras es del módulo Guatemala (exportado con «Guardar» en ese modo).
            if (f.nodes.every((n) => typeof (n as { cabecera?: unknown }).cabecera === 'string')) {
              const gt = guatemalaToGraph(f as GuatemalaDataset);
              replaceGraph(gt.graph, f.meta.nombre ?? name, { mode: 'guatemala', departments: gt.departments });
              return { ok: true };
            }
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

        // ── Proyecto II: Transporte Express ──
        addDepartment({ label, cabecera, lat, lon, at }) {
          const g = get().graph;
          const name = label.trim();
          if (!name) return { ok: false, reason: 'empty-name' };
          if (g.nodes.some((n) => plain(n.label) === plain(name))) return { ok: false, reason: 'duplicate-name' };
          if (!validCoords(lat, lon)) return { ok: false, reason: 'invalid-coords' };
          const id = departmentId(g, name);
          const c = placeDepartment(g, lat, lon, at);
          // Sin coordenadas se guardan las del punto donde quedó, para que siga siendo un nodo del mapa.
          const geo =
            lat !== undefined && lon !== undefined
              ? { lat, lon }
              : gtProjection
                ? gtProjection.unproject(c.x, c.y)
                : {};
          const node: GNode = {
            id,
            label: name,
            x: Math.round(c.x - DATASET_NODE_SIZE.w / 2),
            y: Math.round(c.y - DATASET_NODE_SIZE.h / 2),
            ...DATASET_NODE_SIZE,
            ...geo,
          };
          commitGraph(
            { ...g, nodes: [...g.nodes, node] },
            { departments: { ...get().departments, [id]: { cabecera: cabecera.trim() || name } } },
          );
          return { ok: true, id };
        },
        updateDepartment(id, { label, cabecera, lat, lon }) {
          const g = get().graph;
          const node = g.nodes.find((n) => n.id === id);
          if (!node) return { ok: false, reason: 'empty-name' };
          const name = label === undefined ? node.label : label.trim();
          if (!name) return { ok: false, reason: 'empty-name' };
          if (g.nodes.some((n) => n.id !== id && plain(n.label) === plain(name)))
            return { ok: false, reason: 'duplicate-name' };
          const moving = lat !== undefined || lon !== undefined;
          const nlat = lat ?? node.lat;
          const nlon = lon ?? node.lon;
          if (moving && !validCoords(nlat, nlon)) return { ok: false, reason: 'invalid-coords' };
          const c = moving && gtProjection ? gtProjection.project(nlat!, nlon!) : null;
          commitGraph(
            {
              ...g,
              nodes: g.nodes.map((n) =>
                n.id === id
                  ? {
                      ...n,
                      label: name,
                      ...(c
                        ? { x: Math.round(c.x - n.w / 2), y: Math.round(c.y - n.h / 2), lat: nlat, lon: nlon }
                        : {}),
                    }
                  : n,
              ),
            },
            {
              departments: {
                ...get().departments,
                [id]: { cabecera: cabecera?.trim() || get().departments[id]?.cabecera || name },
              },
            },
          );
          return { ok: true, id };
        },
        addRoad(source, target, km, road) {
          const g = get().graph;
          if (source === target) return { ok: false, reason: 'self-loop' };
          if (!g.nodes.some((n) => n.id === source) || !g.nodes.some((n) => n.id === target))
            return { ok: false, reason: 'missing-node' };
          if (!validWeight(km)) return { ok: false, reason: 'invalid-weight' };
          const dup = g.edges.find((e) => samePair(e, source, target));
          if (dup) return { ok: false, reason: 'duplicate', existingEdgeId: dup.id };
          // Convención del dataset: ids en orden alfabético («GUA-SAC»); bidireccional por definición.
          const [a, b] = source < target ? [source, target] : [target, source];
          const ids = new Set(g.edges.map((e) => e.id));
          let id = `${a}-${b}`;
          for (let i = 2; ids.has(id); i++) id = `${a}-${b}-${i}`;
          const meta = { carretera: road?.trim() ?? '', fuente: 'Ingresada por el usuario' };
          commitGraph({
            ...g,
            edges: [...g.edges, { id, source: a, target: b, weight: km, shape: 'straight', shapeAuto: true, meta }],
          });
          return { ok: true, edgeId: id };
        },
        updateRoad(id, { km, road }) {
          const g = get().graph;
          if (!g.edges.some((e) => e.id === id)) return false;
          if (km !== undefined && !validWeight(km)) return false;
          commitGraph({
            ...g,
            edges: g.edges.map((e) =>
              e.id === id
                ? {
                    ...e,
                    weight: km ?? e.weight,
                    meta: road === undefined ? e.meta : { ...e.meta, carretera: road.trim() },
                  }
                : e,
            ),
          });
          return true;
        },
        restoreOriginal() {
          try {
            storage?.removeItem(KEY_GUATEMALA);
          } catch {
            // Sin acceso a localStorage: igual se recarga el original.
          }
          get().loadTemplate('guatemala');
        },
        exportGuatemalaDataset() {
          const { graph, graphName, departments } = get();
          const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
          return {
            meta: {
              nombre: graphName,
              unidad: 'km',
              fuentes: guatemalaOriginal?.meta.fuentes ?? ['Ingresado por el usuario'],
              fecha: new Date().toISOString().slice(0, 10),
            },
            nodes: graph.nodes.map((n) => {
              const geo =
                n.lat !== undefined && n.lon !== undefined
                  ? { lat: n.lat, lon: n.lon }
                  : gtProjection
                    ? gtProjection.unproject(n.x + n.w / 2, n.y + n.h / 2)
                    : { lat: 0, lon: 0 };
              const orig = guatemalaOriginal?.nodes.find((o) => o.id === n.id);
              return {
                id: n.id,
                label: n.label,
                cabecera: departments[n.id]?.cabecera ?? n.label,
                ...geo,
                fuente: orig && orig.lat === geo.lat && orig.lon === geo.lon ? orig.fuente : 'Ingresado por el usuario',
              };
            }),
            edges: graph.edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              km: e.weight,
              carretera: str(e.meta?.carretera),
              fuente: str(e.meta?.fuente, 'Ingresada por el usuario'),
              verificado_google: e.meta?.verificado_google === true,
              km_google: typeof e.meta?.km_google === 'number' ? e.meta.km_google : null,
              nota: str(e.meta?.nota),
              geometry: str(e.meta?.geometry),
            })),
          };
        },
        setCoverMode(mode) {
          set({ coverMode: mode });
        },
        setMstStart(id) {
          mstStart = id;
          set(derive(get().graph, get().query));
        },
        runTour(start) {
          const { graph } = get();
          const run = ++tourRun;
          set({ tour: { status: 'running', start, result: null, error: null } });
          getWorker()
            .deliveryTour(graph, start)
            .then((result) => {
              if (run === tourRun) set({ tour: { status: 'done', start, result, error: null } });
            })
            .catch((e: unknown) => {
              if (run === tourRun)
                set({
                  tour: { status: 'error', start, result: null, error: e instanceof Error ? e.message : String(e) },
                });
            });
        },
        cancelTour() {
          if (get().tour.status !== 'running') return;
          tourRun++;
          killWorker();
          set({ tour: { ...get().tour, status: 'cancelled' } });
        },
        projectLatLon(lat, lon) {
          const mode = get().mode;
          const proj = mode === 'guatemala' ? gtProjection : mode === 'quetzaltenango' ? qtzProjection : null;
          return proj ? proj.project(lat, lon) : null;
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
      partialize: (s) => ({ graph: s.graph, departments: s.departments }),
      equality: (a, b) => a.graph === b.graph && a.departments === b.departments,
      limit: 100,
    },
  ),
);

// Autoguardado del modo diseño y de las preferencias.
useAppStore.subscribe((s, prev) => {
  if (s.mode === 'design' && (s.graph !== prev.graph || s.graphName !== prev.graphName)) {
    writeJson(KEY_DESIGN, s.exportGraphFile());
  }
  // Proyecto II: el módulo Guatemala se autoguarda solo cuando el usuario lo modifica (no al abrirlo).
  if (
    s.mode === 'guatemala' &&
    prev.mode === 'guatemala' &&
    (s.graph !== prev.graph || s.departments !== prev.departments)
  ) {
    writeJson(KEY_GUATEMALA, s.exportGuatemalaDataset());
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
