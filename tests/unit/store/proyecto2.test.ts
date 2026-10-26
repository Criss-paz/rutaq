import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuatemalaDataset } from '../../../src/core/types';
import { useAppStore } from '../../../src/store/useAppStore';

vi.spyOn(console, 'warn').mockImplementation(() => {});
const st = () => useAppStore.getState();

/** Mini red con el formato de guatemala.json (coordenadas reales aproximadas de 4 cabeceras). */
const MINI: GuatemalaDataset = {
  meta: { nombre: 'Mini Guatemala', unidad: 'km', fuentes: ['prueba'], fecha: '2026-10-25' },
  nodes: [
    { id: 'GUA', label: 'Guatemala', cabecera: 'Ciudad de Guatemala', lat: 14.6349, lon: -90.5069, fuente: 'prueba' },
    { id: 'SAC', label: 'Sacatepéquez', cabecera: 'Antigua Guatemala', lat: 14.5586, lon: -90.7295, fuente: 'prueba' },
    { id: 'CHI', label: 'Chimaltenango', cabecera: 'Chimaltenango', lat: 14.6611, lon: -90.8197, fuente: 'prueba' },
    { id: 'ESC', label: 'Escuintla', cabecera: 'Escuintla', lat: 14.305, lon: -90.785, fuente: 'prueba' },
  ],
  edges: [
    {
      id: 'GUA-SAC',
      source: 'GUA',
      target: 'SAC',
      km: 40.1,
      carretera: 'RN-10',
      fuente: 'prueba',
      verificado_google: false,
      km_google: null,
      nota: '',
      geometry: '',
    },
    {
      id: 'CHI-SAC',
      source: 'CHI',
      target: 'SAC',
      km: 18.3,
      carretera: 'RN-14',
      fuente: 'prueba',
      verificado_google: false,
      km_google: null,
      nota: '',
      geometry: '',
    },
    {
      id: 'ESC-GUA',
      source: 'ESC',
      target: 'GUA',
      km: 56.2,
      carretera: 'CA-9',
      fuente: 'prueba',
      verificado_google: false,
      km_google: null,
      nota: '',
      geometry: '',
    },
    {
      id: 'CHI-GUA',
      source: 'CHI',
      target: 'GUA',
      km: 54.7,
      carretera: 'CA-1',
      fuente: 'prueba',
      verificado_google: false,
      km_google: null,
      nota: '',
      geometry: '',
    },
  ],
};

beforeEach(() => {
  expect(st().importGraphFile(JSON.stringify(MINI))).toEqual({ ok: true });
});

