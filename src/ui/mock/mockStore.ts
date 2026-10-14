import { create } from 'zustand';
import type {
  AllPathsResult,
  DijkstraResult,
  DijkstraStep,
  EdgeShape,
  FloydResult,
  GEdge,
  GNode,
  Graph,
  GraphFile,
  Label,
  LayoutSuggestion,
  NodeId,
  PathResult,
  ScaleInfo,
  TabularCell,
  TabularCellState,
  TabularConfig,
  TabularModel,
  TabularRow,
  ValidationIssue,
  ValidationResult,
} from '../../core/types';
import type {
  AddEdgeResult,
  AllPathsState,
  AppMode,
  AppState,
  ImportResult,
  Query,
  ResultTab,
  Theme,
} from '../../store/types';

// ============================================================================
// TEMPLATES
// ============================================================================

export const EJEMPLO6_GRAPH: Graph = {
  directed: false,
  unit: 'km',
  nodes: [
    { id: 'A', label: 'A (Origen)', x: 120, y: 240, w: 120, h: 48 },
    { id: 'B', label: 'B', x: 300, y: 130, w: 120, h: 48 },
    { id: 'C', label: 'C', x: 300, y: 350, w: 120, h: 48 },
    { id: 'D', label: 'D', x: 500, y: 130, w: 120, h: 48 },
    { id: 'E', label: 'E', x: 500, y: 350, w: 120, h: 48 },
    { id: 'F', label: 'F (Destino)', x: 680, y: 240, w: 120, h: 48 },
  ],
  edges: [
    { id: 'e1', source: 'A', target: 'B', weight: 4, shape: 'straight', shapeAuto: true },
    { id: 'e2', source: 'A', target: 'C', weight: 2, shape: 'straight', shapeAuto: true },
    { id: 'e3', source: 'B', target: 'C', weight: 1, shape: 'straight', shapeAuto: true },
    { id: 'e4', source: 'B', target: 'D', weight: 5, shape: 'straight', shapeAuto: true },
    { id: 'e5', source: 'C', target: 'D', weight: 8, shape: 'straight', shapeAuto: true },
    { id: 'e6', source: 'C', target: 'E', weight: 10, shape: 'straight', shapeAuto: true },
    { id: 'e7', source: 'D', target: 'E', weight: 2, shape: 'straight', shapeAuto: true },
    { id: 'e8', source: 'D', target: 'F', weight: 6, shape: 'straight', shapeAuto: true },
    { id: 'e9', source: 'E', target: 'F', weight: 3, shape: 'straight', shapeAuto: true },
  ],
};

