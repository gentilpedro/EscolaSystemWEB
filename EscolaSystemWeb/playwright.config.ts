import { defineConfig, devices } from '@playwright/test';

/**
 * Testes de ponta a ponta contra o ambiente de demonstração (docker compose: banco, API, seed e build do front).
 * Os testes alteram dados da escola de demonstração; num banco recém-semeado eles sempre partem do mesmo ponto.
 *
 * E2E_BASE_URL: front (padrão http://localhost:3000)
 * E2E_API_URL:  API, com /api (padrão http://localhost:5130/api)
 * E2E_CHANNEL:  navegador instalado na máquina (ex.: chrome), no lugar do Chromium do Playwright
 */
export default defineConfig({
  testDir: './e2e',
  // Os testes compartilham o banco da demo: um de cada vez, na ordem
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.E2E_CHANNEL || undefined },
    },
  ],
});
