import { expect, test } from '@playwright/test';

test('la aplicación carga sin errores de consola', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await expect(page).toHaveTitle(/RutaQ/);
  await expect(page.getByRole('heading', { name: 'RutaQ' })).toBeVisible();
  expect(errors).toEqual([]);
});
