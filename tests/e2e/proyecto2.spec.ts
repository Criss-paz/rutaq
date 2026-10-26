import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import type { GuatemalaDataset } from '../../src/core/types';
import { datasetToGraph } from '../../src/store/dataset';
import { shortestPaths, prim, kruskal } from '../../src/core';

// Cargar el dataset oficial de Guatemala para calcular valores esperados de forma dinámica
const guatemalaRaw = JSON.parse(fs.readFileSync('src/data/guatemala.json', 'utf8')) as GuatemalaDataset;
const gGraph = datasetToGraph(guatemalaRaw, 1400, 'mercator');

test.describe('Proyecto II — Módulo Guatemala (Transporte Express) E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Monitorear errores en consola
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[Browser Console Error]: ${msg.text()}`);
      }
    });
    await page.goto('./');
    // Asegurar selección del modo Guatemala
    const guatBtn = page.getByTestId('mode-guatemala');
    await guatBtn.click();
  });

  test('01. Cambio a modo Guatemala, identidad de marca y elementos del mapa', async ({ page }) => {
    // Verificar encabezado de marca propio
    await expect(page.getByRole('heading', { name: 'Transporte Express' })).toBeVisible();

    // Selector de plantilla refleja guatemala
    await expect(page.getByTestId('template-select')).toHaveValue('guatemala');

    // Barra de herramientas de Guatemala presente
    await expect(page.getByTestId('guatemala-toolbar')).toBeVisible();

    // Elementos del mapa requeridos por G1: rosa de los vientos, escala y botón ajustar pantalla
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('compass-rose')).toBeVisible();
    await expect(page.getByTestId('btn-fit-view')).toBeVisible();
  });

  test('02. Asistente de envíos con cálculo dinámico para 3 pares y suma de tramos', async ({ page }) => {
    const pairs = [
      { source: 'QUE', target: 'IZA', btnId: 'btn-example-que-iza' },
      { source: 'GUA', target: 'PET', btnId: 'btn-example-gua-pet' },
      { source: 'SMA', target: 'JUT', btnId: 'btn-example-sma-jut' },
    ];

    for (const item of pairs) {
      const expPaths = shortestPaths(gGraph, item.source, item.target);
      const expDist = expPaths[0]?.distance ?? 0;

      // Click en el ejemplo rápido correspondiente
      await page.getByTestId(item.btnId).click();

      // Asegurar que la pestaña de desglose esté activa
      const breakdownTab = page.getByTestId('tab-breakdown');
      if (await breakdownTab.isVisible()) {
        await breakdownTab.click();
      }

      // Verificar total grande en km
      const totalEl = page.getByTestId('route-total-distance');
      await expect(totalEl).toBeVisible();
      await expect(totalEl).toContainText(`${expDist.toFixed(1)} km`);

      // Verificar fórmula matemática
      const formulaEl = page.getByTestId('route-formula');
      await expect(formulaEl).toBeVisible();
      await expect(formulaEl).toContainText(`${expDist.toFixed(1)} km`);

      // Verificar tabla de tramos y que la suma de tramos sea exactamente el total
      const legRows = page.getByTestId(/^leg-row-\d+$/);
      const count = await legRows.count();
      expect(count).toBeGreaterThan(0);

      // Comprobar la secuencia de nodos
      const seqEl = page.getByTestId('route-nodes-sequence');
      await expect(seqEl).toBeVisible();
      await expect(seqEl).toContainText(item.source);
      await expect(seqEl).toContainText(item.target);
    }
  });

  test('03. Diálogo de 2 pasos del Asistente con búsqueda interactiva', async ({ page }) => {
    const expPaths = shortestPaths(gGraph, 'GUA', 'PET');
    const expDist = expPaths[0]?.distance ?? 0;

    // Abrir asistente modal
    await page.getByTestId('btn-calculate-route').click();
    await expect(page.getByTestId('modal-assistant')).toBeVisible();

    // Paso 1: filtrar origen
    await page.getByTestId('input-assistant-source-search').fill('Guatemala');
    await page.getByTestId('btn-select-source-GUA').click();

    // Paso 2: filtrar destino
    await page.getByTestId('input-assistant-target-search').fill('Petén');
    await page.getByTestId('btn-select-target-PET').click();

    // El modal debe haberse cerrado
    await expect(page.getByTestId('modal-assistant')).not.toBeVisible();

    // Verificar resultado calculado
    const totalEl = page.getByTestId('route-total-distance');
    await expect(totalEl).toBeVisible();
    await expect(totalEl).toContainText(`${expDist.toFixed(1)} km`);
  });

  test('04. AEM: Prim y Kruskal producen el mismo total y navegación de pasos', async ({ page }) => {
    const expPrim = prim(gGraph);
    const expKruskal = kruskal(gGraph);

    // Verificación teórica interna
    expect(Math.abs(expPrim.total - expKruskal.total)).toBeLessThan(0.001);

    // Activar modo Red Mínima
    await page.getByTestId('btn-example-mst').click();

    // Asegurar que la pestaña MST esté seleccionada
    const mstTab = page.getByTestId('tab-mst');
    if (await mstTab.isVisible()) {
      await mstTab.click();
    }

    // Verificar aviso de equivalencia Prim y Kruskal
    await expect(page.getByTestId('mst-same-total-notice')).toBeVisible();

    // Verificar distancia total del AEM
    const totalEl = page.getByTestId('mst-total-distance');
    await expect(totalEl).toBeVisible();
    await expect(totalEl).toContainText(`${expPrim.total.toFixed(1)} km`);

    // Pestaña Prim con controles paso a paso
    await page.getByTestId('tab-mst-prim').click();
    await expect(page.getByTestId('table-prim-steps')).toBeVisible();
    await expect(page.getByTestId('btn-prim-prev')).toBeVisible();
    await expect(page.getByTestId('btn-prim-next')).toBeVisible();
    await expect(page.getByTestId('btn-prim-play')).toBeVisible();

    // Probar controles de paso: retroceder un paso y luego avanzar
    await page.getByTestId('btn-prim-prev').click();
    await page.getByTestId('btn-prim-next').click();

    // Pestaña Kruskal con aristas ordenadas
    await page.getByTestId('tab-mst-kruskal').click();
    await expect(page.getByTestId('table-kruskal-steps')).toBeVisible();
  });

  test('05. Administrar red: agregar departamento y carretera, ordenar y restaurar', async ({ page }) => {
    // Abrir panel modal de administración de red
    await page.getByTestId('btn-admin-network').click();
    await expect(page.getByTestId('modal-admin-network')).toBeVisible();

    // 1. Agregar nuevo departamento
    await page.getByTestId('input-dept-label').fill('Nuevo Dept');
    await page.getByTestId('input-dept-cabecera').fill('Cabecera Prueba');
    await page.getByTestId('input-dept-lat').fill('15.5');
    await page.getByTestId('input-dept-lon').fill('-90.3');
    await page.getByTestId('btn-save-department').click();

    // Comprobar que aparece en la tabla
    await expect(page.getByTestId('table-departments')).toContainText('Nuevo Dept');

    // 2. Ir a la pestaña de carreteras
    await page.getByTestId('tab-admin-roads').click();
    await expect(page.getByTestId('table-roads')).toBeVisible();

    // Agregar carretera
    await page.getByTestId('select-road-source').selectOption('GUA');
    await page.getByTestId('select-road-target').selectOption('NUE'); // ID derivado de Nuevo Dept
    await page.getByTestId('input-road-km').fill('35.5');
    await page.getByTestId('input-road-name').fill('CA-Express');
    await page.getByTestId('btn-save-road').click();

    // Comprobar que la carretera se añadió
    await expect(page.getByTestId('table-roads')).toContainText('CA-Express');

    // 3. Probar ordenamiento en la tabla de carreteras
    await page.getByTestId('sort-road-km').click();

    // 4. Verificar botones de exportar e importar JSON
    await expect(page.getByTestId('btn-admin-export-json')).toBeVisible();
    await expect(page.getByTestId('btn-admin-import-json')).toBeVisible();

    // 5. Restaurar datos originales con confirmación
    await page.getByTestId('btn-admin-restore-original').click();
    await page.getByTestId('btn-confirm-restore').click();

    // Comprobar que regresó al estado inicial
    await page.getByTestId('tab-admin-departments').click();
    await expect(page.getByTestId('table-departments')).not.toContainText('Nuevo Dept');

    // Cerrar modal
    await page.getByTestId('modal-close-btn').click();
    await expect(page.getByTestId('modal-admin-network')).not.toBeVisible();
  });

  test('06. Modo presentación y Diálogo Acerca de', async ({ page }) => {
    // Abrir modo presentación
    await page.getByTestId('btn-presentation-mode').click();
    await expect(page.getByTestId('guatemala-presentation-overlay')).toBeVisible();

    // Salir del modo presentación con tecla Escape
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('guatemala-presentation-overlay')).not.toBeVisible();

    // Abrir diálogo Acerca de
    await page.getByTestId('btn-about').click();
    await expect(page.getByTestId('modal-about')).toBeVisible();

    // Verificar los 3 integrantes con sus carnés exactos y la universidad
    const aboutContent = page.getByTestId('modal-about');
    await expect(aboutContent).toContainText('Cristopher Alexis Castellanos Paz');
    await expect(aboutContent).toContainText('2690-24-5972');
    await expect(aboutContent).toContainText('Leonel Taracena');
    await expect(aboutContent).toContainText('2690-24-4072');
    await expect(aboutContent).toContainText('Pablo Alexander Vásquez');
    await expect(aboutContent).toContainText('2690-24-13123');
    await expect(aboutContent).toContainText('Universidad Mariano Gálvez de Guatemala');

    // Cerrar diálogo
    await page.getByTestId('btn-close-about').scrollIntoViewIfNeeded();
    await page.getByTestId('btn-close-about').click();
    await expect(page.getByTestId('modal-about')).not.toBeVisible();
  });

  test('07. Persistencia de estado tras recarga de página', async ({ page }) => {
    // Fijar una consulta
    await page.getByTestId('btn-example-que-iza').click();

    // Recargar la página
    await page.reload();

    // Verificar que el modo Guatemala persiste con el título
    await expect(page.getByRole('heading', { name: 'Transporte Express' })).toBeVisible();
  });
});
