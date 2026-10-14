import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../../src/store/useAppStore';

// Mientras el núcleo sea un stub, sus funciones lanzan errores que el store captura y reporta con console.warn.
vi.spyOn(console, 'warn').mockImplementation(() => {});

const st = () => useAppStore.getState();

function triangle() {
  const a = st().addNode({ x: 0, y: 0 });
  const b = st().addNode({ x: 200, y: 0 });
  const c = st().addNode({ x: 100, y: 150 });
  return { a, b, c };
}

beforeEach(() => st().loadTemplate('vacio'));

describe('store: edición del grafo', () => {
  it('crea nodos con ids únicos y etiquetas A, B, C', () => {
    const { a, b, c } = triangle();
    expect(new Set([a, b, c]).size).toBe(3);
    expect(st().graph.nodes.map((n) => n.label)).toEqual(['A', 'B', 'C']);
    expect(st().mode).toBe('design');
  });

  it('rechaza lazos, pesos no positivos, nodos inexistentes y aristas duplicadas', () => {
    const { a, b } = triangle();
    expect(st().addEdge(a, a, 3)).toEqual({ ok: false, reason: 'self-loop' });
    expect(st().addEdge(a, b, 0)).toEqual({ ok: false, reason: 'invalid-weight' });
    expect(st().addEdge(a, b, -2)).toEqual({ ok: false, reason: 'invalid-weight' });
    expect(st().addEdge(a, b, Number.NaN)).toEqual({ ok: false, reason: 'invalid-weight' });
    expect(st().addEdge(a, 'zzz', 3)).toEqual({ ok: false, reason: 'missing-node' });
    const r = st().addEdge(a, b, 4.5);
    expect(r.ok).toBe(true);
    const existing = r.ok ? r.edgeId : '';
    expect(st().addEdge(b, a, 7)).toEqual({ ok: false, reason: 'duplicate', existingEdgeId: existing });
    expect(st().graph.edges).toHaveLength(1);
  });

  it('borrar un nodo borra sus aristas', () => {
    const { a, b, c } = triangle();
    st().addEdge(a, b, 1);
    st().addEdge(b, c, 1);
    st().addEdge(a, c, 1);
    st().removeNodes([b]);
    expect(st().graph.nodes.map((n) => n.id)).toEqual([a, c]);
    expect(st().graph.edges).toHaveLength(1);
  });

  it('editar peso valida que sea positivo', () => {
    const { a, b } = triangle();
    const r = st().addEdge(a, b, 2);
    const id = r.ok ? r.edgeId : '';
    expect(st().setEdgeWeight(id, 0)).toBe(false);
    expect(st().setEdgeWeight(id, 9)).toBe(true);
    expect(st().graph.edges[0]!.weight).toBe(9);
  });

  it('cambiar forma manualmente desactiva shapeAuto y se puede volver a automático', () => {
    const { a, b, c } = triangle();
    st().addEdge(a, b, 1);
    st().addEdge(b, c, 1);
    st().setEdgeShape('all', 'step');
    expect(st().graph.edges.every((e) => e.shape === 'step' && !e.shapeAuto)).toBe(true);
    st().resetEdgeShapeAuto([st().graph.edges[0]!.id]);
    expect(st().graph.edges[0]!.shapeAuto).toBe(true);
    expect(st().graph.edges[1]!.shapeAuto).toBe(false);
  });

  it('renombrar ignora nombres vacíos y redimensionar respeta un mínimo', () => {
    const { a } = triangle();
    st().renameNode(a, '  Zunil ');
    st().renameNode(a, '   ');
    st().resizeNode(a, { x: 0, y: 0, w: 5, h: 5 });
    expect(st().graph.nodes[0]).toMatchObject({ label: 'Zunil', w: 40, h: 28 });
  });
});

describe('store: deshacer / rehacer', () => {
  it('deshace y rehace cambios del grafo', () => {
    st().addNode({ x: 0, y: 0 });
    st().addNode({ x: 100, y: 0 });
    expect(st().canUndo()).toBe(true);
    st().undo();
    expect(st().graph.nodes).toHaveLength(1);
    expect(st().canRedo()).toBe(true);
    st().redo();
    expect(st().graph.nodes).toHaveLength(2);
  });

  it('cargar una plantilla limpia el historial', () => {
    st().addNode({ x: 0, y: 0 });
    st().loadTemplate('vacio');
    expect(st().canUndo()).toBe(false);
  });

  it('cambios que no son del grafo no entran al historial', () => {
    st().setActiveTab('tabla');
    st().setTheme('dark');
    expect(st().canUndo()).toBe(false);
  });
});

