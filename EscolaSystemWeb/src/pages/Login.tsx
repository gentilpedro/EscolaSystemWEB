import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Button, TextField } from '../components/ui';
import { Wordmark } from '../components/layout/BrandMark';

// Contas da seed de demonstração (docker/seed/demo.mjs). Fora do modo dev a lista é vazia e sai do bundle.
const DEV_ACCOUNTS = import.meta.env.DEV
  ? [
      { role: 'Administração', email: 'admin@escolasystem.com', password: 'Admin@123' },
      { role: 'Direção', email: 'diretora@escolademo.com.br', password: 'Demo@2026' },
      { role: 'Professor', email: 'professor@escolademo.com.br', password: 'Demo@2026' },
      { role: 'Orientação', email: 'orientacao@escolademo.com.br', password: 'Demo@2026' },
      { role: 'Aluno', email: 'aluno@escolademo.com.br', password: 'Demo@2026' },
      { role: 'Responsável', email: 'responsavel@escolademo.com.br', password: 'Demo@2026' },
    ]
  : [];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const role = await login(email, password);
      navigate(`/${role}`);
    } catch (err) {
      // Sem resposta do servidor o fetch lança TypeError ("Failed to fetch")
      if (err instanceof TypeError) setError('Não foi possível conectar ao servidor. Verifique a conexão e tente de novo.');
      else setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Lousa */}
      <aside className="on-lousa relative hidden flex-col justify-between overflow-hidden bg-lousa-deep p-10 text-chalk lg:flex">
        <Wordmark onLousa />
        <div className="max-w-md">
          <p className="text-[2rem] font-bold leading-tight">O diário, o boletim e o livro de ocorrências da escola, num lugar só.</p>
          <p className="mt-4 text-chalk-2">Cada perfil entra direto na sua tarefa: chamada, notas, chamados e acompanhamento.</p>
        </div>
        {/* pauta de giz */}
        <div aria-hidden="true" className="space-y-3 opacity-25">
          {[88, 64, 76].map(w => (
            <div key={w} className="h-0.5 rounded bg-chalk" style={{ width: `${w}%` }} />
          ))}
        </div>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <span className="lg:hidden">
            <Wordmark />
          </span>
          <Link
            to="/"
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-ink-2 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Início
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-[1.75rem] font-bold text-ink">Entrar</h1>
          <p className="mt-1 text-[0.9375rem] text-ink-3">Use o e-mail e a senha criados pela sua escola.</p>

          {error && (
            <Alert tone="error" className="mt-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <TextField
              id="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
            <TextField
              id="password"
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} loadingLabel="Entrando…" className="w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink-3">Não tem acesso? Peça à direção ou à administração da sua escola.</p>

          {import.meta.env.DEV && (
            <div className="mt-8 rounded-md border border-dashed border-rule-strong bg-surface px-4 py-3 text-sm text-ink-3">
              <p className="font-semibold text-ink-2">Credenciais de teste (somente em desenvolvimento)</p>
              <p className="mt-1 text-[0.8125rem]">
                Usuários da seed de demonstração (<code>docker/README.md</code>). Senha <code>Demo@2026</code>; o admin usa <code>Admin@123</code>.
              </p>
              <ul className="mt-2 space-y-1">
                {DEV_ACCOUNTS.map(acc => (
                  <li key={acc.email}>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword(acc.password);
                      }}
                      className="break-all text-left text-[0.8125rem] underline decoration-rule-strong underline-offset-2 hover:text-ink"
                    >
                      <span className="font-semibold text-ink-2">{acc.role}:</span> {acc.email}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
