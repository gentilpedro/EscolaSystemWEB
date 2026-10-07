import { expect, test } from '@playwright/test';
import { loginAs, openDialog, uniqueSuffix } from './support';

test('direção abre ticket, administração responde e resolve, direção reabre', async ({ browser }) => {
  const title = `Chamada não salva ${uniqueSuffix()}`;
  const director = await (await browser.newContext()).newPage();
  const admin = await (await browser.newContext()).newPage();

  // Direção abre pelo menu Suporte
  await loginAs(director, 'director');
  await director.getByRole('link', { name: 'Suporte' }).first().click();
  await director.getByRole('button', { name: 'Abrir ticket' }).click();
  const dialog = openDialog(director);
  await dialog.getByLabel('Tipo').selectOption({ label: 'Bug' });
  await dialog.getByLabel(/^Título/).fill(title);
  await dialog.getByLabel(/^Descrição/).fill('Ao salvar a chamada do 6º A aparece uma mensagem de erro.');
  await dialog.getByRole('button', { name: 'Abrir ticket' }).click();
  await expect(director).toHaveURL(/\/director\/support\/[0-9a-f-]{36}$/);
  await expect(director.getByRole('heading', { name: title })).toBeVisible();
  await expect(director.getByText('Aberto', { exact: true })).toBeVisible();
  const ticketUrl = director.url();

  // Administração vê no painel e responde
  await loginAs(admin, 'admin');
  await expect(admin.getByRole('region', { name: /^Tickets pendentes/ })).toBeVisible();
  await admin.getByRole('link', { name: 'Tickets', exact: true }).first().click();
  await admin.getByRole('link', { name: new RegExp(title) }).click();
  await admin.getByLabel('Sua resposta').fill('Estamos verificando. Obrigado pelo aviso.');
  await admin.getByRole('button', { name: 'Enviar resposta' }).click();
  await expect(admin.getByText('Resposta enviada.')).toBeVisible();
  await expect(admin.locator('header').getByText('Em andamento', { exact: true })).toBeVisible();
  await admin.getByLabel('Situação do ticket').selectOption({ label: 'Resolvido' });
  await admin.getByRole('button', { name: 'Salvar situação' }).click();
  await expect(admin.getByText('Ticket marcado como resolvido.')).toBeVisible();

  // Direção vê a resposta da administração e reabre respondendo
  await director.goto(ticketUrl);
  const messages = director.getByRole('list', { name: 'Mensagens' });
  await expect(messages.getByText('Estamos verificando. Obrigado pelo aviso.')).toBeVisible();
  await expect(messages.getByText('Administração', { exact: true })).toBeVisible();
  await expect(director.getByText('Responder um ticket resolvido o reabre.')).toBeVisible();
  await director.getByLabel('Sua resposta').fill('O erro voltou hoje de manhã.');
  await director.getByRole('button', { name: 'Enviar resposta' }).click();
  await expect(director.locator('header').getByText('Aberto', { exact: true })).toBeVisible();
  // A direção não muda a situação
  await expect(director.getByLabel('Situação do ticket')).toHaveCount(0);
});
