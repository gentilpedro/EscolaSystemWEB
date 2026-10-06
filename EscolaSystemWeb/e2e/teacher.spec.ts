import { expect, test } from '@playwright/test';
import { ACCOUNTS, apiGet, apiToken, loginAs, openDialog, uniqueSuffix } from './support';

test.describe('Professor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'teacher');
  });

  test('relatórios por trimestre: frequência, notas e resumo do conselho', async ({ page }) => {
    await page.goto('/teacher/reports');
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();

    // A seed lança notas do 1º trimestre
    await page.getByRole('button', { name: '1º tri' }).click();
    await page.getByRole('button', { name: 'Notas', exact: true }).click();
    await expect(page.getByRole('table', { name: /Notas por disciplina/ })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Matemática' })).toBeVisible();

    await page.getByRole('button', { name: 'Resumo do conselho' }).click();
    await expect(page.getByRole('table', { name: 'Resumo por aluno para o conselho de classe' })).toBeVisible();

    await page.getByRole('button', { name: 'Frequência', exact: true }).click();
    await page.getByRole('button', { name: '3º tri' }).click();
    // A seed registra a chamada dos últimos dias úteis
    await expect(page.getByRole('table', { name: 'Frequência por aluno no período' })).toBeVisible();
  });

  test('lança, edita e exclui um trabalho da turma', async ({ page }) => {
    const title = `Pesquisa E2E ${uniqueSuffix()}`;
    await page.goto('/teacher/assignments');

    await page.getByRole('button', { name: 'Novo trabalho' }).first().click();
    let dialog = openDialog(page);
    await dialog.getByLabel('Título').fill(title);
    await dialog.getByLabel('Descrição').fill('Pesquisa sobre o ciclo da água.');
    await dialog.getByRole('button', { name: /^Lançar para \d+ alunos?$/ }).click();
    await expect(page.getByText(/Trabalho lançado para \d+ alunos? de /)).toBeVisible();

    const card = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: title }) });
    await expect(card).toContainText(/Entregas\s*0 de \d+/);

    await card.getByRole('button', { name: `Editar ${title}` }).click();
    dialog = openDialog(page);
    await dialog.getByLabel('Título').fill(`${title} (corrigido)`);
    await dialog.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText(new RegExp(`"${title} \\(corrigido\\)" foi atualizado`))).toBeVisible();

    // O aluno vê o título corrigido no portal
    const studentToken = await apiToken(ACCOUNTS.student.email, ACCOUNTS.student.password);
    const { body } = await apiGet<{ items: { title: string }[] }>(studentToken, '/pending-works?pageSize=500');
    expect(body.items.map(w => w.title)).toContain(`${title} (corrigido)`);

    const edited = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: `${title} (corrigido)` }) });
    await edited.getByRole('button', { name: `Excluir ${title} (corrigido)` }).click();
    await openDialog(page).getByRole('button', { name: 'Excluir trabalho' }).click();
    await expect(page.getByRole('heading', { name: `${title} (corrigido)` })).toHaveCount(0);
  });
});
