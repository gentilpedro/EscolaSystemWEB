import { expect, test } from '@playwright/test';
import { ACCOUNTS, apiGet, apiPost, apiToken, openDialog, uniqueSuffix } from './support';

// Professor em duas escolas: a direção da segunda escola traz o professor da demo e depois o remove
test('diretor adiciona professor de outra escola e o remove sem tirá-lo da escola original', async ({ page }) => {
  const suffix = uniqueSuffix();
  const admin = await apiToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  const school = await apiPost<{ id: string; name: string }>(admin, '/schools', {
    name: `Escola E2E ${suffix}`,
    address: 'Rua dos Testes, 100',
    phone: '(51) 3333-4444',
    email: `escola.${suffix}@escola.com.br`,
  });
  expect(school.status).toBe(201);
  const directorEmail = `diretor.${suffix}@escola.com.br`;
  expect((await apiPost(admin, '/users', { name: 'Diretor E2E', email: directorEmail, password: 'Teste@2026', roleId: 2, schoolId: school.body.id })).status).toBe(201);

  await page.goto('/login');
  await page.getByLabel('E-mail').fill(directorEmail);
  await page.getByLabel('Senha').fill('Teste@2026');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/director/);

  await page.goto('/director/staff');
  await page.getByRole('button', { name: 'Adicionar existente' }).click();
  const dialog = openDialog(page);
  await dialog.getByLabel('E-mail da conta').fill(ACCOUNTS.teacher.email);
  await dialog.getByRole('button', { name: 'Adicionar à escola' }).click();
  await expect(page.getByText('agora também faz parte desta escola')).toBeVisible();

  const row = page.getByRole('row', { name: /Paulo Mendes/ });
  await expect(row).toContainText('Também em Escola Estadual Jardim das Flores');

  await row.getByRole('button', { name: 'Remover Paulo Mendes da escola' }).click();
  await expect(openDialog(page)).toContainText('continua em Escola Estadual Jardim das Flores');
  await openDialog(page).getByRole('button', { name: 'Remover da escola' }).click();
  await expect(page.getByText('Paulo Mendes saiu da escola.')).toBeVisible();
  await expect(page.getByRole('row', { name: /Paulo Mendes/ })).toHaveCount(0);

  // O professor segue ativo e com as turmas da escola original
  const teacher = await apiToken(ACCOUNTS.teacher.email, ACCOUNTS.teacher.password);
  const classes = await apiGet<{ items: { schoolName: string }[] }>(teacher, '/classes?pageSize=50');
  expect(new Set(classes.body.items.map(c => c.schoolName))).toEqual(new Set(['Escola Estadual Jardim das Flores']));
});
