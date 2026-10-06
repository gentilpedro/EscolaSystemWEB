import { expect, test } from '@playwright/test';
import { loginAs, openDialog } from './support';

test.describe('Administração', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/users');
    await expect(page.getByRole('table', { name: 'Usuários' })).toBeVisible();
  });

  test('busca de usuários é feita pela API', async ({ page }) => {
    const search = page.waitForRequest(r => r.url().includes('/users?') && r.url().includes('search=orient'));
    await page.getByLabel('Pesquisar usuários').fill('orient');
    await search;
    await expect(page.getByText('1 usuário encontrado em toda a rede')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'orientacao@escolademo.com.br' })).toBeVisible();
  });

  test('cadastro oferece só Administrador e Diretor e cobra a regra de senha', async ({ page }) => {
    await page.getByRole('button', { name: 'Novo usuário' }).click();
    const dialog = openDialog(page);

    await expect(dialog.getByLabel('Perfil').locator('option')).toHaveText(['Administrador', 'Diretor']);
    await expect(dialog.getByLabel('Perfil')).toHaveValue('2');

    await dialog.getByLabel('Senha').fill('abc');
    await expect(dialog.getByText(/Falta: 8 caracteres, uma letra maiúscula, um número, um símbolo/)).toBeVisible();
  });
});