export const QUETZALTENANGO_GRAPH: Graph = {
  directed: false,
  unit: 'km',
  nodes: [
    { id: 'quetzaltenango', label: 'Quetzaltenango', x: 480, y: 320, w: 150, h: 48 },
    { id: 'salcaja', label: 'Salcajá', x: 620, y: 270, w: 120, h: 48 },
    { id: 'olintepeque', label: 'Olintepeque', x: 470, y: 230, w: 130, h: 48 },
    { id: 'la_esperanza', label: 'La Esperanza', x: 360, y: 290, w: 130, h: 48 },
    { id: 'san_mateo', label: 'San Mateo', x: 260, y: 290, w: 120, h: 48 },
    { id: 'san_juan_ostuncalco', label: 'San Juan Ostuncalco', x: 180, y: 340, w: 170, h: 48 },
    { id: 'almolonga', label: 'Almolonga', x: 480, y: 400, w: 120, h: 48 },
    { id: 'cantel', label: 'Cantel', x: 590, y: 380, w: 120, h: 48 },
    { id: 'zunil', label: 'Zunil', x: 560, y: 470, w: 120, h: 48 },
    { id: 'concepcion_chiquirichapa', label: 'Concepción Chiquirichapa', x: 160, y: 410, w: 190, h: 48 },
    { id: 'san_martin_sacatepequez', label: 'San Martín Sacatepéquez', x: 130, y: 480, w: 190, h: 48 },
    { id: 'san_miguel_siguila', label: 'San Miguel Sigüilá', x: 200, y: 230, w: 160, h: 48 },
    { id: 'cajola', label: 'Cajolá', x: 220, y: 170, w: 120, h: 48 },
    { id: 'san_carlos_sija', label: 'San Carlos Sija', x: 420, y: 110, w: 150, h: 48 },
    { id: 'sibilia', label: 'Sibilia', x: 280, y: 110, w: 120, h: 48 },
    { id: 'huitan', label: 'Huitán', x: 260, y: 60, w: 120, h: 48 },
    { id: 'cabrican', label: 'Cabricán', x: 190, y: 40, w: 120, h: 48 },
    { id: 'san_francisco_la_union', label: 'San Francisco La Unión', x: 580, y: 170, w: 180, h: 48 },
    { id: 'palestina_de_los_altos', label: 'Palestina de Los Altos', x: 90, y: 290, w: 180, h: 48 },
    { id: 'el_palmar', label: 'El Palmar', x: 380, y: 550, w: 120, h: 48 },
    { id: 'colomba_costa_cuca', label: 'Colomba Costa Cuca', x: 90, y: 570, w: 170, h: 48 },
    { id: 'coatepeque', label: 'Coatepeque', x: 50, y: 690, w: 130, h: 48 },
    { id: 'flores_costa_cuca', label: 'Flores Costa Cuca', x: 120, y: 650, w: 160, h: 48 },
    { id: 'genova', label: 'Génova', x: 160, y: 720, w: 120, h: 48 },
  ],
  edges: [
    { id: 'q-sal', source: 'quetzaltenango', target: 'salcaja', weight: 9.2, shape: 'straight', shapeAuto: true },
    { id: 'q-oli', source: 'quetzaltenango', target: 'olintepeque', weight: 7.5, shape: 'straight', shapeAuto: true },
    { id: 'q-esp', source: 'quetzaltenango', target: 'la_esperanza', weight: 5.4, shape: 'straight', shapeAuto: true },
    { id: 'q-alm', source: 'quetzaltenango', target: 'almolonga', weight: 4.8, shape: 'straight', shapeAuto: true },
    { id: 'q-can', source: 'quetzaltenango', target: 'cantel', weight: 10.1, shape: 'straight', shapeAuto: true },
    { id: 'sal-can', source: 'salcaja', target: 'cantel', weight: 6.8, shape: 'straight', shapeAuto: true },
    { id: 'can-zun', source: 'cantel', target: 'zunil', weight: 8.5, shape: 'straight', shapeAuto: true },
    { id: 'alm-zun', source: 'almolonga', target: 'zunil', weight: 5.6, shape: 'straight', shapeAuto: true },
    { id: 'zun-pal', source: 'zunil', target: 'el_palmar', weight: 26.4, shape: 'straight', shapeAuto: true },
    { id: 'esp-mat', source: 'la_esperanza', target: 'san_mateo', weight: 3.2, shape: 'straight', shapeAuto: true },
    {
      id: 'mat-ost',
      source: 'san_mateo',
      target: 'san_juan_ostuncalco',
      weight: 7.6,
      shape: 'straight',
      shapeAuto: true,
    },
    {
      id: 'ost-con',
      source: 'san_juan_ostuncalco',
      target: 'concepcion_chiquirichapa',
      weight: 3.5,
      shape: 'straight',
      shapeAuto: true,
    },
    {
      id: 'con-mar',
      source: 'concepcion_chiquirichapa',
      target: 'san_martin_sacatepequez',
      weight: 6.2,
      shape: 'straight',
      shapeAuto: true,
    },
    {
      id: 'mar-col',
      source: 'san_martin_sacatepequez',
      target: 'colomba_costa_cuca',
      weight: 32.1,
      shape: 'straight',
      shapeAuto: true,
    },
    {
      id: 'col-coa',
      source: 'colomba_costa_cuca',
      target: 'coatepeque',
      weight: 21.5,
      shape: 'straight',
      shapeAuto: true,
    },
    {
      id: 'col-flo',
      source: 'colomba_costa_cuca',
      target: 'flores_costa_cuca',
      weight: 14.2,
      shape: 'straight',
      shapeAuto: true,
    },
    {
      id: 'coa-flo',
      source: 'coatepeque',
      target: 'flores_costa_cuca',
      weight: 12.8,
      shape: 'straight',
      shapeAuto: true,
    },
    { id: 'flo-gen', source: 'flores_costa_cuca', target: 'genova', weight: 15.6, shape: 'straight', shapeAuto: true },
    { id: 'coa-gen', source: 'coatepeque', target: 'genova', weight: 18.2, shape: 'straight', shapeAuto: true },
    {
      id: 'ost-pal_alt',
      source: 'san_juan_ostuncalco',
      target: 'palestina_de_los_altos',
      weight: 9.8,
      shape: 'straight',
      shapeAuto: true,
    },
    {
      id: 'ost-sig',
      source: 'san_juan_ostuncalco',
      target: 'san_miguel_siguila',
      weight: 5.1,
      shape: 'straight',
      shapeAuto: true,
    },
    { id: 'sig-caj', source: 'san_miguel_siguila', target: 'cajola', weight: 4.3, shape: 'straight', shapeAuto: true },
    {
      id: 'oli-sij',
      source: 'olintepeque',
      target: 'san_carlos_sija',
      weight: 19.4,
      shape: 'straight',
      shapeAuto: true,
    },
    {
      id: 'sij-fra',
      source: 'san_carlos_sija',
      target: 'san_francisco_la_union',
      weight: 12.3,
      shape: 'straight',
      shapeAuto: true,
    },
    {
      id: 'oli-fra',
      source: 'olintepeque',
      target: 'san_francisco_la_union',
      weight: 8.7,
      shape: 'straight',
      shapeAuto: true,
    },
    { id: 'sij-sib', source: 'san_carlos_sija', target: 'sibilia', weight: 11.2, shape: 'straight', shapeAuto: true },
    { id: 'sib-hui', source: 'sibilia', target: 'huitan', weight: 6.5, shape: 'straight', shapeAuto: true },
    { id: 'hui-cab', source: 'huitan', target: 'cabrican', weight: 8.1, shape: 'straight', shapeAuto: true },
    { id: 'caj-hui', source: 'cajola', target: 'huitan', weight: 10.4, shape: 'straight', shapeAuto: true },
    {
      id: 'pal-col',
      source: 'el_palmar',
      target: 'colomba_costa_cuca',
      weight: 34.0,
      shape: 'straight',
      shapeAuto: true,
    },
  ],
};

