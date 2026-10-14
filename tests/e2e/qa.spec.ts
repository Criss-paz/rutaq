// QA final del orquestador (sección 8 del plan): casos que no cubre rutaq.spec.ts.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type N = { id: string; label?: string; x: number; y: number };
type E = { id: string; source: string; target: string; weight: number };

function archivo(name: string, nodes: N[], edges: E[], unit = 'u') {
  const graph = {
    nodes: nodes.map((n) => ({ label: n.id, w: 132, h: 44, ...n })),
    edges: edges.map((e) => ({ shape: 'straight', shapeAuto: true, ...e })),
    directed: false,
    unit,
  };
  return Buffer.from(JSON.stringify({ format: 'rutaq-graph', version: 1, name, graph }));
}

async function importar(page: Page, name: string, buffer: Buffer) {
  await page
    .getByTestId('input-file-json')
    .setInputFiles({ name: `${name}.json`, mimeType: 'application/json', buffer });
}

const cuadro = (w: number[]): [N[], E[]] => [
  [
    { id: 'A', x: 0, y: 0 },
    { id: 'B', x: 300, y: 0 },
    { id: 'C', x: 300, y: 300 },
    { id: 'D', x: 0, y: 300 },
  ],
  [
    { id: 'A-B', source: 'A', target: 'B', weight: w[0]! },
    { id: 'B-C', source: 'B', target: 'C', weight: w[1]! },
    { id: 'C-D', source: 'C', target: 'D', weight: w[2]! },
    { id: 'D-A', source: 'D', target: 'A', weight: w[3]! },
  ],
];

test.describe('QA — validaciones con mensajes claros', () => {
  const casos: [string, N[], E[], RegExp][] = [
    ['peso cero', ...cuadro([1, 0, 1, 1]), /mayor que cero/i],
    ['peso negativo', ...cuadro([1, -4, 1, 1]), /mayor que cero/i],
    ['lazo', [{ id: 'A', x: 0, y: 0 }], [{ id: 'A-A', source: 'A', target: 'A', weight: 3 }], /consigo mismo/i],
    [
      'arista duplicada',
      [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 300, y: 0 },
      ],
      [
        { id: 'A-B', source: 'A', target: 'B', weight: 3 },
        { id: 'B-A', source: 'B', target: 'A', weight: 5 },
      ],
      /más de una arista/i,
    ],
    [
      'grafo desconectado',
      [
        { id: 'A', x: 0, y: 0 },
        { id: 'B', x: 300, y: 0 },
        { id: 'C', x: 600, y: 300 },
      ],
      [{ id: 'A-B', source: 'A', target: 'B', weight: 3 }],
      /desconectado/i,
    ],
  ];

  for (const [nombre, nodes, edges, mensaje] of casos) {
    test(`${nombre}: aviso visible y sin errores de consola`, async ({ page }) => {
      const errores: string[] = [];
      page.on('pageerror', (e) => errores.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
      await page.goto('./');
      await importar(page, nombre, archivo(nombre, nodes, edges));
      await expect(page.getByTestId('validation-alert')).toContainText(mensaje);
      expect(errores).toEqual([]);
    });
  }

  test('grafo desconectado: F3 informa que no existe ruta', async ({ page }) => {
    await page.goto('./');
    const nodes: N[] = [
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: 300, y: 0 },
      { id: 'C', x: 600, y: 300 },
    ];
    await importar(
      page,
      'desconectado',
      archivo('desconectado', nodes, [{ id: 'A-B', source: 'A', target: 'B', weight: 3 }]),
    );
    await page.getByTestId('query-mode-path').click();
    await page.getByTestId('select-source-node').selectOption('A');
    await page.getByTestId('select-target-node').selectOption('C');
    await page.getByTestId('tab-grafica').click();
    await expect(page.getByText('No existe ruta entre A y C')).toBeVisible();
  });
});

test.describe('QA — escala automática y distribución sugerida', () => {
  for (const [maximo, rango] of [
    [80, '1–100'],
    [800, /1\D?000/],
    [8000, /10\D?000/],
  ] as const) {
    test(`pesos hasta ${maximo}: detecta el rango y aplica la distribución`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'El indicador de escala se muestra en pantallas ≥ md.');
      await page.goto('./');
      await importar(
        page,
        `escala-${maximo}`,
        archivo('escala', ...cuadro([maximo, maximo / 2, maximo / 4, maximo / 8])),
      );
      await expect(page.getByTestId('scale-badge')).toContainText(rango);
      await page.getByTestId('btn-apply-layout').or(page.getByTestId('btn-suggest-layout')).first().click();
      await expect(page.getByTestId('stress-error-badge')).toContainText(/\d+(\.\d+)?\s?%/);
    });
  }
});

test.describe('QA — S3 en Quetzaltenango', () => {
  // Distancia de referencia calculada por networkx (verification/resultados.csv).
  const ref = readFileSync('verification/resultados.csv', 'utf8')
    .split(/\r?\n/)
    .map((l) => l.split(','))
    .find((c) => c[0]!.endsWith('quetzaltenango.json') && c[1] === 'QTZ' && c[2] === 'COA')!;
  const esperado = Number(ref[3]).toFixed(1);

  async function consultar(page: Page) {
    await page.goto('./');
    await page.getByTestId('mode-quetzaltenango').click();
    await page.getByTestId('query-mode-path').click();
    await page.getByTestId('select-source-node').selectOption('QTZ');
    await page.getByTestId('select-target-node').selectOption('COA');
  }

  test('la primera ruta de S3 es la de Dijkstra/networkx y la UI sigue respondiendo', async ({ page }) => {
    test.setTimeout(90_000);
    await consultar(page);
    await page.getByTestId('tab-rutas').click();
    // Mientras el Worker busca, la interfaz responde: cambiar de pestaña es inmediato.
    await page.getByTestId('tab-tabla').click({ timeout: 2000 });
    await expect(page.getByTestId('tabular-iterations-table')).toBeVisible({ timeout: 2000 });
    await page.getByTestId('tab-rutas').click();
    const primera = page.getByTestId('path-row-0');
    await expect(primera).toBeVisible({ timeout: 60_000 });
    await expect(primera).toContainText('⭐');
    await expect(primera).toContainText(esperado);
  });

  test('cancelar la búsqueda de S3 funciona', async ({ page }) => {
    await consultar(page);
    await page.getByTestId('tab-rutas').click();
    const cancelar = page.getByTestId('btn-cancel-all-paths');
    // Con el límite máximo la búsqueda dura lo suficiente para poder cancelarla.
    const limite = page.getByTestId('select-paths-limit');
    const opciones = await limite
      .locator('option')
      .evaluateAll((os) => os.map((o) => (o as unknown as { value: string }).value));
    await limite.selectOption(opciones.sort((a, b) => Number(b) - Number(a))[0]!);
    await page.getByTestId('btn-run-all-paths').click();
    await expect(cancelar).toBeVisible({ timeout: 5000 });
    await cancelar.click();
    await expect(page.getByText(/cancelada/i).first()).toBeVisible();
    await expect(page.getByTestId('btn-run-all-paths')).toBeEnabled();
  });
});
