import { expect, test } from '@playwright/test';

test.describe('RutaQ — Interfaz y Experiencia de Usuario E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Escuchar errores en consola
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`Error en consola del navegador: ${msg.text()}`);
      }
    });
  });

  test('01. Carga inicial y layout general sin errores de consola', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('./');
    await expect(page).toHaveTitle(/RutaQ/);
    await expect(page.getByRole('heading', { name: 'RutaQ' })).toBeVisible();

    // Comprobar elementos principales
    await expect(page.getByTestId('mode-quetzaltenango')).toBeVisible();
    await expect(page.getByTestId('mode-design')).toBeVisible();
    await expect(page.getByTestId('template-select')).toBeVisible();
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await expect(page.getByTestId('results-panel')).toBeVisible();

    // Guardar captura
    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-01-inicio.png`,
      fullPage: true,
    });

    expect(errors).toEqual([]);
  });

  test('02. Cargar plantilla de Quetzaltenango con 24 municipios', async ({ page }, testInfo) => {
    await page.goto('./');

    // Cambiar a plantilla Quetzaltenango
    await page.getByTestId('template-select').selectOption('quetzaltenango');

    // Verificar nodos clave
    await expect(page.getByTestId('node-quetzaltenango')).toBeVisible();
    await expect(page.getByTestId('node-salcaja')).toBeVisible();
    await expect(page.getByTestId('node-cantel')).toBeVisible();
    await expect(page.getByTestId('node-coatepeque')).toBeVisible();

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-02-quetzaltenango.png`,
    });
  });

  test('03. Consultas F2 (Árbol Dijkstra) desde 3 nodos distintos', async ({ page }, testInfo) => {
    await page.goto('./');

    // Cargar plantilla ejemplo 6 nodos
    await page.getByTestId('template-select').selectOption('ejemplo6');

    // Asegurar pestaña tabla activa
    await page.getByTestId('tab-tabla').click();

    // Activar modo Árbol F2
    await page.getByTestId('query-mode-tree').click();

    // Consulta 1: Desde nodo A
    await page.getByTestId('select-source-node').selectOption('A');
    await expect(page.getByTestId('tabular-summary-table')).toBeVisible();
    await expect(page.getByTestId('tabular-summary-table')).toContainText('A (Origen)');

    // Consulta 2: Desde nodo B
    await page.getByTestId('select-source-node').selectOption('B');
    await expect(page.getByTestId('tabular-summary-table')).toContainText('B (B)');

    // Consulta 3: Desde nodo C
    await page.getByTestId('select-source-node').selectOption('C');
    await expect(page.getByTestId('tabular-summary-table')).toContainText('C (C)');

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-03-f2-arbol.png`,
    });
  });

  test('04. Consultas F3 (Ruta más corta) entre 3 pares distintos', async ({ page }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('ejemplo6');

    // Activar modo Ruta F3
    await page.getByTestId('query-mode-path').click();

    // Par 1: A -> F
    await page.getByTestId('select-source-node').selectOption('A');
    await page.getByTestId('select-target-node').selectOption('F');

    // Cambiar a pestaña gráfica para verificar resumen de ruta
    await page.getByTestId('tab-grafica').click();
    await expect(page.getByText('Distancia Total: 13 km')).toBeVisible();

    // Par 2: A -> D (A -> C (2) -> B (1) -> D (5) = 8 km)
    await page.getByTestId('select-target-node').selectOption('D');
    await expect(page.getByText('Distancia Total: 8 km')).toBeVisible();

    // Par 3: B -> E (B -> D (5) -> E (2) = 7 km)
    await page.getByTestId('select-source-node').selectOption('B');
    await page.getByTestId('select-target-node').selectOption('E');
    await expect(page.getByText('Distancia Total: 7 km')).toBeVisible();

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-04-f3-ruta.png`,
    });
  });

  test('05. Tabla S1 paso a paso, reproducción y configuraciones', async ({ page }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('ejemplo6');
    await page.getByTestId('query-mode-path').click();
    await page.getByTestId('select-source-node').selectOption('A');
    await page.getByTestId('select-target-node').selectOption('F');

    // Abrir pestaña tabla
    await page.getByTestId('tab-tabla').click();
    await expect(page.getByTestId('tabular-iterations-table')).toBeVisible();

    // Comprobar paso anterior y siguiente
    await page.getByTestId('btn-step-prev').click();
    await page.getByTestId('btn-step-next').click();

    // Ir al final
    await page.getByTestId('btn-step-end').click();
    await expect(page.getByText(/Iteración \d+ de \d+/)).toBeVisible();

    // Cambiar formato de etiquetas a corchetes
    await page.getByTestId('select-label-format').selectOption('bracket');
    await expect(page.getByTestId('tabular-iterations-table')).toContainText('[');

    // Cambiar formato de etiquetas a barra diagonal
    await page.getByTestId('select-label-format').selectOption('slash');
    await expect(page.getByTestId('tabular-iterations-table')).toContainText('/');

    // Toggle matriz de adyacencia
    await page.getByTestId('toggle-adjacency').check();
    await expect(page.getByText('Matriz de Adyacencia (Pesos Directos)')).toBeVisible();

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-05-tabla-s1.png`,
    });
  });

  test('06. Lista S3 de todas las rutas, estrella en la mínima, resaltar y exportar CSV', async ({
    page,
  }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('ejemplo6');
    await page.getByTestId('query-mode-path').click();
    await page.getByTestId('select-source-node').selectOption('A');
    await page.getByTestId('select-target-node').selectOption('F');

    // Ir a pestaña S3
    await page.getByTestId('tab-rutas').click();
    await expect(page.getByTestId('all-paths-virtual-list')).toBeVisible();

    // Comprobar estrella en la más corta
    const firstRow = page.getByTestId('path-row-0');
    await expect(firstRow).toBeVisible();
    await expect(firstRow).toContainText('⭐');
    await expect(firstRow).toContainText('13 km');
    await expect(firstRow).toContainText('+0.0 km');

    // Clic en la fila para resaltar
    await firstRow.click();

    // Exportar CSV
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('btn-export-csv').click()]);
    expect(download.suggestedFilename()).toContain('.csv');

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-06-s3-todas-rutas.png`,
    });
  });

  test('07. Pestaña Floyd-Warshall con navegación de matrices D(k)', async ({ page }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('ejemplo6');

    // Ir a pestaña Floyd
    await page.getByTestId('tab-floyd').click({ force: true });
    await expect(page.getByTestId('floyd-matrix-table')).toBeVisible();

    // Cambiar a paso k = 0
    await page.getByTestId('floyd-k-selector').selectOption('0');
    await expect(page.getByText('Matriz de Distancias D⁽0⁾')).toBeVisible();

    // Avanzar a paso k = 1
    await page.getByTestId('floyd-k-next').click();
    await expect(page.getByText('Matriz de Distancias D⁽1⁾')).toBeVisible();

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-07-floyd.png`,
    });
  });

  test('08. Modo diseño: crear grafo de 5 nodos y resolverlo con deshacer/rehacer', async ({ page }, testInfo) => {
    await page.goto('./');

    // Cambiar a modo Diseño
    await page.getByTestId('mode-design').click();

    // Cargar plantilla vacía
    await page.getByTestId('template-select').selectOption('vacio');

    // Agregar 5 nodos
    await page.getByTestId('btn-add-node').click();
    await page.getByTestId('btn-add-node').click();
    await page.getByTestId('btn-add-node').click();
    await page.getByTestId('btn-add-node').click();
    await page.getByTestId('btn-add-node').click();

    // Verificar presencia de los 5 nodos
    await expect(page.getByTestId('node-N1')).toBeVisible();
    await expect(page.getByTestId('node-N2')).toBeVisible();
    await expect(page.getByTestId('node-N3')).toBeVisible();
    await expect(page.getByTestId('node-N4')).toBeVisible();
    await expect(page.getByTestId('node-N5')).toBeVisible();

    // Probar deshacer
    await page.getByTestId('btn-undo').click();
    await expect(page.getByTestId('node-N5')).not.toBeVisible();

    // Probar rehacer
    await page.getByTestId('btn-redo').click();
    await expect(page.getByTestId('node-N5')).toBeVisible();

    // Probar distribución sugerida
    await page.getByTestId('btn-suggest-layout').click();

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-08-modo-diseno.png`,
    });
  });

  test('09. Cambiar forma de arista (recta, curva, arco, etc.) y volver a automático', async ({ page }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('ejemplo6');
    await page.getByTestId('query-clear').click();

    // Abrir menú de arista e1
    await expect(page.getByTestId('edge-menu-e1')).toBeVisible();
    await page.getByTestId('edge-menu-e1').click({ force: true });

    // Cambiar forma a curva (bezier)
    await expect(page.getByTestId('edge-shape-bezier')).toBeVisible();
    await page.getByTestId('edge-shape-bezier').click({ force: true });
    await page.waitForTimeout(200);

    // Abrir menú nuevamente y cambiar a arco
    await expect(page.getByTestId('edge-menu-e1')).toBeVisible();
    await page.getByTestId('edge-menu-e1').click({ force: true });
    await expect(page.getByTestId('edge-shape-arc')).toBeVisible();
    await page.getByTestId('edge-shape-arc').click({ force: true });
    await page.waitForTimeout(200);

    // Abrir menú y volver a automático
    await expect(page.getByTestId('edge-menu-e1')).toBeVisible();
    await page.getByTestId('edge-menu-e1').click({ force: true });
    await expect(page.getByTestId('edge-shape-reset-auto')).toBeVisible();
    await page.getByTestId('edge-shape-reset-auto').click({ force: true });

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-09-forma-arista.png`,
    });
  });

  test('10. Guardar y recargar archivo de grafo JSON', async ({ page }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('ejemplo6');

    // Descargar archivo JSON
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('btn-export-json').click()]);

    expect(download.suggestedFilename()).toContain('.json');
    const path = await download.path();
    expect(path).toBeTruthy();

    // Modificar grafo cambiando a vacío
    await page.getByTestId('template-select').selectOption('vacio');
    await expect(page.getByTestId('node-A')).not.toBeVisible();

    // Recargar archivo JSON descargado
    if (path) {
      await page.getByTestId('input-file-json').setInputFiles(path);
      // El grafo recargado debe tener de nuevo el nodo A
      await expect(page.getByTestId('node-A')).toBeVisible();
    }

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-10-guardar-recargar.png`,
    });
  });
});
