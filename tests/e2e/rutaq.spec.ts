import fs from 'node:fs';
import { expect, test } from '@playwright/test';

const QTZ = JSON.parse(fs.readFileSync('src/data/quetzaltenango.json', 'utf8')) as {
  nodes: { id: string; label: string }[];
  edges: unknown[];
};

// Función auxiliar para leer la solución teórica de Dijkstra verificada con networkx
function getNetworkxDistance(graphFile: string, origin: string, destination: string): number {
  const content = fs.readFileSync('verification/resultados.csv', 'utf-8');
  for (const line of content.split('\n')) {
    const parts = line.trim().split(',');
    if (parts[0] === graphFile && parts[1] === origin && parts[2] === destination) {
      return parseFloat(parts[3]!);
    }
  }
  throw new Error(`Distancia no encontrada en resultados.csv para ${graphFile} ${origin}->${destination}`);
}

/** La interfaz muestra los km con 1 decimal (los datos tienen precisión de 0.1 km). */
const km1 = (d: number) => d.toFixed(1);

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

    // Verificar nodos clave por sus IDs reales del dataset
    await expect(page.getByTestId('node-QTZ')).toBeVisible();
    await expect(page.getByTestId('node-SAL')).toBeVisible();
    await expect(page.getByTestId('node-CAN')).toBeVisible();
    await expect(page.getByTestId('node-COA')).toBeVisible();

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
    await expect(page.getByTestId('tabular-summary-table')).toContainText('(Origen)');
    await expect(page.getByTestId('tabular-summary-table')).toContainText('A (A)');

    // Consulta 2: Desde nodo B
    await page.getByTestId('select-source-node').selectOption('B');
    await expect(page.getByTestId('tabular-summary-table')).toContainText('(Origen)');
    await expect(page.getByTestId('tabular-summary-table')).toContainText('B (B)');

    // Consulta 3: Desde nodo C
    await page.getByTestId('select-source-node').selectOption('C');
    await expect(page.getByTestId('tabular-summary-table')).toContainText('(Origen)');
    await expect(page.getByTestId('tabular-summary-table')).toContainText('C (C)');

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-03-f2-arbol.png`,
    });
  });

  test('04. Consultas F3 (Ruta más corta) entre 3 pares distintos', async ({ page }, testInfo) => {
    await page.goto('./');
    // Asegurar dataset de Quetzaltenango
    await page.getByTestId('template-select').selectOption('quetzaltenango');

    // Activar modo Ruta F3
    await page.getByTestId('query-mode-path').click();

    // Par 1: Quetzaltenango (QTZ) -> Salcajá (SAL)
    const dist1 = getNetworkxDistance('src/data/quetzaltenango.json', 'QTZ', 'SAL');
    await page.getByTestId('select-source-node').selectOption('QTZ');
    await page.getByTestId('select-target-node').selectOption('SAL');

    // Cambiar a pestaña gráfica para verificar resumen de ruta
    await page.getByTestId('tab-grafica').click();
    await expect(page.getByText(`Distancia Total: ${km1(dist1)} km`)).toBeVisible();

    // Par 2: Quetzaltenango (QTZ) -> Olintepeque (OLI)
    const dist2 = getNetworkxDistance('src/data/quetzaltenango.json', 'QTZ', 'OLI');
    await page.getByTestId('select-target-node').selectOption('OLI');
    await expect(page.getByText(`Distancia Total: ${km1(dist2)} km`)).toBeVisible();

    // Par 3: Quetzaltenango (QTZ) -> Coatepeque (COA)
    const dist3 = getNetworkxDistance('src/data/quetzaltenango.json', 'QTZ', 'COA');
    await page.getByTestId('select-target-node').selectOption('COA');
    await expect(page.getByText(`Distancia Total: ${km1(dist3)} km`)).toBeVisible();

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

  test('06. Lista S3 de todas las rutas, estrella en la mínima, cancelar y exportar CSV', async ({
    page,
  }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('ejemplo6');
    await page.getByTestId('query-mode-path').click();
    await page.getByTestId('select-source-node').selectOption('A');
    await page.getByTestId('select-target-node').selectOption('F');

    // Distancia teórica esperada de Dijkstra calculada con networkx
    const expectedDijkstraDist = getNetworkxDistance('src/data/ejemplo6.json', 'A', 'F');

    // Ir a pestaña S3
    await page.getByTestId('tab-rutas').click();
    await expect(page.getByTestId('all-paths-virtual-list')).toBeVisible();

    // Comprobar estrella en la ruta más corta y verificar que coincide con la solución teórica de Dijkstra
    const firstRow = page.getByTestId('path-row-0');
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await expect(firstRow).toContainText('⭐');
    await expect(firstRow).toContainText(km1(expectedDijkstraDist));
    await expect(firstRow).toContainText('+0.0');

    // Clic en la fila para resaltar
    await firstRow.click();

    // Exportar CSV
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('btn-export-csv').click()]);
    expect(download.suggestedFilename()).toContain('.csv');

    // Probar que cancelar S3 funciona: cambiar a Quetzaltenango y lanzar búsqueda de muchas rutas
    await page.getByTestId('template-select').selectOption('quetzaltenango');
    await page.getByTestId('query-mode-path').click();
    await page.getByTestId('select-source-node').selectOption('QTZ');
    await page.getByTestId('select-target-node').selectOption('COA');
    await page.getByTestId('tab-rutas').click();
    await page.getByTestId('btn-run-all-paths').click();

    // Si el botón de cancelar aparece durante la ejecución, presionarlo y verificar cancelación
    const cancelBtn = page.getByTestId('btn-cancel-all-paths');
    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click();
      await expect(page.getByText(/cancelada/i).first()).toBeVisible();
    }

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

    // Verificar presencia de los 5 nodos por sus etiquetas visibles (A, B, C, D, E)
    await expect(page.getByTestId('node-label-A')).toBeVisible();
    await expect(page.getByTestId('node-label-B')).toBeVisible();
    await expect(page.getByTestId('node-label-C')).toBeVisible();
    await expect(page.getByTestId('node-label-D')).toBeVisible();
    await expect(page.getByTestId('node-label-E')).toBeVisible();

    // Probar deshacer (elimina el nodo E)
    await page.getByTestId('btn-undo').click();
    await expect(page.getByTestId('node-label-E')).not.toBeVisible();

    // Probar rehacer (restaura el nodo E)
    await page.getByTestId('btn-redo').click();
    await expect(page.getByTestId('node-label-E')).toBeVisible();

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

    // Abrir menú de forma haciendo clic en la arista o su etiqueta
    const firstEdge = page.locator('[data-testid^="edge-interaction-"]').first();
    const firstWeight = page.locator('[data-testid^="edge-weight-"]').first();
    await expect(firstEdge).toBeAttached();
    await expect(firstWeight).toBeVisible();
    await firstWeight.click();

    // Cambiar forma a curva (bezier)
    await expect(page.getByTestId('edge-shape-bezier')).toBeVisible();
    await page.getByTestId('edge-shape-bezier').click();
    await page.waitForTimeout(200);

    // Abrir menú nuevamente y cambiar a arco
    await firstWeight.click();
    await expect(page.getByTestId('edge-shape-arc')).toBeVisible();
    await page.getByTestId('edge-shape-arc').click();
    await page.waitForTimeout(200);

    // Abrir menú y volver a automático
    await firstWeight.click();
    await expect(page.getByTestId('edge-shape-reset-auto')).toBeVisible();
    await page.getByTestId('edge-shape-reset-auto').click();

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-09-forma-arista.png`,
    });
  });

  test('10. Guardar y recargar archivo de grafo JSON', async ({ page }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('ejemplo6');

    // En móviles, abrir el menú de acciones secundarias si está presente
    const moreMenuBtn = page.getByTestId('header-more-btn');
    if (await moreMenuBtn.isVisible()) {
      await moreMenuBtn.click();
    }

    // Descargar archivo JSON
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="btn-export-json"]:visible').first().click(),
    ]);

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

  test('11. Empates en F3 (ejemplo6 de 6 nodos: A -> F con 2 rutas mínimas de 12)', async ({ page }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('ejemplo6');

    // Activar modo ruta F3
    await page.getByTestId('query-mode-path').click();
    await page.getByTestId('select-source-node').selectOption('A');
    await page.getByTestId('select-target-node').selectOption('F');

    // Verificar indicador de distancia en el lienzo: "12 ... · 2 rutas empatadas"
    const distBadge = page.getByTestId('path-distance-badge');
    await expect(distBadge).toBeVisible();
    await expect(distBadge).toContainText('12');
    await expect(distBadge).toContainText('2 rutas empatadas');

    // Verificar en la pestaña gráfica que se listan ambas rutas
    await page.getByTestId('tab-grafica').click();
    await expect(page.getByTestId('ties-alert')).toBeVisible();
    await expect(page.getByTestId('ties-alert')).toContainText('2 rutas mínimas');

    const path0 = page.getByTestId('shortest-path-0');
    const path1 = page.getByTestId('shortest-path-1');
    await expect(path0).toBeVisible();
    await expect(path1).toBeVisible();

    // Ambas tienen distancia 12
    await expect(path0).toContainText('12');
    await expect(path1).toContainText('12');

    // Secuencias de ambas rutas
    await expect(path0).toContainText('A → B → D → E → F');
    await expect(path1).toContainText('A → C → E → F');

    // Verificar en el lienzo que ambas rutas están resaltadas
    // Ruta 1 (sólida): A-B
    const edgeAB = page.locator('.react-flow__edge[data-id="A-B"] path').first();
    await expect(edgeAB).toHaveCSS('stroke', 'rgb(147, 51, 234)');

    // Ruta 2 (discontinua): A-C
    const edgeAC = page.locator('.react-flow__edge[data-id="A-C"] path').first();
    await expect(edgeAC).toHaveCSS('stroke', 'rgb(147, 51, 234)');

    // Seleccionar la segunda ruta (Ruta 2)
    await path1.click();
    await expect(path1).toContainText('✓ Ruta resaltada en el mapa');

    // Botón para volver a ver todas
    const showAllBtn = page.getByTestId('btn-show-all-tied');
    await expect(showAllBtn).toBeVisible();
    await showAllBtn.click();
    await expect(distBadge).toContainText('2 rutas empatadas');

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-11-f3-empates.png`,
    });
  });

  test('12. Diálogo de arista con peso inválido y validación en vivo', async ({ page }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('mode-design').click();
    await page.getByTestId('template-select').selectOption('ejemplo6');

    // Abrir diálogo de agregar arista
    await page.getByTestId('btn-add-edge').click();
    const modal = page.getByTestId('modal-add-edge');
    await expect(modal).toBeVisible();

    // Seleccionar origen y destino no conectados directamente (A y D)
    await page.getByTestId('select-edge-source').selectOption('A');
    await page.getByTestId('select-edge-target').selectOption('D');

    // Introducir peso 0 (inválido)
    const weightInput = page.getByTestId('input-edge-weight');
    await weightInput.fill('0');
    await expect(page.getByTestId('edge-weight-error')).toBeVisible();
    await expect(page.getByTestId('edge-weight-error')).toContainText('El peso debe ser mayor que cero');

    // El botón de enviar debe estar deshabilitado
    const submitBtn = page.getByTestId('btn-submit-edge');
    await expect(submitBtn).toBeDisabled();

    // Probar número negativo
    await weightInput.fill('-4');
    await expect(page.getByTestId('edge-weight-error')).toContainText('El peso debe ser mayor que cero');
    await expect(submitBtn).toBeDisabled();

    // Probar cerrar con tecla Escape (accesibilidad con foco atrapado)
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-12-dialogo-peso-invalido.png`,
    });
  });

  test('13. Arista duplicada ofrece editar la existente y actualiza la etiqueta', async ({ page }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('mode-design').click();
    await page.getByTestId('template-select').selectOption('ejemplo6');

    // En ejemplo6 ya existe la arista A-B con peso 4
    await expect(page.getByTestId('edge-weight-A-B')).toContainText('4');

    // Intentar agregar arista entre A y B con nuevo peso 18
    await page.getByTestId('btn-add-edge').click();
    await page.getByTestId('select-edge-source').selectOption('A');
    await page.getByTestId('select-edge-target').selectOption('B');
    await page.getByTestId('input-edge-weight').fill('18');
    await page.getByTestId('btn-submit-edge').click();

    // Debe mostrarse el diálogo de duplicado con mensaje claro
    const dupMsg = page.getByTestId('duplicate-edge-message');
    await expect(dupMsg).toBeVisible();
    await expect(dupMsg).toContainText('Ya existe una carretera entre A y B (peso 4)');

    // Ofrece "Editar la existente" y "Cancelar"
    const editBtn = page.getByTestId('btn-edit-existing-edge');
    const cancelBtn = page.getByTestId('btn-cancel-edge');
    await expect(editBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();

    // Tocar "Editar la existente"
    await editBtn.click();
    await expect(page.getByTestId('modal-add-edge')).not.toBeVisible();

    // Verificar que la arista existente A-B actualizó su peso a 18 en la etiqueta del lienzo
    await expect(page.getByTestId('edge-weight-A-B')).toContainText('18');

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-13-arista-duplicada.png`,
    });
  });

  test('14. Aviso de validación con varios problemas (+N más desplegable y selección con select)', async ({
    page,
  }, testInfo) => {
    await page.goto('./');

    // Importar un archivo con varios problemas (desconectado y peso no positivo)
    const graphData = {
      format: 'rutaq-graph',
      version: 1,
      name: 'Varios Problemas',
      graph: {
        nodes: [
          { id: 'A', label: 'A', x: 0, y: 0, w: 132, h: 44 },
          { id: 'B', label: 'B', x: 300, y: 0, w: 132, h: 44 },
          { id: 'C', label: 'C', x: 600, y: 300, w: 132, h: 44 },
        ],
        edges: [{ id: 'A-B', source: 'A', target: 'B', weight: 0, shape: 'straight', shapeAuto: true }],
        directed: false,
        unit: 'km',
      },
    };

    await page.getByTestId('input-file-json').setInputFiles({
      name: 'varios_problemas.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(graphData)),
    });

    const alert = page.getByTestId('validation-alert');
    await expect(alert).toBeVisible();

    // Debe haber un botón "+1 más" o "+N más"
    const toggleBtn = page.getByTestId('btn-toggle-issues');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toContainText('+1 más');

    // Al hacer clic en "+1 más", se despliega la lista completa de problemas
    await toggleBtn.click();
    const issuesList = page.getByTestId('validation-issues-list');
    await expect(issuesList).toBeVisible();

    // Comprobar que contiene ambos problemas (peso mayor que cero y desconectado)
    await expect(issuesList).toContainText(/mayor que cero/i);
    await expect(issuesList).toContainText(/desconectado/i);

    // Tocar el problema de grafo desconectado (afecta a nodo C): debe seleccionarlo con select
    const disconnectedIssue = page.locator('[data-testid^="validation-issue-"]').filter({ hasText: /desconectado/i });
    await disconnectedIssue.click();

    // Verificar que el nodo C fue seleccionado en el lienzo (con anillo de selección azul)
    await expect(page.getByTestId('node-C')).toHaveClass(/ring-2 ring-blue-600/);

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-14-aviso-varios-problemas.png`,
    });
  });

  test('15. Sincronización robusta del lienzo al alternar plantillas sin carreras', async ({ page }, testInfo) => {
    await page.goto('./');

    // Alternar 5 veces seguidas, sin esperas, entre Quetzaltenango y ejemplo6 (terminando en ejemplo6)
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('template-select').selectOption('quetzaltenango');
      await page.getByTestId('template-select').selectOption('ejemplo6');
    }

    // Al final verifica que el número de .react-flow__node visibles es exactamente el del grafo activo (6) y que hay 9 .react-flow__edge
    await expect(page.locator('.react-flow__node')).toHaveCount(6);
    await expect(page.locator('.react-flow__edge')).toHaveCount(9);
    await expect(page.locator('.react-flow__node').first()).toBeVisible();

    // Luego lo mismo terminando en Quetzaltenango (conteos tomados del dataset)
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('template-select').selectOption('ejemplo6');
      await page.getByTestId('template-select').selectOption('quetzaltenango');
    }

    await expect(page.locator('.react-flow__node')).toHaveCount(QTZ.nodes.length);
    await expect(page.locator('.react-flow__edge')).toHaveCount(QTZ.edges.length);
    await expect(page.locator('.react-flow__node').first()).toBeVisible();

    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-15-sincronizacion-lienzo.png`,
    });
  });

  test('16. Quetzaltenango: nombres legibles sin superposiciones y rosa de los vientos con escala en km', async ({
    page,
  }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('quetzaltenango');

    // Rosa de los vientos y barra de escala visibles
    await expect(page.getByTestId('compass-rose')).toBeVisible();
    await expect(page.getByTestId('compass-rose')).toContainText('N');
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toContainText(/km/);

    // Cada municipio sigue identificable aunque su nombre no quepa con este zoom (nombre accesible en el punto).
    for (const n of QTZ.nodes) await expect(page.getByLabel(n.label, { exact: true }).first()).toBeAttached();

    // Nombres visibles: la mayoría cabe con el mapa completo, ninguno se encima con otro ni se sale del lienzo.
    const canvas = (await page.getByTestId('graph-canvas').boundingBox())!;
    const labels = page.locator('[data-testid^="node-label-"]:visible');
    const visibles = await labels.count();
    expect(visibles).toBeGreaterThanOrEqual(testInfo.project.name === 'desktop-chrome' ? 20 : 15);
    const boxes = [];
    for (let i = 0; i < visibles; i++) {
      const loc = labels.nth(i);
      const box = (await loc.boundingBox())!;
      boxes.push({ id: await loc.getAttribute('data-testid'), ...box });
      expect(box.x, `${await loc.textContent()} dentro del lienzo`).toBeGreaterThanOrEqual(canvas.x - 1);
      expect(box.x + box.width, `${await loc.textContent()} dentro del lienzo`).toBeLessThanOrEqual(
        canvas.x + canvas.width + 1,
      );
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const b1 = boxes[i]!;
        const b2 = boxes[j]!;
        const overlaps = !(
          b1.x + b1.width <= b2.x ||
          b2.x + b2.width <= b1.x ||
          b1.y + b1.height <= b2.y ||
          b2.y + b2.height <= b1.y
        );
        expect(overlaps, `Las etiquetas ${b1.id} y ${b2.id} no deben superponerse`).toBe(false);
      }
    }

    // Al acercar aparecen los demás: con 6 pasos de zoom se leen los nombres de todos los municipios.
    for (let i = 0; i < 6; i++) {
      await page
        .getByRole('button', { name: /zoom in|acercar/i })
        .first()
        .click();
      await page.waitForTimeout(200);
    }
    await expect(page.locator('[data-testid^="node-label-"]:visible')).toHaveCount(QTZ.nodes.length);
  });

  test('17. Pesos de aristas: visibilidad automática, todas y ocultas', async ({ page }) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('quetzaltenango');

    // Selector en modo automático por defecto
    const weightsSelector = page.getByTestId('select-edge-weights-mode');
    await expect(weightsSelector).toBeVisible();
    await expect(weightsSelector).toHaveValue('auto');

    // Sin consulta no hay etiquetas de peso visibles
    await expect(page.locator('[data-testid^="edge-label-"]')).toHaveCount(0);

    // Consultar una ruta: QTZ -> COA
    await page.getByTestId('query-mode-path').click();
    await page.getByTestId('select-source-node').selectOption('QTZ');
    await page.getByTestId('select-target-node').selectOption('COA');

    // Solo se muestran las etiquetas de peso de la ruta consultada (< 10)
    const routeWeights = page.locator('[data-testid^="edge-label-"]');
    const routeWeightsCount = await routeWeights.count();
    expect(routeWeightsCount).toBeGreaterThan(0);
    expect(routeWeightsCount).toBeLessThan(10);

    // Cambiar a "todos": se ven todos los pesos del dataset
    await weightsSelector.selectOption('all');
    await expect(page.locator('[data-testid^="edge-label-"]')).toHaveCount(QTZ.edges.length);

    // Cambiar a "ocultos": no se ve ningún peso
    await weightsSelector.selectOption('hidden');
    await expect(page.locator('[data-testid^="edge-label-"]')).toHaveCount(0);
  });

  test('18. Panel de resultados tipo ventana: redimensionar, minimizar y maximizar', async ({ page, isMobile }) => {
    test.skip(isMobile, 'El panel tipo ventana con tirador lateral aplica en escritorio (≥1024px)');

    await page.goto('./');
    const panel = page.getByTestId('results-panel');
    await expect(panel).toBeVisible();
    const initialBox = await panel.boundingBox();
    expect(initialBox).toBeTruthy();

    // Redimensionar arrastrando el tirador izquierdo
    const handle = page.getByTestId('panel-resize-handle');
    await expect(handle).toBeVisible();
    const handleBox = await handle.boundingBox();
    expect(handleBox).toBeTruthy();

    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x - 120, handleBox!.y + handleBox!.height / 2);
    await page.mouse.up();

    const resizedBox = await panel.boundingBox();
    expect(resizedBox!.width).toBeGreaterThan(initialBox!.width + 40);

    // Redimensionar con teclado (flecha izquierda ensancha el panel)
    await handle.press('ArrowLeft');
    await handle.press('ArrowLeft');
    const kbBox = await panel.boundingBox();
    expect(kbBox!.width).toBeGreaterThan(resizedBox!.width);

    // Minimizar panel
    await page.getByTestId('btn-minimize-panel').click();
    const miniIcon = page.getByTestId('tab-tabla-mini');
    await expect(miniIcon).toBeVisible();
    const miniBox = await panel.boundingBox();
    expect(miniBox!.width).toBeLessThanOrEqual(60);

    // Restaurar tocando un icono de pestaña
    await page.getByTestId('tab-grafica-mini').click();
    await expect(page.getByTestId('tab-grafica')).toBeVisible();
    const restoredBox = await panel.boundingBox();
    expect(restoredBox!.width).toBeGreaterThan(300);

    // Maximizar panel
    await page.getByTestId('btn-maximize-panel').click();
    const maxBox = await panel.boundingBox();
    expect(maxBox!.width).toBeGreaterThan(700);

    // Restaurar panel
    await page.getByTestId('btn-restore-panel').click();
    const normalBox = await panel.boundingBox();
    expect(normalBox!.width).toBeLessThan(maxBox!.width);
  });

  test('19. Capturas de Quetzaltenango para el informe (sin consulta y con ruta QTZ -> COA)', async ({
    page,
  }, testInfo) => {
    await page.goto('./');
    await page.getByTestId('template-select').selectOption('quetzaltenango');
    await page.getByTestId('query-clear').click();
    await page.waitForTimeout(400);

    // Captura 1: Quetzaltenango sin consulta
    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-quetzaltenango-sin-consulta.png`,
    });

    // Consultar ruta Quetzaltenango -> Coatepeque
    await page.getByTestId('query-mode-path').click();
    await page.getByTestId('select-source-node').selectOption('QTZ');
    await page.getByTestId('select-target-node').selectOption('COA');
    await page.waitForTimeout(400);

    // Captura 2: Quetzaltenango con la ruta QTZ -> COA
    await page.screenshot({
      path: `docs/informe/capturas/${testInfo.project.name}-quetzaltenango-ruta-coa.png`,
    });
  });
});
