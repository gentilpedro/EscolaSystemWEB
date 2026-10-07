import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ACCOUNTS, apiPost, apiToken, loginAs, openDialog } from './support';

// Critérios WCAG 2.1 níveis A e AA, a meta do produto
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function violations(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  // Uma linha por problema, para o relatório do teste dizer o que corrigir e onde
  return result.violations.flatMap(v => v.nodes.map(n => `${v.id} (${v.impact}): ${v.help} → ${n.target.join(' ')}`));
}

const ADMIN_PAGES = [
  ['Painel', '/admin'],
  ['Escolas', '/admin/schools'],
  ['Usuários', '/admin/users'],
  ['Tickets', '/admin/tickets'],
  ['Atividades', '/admin/activity'],
  ['Configurações', '/admin/settings'],
] as const;

test.describe('Acessibilidade do portal do admin (WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  for (const [name, path] of ADMIN_PAGES) {
    test(`${name} sem violações`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await violations(page)).toEqual([]);
    });
  }

  test('formulários em diálogo sem violações', async ({ page }) => {
    await page.goto('/admin/schools');
    await page.getByRole('button', { name: 'Nova escola' }).click();
    await expect(openDialog(page)).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await page.goto('/admin/users');
    await page.getByRole('button', { name: 'Novo usuário' }).click();
    await expect(openDialog(page)).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('detalhe de ticket sem violações', async ({ page }) => {
    const director = await apiToken(ACCOUNTS.director.email, ACCOUNTS.director.password);
    const ticket = await apiPost<{ id: string }>(director, '/tickets', {
      type: 2,
      title: 'Exportar a lista de turmas',
      description: 'Gostaríamos de exportar a lista de turmas para a secretaria.',
    });
    expect(ticket.status).toBe(201);
    await page.goto(`/admin/tickets/${ticket.body.id}`);
    await page.waitForLoadState('networkidle');
    expect(await violations(page)).toEqual([]);
  });

  test('página da escola sem violações', async ({ page }) => {
    await page.goto(`/admin/schools?busca=${encodeURIComponent('Jardim das Flores')}`);
    await page.getByRole('table', { name: 'Escolas cadastradas' }).getByRole('link', { name: 'Escola Estadual Jardim das Flores' }).click();
    await page.waitForLoadState('networkidle');
    expect(await violations(page)).toEqual([]);
  });

  test('com zoom de 200% as telas não rolam para o lado', async ({ page }) => {
    // 1366 px a 200% equivale a uma janela de 683 px
    await page.setViewportSize({ width: 683, height: 768 });
    for (const [, path] of ADMIN_PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('cada tela tem o próprio título de aba e, ao navegar, o foco vai para o título da tela', async ({ page }) => {
    // Depois do login (uma navegação), o painel já está com título e foco
    await expect(page).toHaveTitle('Painel administrativo · EscolaSystem');
    await expect(page.getByRole('heading', { level: 1, name: 'Painel administrativo' })).toBeFocused();

    for (const [name, title] of [
      ['Escolas', 'Escolas'],
      ['Usuários', 'Usuários'],
      ['Atividades', 'Atividades'],
      ['Configurações', 'Configurações'],
    ] as const) {
      await page.getByRole('navigation').getByRole('link', { name, exact: true }).first().click();
      await expect(page).toHaveTitle(`${title} · EscolaSystem`);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeFocused();
    }
  });

  test('tela de detalhe usa o próprio nome no título da aba', async ({ page }) => {
    const director = await apiToken(ACCOUNTS.director.email, ACCOUNTS.director.password);
    const ticket = await apiPost<{ id: string; title: string }>(director, '/tickets', {
      type: 3,
      title: 'Como cadastrar o calendário',
      description: 'Onde fica o cadastro do calendário escolar?',
    });
    await page.goto('/admin/tickets');
    await page.getByRole('link', { name: /Como cadastrar o calendário/ }).first().click();
    await expect(page).toHaveTitle('Como cadastrar o calendário · EscolaSystem');
    await expect(page.getByRole('heading', { level: 1, name: ticket.body.title })).toBeFocused();
  });

  test('o teclado chega ao conteúdo pelo link de pular', async ({ page }) => {
    await page.goto('/admin/users');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    // O próximo foco já está no conteúdo da página, não no menu
    const inMain = await page.evaluate(() => !!document.activeElement?.closest('main, #conteudo'));
    expect(inMain).toBe(true);
  });
});
