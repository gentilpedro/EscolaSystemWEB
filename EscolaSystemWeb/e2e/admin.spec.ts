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

test('exporta administradores e diretores para planilha, sem CPF', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/users');
  await page.getByLabel('Filtrar por perfil').selectOption({ label: 'Diretor' });
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar' }).click()]);

  expect(download.suggestedFilename()).toMatch(/^administradores-e-diretores-\d{4}-\d{2}-\d{2}\.csv$/);
  const csv = await (await import('node:fs/promises')).readFile(await download.path(), 'utf-8');
  const [header, ...rows] = csv.replace(/^\uFEFF/, '').split('\r\n');
  expect(header).toBe('Nome;E-mail;Perfil;Escola;Situação;Bloqueada até;Último acesso');
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.every(r => r.split(';')[2] === 'Diretor')).toBe(true);
  expect(rows.some(r => r.includes('diretora@escolademo.com.br'))).toBe(true);
  expect(csv).not.toMatch(/CPF/i);
  await expect(page.getByText(/contas? exportadas?\.$/)).toBeVisible();
});

test('usuários mostram o último acesso e ordenam por quem está há mais tempo sem entrar', async ({ page }) => {
  const admin = await apiToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  const suffix = uniqueSuffix();
  const school = await apiPost<{ id: string }>(admin, '/schools', {
    name: `Escola Acesso ${suffix}`, address: 'Rua E, 50', phone: '(51) 3333-9999', email: `acesso.${suffix}@escola.com.br`,
  });
  const director = await apiPost<{ id: string; name: string }>(admin, '/users', {
    name: `Diretor Nunca Entrou ${suffix}`, email: `nunca.${suffix}@escola.com.br`, password: 'Senha@123', roleId: 2, schoolId: school.body.id,
  });
  expect(director.status).toBe(201);

  await loginAs(page, 'admin');
  await page.goto('/admin/users');
  const table = page.getByRole('table', { name: 'Usuários' });
  await expect(table.getByRole('columnheader', { name: 'Último acesso' })).toBeVisible();
  await expect(table.getByRole('row', { name: new RegExp(ACCOUNTS.admin.email) })).toContainText(/\d{2}\/\d{2}\/\d{4}/);

  await page.getByLabel('Ordenar').selectOption('lastAccess');
  // Quem nunca entrou vem antes de todos
  await expect(table.locator('tbody tr').first()).toContainText('Nunca entrou');
  await expect(table.getByRole('row', { name: new RegExp(director.body.name) })).toContainText('Nunca entrou');
});

test('página da escola mostra a direção e os números, sem dados da equipe', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto(`/admin/schools?busca=${encodeURIComponent('Jardim das Flores')}`);
  await page.getByRole('table', { name: 'Escolas cadastradas' }).getByRole('link', { name: 'Escola Estadual Jardim das Flores' }).click();
  await expect(page).toHaveURL(/\/admin\/schools\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { name: 'Escola Estadual Jardim das Flores' })).toBeVisible();
  const direction = page.getByRole('region', { name: 'Direção' });
  await expect(direction).toContainText('Marta Ribeiro');
  await expect(direction).toContainText('diretora@escolademo.com.br');
  // Atalho para o diretor em Usuários, onde ficam senha, bloqueio e aparelhos
  await direction.getByRole('link', { name: /^Ver em Usuários/ }).click();
  await expect(page.getByLabel('Pesquisar usuários')).toHaveValue('diretora@escolademo.com.br');
  await expect(page.getByRole('row', { name: /diretora@escolademo\.com\.br/ })).toBeVisible();
  await page.goBack();
  const usage = page.getByRole('region', { name: 'Uso do sistema' });
  await expect(usage).toContainText('Turmas ativas');
  await expect(usage).toContainText('Os nomes ficam com a direção da escola.');
  // Nenhum nome de professor da escola aparece para o admin
  await expect(page.getByText('Paulo Mendes')).toHaveCount(0);

  // Escola nova: sem diretor, com o atalho para cadastrar
  const admin = await apiToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  const suffix = uniqueSuffix();
  const school = await apiPost<{ id: string }>(admin, '/schools', {
    name: `Escola Página ${suffix}`, address: 'Rua F, 60', phone: '(51) 3333-1111', email: `pagina.${suffix}@escola.com.br`,
  });
  await page.goto(`/admin/schools/${school.body.id}`);
  await expect(page.getByRole('region', { name: 'Direção' })).toContainText('Sem diretor.');
  await page.getByRole('link', { name: 'Cadastrar diretor' }).click();
  await expect(openDialog(page).getByLabel('Escola')).toHaveValue(school.body.id);
});

test('painel aponta escola com diretor e sem turmas como implantação incompleta', async ({ page }) => {
  const admin = await apiToken(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  const suffix = uniqueSuffix();
  // "AAA" no começo: a lista do grupo mostra só as 5 primeiras em ordem alfabética
  const school = await apiPost<{ id: string; name: string }>(admin, '/schools', {
    name: `AAA Implantação ${suffix}`, address: 'Rua G, 70', phone: '(51) 3333-2222', email: `implantacao.${suffix}@escola.com.br`,
  });
  await apiPost(admin, '/users', {
    name: `Diretor Implantação ${suffix}`, email: `dir.implantacao.${suffix}@escola.com.br`, password: 'Senha@123', roleId: 2, schoolId: school.body.id,
  });

  await loginAs(page, 'admin');
  const group = page.getByRole('region', { name: 'Implantação incompleta' });
  await expect(group).toContainText(`${school.body.name} · sem turmas`);
  await group.getByRole('link', { name: `Ver escola ${school.body.name} · sem turmas` }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/schools/${school.body.id}$`));
  await expect(page.getByText('a implantação não começou', { exact: false })).toBeVisible();
});

test('admin desconecta um diretor de todos os aparelhos sem trocar a senha', async ({ page }) => {
  const director = ACCOUNTS.director;
  const directorToken = await apiToken(director.email, director.password);
  const meStatus = async (token: string) =>
    (await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).status;
  expect(await meStatus(directorToken)).toBe(200);

  await loginAs(page, 'admin');
  await page.goto(`/admin/users?busca=${encodeURIComponent(director.email)}`);
  const row = page.getByRole('row', { name: new RegExp(director.email) });
  await row.getByRole('button', { name: /^Desconectar .* de todos os aparelhos$/ }).click();
  await openDialog(page).getByRole('button', { name: 'Desconectar' }).click();
  await expect(page.getByText(/foi desconectado de todos os aparelhos\.$/)).toBeVisible();

  expect(await meStatus(directorToken)).toBe(401);
  // A senha continua a mesma
  expect(await apiTokenStatus(director.email, director.password)).toBe(200);
  // Na própria linha do admin a ação não aparece
  await page.goto(`/admin/users?busca=${encodeURIComponent(ACCOUNTS.admin.email)}`);
  await expect(page.getByRole('row', { name: new RegExp(ACCOUNTS.admin.email) }).getByRole('button', { name: /^Desconectar/ })).toHaveCount(0);
});