export const VACIO_GRAPH: Graph = {
  directed: false,
  unit: 'km',
  nodes: [],
  edges: [],
};

// ============================================================================
// ALGORITMOS INTERNOS DEL MOCK (Puros, deterministas, sin tocar src/core)
// ============================================================================

export function mockValidateGraph(g: Graph): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (g.nodes.length === 0) {
    issues.push({
      code: 'EMPTY_GRAPH',
      severity: 'error',
      message: 'El grafo no contiene ningún nodo.',
    });
    return { ok: false, issues };
  }

  const nodeIds = new Set<string>();
  for (const n of g.nodes) {
    if (nodeIds.has(n.id)) {
      issues.push({
        code: 'DUPLICATE_NODE_ID',
        severity: 'error',
        message: `ID de nodo duplicado: ${n.id}`,
        nodeIds: [n.id],
      });
    }
    nodeIds.add(n.id);
  }

  const edgeIds = new Set<string>();
  const edgePairs = new Set<string>();

  for (const e of g.edges) {
    if (edgeIds.has(e.id)) {
      issues.push({
        code: 'DUPLICATE_EDGE_ID',
        severity: 'error',
        message: `ID de arista duplicado: ${e.id}`,
        edgeIds: [e.id],
      });
    }
    edgeIds.add(e.id);

    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) {
      issues.push({
        code: 'MISSING_NODE',
        severity: 'error',
        message: `La arista ${e.id} conecta con un nodo inexistente.`,
        edgeIds: [e.id],
      });
    }

    if (e.source === e.target) {
      issues.push({
        code: 'SELF_LOOP',
        severity: 'error',
        message: `Lazo en el nodo ${e.source}: no se permiten bucles propios.`,
        edgeIds: [e.id],
      });
    }

    const pairKey = [e.source, e.target].sort().join('--');
    if (edgePairs.has(pairKey)) {
      issues.push({
        code: 'DUPLICATE_EDGE',
        severity: 'error',
        message: `Arista paralela duplicada entre ${e.source} y ${e.target}.`,
        edgeIds: [e.id],
      });
    }
    edgePairs.add(pairKey);

    if (typeof e.weight !== 'number' || isNaN(e.weight)) {
      issues.push({
        code: 'INVALID_WEIGHT',
        severity: 'error',
        message: `La arista ${e.id} tiene un peso no numérico.`,
        edgeIds: [e.id],
      });
    } else if (e.weight <= 0) {
      issues.push({
        code: 'NON_POSITIVE_WEIGHT',
        severity: 'error',
        message: `El peso de la arista ${e.id} debe ser estrictamente positivo (> 0).`,
        edgeIds: [e.id],
      });
    }
  }

  // Comprobar conexidad
  const firstNode = g.nodes[0];
  if (firstNode && g.nodes.length > 1) {
    const visited = new Set<string>();
    const queue = [firstNode.id];
    visited.add(firstNode.id);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const e of g.edges) {
        let neighbor: string | null = null;
        if (e.source === curr) neighbor = e.target;
        else if (e.target === curr) neighbor = e.source;
        if (neighbor && nodeIds.has(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (visited.size < g.nodes.length) {
      issues.push({
        code: 'DISCONNECTED',
        severity: 'warning',
        message: 'El grafo tiene componentes inconexas. Algunos pares de nodos no tendrán ruta.',
      });
    }
  }

  const ok = !issues.some((i) => i.severity === 'error');
  return { ok, issues };
}

export function mockDetectScale(weights: number[]): ScaleInfo {
  if (weights.length === 0) {
    return { magnitude: 1, range: '1–10', pxPerUnit: 16 };
  }
  const maxW = Math.max(...weights);
  const sorted = [...weights].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const midVal = sorted[mid] ?? 1;
  const prevVal = sorted[mid - 1] ?? midVal;
  const median = sorted.length % 2 !== 0 ? midVal : (prevVal + midVal) / 2;
  const magnitude = Math.max(1, Math.pow(10, Math.ceil(Math.log10(Math.max(1, maxW)))));
  const pxPerUnit = median > 0 ? 160 / median : 16;
  return {
    magnitude,
    range: `1–${magnitude.toLocaleString('es-GT')}`,
    pxPerUnit,
  };
}

export function mockDijkstra(g: Graph, source: NodeId): DijkstraResult {
  const steps: DijkstraStep[] = [];
  const labels: Record<NodeId, Label> = {};

  for (const n of g.nodes) {
    labels[n.id] = { dist: n.id === source ? 0 : Infinity, pred: null };
  }

  // Iteración 0: inicialización
  steps.push({
    iter: 0,
    current: null,
    permanent: [],
    crossedOut: [],
    labels: JSON.parse(JSON.stringify(labels)),
    updated: [source],
    evaluatedEdges: [],
  });

  const permanent: NodeId[] = [];
  let iter = 1;

  while (permanent.length < g.nodes.length) {
    // Buscar nodo no permanente con menor distancia
    let minDist = Infinity;
    let chosen: NodeId | null = null;

    for (const n of g.nodes) {
      if (!permanent.includes(n.id)) {
        const lbl = labels[n.id];
        if (lbl) {
          const d = lbl.dist;
          if (d < minDist) {
            minDist = d;
            chosen = n.id;
          } else if (d === minDist && chosen !== null && n.id < chosen) {
            chosen = n.id;
          }
        }
      }
    }

    if (chosen === null || minDist === Infinity) {
      break;
    }

    permanent.push(chosen);
    const updated: NodeId[] = [];
    const evaluatedEdges: string[] = [];

    // Relajar aristas incidentes hacia vecinos no permanentes
    for (const e of g.edges) {
      let neighbor: NodeId | null = null;
      if (e.source === chosen) neighbor = e.target;
      else if (e.target === chosen) neighbor = e.source;

      if (neighbor && !permanent.includes(neighbor)) {
        evaluatedEdges.push(e.id);
        const alt = minDist + e.weight;
        const neighborLbl = labels[neighbor];

        if (neighborLbl) {
          const currentDist = neighborLbl.dist;
          if (alt < currentDist || (alt === currentDist && chosen < (neighborLbl.pred ?? ''))) {
            labels[neighbor] = { dist: alt, pred: chosen };
            updated.push(neighbor);
          }
        }
      }
    }

    steps.push({
      iter,
      current: chosen,
      permanent: [...permanent],
      crossedOut: [...permanent],
      labels: JSON.parse(JSON.stringify(labels)),
      updated,
      evaluatedEdges,
    });

    iter++;
  }

  // Calcular aristas del árbol
  const treeEdges: string[] = [];
  for (const n of g.nodes) {
    const lbl = labels[n.id];
    if (n.id !== source && lbl && lbl.pred) {
      const pred = lbl.pred;
      const edge = g.edges.find(
        (e) => (e.source === pred && e.target === n.id) || (e.target === pred && e.source === n.id),
      );
      if (edge && !treeEdges.includes(edge.id)) {
        treeEdges.push(edge.id);
      }
    }
  }

  return { source, labels, steps, treeEdges };
}

export function mockBuildTabular(g: Graph, dijkstraRes: DijkstraResult): TabularModel {
  const order = g.nodes.map((n) => n.id);
  const n = order.length;
  const adjacency: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));

  for (const e of g.edges) {
    const i = order.indexOf(e.source);
    const j = order.indexOf(e.target);
    if (i !== -1 && j !== -1) {
      const rowI = adjacency[i];
      const rowJ = adjacency[j];
      if (rowI && rowJ) {
        rowI[j] = e.weight;
        rowJ[i] = e.weight;
      }
    }
  }

  const rows: TabularRow[] = [];
  for (const step of dijkstraRes.steps) {
    const cells: Record<NodeId, TabularCell> = {};

    for (const id of order) {
      const label = step.labels[id] ?? { dist: Infinity, pred: null };
      let state: TabularCellState;

      if (step.iter === 0) {
        state = id === dijkstraRes.source ? 'updated' : 'unreached';
      } else {
        const prevStep = dijkstraRes.steps[step.iter - 1];
        const wasPermanentBefore = prevStep ? prevStep.permanent.includes(id) : false;
        if (step.current === id) {
          state = 'min';
        } else if (wasPermanentBefore) {
          state = 'crossed';
        } else if (step.updated.includes(id)) {
          state = 'updated';
        } else if (label.dist === Infinity) {
          state = 'unreached';
        } else {
          state = 'normal';
        }
      }

      cells[id] = { label, state };
    }

    rows.push({
      iter: step.iter,
      current: step.current,
      cells,
    });
  }

  return {
    source: dijkstraRes.source,
    order,
    adjacency,
    rows,
  };
}

