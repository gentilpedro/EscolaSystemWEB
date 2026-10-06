import { expect, type Page } from '@playwright/test';

export const API_URL = (process.env.E2E_API_URL ?? 'http://localhost:5130/api').replace(/\/$/, '');

/** Contas da seed de demonstração (docker/seed/demo.mjs). */
export const ACCOUNTS = {
  admin: { email: 'admin@escolasystem.com', password: 'Admin@123', home: '/admin' },
  director: { email: 'diretora@escolademo.com.br', password: 'Demo@2026', home: '/director' },
  teacher: { email: 'professor@escolademo.com.br', password: 'Demo@2026', home: '/teacher' },
  student: { email: 'aluno@escolademo.com.br', password: 'Demo@2026', home: '/student' },
} as const;

export type Account = keyof typeof ACCOUNTS;

/** Entra pela tela de login e espera chegar ao painel do perfil. */
export async function loginAs(page: Page, who: Account): Promise<void> {
  const account = ACCOUNTS[who];
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(new RegExp(`${account.home}(/|$)`));
}

/**
 * Token de acesso para chamar a API direto (preparar ou conferir dados), como fazem ferramentas e a seed:
 * o login grava o token no cookie es_access e a API aceita o mesmo valor no cabeçalho Authorization.
 */
export async function apiToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  expect(res.ok, `login de ${email} pela API`).toBeTruthy();
  const cookie = res.headers.getSetCookie().find(c => c.startsWith('es_access='));
  expect(cookie, 'cookie es_access no login').toBeTruthy();
  return cookie!.split(';')[0].slice('es_access='.length);
}

export async function apiGet<T>(token: string, path: string): Promise<{ status: number; body: T }> {
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, body: (res.ok ? await res.json() : undefined) as T };
}

/** Sufixo para dados criados pelos testes não colidirem entre execuções no mesmo banco. */
export const uniqueSuffix = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

/** Diálogo aberto (o sistema usa <dialog>). */
export const openDialog = (page: Page) => page.locator('dialog[open]');
