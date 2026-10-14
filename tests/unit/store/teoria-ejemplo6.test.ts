import { describe, expect, it } from 'vitest';
import type { GraphFile } from '../../../src/core/types';
import { buildTabular, dijkstra } from '../../../src/core';
import ejemplo6 from '../../../src/data/ejemplo6.json';

// Transcripción de docs/informe/solucion_teorica.md (sección 4): por fila, nodo elegido y etiquetas "dist(pred)".
const MANO: [string | null, Record<string, string>][] = [
  [null, { A: '0(-)', B: '∞', C: '∞', D: '∞', E: '∞', F: '∞' }],
  ['A', { A: '0(-)', B: '4(A)', C: '4(A)', D: '10(A)', E: '∞', F: '∞' }],
  ['B', { A: '0(-)', B: '4(A)', C: '4(A)', D: '7(B)', E: '∞', F: '∞' }],
  ['C', { A: '0(-)', B: '4(A)', C: '4(A)', D: '7(B)', E: '9(C)', F: '∞' }],
  ['D', { A: '0(-)', B: '4(A)', C: '4(A)', D: '7(B)', E: '9(C)', F: '13(D)' }],
  ['E', { A: '0(-)', B: '4(A)', C: '4(A)', D: '7(B)', E: '9(C)', F: '12(E)' }],
  ['F', { A: '0(-)', B: '4(A)', C: '4(A)', D: '7(B)', E: '9(C)', F: '12(E)' }],
];

describe('comparación teórica: ejemplo de 6 nodos', () => {
  const g = (ejemplo6 as GraphFile).graph;
  const tabla = buildTabular(g, dijkstra(g, 'A'));

  it('la tabla del programa coincide con la solución a mano, iteración por iteración', () => {
    expect(tabla.rows).toHaveLength(MANO.length);
    tabla.rows.forEach((row, i) => {
      const [elegido, etiquetas] = MANO[i]!;
      expect(row.current).toBe(elegido);
      for (const [id, texto] of Object.entries(etiquetas)) {
        const { dist, pred } = row.cells[id]!.label;
        expect(Number.isFinite(dist) ? `${dist}(${pred ?? '-'})` : '∞', `iteración ${i}, columna ${id}`).toBe(texto);
      }
    });
  });

  it('la casilla mínima de cada iteración es la del nodo elegido', () => {
    tabla.rows.slice(1).forEach((row) => expect(row.cells[row.current!]!.state).toBe('min'));
  });
});
