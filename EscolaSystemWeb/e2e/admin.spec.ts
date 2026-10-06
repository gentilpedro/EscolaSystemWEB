import { expect, test } from '@playwright/test';
import { ACCOUNTS, API_URL, loginAs, openDialog } from './support';

const apiTokenStatus = async (email: string, password: string) =>
  (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })).status;

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

test.describe('Senhas pelo admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('redefine a senha de outra pessoa pela linha dela', async ({ page }) => {
    const resetTo = async (password: string) => {
      await page.goto('/admin/users');
      await page.getByLabel('Pesquisar usuários').fill('diretora');
      await page.getByRole('button', { name: 'Redefinir senha de Marta Ribeiro' }).click();
      const dialog = openDialog(page);
      await expect(dialog).toContainText(ACCOUNTS.director.email);
      await dialog.getByLabel(/^Nova senha/).fill(password);
      await dialog.getByLabel('Confirmar nova senha').fill(password);
      await dialog.getByRole('button', { name: 'Redefinir senha' }).click();
      await expect(page.getByText('Senha de Marta Ribeiro redefinida.')).toBeVisible();
    };

    await resetTo('Outra@2026');
    expect((await apiTokenStatus(ACCOUNTS.director.email, 'Outra@2026'))).toBe(200);
    // Volta a senha da demo para os outros testes
    await resetTo(ACCOUNTS.director.password);
    expect((await apiTokenStatus(ACCOUNTS.director.email, ACCOUNTS.director.password))).toBe(200);
  });

  test('troca a própria senha só com a senha atual', async ({ page }) => {
    const change = async (current: string, next: string) => {
      await page.goto('/admin/settings');
      await page.getByLabel('Senha atual').fill(current);
      await page.getByLabel(/^Nova senha/).fill(next);
      await page.getByLabel('Confirmar nova senha').fill(next);
      await page.getByRole('button', { name: 'Trocar senha' }).click();
    };

    await change('Errada@123', 'Nova@2026x');
    await expect(page.getByText('Senha atual incorreta.')).toBeVisible();
    // Continua logado: senha atual errada não é sessão expirada
    await expect(page).toHaveURL(/\/admin\/settings$/);

    await change(ACCOUNTS.admin.password, 'Nova@2026x');
    await expect(page.getByText('Senha trocada.')).toBeVisible();
    await change('Nova@2026x', ACCOUNTS.admin.password);
    await expect(page.getByText('Senha trocada.')).toBeVisible();
  });
});
