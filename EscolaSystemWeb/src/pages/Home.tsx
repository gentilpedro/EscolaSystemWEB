import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ButtonLink, buttonClasses, GradeValue, Stamp } from '../components/ui';
import { Wordmark } from '../components/layout/BrandMark';
import { useAuth } from '../contexts/auth';
import { cn } from '../lib/cn';

// Nomes e valores fictícios: só para demonstrar a interface na página pública.
const DEMO_STUDENTS = [
  'Ana Beatriz Moura',
  'Bruno Henrique Dias',
  'Carla Nogueira',
  'Davi Lucas Prado',
  'Eduarda Sampaio',
  'Felipe Andrade',
];

const ROLES = [
  { name: 'Direção', does: 'Cadastra funcionários, turmas e alunos, acompanha os relatórios por turma e decide os chamados disciplinares.' },
  { name: 'Professores', does: 'Fazem a chamada, lançam as notas por trimestre, acompanham os relatórios da turma e abrem chamados disciplinares das suas turmas.' },
  { name: 'Orientação', does: 'Consulta alunos, faltas e notas das turmas que acompanha e abre e resolve chamados.' },
  { name: 'Responsáveis', does: 'Acompanham os chamados dos filhos e a resolução registrada pela escola.' },
  { name: 'Alunos', does: 'Consultam notas, frequência e trabalhos pendentes e registram as entregas.' },
  { name: 'Administração', does: 'Gerencia as escolas da rede e os usuários de cada uma.' },
];