export function mockFloydWarshall(g: Graph): FloydResult {
  const order = g.nodes.map((n) => n.id);
  const n = order.length;

  const d0: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)),
  );
  const next: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));

  for (const e of g.edges) {
    const i = order.indexOf(e.source);
    const j = order.indexOf(e.target);
    if (i !== -1 && j !== -1) {
      const rowI = d0[i];
      const rowJ = d0[j];
      const nextI = next[i];
      const nextJ = next[j];
      if (rowI && rowJ && nextI && nextJ) {
        const currentW = rowI[j] ?? Infinity;
        if (e.weight < currentW) {
          rowI[j] = e.weight;
          rowJ[i] = e.weight;
          nextI[j] = j;
          nextJ[i] = i;
        }
      }
    }
  }

  const matrices: number[][][] = [d0];

  for (let k = 0; k < n; k++) {
    const prev = matrices[k];
    if (!prev) continue;
    const curr: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      const prevI = prev[i];
      const prevK = prev[k];
      const currI = curr[i];
      const nextI = next[i];
      if (!prevI || !prevK || !currI || !nextI) continue;

      for (let j = 0; j < n; j++) {
        const direct = prevI[j] ?? Infinity;
        const throughK = (prevI[k] ?? Infinity) + (prevK[j] ?? Infinity);
        if (throughK < direct) {
          currI[j] = throughK;
          nextI[j] = nextI[k] ?? null;
        } else {
          currI[j] = direct;
        }
      }
    }
    matrices.push(curr);
  }

  const dist = matrices[n] ?? d0;

  return {
    order,
    dist,
    next,
    matrices,
  };
}

