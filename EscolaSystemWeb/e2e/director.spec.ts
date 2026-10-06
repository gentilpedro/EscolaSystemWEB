import { expect, test } from '@playwright/test';
import { ACCOUNTS, apiGet, apiToken, loginAs, openDialog, uniqueSuffix } from './support';

interface Stats {
  totalStudents: number;
  pendingDisciplinaryCalls: number;
}

test.describe('Direção', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'director');
  });

  test('relatórios mostram os números calculados pela API', async ({ page }) => {
    const token = await apiToken(ACCOUNTS.director.email, ACCOUNTS.director.password);
    const { body: stats } = await apiGet<Stats>(token, '/dashboard/stats');

    await page.goto('/director/reports');
    const table = page.getByRole('table', { name: 'Resumo por turma' });
    await expect(table.getByRole('row')).toHaveCount(4); // cabeçalho + 3 turmas da demo
    await expect(page.getByText('Alunos ativos').locator('..')).toContainText(String(stats.totalStudents));
    await expect(page.getByText('Chamados pendentes', { exact: true }).locator('..')).toContainText(String(stats.pendingDisciplinaryCalls));
  });

  test('excluir turma com alunos mostra a orientação da API', async ({ page }) => {
    await page.goto('/director/classes');
    await page.getByRole('button', { name: /^Excluir 6º Ano A/ }).click();
    await openDialog(page).getByRole('button', { name: 'Excluir turma' }).click();
    await expect(page.getByText('A turma possui alunos ou histórico (notas, chamadas, trabalhos). Desative-a em vez de excluir.')).toBeVisible();
  });

  test('cria o acesso do aluno e um responsável, e os dois entram', async ({ page }) => {
    const suffix = uniqueSuffix();
    const studentEmail = `aluno.e2e.${suffix}@escolademo.com.br`;
    const parentEmail = `resp.e2e.${suffix}@escolademo.com.br`;
    const password = 'Teste@2026';

    await page.goto('/director/students');
    const createAccess = page.getByRole('button', { name: /^Criar acesso de / }).first();
    const studentName = (await createAccess.getAttribute('aria-label'))!.replace('Criar acesso de ', '');

    await createAccess.click();
    let dialog = openDialog(page);
    await dialog.getByLabel('E-mail de acesso').fill(studentEmail);
    await dialog.getByLabel('Senha inicial').fill(password);
    await dialog.getByRole('button', { name: 'Criar acesso' }).click();
    await expect(page.getByText(`${studentName} já pode entrar no sistema.`)).toBeVisible();

    await page.getByRole('button', { name: `Responsáveis de ${studentName}` }).click();
    dialog = openDialog(page);
    const form = dialog.getByRole('form', { name: /novo responsável/i }).or(dialog.locator('form[aria-labelledby=novo-responsavel]'));
    await form.getByLabel('Nome').fill(`Responsável E2E ${suffix}`);
    await form.getByLabel('E-mail').fill(parentEmail);
    await form.getByLabel('Senha inicial').fill(password);
    await form.getByRole('button', { name: 'Cadastrar e vincular' }).click();
    await expect(dialog.getByText(`já acompanha ${studentName}`)).toBeVisible();
    // O rodapé tem o botão Fechar; o X do cabeçalho tem o mesmo nome
    await dialog.getByRole('button', { name: 'Fechar' }).last().click();

    await expect(page.getByRole('row', { name: new RegExp(studentName) })).toContainText('Com acesso');

    // As duas contas novas entram e enxergam os próprios dados
    const studentToken = await apiToken(studentEmail, password);
    expect((await apiGet(studentToken, '/grades?pageSize=1')).status).toBe(200);
    const parentToken = await apiToken(parentEmail, password);
    expect((await apiGet(parentToken, '/disciplinary-calls')).status).toBe(200);
  });
});