describe('Proyecto II — módulo Guatemala en el store', () => {
  it('un dataset con cabeceras abre el módulo Guatemala con sus cabeceras', () => {
    expect(st().mode).toBe('guatemala');
    expect(st().graph.nodes).toHaveLength(4);
    expect(st().departments.SAC).toEqual({ cabecera: 'Antigua Guatemala' });
    // Norte arriba: Chimaltenango (14.66 °N) queda más arriba que Escuintla (14.31 °N).
    const y = (id: string) => st().graph.nodes.find((n) => n.id === id)!.y;
    expect(y('CHI')).toBeLessThan(y('ESC'));
  });

  it('agrega, valida y edita departamentos', () => {
    expect(st().addDepartment({ label: '  ', cabecera: 'x' })).toEqual({ ok: false, reason: 'empty-name' });
    expect(st().addDepartment({ label: 'sacatepequez', cabecera: 'x' })).toEqual({
      ok: false,
      reason: 'duplicate-name',
    });
    expect(st().addDepartment({ label: 'Jalapa', cabecera: 'Jalapa', lat: 200, lon: 0 })).toEqual({
      ok: false,
      reason: 'invalid-coords',
    });
    const r = st().addDepartment({ label: 'Petén', cabecera: 'Flores', at: { x: 50, y: 10 } });
    expect(r).toEqual({ ok: true, id: 'PET' });
    expect(st().departments.PET).toEqual({ cabecera: 'Flores' });
    expect(st().updateDepartment('PET', { cabecera: 'Flores, Petén' }).ok).toBe(true);
    expect(st().departments.PET!.cabecera).toBe('Flores, Petén');
    expect(st().graph.nodes.find((n) => n.id === 'PET')!.label).toBe('Petén');
  });

  it('agrega carreteras bidireccionales con nombre y rechaza duplicadas, lazos y km ≤ 0', () => {
    expect(st().addRoad('SAC', 'SAC', 10)).toEqual({ ok: false, reason: 'self-loop' });
    expect(st().addRoad('SAC', 'ESC', 0)).toEqual({ ok: false, reason: 'invalid-weight' });
    expect(st().addRoad('SAC', 'GUA', 12)).toEqual({ ok: false, reason: 'duplicate', existingEdgeId: 'GUA-SAC' });
    const r = st().addRoad('SAC', 'ESC', 48.9, ' RN-14 ');
    expect(r).toEqual({ ok: true, edgeId: 'ESC-SAC' });
    const e = st().graph.edges.find((x) => x.id === 'ESC-SAC')!;
    expect(e.meta?.carretera).toBe('RN-14');
    expect(st().updateRoad('ESC-SAC', { km: 50, road: 'CA-14' })).toBe(true);
    expect(st().updateRoad('ESC-SAC', { km: -1 })).toBe(false);
    expect(st().graph.edges.find((x) => x.id === 'ESC-SAC')).toMatchObject({
      weight: 50,
      meta: { carretera: 'CA-14' },
    });
  });

  it('la ruta trae su desglose: listado, tramos con carretera, acumulados y suma', () => {
    st().setPathQuery('CHI', 'ESC');
    const b = st().breakdown![0]!;
    expect(b.nodes).toEqual(['CHI', 'GUA', 'ESC']);
    expect(b.legs.map((l) => [l.from, l.to, l.road, l.km, l.cumulative])).toEqual([
      ['CHI', 'GUA', 'CA-1', 54.7, 54.7],
      ['GUA', 'ESC', 'CA-9', 56.2, 110.9],
    ]);
    expect(b.total).toBeCloseTo(110.9, 9);
    expect(b.formula).toBe('54.7 + 56.2 = 110.9 km');
  });

  it('Prim y Kruskal dan el mismo total en la red cargada', () => {
    const { prim, kruskal } = st().mst!;
    expect(prim.total).toBeCloseTo(kruskal.total, 9);
    expect(prim.edges).toHaveLength(3);
    // AEM a mano: CHI-SAC 18.3 + GUA-SAC 40.1 + ESC-GUA 56.2 = 114.6
    expect(new Set(kruskal.edges)).toEqual(new Set(['CHI-SAC', 'GUA-SAC', 'ESC-GUA']));
    expect(kruskal.total).toBeCloseTo(114.6, 9);
    st().setMstStart('ESC');
    expect(st().mstStart).toBe('ESC');
    expect(st().mst!.prim.steps[0]!.inTree).toEqual(['ESC']);
  });

  it('exporta e importa sin perder cabeceras, coordenadas ni carreteras', () => {
    st().addDepartment({ label: 'Jutiapa', cabecera: 'Jutiapa', lat: 14.29, lon: -89.895 });
    st().addRoad('ESC', 'JUT', 140.2, 'CA-2');
    const ds = st().exportGuatemalaDataset();
    expect(ds.nodes.find((n) => n.id === 'JUT')).toMatchObject({ cabecera: 'Jutiapa', lat: 14.29, lon: -89.895 });
    expect(ds.edges.find((e) => e.id === 'ESC-JUT')).toMatchObject({ km: 140.2, carretera: 'CA-2' });
    st().loadTemplate('vacio');
    expect(st().importGraphFile(JSON.stringify(ds))).toEqual({ ok: true });
    expect(st().mode).toBe('guatemala');
    expect(st().graph.nodes).toHaveLength(5);
    expect(st().departments.JUT).toEqual({ cabecera: 'Jutiapa' });
  });

  it('deshacer revierte también la cabecera', () => {
    st().updateDepartment('GUA', { cabecera: 'Otra' });
    expect(st().departments.GUA!.cabecera).toBe('Otra');
    st().undo();
    expect(st().departments.GUA!.cabecera).toBe('Ciudad de Guatemala');
  });

  it('el Proyecto I no cambia: Quetzaltenango sigue sin cabeceras ni contorno', () => {
    st().setMode('quetzaltenango');
    expect(st().mode).toBe('quetzaltenango');
    expect(st().departments).toEqual({});
    expect(st().outline).toBeNull();
  });
});