export function mockFindAllPaths(g: Graph, source: NodeId, target: NodeId, limit = 5000): AllPathsResult {
  const paths: PathResult[] = [];
  const visited = new Set<NodeId>([source]);

  function dfs(curr: NodeId, pathNodes: NodeId[], pathEdges: string[], dist: number) {
    if (paths.length >= limit) return;
    if (curr === target) {
      paths.push({
        nodes: [...pathNodes],
        edges: [...pathEdges],
        distance: Math.round(dist * 1000) / 1000,
      });
      return;
    }

    for (const e of g.edges) {
      let neighbor: NodeId | null = null;
      if (e.source === curr) neighbor = e.target;
      else if (e.target === curr) neighbor = e.source;

      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor);
        pathNodes.push(neighbor);
        pathEdges.push(e.id);

        dfs(neighbor, pathNodes, pathEdges, dist + e.weight);

        pathEdges.pop();
        pathNodes.pop();
        visited.delete(neighbor);
      }
    }
  }

  dfs(source, [source], [], 0);

  // Ordenar caminos por distancia ascendente y secuencia de IDs lexicográfica
  paths.sort((a, b) => {
    if (Math.abs(a.distance - b.distance) > 1e-6) {
      return a.distance - b.distance;
    }
    return a.nodes.join(',').localeCompare(b.nodes.join(','));
  });

  return {
    paths,
    complete: paths.length < limit,
    method: 'dfs',
    totalFound: paths.length,
  };
}

export function mockSuggestLayout(g: Graph): LayoutSuggestion {
  const positions: Record<NodeId, { x: number; y: number }> = {};
  const n = g.nodes.length;
  const scale = mockDetectScale(g.edges.map((e) => e.weight));

  if (n === 0) {
    return { positions: {}, stressError: 0, scale };
  }

  // Distribución circular equilibrada
  const cx = 450;
  const cy = 350;
  const radius = Math.min(280, Math.max(140, n * 25));

  g.nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions[node.id] = {
      x: Math.round(cx + radius * Math.cos(angle) - node.w / 2),
      y: Math.round(cy + radius * Math.sin(angle) - node.h / 2),
    };
  });

  return {
    positions,
    stressError: 8.5,
    scale,
  };
}

// ============================================================================
// STORE CREATION (Zustand + Mock)
// ============================================================================

interface HistoryEntry {
  graph: Graph;
  graphName: string;
}

export function createInitialState(template: 'quetzaltenango' | 'ejemplo6' | 'vacio' = 'ejemplo6'): {
  graph: Graph;
  graphName: string;
  mode: AppMode;
  query: Query;
  scale: ScaleInfo;
  validation: ValidationResult;
  dijkstra: DijkstraResult;
  tabular: TabularModel;
  shortest: PathResult[];
  floyd: FloydResult;
  allPaths: AllPathsState;
  layoutSuggestion: LayoutSuggestion;
} {
  const graph: Graph =
    template === 'quetzaltenango'
      ? JSON.parse(JSON.stringify(QUETZALTENANGO_GRAPH))
      : template === 'ejemplo6'
        ? JSON.parse(JSON.stringify(EJEMPLO6_GRAPH))
        : JSON.parse(JSON.stringify(VACIO_GRAPH));

  const graphName =
    template === 'quetzaltenango'
      ? 'Red Vial de Quetzaltenango'
      : template === 'ejemplo6'
        ? 'Grafo de Ejemplo (6 Nodos)'
        : 'Grafo Vacío';

  const mode: AppMode = template === 'quetzaltenango' ? 'quetzaltenango' : 'design';
  const sourceNode = graph.nodes[0]?.id ?? 'A';
  const targetNode = graph.nodes[graph.nodes.length - 1]?.id ?? 'F';
  const query: Query = { kind: 'path', source: sourceNode, target: targetNode };

  const validation = mockValidateGraph(graph);
  const scale = mockDetectScale(graph.edges.map((e: GEdge) => e.weight));
  const dijkstra = mockDijkstra(graph, sourceNode);
  const tabular = mockBuildTabular(graph, dijkstra);
  const floyd = mockFloydWarshall(graph);
  const allPathsRes = mockFindAllPaths(graph, sourceNode, targetNode);
  const minDist = allPathsRes.paths[0]?.distance;
  const shortest = minDist !== undefined ? allPathsRes.paths.filter((p) => Math.abs(p.distance - minDist) < 1e-6) : [];
  const layoutSuggestion = mockSuggestLayout(graph);

  return {
    graph,
    graphName,
    mode,
    query,
    scale,
    validation,
    dijkstra,
    tabular,
    shortest,
    floyd,
    allPaths: {
      status: 'done',
      found: allPathsRes.totalFound,
      result: allPathsRes,
      error: null,
    },
    layoutSuggestion,
  };
}

