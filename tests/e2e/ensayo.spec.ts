import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const CAPTURES_DIR = 'docs/capturas/proyecto2/ensayo';

test.describe('Ensayo de Presentación — Proyecto II (Transporte Express)', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(CAPTURES_DIR)) {
      fs.mkdirSync(CAPTURES_DIR, { recursive: true });
    }
  });

  test('Reproducción paso a paso del guion de presentación contra la URL publicada', async ({ page }, testInfo) => {
    // Solo ejecutar en desktop-chrome como pide la instrucción del orquestador
    if (testInfo.project.name !== 'desktop-chrome') return;

    // Asegurar viewport exacto de 1280×720
    await page.setViewportSize({ width: 1280, height: 720 });

    // -------------------------------------------------------------------------
    // PASO 1: Introducción y Contexto del Problema (1:00 min)
    // Pantalla de inicio de RutaQ en modo «Guatemala — Transporte Express»
    // con el mapa de los 22 departamentos orientado al norte.
    // -------------------------------------------------------------------------
    await page.goto('./');

    // Cambiar a modo Guatemala si no está activo
    const guatBtn = page.getByTestId('mode-guatemala');
    if (await guatBtn.isVisible()) {
      await guatBtn.click();
    }

    // Verificar identidad de marca "Transporte Express"
    await expect(page.getByRole('heading', { name: 'Transporte Express' })).toBeVisible();

    // Selector de plantilla refleja "guatemala"
    await expect(page.getByTestId('template-select')).toHaveValue('guatemala');

    // Barra de herramientas de Guatemala
    await expect(page.getByTestId('guatemala-toolbar')).toBeVisible();

    // Rosa de los vientos orientada al norte y escala gráfica
    await expect(page.getByTestId('compass-rose')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    // Ajustar vista del mapa de los 22 departamentos
    await page.getByTestId('btn-fit-view').click();
    await page.waitForTimeout(400);

    // Captura 01: Pantalla de inicio modo Guatemala
    await page.screenshot({ path: path.join(CAPTURES_DIR, '01-pantalla-inicio-guatemala.png') });

    // -------------------------------------------------------------------------
    // PASO 2: El Asistente de Transporte Express (1:00 min)
    // Botón «Calcular mejor ruta» y panel interactivo de dos preguntas:
    // 1. ¿Dónde se encuentra el paquete?
    // 2. ¿A qué departamento debe entregarse? / ¿A qué departamento debe llegar?
    // -------------------------------------------------------------------------
    await page.getByTestId('btn-calculate-route').click();
    await expect(page.getByTestId('modal-assistant')).toBeVisible();

    // Verificar Pregunta 1 en pantalla (texto y buscador)
    await expect(page.getByText('1. ¿Dónde se encuentra el paquete?')).toBeVisible();
    await expect(page.getByTestId('input-assistant-source-search')).toBeVisible();

    // Captura 02: Asistente Paso 1 (origen)
    await page.screenshot({ path: path.join(CAPTURES_DIR, '02-asistente-paso1.png') });

    // Seleccionar origen (Quetzaltenango) para avanzar a la pregunta 2
    await page.getByTestId('input-assistant-source-search').fill('Quetzaltenango');
    await page.getByTestId('btn-select-source-QUE').click();

    // Verificar Pregunta 2 en pantalla
    // Nota: El guion dice "¿A qué departamento debe entregarse?", en pantalla aparece "¿A qué departamento debe llegar?"
    await expect(page.getByText('2. ¿A qué departamento debe llegar?')).toBeVisible();
    await expect(page.getByTestId('input-assistant-target-search')).toBeVisible();

    // Captura 03: Asistente Paso 2 (destino)
    await page.screenshot({ path: path.join(CAPTURES_DIR, '03-asistente-paso2.png') });

    // Completar selección hacia Puerto Barrios (Izabal) desde el asistente
    await page.getByTestId('input-assistant-target-search').fill('Izabal');
    await page.getByTestId('btn-select-target-IZA').click();

    // El modal del asistente debe haberse cerrado y mostrar el desglose
    await expect(page.getByTestId('modal-assistant')).not.toBeVisible();

    // -------------------------------------------------------------------------
    // PASO 3.1: Ejemplo 1 — Quetzaltenango → Puerto Barrios (QUE → IZA)
    // Distancia total: 494.0 km
    // Secuencia: QUE (Totonicapán 28.8 km, Quiché 36.2 km, Baja Verapaz 128.6 km,
    // Zacapa 128.3 km, CA-9 Norte / Puerto Barrios 172.1 km).
    // -------------------------------------------------------------------------
    // Asegurar pestaña de desglose activa
    const breakdownTab = page.getByTestId('tab-breakdown');
    if (await breakdownTab.isVisible()) {
      await breakdownTab.click();
    }
    await expect(page.getByTestId('route-breakdown-container')).toBeVisible();

    // Verificar distancia total: 494.0 km
    const totalQueIza = page.getByTestId('route-total-distance');
    await expect(totalQueIza).toBeVisible();
    await expect(totalQueIza).toContainText('494.0 km');

    // Verificar fórmula matemática exacta de tramos
    const formulaQueIza = page.getByTestId('route-formula');
    await expect(formulaQueIza).toBeVisible();
    await expect(formulaQueIza).toContainText('28.8 + 36.2 + 128.6 + 128.3 + 172.1 = 494.0 km');

    // Verificar secuencia de departamentos
    const seqQueIza = page.getByTestId('route-nodes-sequence');
    await expect(seqQueIza).toContainText('QUE');
    await expect(seqQueIza).toContainText('Quetzaltenango');
    await expect(seqQueIza).toContainText('TOT');
    await expect(seqQueIza).toContainText('Totonicapán');
    await expect(seqQueIza).toContainText('QUI');
    await expect(seqQueIza).toContainText('Quiché');
    await expect(seqQueIza).toContainText('BVE');
    await expect(seqQueIza).toContainText('Baja Verapaz');
    await expect(seqQueIza).toContainText('ZAC');
    await expect(seqQueIza).toContainText('Zacapa');
    await expect(seqQueIza).toContainText('IZA');
    await expect(seqQueIza).toContainText('Izabal');

    // Verificar tabla de tramos y carreteras
    const legsQueIza = page.getByTestId('table-route-legs');
    await expect(legsQueIza).toContainText('28.8 km');
    await expect(legsQueIza).toContainText('36.2 km');
    await expect(legsQueIza).toContainText('128.6 km');
    await expect(legsQueIza).toContainText('128.3 km');
    await expect(legsQueIza).toContainText('172.1 km');
    // Carretera del último tramo (dataset dice CA-9 Nor, guion menciona CA-9 Norte)
    await expect(legsQueIza).toContainText('CA-9 Nor');

    // Captura 04: Ejemplo 1 QUE -> IZA
    await page.screenshot({ path: path.join(CAPTURES_DIR, '04-ejemplo-que-iza.png') });

    // -------------------------------------------------------------------------
    // PASO 3.2: Ejemplo 2 — Ciudad de Guatemala → Flores, Petén (GUA → PET)
    // Distancia total: 415.3 km
    // Secuencia: GUA (Salamá / Baja Verapaz 89.0 km, Alta Verapaz CA-14 69.0 km,
    // Petén RD PET-11 / RD AV-09 257.3 km).
    // -------------------------------------------------------------------------
    await page.getByTestId('btn-example-gua-pet').click();

    // Verificar distancia total: 415.3 km
    const totalGuaPet = page.getByTestId('route-total-distance');
    await expect(totalGuaPet).toBeVisible();
    await expect(totalGuaPet).toContainText('415.3 km');

    // Verificar fórmula matemática exacta
    const formulaGuaPet = page.getByTestId('route-formula');
    await expect(formulaGuaPet).toBeVisible();
    await expect(formulaGuaPet).toContainText('89.0 + 69.0 + 257.3 = 415.3 km');

    // Verificar secuencia de departamentos
    const seqGuaPet = page.getByTestId('route-nodes-sequence');
    await expect(seqGuaPet).toContainText('GUA');
    await expect(seqGuaPet).toContainText('Guatemala');
    await expect(seqGuaPet).toContainText('BVE');
    await expect(seqGuaPet).toContainText('Baja Verapaz');
    await expect(seqGuaPet).toContainText('AVE');
    await expect(seqGuaPet).toContainText('Alta Verapaz');
    await expect(seqGuaPet).toContainText('PET');
    await expect(seqGuaPet).toContainText('Petén');

    // Verificar tramos individuales en la tabla
    const legsGuaPet = page.getByTestId('table-route-legs');
    await expect(legsGuaPet).toContainText('89.0 km');
    await expect(legsGuaPet).toContainText('69.0 km');
    await expect(legsGuaPet).toContainText('257.3 km');
    await expect(legsGuaPet).toContainText('RD PET-11 / RD AV-09');

    // Captura 05: Ejemplo 2 GUA -> PET
    await page.screenshot({ path: path.join(CAPTURES_DIR, '05-ejemplo-gua-pet.png') });

    // -------------------------------------------------------------------------
    // PASO 3.3: Ejemplo 3 — San Marcos → Jutiapa (SMA → JUT)
    // Distancia total: 368.3 km
    // Secuencia: SMA (Quetzaltenango 49.6 km, Suchitepéquez CITO-180 60.2 km,
    // Escuintla CA-02 Occ 102.5 km, Santa Rosa 100.0 km, Jutiapa CA-1 Or 56.0 km).
    // -------------------------------------------------------------------------
    await page.getByTestId('btn-example-sma-jut').click();

    // Verificar distancia total: 368.3 km
    const totalSmaJut = page.getByTestId('route-total-distance');
    await expect(totalSmaJut).toBeVisible();
    await expect(totalSmaJut).toContainText('368.3 km');

    // Verificar fórmula matemática exacta
    const formulaSmaJut = page.getByTestId('route-formula');
    await expect(formulaSmaJut).toBeVisible();
    await expect(formulaSmaJut).toContainText('49.6 + 60.2 + 102.5 + 100.0 + 56.0 = 368.3 km');

    // Verificar secuencia de departamentos
    const seqSmaJut = page.getByTestId('route-nodes-sequence');
    await expect(seqSmaJut).toContainText('SMA');
    await expect(seqSmaJut).toContainText('San Marcos');
    await expect(seqSmaJut).toContainText('QUE');
    await expect(seqSmaJut).toContainText('Quetzaltenango');
    await expect(seqSmaJut).toContainText('SUC');
    await expect(seqSmaJut).toContainText('Suchitepéquez');
    await expect(seqSmaJut).toContainText('ESC');
    await expect(seqSmaJut).toContainText('Escuintla');
    await expect(seqSmaJut).toContainText('SRO');
    await expect(seqSmaJut).toContainText('Santa Rosa');
    await expect(seqSmaJut).toContainText('JUT');
    await expect(seqSmaJut).toContainText('Jutiapa');

    // Verificar tramos en la tabla
    const legsSmaJut = page.getByTestId('table-route-legs');
    await expect(legsSmaJut).toContainText('49.6 km');
    await expect(legsSmaJut).toContainText('60.2 km');
    await expect(legsSmaJut).toContainText('102.5 km');
    await expect(legsSmaJut).toContainText('100.0 km');
    await expect(legsSmaJut).toContainText('56.0 km');

    // Captura 06: Ejemplo 3 SMA -> JUT
    await page.screenshot({ path: path.join(CAPTURES_DIR, '06-ejemplo-sma-jut.png') });

    // -------------------------------------------------------------------------
    // PASO 4: Red Mínima Nacional (AEM / MST) (1:00 min)
    // 21 carreteras, kilometraje total 1425.3 km (o 1 425.3 km)
    // Pestañas Prim y Kruskal tabulado paso a paso.
    // -------------------------------------------------------------------------
    await page.getByTestId('btn-example-mst').click();

    // Asegurar pestaña MST activa
    const mstTab = page.getByTestId('tab-mst');
    if (await mstTab.isVisible()) {
      await mstTab.click();
    }

    // Verificar aviso de equivalencia entre Prim y Kruskal
    await expect(page.getByTestId('mst-same-total-notice')).toBeVisible();

    // Verificar kilometraje total: 1425.3 km
    const mstTotal = page.getByTestId('mst-total-distance');
    await expect(mstTotal).toBeVisible();
    await expect(mstTotal).toContainText('1425.3 km');

    // Pestaña Prim tabulado
    await page.getByTestId('tab-mst-prim').click();
    await expect(page.getByTestId('table-prim-steps')).toBeVisible();
    await expect(page.getByTestId('btn-prim-prev')).toBeVisible();
    await expect(page.getByTestId('btn-prim-next')).toBeVisible();

    // Desplazar tabla de Prim para ver filas tabuladas claramente
    await page.locator('[data-testid="table-prim-steps"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Captura 07: Red Mínima - Prim tabulado
    await page.screenshot({ path: path.join(CAPTURES_DIR, '07-red-minima-prim.png') });

    // Pestaña Kruskal tabulado
    await page.getByTestId('tab-mst-kruskal').click();
    await expect(page.getByTestId('table-kruskal-steps')).toBeVisible();

    // Desplazar tabla de Kruskal para ver aristas ordenadas
    await page.locator('[data-testid="table-kruskal-steps"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Captura 08: Red Mínima - Kruskal tabulado
    await page.screenshot({ path: path.join(CAPTURES_DIR, '08-red-minima-kruskal.png') });

    // -------------------------------------------------------------------------
    // PASO 5: Modo Presentación (Herramienta principal del expositor)
    // Pantalla completa, alta legibilidad, selector flotante de ejemplos.
    // -------------------------------------------------------------------------
    await page.getByTestId('btn-presentation-mode').click();
    await expect(page.getByTestId('guatemala-presentation-overlay')).toBeVisible();

    // Verificar título y contexto institucional en la barra flotante
    await expect(page.getByText('Transporte Express — Guatemala')).toBeVisible();
    await expect(page.getByText('Modo Presentación · Red Vial Nacional de 22 Departamentos')).toBeVisible();

    // Probar el botón de ejemplo rápido dentro del modo presentación
    await page.getByTestId('btn-pres-que-iza').click();
    await expect(page.getByTestId('pres-total-distance')).toContainText('494.0 km');

    // Captura 09: Modo Presentación (1280×720)
    await page.screenshot({ path: path.join(CAPTURES_DIR, '09-modo-presentacion.png') });

    // Salir del modo presentación con tecla Escape
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('guatemala-presentation-overlay')).not.toBeVisible();

    // -------------------------------------------------------------------------
    // PASO 6: Diálogo «Acerca de» y Cierre
    // Créditos institucionales UMG y los 3 integrantes con carné exacto.
    // -------------------------------------------------------------------------
    await page.getByTestId('btn-about').click();
    await expect(page.getByTestId('modal-about')).toBeVisible();

    const aboutContent = page.getByTestId('modal-about');
    await expect(aboutContent).toContainText('Universidad Mariano Gálvez de Guatemala');
    await expect(aboutContent).toContainText('Cristopher Alexis Castellanos Paz');
    await expect(aboutContent).toContainText('2690-24-5972');
    await expect(aboutContent).toContainText('Leonel Taracena Marroquín');
    await expect(aboutContent).toContainText('2690-24-4072');
    await expect(aboutContent).toContainText('Pablo Alexander Vásquez Rivera');
    await expect(aboutContent).toContainText('2690-24-13123');

    // Captura 10: Diálogo Acerca de
    await page.screenshot({ path: path.join(CAPTURES_DIR, '10-acerca-de.png') });

    // Cerrar modal Acerca de
    await page.getByTestId('btn-close-about').click();
    await expect(page.getByTestId('modal-about')).not.toBeVisible();
  });
});
