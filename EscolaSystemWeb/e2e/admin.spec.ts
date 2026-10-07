import { expect, test } from '@playwright/test';
import { ACCOUNTS, API_URL, apiPost, apiToken, loginAs, openDialog, uniqueSuffix } from './support';

const apiTokenStatus = async (email: string, password: string) =>
  (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })).status;

test.describe('Administração', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/users');
    await expect(page.getByRole('table', { name: 'Usuários' })).toBeVisible();
  });

  test('busca de usuários é feita pela API e traz só administradores e diretores', async ({ page }) => {
    const search = page.waitForRequest(r => r.url().includes('/users?') && r.url().includes('search=diretora'));
    await page.getByLabel('Pesquisar usuários').fill('diretora');
    await search;
    await expect(page.getByText('1 conta encontrada')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'diretora@escolademo.com.br' })).toBeVisible();

    // As pessoas da escola ficam com a direção: o admin não acha a orientadora
    await page.getByLabel('Pesquisar usuários').fill('orientacao');
    await expect(page.getByText('0 contas encontradas')).toBeVisible();
    await expect(page.getByLabel('Filtrar por perfil').locator('option')).toHaveText(['Todos os perfis', 'Administrador', 'Diretor']);
  });

  test('a própria conta não tem desativar nem troca de perfil', async ({ page }) => {
    await page.getByLabel('Pesquisar usuários').fill('admin@escolasystem.com');
    const row = page.getByRole('row', { name: /admin@escolasystem\.com/ });
    await expect(row.getByRole('button', { name: 'Editar Administrador' })).toBeVisible();
    await expect(row.getByRole('button', { name: /^Desativar/ })).toHaveCount(0);
    await expect(row.getByRole('button', { name: /^Redefinir senha/ })).toHaveCount(0);

    await row.getByRole('button', { name: 'Editar Administrador' }).click();
    const dialog = openDialog(page);
    await expect(dialog.getByText('Outro administrador pode mudar o seu perfil.')).toBeVisible();
    await expect(dialog.getByLabel('Usuário ativo')).toHaveCount(0);
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

test('painel aponta escola sem diretor e leva ao cadastro com a escola escolhida', async ({ page }) => {
  const admin = await apiToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  const suffix = uniqueSuffix();
  const school = await apiPost<{ id: string; name: string }>(admin, '/schools', {
    name: `Escola Sem Diretor ${suffix}`,
    address: 'Rua Nova, 10',
    phone: '(51) 3333-5555',
    email: `sem.diretor.${suffix}@escola.com.br`,
  });
  expect(school.status).toBe(201);

  await loginAs(page, 'admin');
  const attention = page.getByRole('region', { name: 'Escolas ativas sem diretor' });
  await expect(attention).toBeVisible();
  // A lista mostra até 5; a escola nova pode estar entre as do "e mais"
  const link = attention.getByRole('link', { name: `Cadastrar diretor ${school.body.name}` });
  if ((await link.count()) === 0) test.skip(true, 'Mais de 5 escolas sem diretor na base: a nova ficou no "e mais"');
  await link.click();

  const dialog = openDialog(page);
  await expect(dialog.getByLabel('Perfil')).toHaveValue('2');
  await expect(dialog.getByLabel('Escola')).toHaveValue(school.body.id);
});

test('desativa e reativa a escola pela própria linha, com a confirmação', async ({ page }) => {
  const admin = await apiToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  const suffix = uniqueSuffix();
  const school = await apiPost<{ id: string; name: string }>(admin, '/schools', {
    name: `Escola Na Linha ${suffix}`,
    address: 'Rua Nova, 20',
    phone: '(51) 3333-6666',
    email: `na.linha.${suffix}@escola.com.br`,
  });
  expect(school.status).toBe(201);

  await loginAs(page, 'admin');
  await page.goto(`/admin/schools?busca=${encodeURIComponent(school.body.name)}`);
  const row = page.getByRole('row', { name: new RegExp(school.body.name) });

  await row.getByRole('button', { name: `Desativar ${school.body.name}` }).click();
  let dialog = openDialog(page);
  await expect(dialog.getByText('Ninguém da escola tem conta ativa agora.', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Desativar escola' }).click();
  await expect(page.getByText(`${school.body.name} foi desativada.`)).toBeVisible();
  await expect(row.getByRole('button', { name: `Desativar ${school.body.name}` })).toHaveCount(0);

  await row.getByRole('button', { name: `Reativar ${school.body.name}` }).click();
  dialog = openDialog(page);
  await dialog.getByRole('button', { name: 'Reativar escola' }).click();
  await expect(page.getByText(`${school.body.name} foi reativada.`)).toBeVisible();
  await expect(row.getByRole('button', { name: `Desativar ${school.body.name}` })).toBeVisible();
});

test('Configurações mostram a versão do build e editam o próprio nome', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/settings');
  await expect(page.getByText(/^EscolaSystem v\d+\.\d+\.\d+/)).toBeVisible();

  const rename = async (name: string) => {
    await page.getByLabel(/^Nome/).fill(name);
    await page.getByRole('button', { name: 'Salvar perfil' }).click();
    await expect(page.getByText('Perfil atualizado.')).toBeVisible();
  };

  const original = await page.getByLabel(/^Nome/).inputValue();
  await rename(`${original} Teste`);
  // Vem da API depois de recarregar, não só do formulário
  await page.reload();
  await expect(page.getByLabel(/^Nome/)).toHaveValue(`${original} Teste`);
  await rename(original);
});

test('usuários filtram por escola e viram cartões no celular', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/users');
  const filter = page.getByLabel('Filtrar por escola');
  // A escola do seed tem diretora; escolas criadas por outros testes podem não ter ninguém que o admin veja
  const school = 'Escola Estadual Jardim das Flores';
  await filter.selectOption({ label: school });
  await expect(page.getByText(/contas? encontradas?/)).toBeVisible();

  const table = page.getByRole('table', { name: 'Usuários' });
  const rows = table.locator('tbody tr');
  await expect(rows.first()).toBeVisible();
  for (const row of await rows.all()) await expect(row).toContainText(school);

  await page.setViewportSize({ width: 390, height: 800 });
  await expect(table).toBeHidden();
  const cards = page.getByRole('list', { name: 'Usuários' }).getByRole('listitem');
  await expect(cards.first()).toContainText(school);
  await expect(cards.first().getByRole('button', { name: /^Editar / })).toBeVisible();
  // Sem rolagem lateral na página
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('conta bloqueada por senha errada aparece na lista e o admin desbloqueia', async ({ page }) => {
  const director = ACCOUNTS.director;
  for (let i = 0; i < 5; i++) await apiTokenStatus(director.email, 'Errada@123');
  expect(await apiTokenStatus(director.email, director.password)).toBe(429);

  // O painel aponta a conta bloqueada e leva até ela em Usuários
  await loginAs(page, 'admin');
  const lockedGroup = page.getByRole('region', { name: 'Contas bloqueadas por senha errada' });
  await expect(lockedGroup).toContainText(/bloqueada até \d{2}:\d{2}/);
  await lockedGroup.getByRole('link', { name: /^Desbloquear/ }).first().click();
  await expect(page.getByLabel('Pesquisar usuários')).toHaveValue(director.email);
  const row = page.getByRole('row', { name: new RegExp(director.email) });
  await expect(row.getByText(/^Bloqueada até \d{2}:\d{2}$/)).toBeVisible();

  await row.getByRole('button', { name: /^Desbloquear / }).click();
  await openDialog(page).getByRole('button', { name: 'Desbloquear' }).click();
  await expect(page.getByText(/foi desbloqueado\.$/)).toBeVisible();
  await expect(row.getByText(/^Bloqueada até/)).toHaveCount(0);
  expect(await apiTokenStatus(director.email, director.password)).toBe(200);
});

test('Configurações mostram os aparelhos conectados e saem deles', async ({ page }) => {
  const meStatus = async (token: string) =>
    (await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).status;
  const outro = await apiToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password);

  await loginAs(page, 'admin');
  await page.goto('/admin/settings');
  const devices = page.getByRole('list', { name: 'Aparelhos conectados' });
  await expect(devices.getByText('Este aparelho', { exact: true })).toBeVisible();

  // Sair de todos os outros: só este continua
  await page.getByRole('button', { name: 'Sair de todos os outros' }).click();
  await openDialog(page).getByRole('button', { name: 'Sair dos outros' }).click();
  await expect(page.getByText('Só este aparelho continua conectado.')).toBeVisible();
  await expect(devices.getByRole('listitem')).toHaveCount(1);
  expect(await meStatus(outro)).toBe(401);

  // Sair de um aparelho específico
  const terceiro = await apiToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  await page.reload();
  await devices.getByRole('button', { name: /^Sair deste aparelho/ }).click();
  await openDialog(page).getByRole('button', { name: 'Sair do aparelho' }).click();
  await expect(page.getByText(/^Você saiu de /)).toBeVisible();
  expect(await meStatus(terceiro)).toBe(401);
  await expect(devices.getByText('Este aparelho', { exact: true })).toBeVisible();
});

test('Atividades mostram quem fez o quê, com filtro por ação e período', async ({ page }) => {
  const admin = await apiToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  const suffix = uniqueSuffix();
  const body = { name: `Escola Atividade ${suffix}`, address: 'Rua D, 40', phone: '(51) 3333-8888', email: `atividade.${suffix}@escola.com.br` };
  const school = await apiPost<{ id: string; name: string }>(admin, '/schools', body);
  expect(school.status).toBe(201);
  const put = await fetch(`${API_URL}/schools/${school.body.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` },
    body: JSON.stringify({ ...body, isActive: false }),
  });
  expect(put.status).toBe(200);

  await loginAs(page, 'admin');
  await page.getByRole('link', { name: 'Atividades' }).first().click();
  const list = page.getByRole('region', { name: 'Atividades' });
  const deactivated = list.getByRole('listitem').filter({ hasText: school.body.name }).filter({ hasText: 'Escola desativada' });
  await expect(deactivated).toBeVisible();
  await expect(deactivated).toContainText('por Administrador');

  await page.getByLabel('Ação', { exact: true }).selectOption({ label: 'Escola cadastrada' });
  await expect(list.getByRole('listitem').filter({ hasText: school.body.name })).toHaveCount(1);
  await expect(list.getByText('Escola desativada')).toHaveCount(0);

  // Período que termina ontem: a escola de hoje some
  const yesterday = new Date(Date.now() - 86_400_000);
  const iso = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  await page.getByLabel('Até').fill(iso);
  await expect(list.getByText(school.body.name)).toHaveCount(0);
});

test('escolas viram cartões no celular, com as ações', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`/admin/schools?busca=${encodeURIComponent('Jardim das Flores')}`);
  await expect(page.getByRole('table', { name: 'Escolas cadastradas' })).toBeHidden();
  const card = page.getByRole('list', { name: 'Escolas cadastradas' }).getByRole('listitem').first();
  await expect(card).toContainText('Escola Estadual Jardim das Flores');
  await expect(card).toContainText('(51) 3333-1200');
  await expect(card.getByRole('button', { name: /^Editar / })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