export const useMockStore = create<AppState>((set, get) => {
  const initial = createInitialState('ejemplo6');

  // Historial para deshacer / rehacer
  const undoStack: HistoryEntry[] = [];
  const redoStack: HistoryEntry[] = [];

  function recordHistory() {
    const currentGraph = JSON.parse(JSON.stringify(get().graph));
    undoStack.push({ graph: currentGraph, graphName: get().graphName });
    if (undoStack.length > 30) undoStack.shift();
    redoStack.length = 0;
  }

  function recalculate(patch?: Partial<AppState>) {
    const s = { ...get(), ...patch };
    const validation = mockValidateGraph(s.graph);
    const scale = mockDetectScale(s.graph.edges.map((e) => e.weight));
    const layoutSuggestion = mockSuggestLayout(s.graph);

    let dijkstra = s.dijkstra;
    let tabular = s.tabular;
    let floyd: FloydResult | null;
    let shortest = s.shortest;
    let allPaths = s.allPaths;

    if (s.graph.nodes.length > 0) {
      floyd = mockFloydWarshall(s.graph);

      if (s.query) {
        const sourceExists = s.graph.nodes.some((n) => n.id === s.query!.source);
        if (sourceExists) {
          dijkstra = mockDijkstra(s.graph, s.query.source);
          tabular = mockBuildTabular(s.graph, dijkstra);

          if (s.query.kind === 'path' && s.query.target) {
            const targetId = s.query.target;
            const targetExists = s.graph.nodes.some((n) => n.id === targetId);
            if (targetExists) {
              const allRes = mockFindAllPaths(s.graph, s.query.source, targetId, s.allPathsLimit);
              allPaths = {
                status: 'done',
                found: allRes.totalFound,
                result: allRes,
                error: null,
              };
              const minDist = allRes.paths[0]?.distance;
              shortest = minDist !== undefined ? allRes.paths.filter((p) => Math.abs(p.distance - minDist) < 1e-6) : [];
            } else {
              shortest = [];
              allPaths = { status: 'idle', found: 0, result: null, error: null };
            }
          } else {
            shortest = null;
            allPaths = { status: 'idle', found: 0, result: null, error: null };
          }
        }
      }
    } else {
      dijkstra = null;
      tabular = null;
      floyd = null;
      shortest = null;
      allPaths = { status: 'idle', found: 0, result: null, error: null };
    }

    set({
      ...patch,
      validation,
      scale,
      layoutSuggestion,
      dijkstra,
      tabular,
      floyd,
      shortest,
      allPaths,
    });
  }

  return {
    // ── Datos ──
    mode: initial.mode,
    graph: initial.graph,
    graphName: initial.graphName,
    validation: initial.validation,
    scale: initial.scale,

    // ── Selección y consulta ──
    selectedNodeIds: [],
    selectedEdgeIds: [],
    query: initial.query,

    // ── Resultados ──
    dijkstra: initial.dijkstra,
    tabular: initial.tabular,
    shortest: initial.shortest,
    floyd: initial.floyd,
    allPaths: initial.allPaths,
    highlightedPath: null,
    playback: {
      stepIndex: initial.dijkstra.steps.length - 1,
      playing: false,
      speedMs: 1000,
    },
    layoutSuggestion: initial.layoutSuggestion,

    // ── Preferencias de UI ──
    activeTab: 'tabla',
    tabularConfig: {
      showAdjacency: true,
      labelFormat: 'paren',
      crossOut: 'column',
      repeatPermanent: false,
    },
    allPathsLimit: 5000,
    theme: 'light',
    keepProportion: false,

    // ── Acciones: modo y archivos ──
    setMode: (mode: AppMode) => {
      set({ mode });
    },

    loadTemplate: (template: 'quetzaltenango' | 'ejemplo6' | 'vacio') => {
      recordHistory();
      const next = createInitialState(template);
      set({
        graph: next.graph,
        graphName: next.graphName,
        mode: next.mode,
        query: next.query,
        scale: next.scale,
        validation: next.validation,
        dijkstra: next.dijkstra,
        tabular: next.tabular,
        shortest: next.shortest,
        floyd: next.floyd,
        allPaths: next.allPaths,
        highlightedPath: null,
        playback: {
          stepIndex: next.dijkstra?.steps.length ? next.dijkstra.steps.length - 1 : 0,
          playing: false,
          speedMs: 1000,
        },
        selectedNodeIds: [],
        selectedEdgeIds: [],
      });
    },

    exportGraphFile: (): GraphFile => {
      return {
        format: 'rutaq-graph',
        version: 1,
        name: get().graphName,
        graph: JSON.parse(JSON.stringify(get().graph)),
      };
    },

    importGraphFile: (json: string): ImportResult => {
      try {
        const parsed = JSON.parse(json);
        if (parsed.format !== 'rutaq-graph' || !parsed.graph || !Array.isArray(parsed.graph.nodes)) {
          return { ok: false, message: 'El archivo no tiene el formato rutaq-graph v1 válido.' };
        }
        recordHistory();
        const graph: Graph = parsed.graph;
        const graphName = parsed.name || 'Grafo Importado';
        const source = graph.nodes[0]?.id ?? '';
        const target = graph.nodes[graph.nodes.length - 1]?.id ?? '';
        const query: Query | null = source ? { kind: 'path', source, target } : null;

        recalculate({
          graph,
          graphName,
          query,
          selectedNodeIds: [],
          selectedEdgeIds: [],
          highlightedPath: null,
        });
        return { ok: true };
      } catch (e) {
        return { ok: false, message: `Error al analizar JSON: ${(e as Error).message}` };
      }
    },

    // ── Acciones: edición (modo diseño) ──
    addNode: (at: { x: number; y: number }, label?: string): NodeId => {
      recordHistory();
      const currentNodes = get().graph.nodes;
      let nextIndex = currentNodes.length + 1;
      let id = `N${nextIndex}`;
      while (currentNodes.some((n) => n.id === id)) {
        nextIndex++;
        id = `N${nextIndex}`;
      }
      const nodeLabel = label ?? id;
      const newNode: GNode = {
        id,
        label: nodeLabel,
        x: at.x,
        y: at.y,
        w: 120,
        h: 48,
      };

      const updatedGraph: Graph = {
        ...get().graph,
        nodes: [...currentNodes, newNode],
      };

      recalculate({ graph: updatedGraph });
      return id;
    },

    moveNodes: (moves: Record<NodeId, { x: number; y: number }>) => {
      const nodes = get().graph.nodes.map((n) => {
        const move = moves[n.id];
        if (move) {
          return { ...n, x: move.x, y: move.y };
        }
        return n;
      });
      set({ graph: { ...get().graph, nodes } });
    },

    resizeNode: (id: NodeId, size: { x: number; y: number; w: number; h: number }) => {
      const nodes = get().graph.nodes.map((n) => {
        if (n.id === id) {
          return { ...n, ...size };
        }
        return n;
      });
      set({ graph: { ...get().graph, nodes } });
    },

    renameNode: (id: NodeId, label: string) => {
      recordHistory();
      const nodes = get().graph.nodes.map((n) => (n.id === id ? { ...n, label } : n));
      recalculate({ graph: { ...get().graph, nodes } });
    },

    removeNodes: (ids: NodeId[]) => {
      if (ids.length === 0) return;
      recordHistory();
      const removeSet = new Set(ids);
      const nodes = get().graph.nodes.filter((n) => !removeSet.has(n.id));
      const edges = get().graph.edges.filter((e) => !removeSet.has(e.source) && !removeSet.has(e.target));

      let query = get().query;
      if (query) {
        const isTargetInRemove = query.kind === 'path' && query.target ? removeSet.has(query.target) : false;
        if (removeSet.has(query.source) || isTargetInRemove) {
          query = nodes[0] ? { kind: 'tree', source: nodes[0].id } : null;
        }
      }

      recalculate({
        graph: { ...get().graph, nodes, edges },
        selectedNodeIds: [],
        query,
      });
    },

    addEdge: (source: NodeId, target: NodeId, weight: number): AddEdgeResult => {
      if (source === target) {
        return { ok: false, reason: 'self-loop' };
      }
      if (weight <= 0 || isNaN(weight)) {
        return { ok: false, reason: 'invalid-weight' };
      }
      const nodeIds = new Set(get().graph.nodes.map((n) => n.id));
      if (!nodeIds.has(source) || !nodeIds.has(target)) {
        return { ok: false, reason: 'missing-node' };
      }

      const existing = get().graph.edges.find(
        (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source),
      );
      if (existing) {
        return { ok: false, reason: 'duplicate', existingEdgeId: existing.id };
      }

      recordHistory();
      const edgeId = `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const newEdge: GEdge = {
        id: edgeId,
        source,
        target,
        weight,
        shape: 'straight',
        shapeAuto: true,
      };

      const edges = [...get().graph.edges, newEdge];
      recalculate({ graph: { ...get().graph, edges } });
      return { ok: true, edgeId };
    },

    setEdgeWeight: (id: string, weight: number): boolean => {
      if (weight <= 0 || isNaN(weight)) return false;
      recordHistory();
      const edges = get().graph.edges.map((e) => (e.id === id ? { ...e, weight } : e));
      recalculate({ graph: { ...get().graph, edges } });
      return true;
    },

    setEdgeShape: (ids: string[] | 'all', shape: EdgeShape) => {
      recordHistory();
      const edges = get().graph.edges.map((e) => {
        if (ids === 'all' || ids.includes(e.id)) {
          return { ...e, shape, shapeAuto: false };
        }
        return e;
      });
      set({ graph: { ...get().graph, edges } });
    },

    resetEdgeShapeAuto: (ids: string[] | 'all') => {
      recordHistory();
      const edges = get().graph.edges.map((e) => {
        if (ids === 'all' || ids.includes(e.id)) {
          return { ...e, shape: 'straight' as EdgeShape, shapeAuto: true };
        }
        return e;
      });
      set({ graph: { ...get().graph, edges } });
    },

    removeEdges: (ids: string[]) => {
      if (ids.length === 0) return;
      recordHistory();
      const removeSet = new Set(ids);
      const edges = get().graph.edges.filter((e) => !removeSet.has(e.id));
      recalculate({
        graph: { ...get().graph, edges },
        selectedEdgeIds: [],
      });
    },

    applySuggestedLayout: async () => {
      const suggestion = get().layoutSuggestion;
      if (!suggestion) return;
      recordHistory();
      const nodes = get().graph.nodes.map((n) => {
        const pos = suggestion.positions[n.id];
        if (pos) {
          return { ...n, ...pos };
        }
        return n;
      });
      set({ graph: { ...get().graph, nodes } });
    },

    undo: () => {
      if (undoStack.length === 0) return;
      const prev = undoStack.pop()!;
      redoStack.push({
        graph: JSON.parse(JSON.stringify(get().graph)),
        graphName: get().graphName,
      });
      recalculate({ graph: prev.graph, graphName: prev.graphName });
    },

    redo: () => {
      if (redoStack.length === 0) return;
      const next = redoStack.pop()!;
      undoStack.push({
        graph: JSON.parse(JSON.stringify(get().graph)),
        graphName: get().graphName,
      });
      recalculate({ graph: next.graph, graphName: next.graphName });
    },

    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,

    // ── Acciones: selección y consulta ──
    select: (nodeIds: NodeId[], edgeIds: string[]) => {
      set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds });
    },

    setTreeQuery: (source: NodeId) => {
      const query: Query = { kind: 'tree', source };
      recalculate({ query, highlightedPath: null });
    },

    setPathQuery: (source: NodeId, target: NodeId | null) => {
      const query: Query = { kind: 'path', source, target };
      recalculate({ query, highlightedPath: null });
    },

    clearQuery: () => {
      set({
        query: null,
        dijkstra: null,
        tabular: null,
        shortest: null,
        allPaths: { status: 'idle', found: 0, result: null, error: null },
        highlightedPath: null,
      });
    },

    // ── Acciones: reproducción S1 ──
    stepTo: (index: number) => {
      const maxIndex = (get().dijkstra?.steps.length ?? 1) - 1;
      const clamped = Math.max(0, Math.min(index, maxIndex));
      set({ playback: { ...get().playback, stepIndex: clamped } });
    },

    nextStep: () => {
      const curr = get().playback.stepIndex;
      const maxIndex = (get().dijkstra?.steps.length ?? 1) - 1;
      if (curr < maxIndex) {
        set({ playback: { ...get().playback, stepIndex: curr + 1 } });
      }
    },

    prevStep: () => {
      const curr = get().playback.stepIndex;
      if (curr > 0) {
        set({ playback: { ...get().playback, stepIndex: curr - 1 } });
      }
    },

    play: () => {
      set({ playback: { ...get().playback, playing: true } });
    },

    pause: () => {
      set({ playback: { ...get().playback, playing: false } });
    },

    toEnd: () => {
      const maxIndex = (get().dijkstra?.steps.length ?? 1) - 1;
      set({ playback: { ...get().playback, stepIndex: maxIndex, playing: false } });
    },

    setSpeed: (ms: number) => {
      set({ playback: { ...get().playback, speedMs: ms } });
    },

    // ── Acciones: S3 ──
    runAllPaths: () => {
      const { graph, query, allPathsLimit } = get();
      if (!query || query.kind !== 'path' || !query.target) return;

      set({
        allPaths: {
          status: 'running',
          found: 0,
          result: null,
          error: null,
        },
      });

      const res = mockFindAllPaths(graph, query.source, query.target, allPathsLimit);
      const minDist = res.paths[0]?.distance;
      set({
        allPaths: {
          status: 'done',
          found: res.totalFound,
          result: res,
          error: null,
        },
        shortest: minDist !== undefined ? res.paths.filter((p) => Math.abs(p.distance - minDist) < 1e-6) : [],
      });
    },

    cancelAllPaths: () => {
      set({
        allPaths: {
          status: 'cancelled',
          found: get().allPaths.found,
          result: get().allPaths.result,
          error: null,
        },
      });
    },

    setAllPathsLimit: (limit: number) => {
      set({ allPathsLimit: limit });
    },

    highlightPath: (sel: AppState['highlightedPath']) => {
      set({ highlightedPath: sel });
    },

    // ── Acciones: preferencias ──
    setActiveTab: (tab: ResultTab) => {
      set({ activeTab: tab });
    },

    setTabularConfig: (patch: Partial<TabularConfig>) => {
      set({ tabularConfig: { ...get().tabularConfig, ...patch } });
    },

    setTheme: (theme: Theme) => {
      set({ theme });
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
      }
    },

    setKeepProportion: (on: boolean) => {
      set({ keepProportion: on });
    },
  };
});
