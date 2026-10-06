import { expect, test } from '@playwright/test';
import { ACCOUNTS, API_URL, loginAs } from './support';

const apiCookies = (cookies: { name: string; httpOnly: boolean; sameSite: string }[]) =>
  Object.fromEntries(cookies.map(c => [c.name, c]));

test.describe('Sessão', () => {
  test('home anônima não chama a API', async ({ page }) => {
    const calls: string[] = [];
    page.on('request', r => {
      if (r.url().startsWith(API_URL)) calls.push(r.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(calls).toEqual([]);
  });

  test('senha errada mostra a mensagem da API e continua no login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(ACCOUNTS.director.email);
    await page.getByLabel('Senha').fill('Errada@123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Credenciais inválidas')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login guarda a sessão em cookies httpOnly e nada no localStorage', async ({ page, context }) => {
    await loginAs(page, 'director');

    const cookies = apiCookies(await context.cookies(API_URL + '/auth/refresh'));
    expect(cookies.es_access?.httpOnly).toBe(true);
    expect(cookies.es_refresh?.httpOnly).toBe(true);
    expect(cookies.es_access?.sameSite).toBe('Strict');
    // O JavaScript da página só enxerga o token de CSRF
    expect(cookies.es_csrf?.httpOnly).toBe(false);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
    expect(await page.evaluate(() => document.cookie.split('; ').map(c => c.split('=')[0]))).toEqual(['es_csrf']);

    await page.reload();
    await expect(page.getByRole('heading', { name: /Olá, Marta/ })).toBeVisible();
  });

  test('sem o token de acesso, a sessão é renovada sozinha', async ({ page, context }) => {
    await loginAs(page, 'director');
    await context.clearCookies({ name: 'es_access' });

    const refresh = page.waitForResponse(r => r.url() === `${API_URL}/auth/refresh` && r.status() === 200);
    await page.goto('/director/reports');
    await refresh;
    await expect(page.getByRole('table', { name: 'Resumo por turma' })).toBeVisible();
    expect((await context.cookies(API_URL)).some(c => c.name === 'es_access')).toBe(true);
  });

  test('sair encerra a sessão na API e apaga os cookies', async ({ page, context }) => {
    await loginAs(page, 'director');
    const access = (await context.cookies(API_URL)).find(c => c.name === 'es_access')!.value;

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await context.cookies(API_URL + '/auth/refresh')).toEqual([]);

    // O token antigo, mesmo copiado, não vale mais
    const me = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${access}` } });
    expect(me.status).toBe(401);

    await page.goto('/director');
    await expect(page).toHaveURL(/\/login$/);
  });
});
