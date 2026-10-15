import { describe, expect, it } from 'vitest';
import type { Dataset } from '../../../src/core/types';
import { DATASET_NODE_SIZE, datasetToGraph } from '../../../src/store/dataset';

const ds: Dataset = {
  meta: { nombre: 'prueba', unidad: 'km', fuentes: [], fecha: '2026-10' },
  nodes: [
    { id: 'A', label: 'Oeste', lat: 14.8, lon: -91.8, fuente: 'x' },
    { id: 'B', label: 'Este', lat: 14.8, lon: -91.4, fuente: 'x' },
    { id: 'C', label: 'Norte', lat: 15.0, lon: -91.6, fuente: 'x' },
  ],
  edges: [
    {
      id: 'A-B',
      source: 'A',
      target: 'B',
      km: 45.3,
      carretera: 'CA-1',
      fuente: 'OSRM',
      verificado_google: true,
      km_google: 44.9,
      nota: '',
      geometry: '',
    },
  ],
};

describe('datasetToGraph', () => {
  const g = datasetToGraph(ds, 1000);
  const center = (id: string) => {
    const n = g.nodes.find((x) => x.id === id)!;
    return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
  };

  it('proyecta oeste→izquierda y norte→arriba, ajustado al ancho', () => {
    expect(center('A').x).toBeCloseTo(0, 0);
    expect(center('B').x).toBeCloseTo(1000, 0);
    expect(center('C').y).toBeLessThan(center('A').y);
    expect(g.nodes[0]).toMatchObject(DATASET_NODE_SIZE);
  });

  it('usa km como peso y conserva los metadatos de trazabilidad', () => {
    expect(g.edges[0]).toMatchObject({ weight: 45.3, shape: 'straight', shapeAuto: true });
    expect(g.edges[0]!.meta).toMatchObject({ carretera: 'CA-1', km_google: 44.9, fuente: 'OSRM' });
    expect(g.unit).toBe('km');
    expect(g.directed).toBe(false);
  });

  it('acepta un dataset vacío', () => {
    expect(datasetToGraph({ ...ds, nodes: [], edges: [] }).nodes).toEqual([]);
  });
});

describe('datasetToGraph con el dataset real', () => {
  it('conserva la orientación geográfica exacta (N/S/E/O) entre todos los pares de municipios', async () => {
    const { default: q } = await import('../../../src/data/quetzaltenango.json');
    const g = datasetToGraph(q as Dataset);
    expect(g.nodes).toHaveLength(24);
    for (const [i, a] of g.nodes.entries())
      for (const b of g.nodes.slice(i + 1)) {
        // Más al norte ⇒ más arriba (y menor); más al este ⇒ más a la derecha (x mayor). Se omiten pares a < ~100 m.
        if (Math.abs(a.lat! - b.lat!) > 0.001)
          expect(Math.sign(b.y - a.y), `${a.label} / ${b.label} (N-S)`).toBe(Math.sign(a.lat! - b.lat!));
        if (Math.abs(a.lon! - b.lon!) > 0.001)
          expect(Math.sign(b.x - a.x), `${a.label} / ${b.label} (E-O)`).toBe(Math.sign(b.lon! - a.lon!));
      }
  });

  it('las distancias en pantalla son proporcionales a las distancias reales en línea recta', async () => {
    const { default: q } = await import('../../../src/data/quetzaltenango.json');
    const g = datasetToGraph(q as Dataset);
    const R = 6371;
    const rad = (d: number) => (d * Math.PI) / 180;
    const km = (a: (typeof g.nodes)[0], b: (typeof g.nodes)[0]) => {
      const h =
        Math.sin(rad(b.lat! - a.lat!) / 2) ** 2 +
        Math.cos(rad(a.lat!)) * Math.cos(rad(b.lat!)) * Math.sin(rad(b.lon! - a.lon!) / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    const px = (a: (typeof g.nodes)[0], b: (typeof g.nodes)[0]) => Math.hypot(a.x - b.x, a.y - b.y);
    const ratios = g.nodes.flatMap((a, i) => g.nodes.slice(i + 1).map((b) => px(a, b) / km(a, b)));
    const mean = ratios.reduce((s, r) => s + r, 0) / ratios.length;
    // Proyección equirectangular en un área de ~50 km: error de escala < 2 % (más el redondeo a px).
    for (const r of ratios) expect(Math.abs(r - mean) / mean).toBeLessThan(0.03);
  });

  it('ningún par de municipios queda encimado', async () => {
    const { default: q } = await import('../../../src/data/quetzaltenango.json');
    const g = datasetToGraph(q as Dataset);
    for (const [i, a] of g.nodes.entries())
      for (const b of g.nodes.slice(i + 1)) {
        const libre = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(libre, `${a.label} / ${b.label}`).toBe(true);
      }
  });
});
