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

  test('cadastro de escola valida os campos e mascara o telefone', async ({ page }) => {
    await page.goto('/admin/schools');
    await page.getByRole('button', { name: 'Nova escola' }).click();
    const dialog = openDialog(page);

    await dialog.getByLabel('Nome').fill('E');
    await dialog.getByLabel('E-mail').fill('escola@x');
    await dialog.getByLabel('Endereço').fill('R');
    // A máscara descarta letras: "abc" deixa o campo vazio
    await dialog.getByLabel('Telefone').fill('abc');
    await expect(dialog.getByLabel('Telefone')).toHaveValue('');
    await dialog.getByLabel('Telefone').fill('5133');
    await dialog.getByRole('button', { name: 'Salvar' }).click();

    await expect(dialog.getByText('Corrija os campos destacados.')).toBeVisible();
    await expect(dialog.getByText('O nome precisa ter ao menos 3 caracteres.')).toBeVisible();
    await expect(dialog.getByText('O endereço precisa ter ao menos 5 caracteres.')).toBeVisible();
    await expect(dialog.getByText('Use o formato nome@dominio.com.br.')).toBeVisible();
    await expect(dialog.getByText(/Use DDD e número/)).toBeVisible();

    await dialog.getByLabel('Telefone').fill('51999991200');
    await expect(dialog.getByLabel('Telefone')).toHaveValue('(51) 99999-1200');
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
