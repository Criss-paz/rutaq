import { defineConfig, devices } from '@playwright/test';

// BASE_URL apunta a la URL desplegada en la QA final; por defecto se usa el preview local.
const baseURL = process.env.BASE_URL ?? 'http://localhost:4173';
const local = !process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  // Con 4 navegadores en paralelo más los Workers de S3 la CPU se satura: 5 s por aserción resulta justo.
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'on-first-retry', screenshot: 'only-on-failure', locale: 'es-GT' },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-13', use: { ...devices['iPhone 13'] } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 7)'] } },
  ],
  webServer: local
    ? {
        command: 'npm run build && npm run preview',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
});