describe('store: guardar y cargar JSON', () => {
  it('exporta e importa el mismo grafo', () => {
    const { a, b } = triangle();
    st().addEdge(a, b, 12.5);
    const file = st().exportGraphFile();
    expect(file).toMatchObject({ format: 'rutaq-graph', version: 1 });
    const json = JSON.stringify(file);
    st().loadTemplate('vacio');
    expect(st().importGraphFile(json)).toEqual({ ok: true });
    expect(st().graph).toEqual(file.graph);
  });

  it('completa campos opcionales al importar', () => {
    const json = JSON.stringify({
      format: 'rutaq-graph',
      version: 1,
      name: 'mínimo',
      graph: { nodes: [{ id: 'A', x: 0, y: 0 }], edges: [] },
    });
    expect(st().importGraphFile(json)).toEqual({ ok: true });
    expect(st().graph.nodes[0]).toMatchObject({ label: 'A', w: 132, h: 44 });
    expect(st().graphName).toBe('mínimo');
  });

  it('rechaza archivos inválidos con mensaje claro', () => {
    expect(st().importGraphFile('{no es json')).toEqual({ ok: false, message: 'El archivo no es un JSON válido.' });
    expect(st().importGraphFile('{"foo": 1}')).toMatchObject({ ok: false });
  });
});

describe('store: consultas', () => {
  it('una consulta sobre un nodo borrado se descarta', () => {
    const { a, b } = triangle();
    st().setPathQuery(a, b);
    expect(st().query).toEqual({ kind: 'path', source: a, target: b });
    st().removeNodes([b]);
    expect(st().query).toBeNull();
  });
});

describe('store + núcleo: resultados derivados', () => {
  function square() {
    // A─B─C con atajo A─C más largo, y D colgando de C: A→C por B (2) gana a la directa (5).
    const [a, b, c, d] = ['A', 'B', 'C', 'D'].map((l, i) => st().addNode({ x: i * 200, y: 0 }, l));
    st().addEdge(a!, b!, 1);
    st().addEdge(b!, c!, 1);
    st().addEdge(a!, c!, 5);
    st().addEdge(c!, d!, 2.5);
    return { a: a!, b: b!, c: c!, d: d! };
  }

  it('F2: árbol de rutas, tabla y reproducción', () => {
    const { a, d } = square();
    expect(st().validation.ok).toBe(true);
    st().setTreeQuery(a);
    const dj = st().dijkstra!;
    expect(dj.labels[d]).toEqual({ dist: 4.5, pred: st().graph.nodes[2]!.id });
    expect(dj.treeEdges).toHaveLength(3);
    expect(st().tabular!.rows).toHaveLength(dj.steps.length);
    expect(st().playback.stepIndex).toBe(dj.steps.length - 1);
    st().stepTo(0);
    st().nextStep();
    expect(st().playback.stepIndex).toBe(1);
    st().toEnd();
    expect(st().playback.stepIndex).toBe(dj.steps.length - 1);
  });

  it('F3: ruta mínima y "no existe ruta"', () => {
    const { a, c } = square();
    st().setPathQuery(a, c);
    expect(st().shortest).toHaveLength(1);
    expect(st().shortest![0]!.distance).toBe(2);
    const e = st().addNode({ x: 0, y: 300 }, 'E');
    st().setPathQuery(a, e);
    expect(st().validation.issues.map((i) => i.code)).toContain('DISCONNECTED');
    expect(st().shortest).toEqual([]);
  });

  it('las aristas que cruzan nodos se curvan solas', () => {
    const a = st().addNode({ x: 0, y: 0 });
    st().addNode({ x: 300, y: 0 });
    const c = st().addNode({ x: 600, y: 0 });
    st().addEdge(a, c, 3);
    expect(st().graph.edges[0]!.shape).not.toBe('straight');
  });
});