const AttendanceDemo: React.FC = () => {
  const [marks, setMarks] = useState<boolean[]>([true, true, false, true, true, true]);
  const present = marks.filter(Boolean).length;

  return (
    <figure className="rounded-lg border border-rule-strong bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-[3px] border-double border-rule-strong px-5 py-4">
        <div>
          <p className="font-bold text-ink">7º Ano B · Chamada</p>
          <p className="figures text-sm text-ink-3">16/03 · segunda-feira</p>
        </div>
        <Stamp tone="neutral">Exemplo ilustrativo</Stamp>
      </div>
      <ol className="divide-y divide-rule">
        {DEMO_STUDENTS.map((name, i) => (
          <li key={name} className="flex items-center gap-3 px-5 py-2.5">
            <span className="figures w-5 text-right text-sm text-ink-3">{i + 1}</span>
            <span className="flex-1 truncate text-[0.9375rem] text-ink">{name}</span>
            <div role="group" aria-label={`Presença de ${name}`} className="flex gap-1">
              {[true, false].map(value => {
                const active = marks[i] === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={active}
                    aria-label={value ? 'Presente' : 'Falta'}
                    onClick={() => setMarks(m => m.map((v, j) => (j === i ? value : v)))}
                    className={cn(
                      'figures inline-flex h-11 w-11 items-center justify-center rounded-[4px] border-[1.5px] text-sm font-bold transition-colors duration-150 sm:h-9 sm:w-9',
                      active
                        ? value
                          ? 'border-blue-ink bg-blue-ink text-white'
                          : 'border-red-ink bg-red-ink text-white'
                        : 'border-control bg-surface text-ink-3 hover:border-ink-3',
                    )}
                  >
                    {value ? 'P' : 'F'}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="flex items-center justify-between gap-4 border-t border-rule bg-paper px-5 py-3 text-sm">
        <span className="text-ink-2">
          <strong className="figures text-blue-ink">{present}</strong> presentes ·{' '}
          <strong className="figures text-red-ink">{marks.length - present}</strong>{' '}
          {marks.length - present === 1 ? 'falta' : 'faltas'}
        </span>
        <span className="text-ink-3">Toque em P ou F</span>
      </figcaption>
    </figure>
  );
};

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const panel = isAuthenticated && user ? `/${user.role}` : null;
  return (
  <div className="min-h-dvh bg-paper text-ink">
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Seções" className="hidden items-center gap-7 text-[0.9375rem] font-semibold text-ink-2 md:flex">
          <a href="#registros" className="hover:text-ink">
            Como funciona
          </a>
          <a href="#perfis" className="hover:text-ink">
            Perfis
          </a>
        </nav>
        {/* Quem já está logado volta direto ao próprio painel */}
        <ButtonLink to={panel ?? '/login'} size="sm">
          {panel ? 'Ir para o painel' : 'Entrar'}
        </ButtonLink>
      </div>
    </header>

    <main>
      {/* Primeira dobra: a promessa e o diário funcionando */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:py-20">
        <div>
          <h1 className="max-w-xl text-[2.5rem] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[3.25rem]">
            A chamada, as notas e as ocorrências da escola no mesmo registro.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-2">
            Gestão escolar com um portal para cada perfil: direção, professores, orientação, responsáveis e alunos. Cada um entra
            direto na sua tarefa.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to={panel ?? '/login'} icon={<ArrowRight className="order-last h-4 w-4" aria-hidden="true" />}>
              Entrar no sistema
            </ButtonLink>
            <a href="#registros" className={buttonClasses('secondary')}>
              Ver como funciona
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-3">O acesso é criado pela direção da sua escola.</p>
        </div>
        <AttendanceDemo />
      </section>

      {/* Os três registros */}
      <section id="registros" className="scroll-mt-20 border-t border-rule bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="max-w-2xl text-[2rem] font-bold leading-tight">Os registros que a escola já conhece, sem papel.</h2>
          <p className="mt-3 max-w-2xl text-lg text-ink-2">
            O sistema organiza o dia a dia em torno de três registros, cada um visível para quem precisa dele.
          </p>

          <div className="mt-12 divide-y divide-rule border-y border-rule">
            <Register
              title="Diário de classe"
              text="O professor marca presença e falta da turma inteira, dia a dia, com observação por aluno. A frequência abaixo de 75% fica destacada para o aluno."
            >
              <div className="flex flex-wrap gap-1.5" role="img" aria-label="Exemplo de marcações: 7 presenças e 2 faltas">
                {['P', 'P', 'F', 'P', 'P', 'P', 'P', 'F', 'P'].map((m, i) => (
                  <span
                    key={i}
                    className={cn(
                      'figures inline-flex h-8 w-8 items-center justify-center rounded-[4px] border-[1.5px] text-sm font-bold',
                      m === 'P' ? 'border-blue-ink/55 bg-blue-tint text-blue-ink' : 'border-red-ink/55 bg-red-tint text-red-ink',
                    )}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </Register>

            <Register
              title="Boletim"
              text="Notas de 0 a 10 por disciplina e trimestre, com recuperação e final. A média aparece por disciplina e a nota vermelha não passa despercebida."
            >
              <dl className="grid grid-cols-4 overflow-hidden rounded-md border border-rule text-center">
                {[
                  ['1º Tri', 8.5],
                  ['2º Tri', 6.0],
                  ['3º Tri', 4.5],
                  ['Média', 6.3],
                ].map(([label, value], i) => (
                  <div key={label} className={cn('px-2 py-3', i > 0 && 'border-l border-rule')}>
                    <dt className="text-[0.8125rem] font-semibold text-ink-3">{label}</dt>
                    <dd className="mt-1">
                      <GradeValue value={value as number} size="lg" />
                    </dd>
                  </div>
                ))}
              </dl>
            </Register>

            <Register
              title="Livro de ocorrências"
              text="Professores e orientação abrem o chamado; a direção aprova ou rejeita com justificativa; o responsável acompanha o que foi decidido, por quem e quando."
            >
              <ol className="space-y-2.5 text-[0.9375rem]">
                <li className="flex items-center gap-3">
                  <Stamp tone="amber">Pendente</Stamp>
                  <span className="text-ink-2">Aberto pelo professor</span>
                </li>
                <li className="flex items-center gap-3">
                  <Stamp tone="red">Aprovado</Stamp>
                  <span className="text-ink-2">Advertência confirmada pela direção, com justificativa</span>
                </li>
                <li className="flex items-center gap-3">
                  <Stamp tone="neutral">Rejeitado</Stamp>
                  <span className="text-ink-2">Ou arquivado sem advertência, também com justificativa</span>
                </li>
                <li className="pt-1 text-sm text-ink-3">Em qualquer caso, o responsável vê a decisão.</li>
              </ol>
            </Register>
          </div>
        </div>
      </section>

      {/* Perfis */}
      <section id="perfis" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="max-w-2xl text-[2rem] font-bold leading-tight">Um portal para cada perfil.</h2>
          <dl className="mt-10 grid gap-x-12 border-t border-rule md:grid-cols-2">
            {ROLES.map(role => (
              <div key={role.name} className="border-b border-rule py-5">
                <dt className="text-lg font-bold">{role.name}</dt>
                <dd className="mt-1 text-[0.9375rem] leading-relaxed text-ink-2">{role.does}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Fechamento */}
      <section className="on-lousa bg-lousa-deep text-chalk">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-6">
          <div>
            <h2 className="text-[1.75rem] font-bold leading-tight">Sua escola já usa o EscolaSystem?</h2>
            <p className="mt-2 text-chalk-2">Entre com o e-mail e a senha fornecidos pela direção.</p>
          </div>
          <ButtonLink to={panel ?? '/login'} variant="chalk" icon={<ArrowRight className="order-last h-4 w-4" aria-hidden="true" />}>
            {panel ? 'Ir para o painel' : 'Entrar'}
          </ButtonLink>
        </div>
      </section>
    </main>

    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-ink-3 sm:px-6">
        <Wordmark className="scale-90 origin-left" />
        <p>© 2026 Pedro Gentil. Todos os direitos reservados.</p>
      </div>
    </footer>
  </div>
);
};

const Register: React.FC<{ title: string; text: string; children: React.ReactNode }> = ({ title, text, children }) => (
  <div className="grid items-center gap-6 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-12">
    <div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-ink-2">{text}</p>
    </div>
    <div>{children}</div>
  </div>
);
