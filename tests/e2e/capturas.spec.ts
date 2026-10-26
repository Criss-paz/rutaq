import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const OUT_DIR = 'docs/capturas/proyecto2';

test.describe('Capturas automáticas de alta fidelidad — Proyecto II (Transporte Express)', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(OUT_DIR)) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
    }
  });

  test('Capturas en Desktop (Chrome)', async ({ page }, testInfo) => {
    // Si no es desktop-chrome, ignorar este test específico de desktop
    if (testInfo.project.name !== 'desktop-chrome') return;

    await page.goto('./');
    // Cambiar a modo Guatemala
    await page.getByTestId('mode-guatemala').click();
    await expect(page.getByRole('heading', { name: 'Transporte Express' })).toBeVisible();

    // 01. Pantalla inicial
    await page.screenshot({ path: `${OUT_DIR}/01-pantalla-inicial.png`, fullPage: true });

    // 02. Mapa completo
    await page.getByTestId('btn-fit-view').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT_DIR}/02-mapa-completo.png`, fullPage: true });

    // 03. Formulario de departamentos (modal Administrar red)
    await page.getByTestId('btn-admin-network').click();
    await expect(page.getByTestId('modal-admin-network')).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/03-formulario-departamentos.png` });

    // 04. Formulario de carreteras
    await page.getByTestId('tab-admin-roads').click();
    await expect(page.getByTestId('table-roads')).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/04-formulario-carreteras.png` });

    // Cerrar modal admin
    await page.getByTestId('modal-close-btn').click();

    // 05. Asistente
    await page.getByTestId('btn-calculate-route').click();
    await expect(page.getByTestId('modal-assistant')).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/05-asistente.png` });
    await page.getByTestId('btn-cancel-assistant').click();

    // 06. Resultado con tramos y suma (ejemplo QUE -> IZA)
    await page.getByTestId('btn-example-que-iza').click();
    await page.getByTestId('tab-breakdown').click();
    await expect(page.getByTestId('route-breakdown-container')).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/06-resultado-tramos-suma.png`, fullPage: true });

    // 07. AEM (Árbol de expansión mínima)
    await page.getByTestId('btn-example-mst').click();
    await page.getByTestId('tab-mst').click();
    await expect(page.getByTestId('mst-same-total-notice')).toBeVisible();
    await page.screenshot({ path: `${OUT_DIR}/07-arbol-expansion-minima.png`, fullPage: true });

    // 08. Tabla tabulada de Prim (panel maximizado y desplazado para ver las filas de Prim)
    await page.getByTestId('tab-mst-prim').click();
    await expect(page.getByTestId('table-prim-steps')).toBeVisible();
    await page.getByTestId('btn-maximize-panel').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="table-prim-steps"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT_DIR}/08-prim-tabulado.png` });
    await page.getByTestId('btn-restore-panel').click();
    await page.waitForTimeout(200);

    // 09. Tabla de Kruskal (panel maximizado y desplazado para ver las filas de Kruskal)
    await page.getByTestId('tab-mst-kruskal').click();
    await expect(page.getByTestId('table-kruskal-steps')).toBeVisible();
    await page.getByTestId('btn-maximize-panel').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="table-kruskal-steps"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT_DIR}/09-kruskal-tabulado.png` });
    await page.getByTestId('btn-restore-panel').click();
    await page.waitForTimeout(200);

    // 11. Modo presentación a pantalla completa (1280×720 y 1920×1080)
    await page.getByTestId('btn-presentation-mode').click();
    await expect(page.getByTestId('guatemala-presentation-overlay')).toBeVisible();

    // Captura en 1280×720
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT_DIR}/11-modo-presentacion.png` });
    await page.screenshot({ path: `${OUT_DIR}/11-modo-presentacion-1280x720.png` });

    // Captura en 1920×1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT_DIR}/12-modo-presentacion-1920x1080.png` });

    // Salir con Escape
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('guatemala-presentation-overlay')).not.toBeVisible();
  });

  test('Captura de vista en celular (Pixel 7)', async ({ page }, testInfo) => {
    if (testInfo.project.name !== 'pixel-7') return;

    await page.goto('./');
    await page.getByTestId('mode-guatemala').click();
    await expect(page.getByRole('heading', { name: 'Transporte Express' })).toBeVisible();

    // 10. Vista en celular
    await page.getByTestId('btn-example-que-iza').click();
    await page.screenshot({ path: `${OUT_DIR}/10-vista-celular.png`, fullPage: true });
  });
});
