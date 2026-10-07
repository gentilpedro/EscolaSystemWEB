import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, School as SchoolIcon } from 'lucide-react';
import type { AdminStats, School, TicketSummary, UserListItem } from '../../types';
import { RoleId } from '../../types';
import { dashboardApi, schoolApi, ticketApi, userApi } from '../../services/api';
import { ActiveStamp, EmptyState, LoadError, PageLoader, Panel, TaskList } from '../../components/ui';
import { formatDate, plural } from '../../lib/format';
import { listAll } from '../../lib/paging';
import { DashboardColumns, DashboardHeader } from '../../features/dashboard/DashboardParts';

interface Attention {
  withoutDirector: School[];
  inactive: School[];
}

/** O admin abre no que pede atenção na rede e nos cadastros que só ele faz; os totais ficam no cabeçalho. */
export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [attention, setAttention] = useState<Attention | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsFailed, setStatsFailed] = useState(false);
  const [tickets, setTickets] = useState<TicketSummary | null>(null);
  const [ticketsFailed, setTicketsFailed] = useState(false);
  const [schoolsFailed, setSchoolsFailed] = useState(false);

  const fetchData = useCallback(() => {
    Promise.allSettled([
      dashboardApi.adminStats(),
      listAll<School>((page, size) => schoolApi.list(page, size)),
      listAll<UserListItem>((page, size) => userApi.list(page, size, { roleId: RoleId.DIRECTOR, isActive: true })),
      ticketApi.summary(),
    ])
      .then(([statsResult, schoolsResult, directorsResult, ticketsResult]) => {
        setTicketsFailed(ticketsResult.status === 'rejected');
        if (ticketsResult.status === 'fulfilled') setTickets(ticketsResult.value);

        setStatsFailed(statsResult.status === 'rejected');
        if (statsResult.status === 'fulfilled') setStats(statsResult.value);

        const failed = schoolsResult.status === 'rejected' || directorsResult.status === 'rejected';
        setSchoolsFailed(failed);
        if (schoolsResult.status === 'fulfilled') {
          const all = schoolsResult.value.items;
          setSchools([...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5));
          if (directorsResult.status === 'fulfilled') {
            const led = new Set(directorsResult.value.items.map(d => d.schoolId));
            setAttention({
              withoutDirector: all.filter(s => s.isActive && !led.has(s.id)).sort((a, b) => a.name.localeCompare(b.name)),
              inactive: all.filter(s => !s.isActive).sort((a, b) => a.name.localeCompare(b.name)),
            });
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = () => {
    setLoading(true);
    fetchData();
  };

  if (loading) {
    return (
      <>
        <DashboardHeader title="Painel administrativo" />
        <PageLoader label="Carregando painel…" rows={4} />
      </>
    );
  }

  const pending = attention ? attention.withoutDirector.length + attention.inactive.length : 0;

  return (
    <>
      <DashboardHeader
        title="Painel administrativo"
        description={
          stats ? (
            <span className="figures">
              {plural(stats.totalSchools, 'escola', 'escolas')} ({plural(stats.activeSchools, 'ativa', 'ativas')}) ·{' '}
              {plural(stats.totalUsers, 'usuário ativo', 'usuários ativos')} · {plural(stats.totalClasses, 'turma ativa', 'turmas ativas')} ·{' '}
              {plural(stats.totalStudents, 'aluno ativo', 'alunos ativos')}
            </span>
          ) : (
            'Visão da rede de escolas'
          )
        }
      />
      {statsFailed && <LoadError message="Não foi possível carregar os números da rede." onRetry={retry} />}

      <DashboardColumns>
        <Panel title={pending > 0 ? `Pede atenção (${pending})` : 'Pede atenção'} titleId="atencao" flush>
          {schoolsFailed || !attention ? (
            <LoadError message="Não foi possível verificar as escolas." onRetry={retry} className="m-5" />
          ) : pending === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nada pede atenção agora" compact>
              Todas as escolas ativas têm diretor.
            </EmptyState>
          ) : (
            <div className="divide-y divide-rule">
              <AttentionGroup
                title="Escolas ativas sem diretor"
                explanation="Sem diretor, ninguém cadastra a equipe, as turmas e os alunos."
                schools={attention.withoutDirector}
                action={school => ({ to: `/admin/users?novo=diretor&escola=${school.id}`, label: 'Cadastrar diretor' })}
                more={{ to: '/admin/schools', label: 'Ver todas as escolas' }}
              />
              <AttentionGroup
                title="Escolas desativadas"
                explanation="Ninguém dessas escolas consegue entrar enquanto elas estiverem desativadas."
                schools={attention.inactive}
                action={school => ({ to: `/admin/schools?busca=${encodeURIComponent(school.name)}`, label: 'Ver escola' })}
                more={{ to: '/admin/schools', label: 'Ver todas as escolas' }}
              />
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <TicketsPanel summary={tickets} failed={ticketsFailed} onRetry={retry} />

          <Panel title="Cadastros da rede" titleId="cadastros" flush>
            <TaskList
              items={[
                { to: '/admin/schools?nova=1', label: 'Nova escola', description: 'Nome, endereço, e-mail e telefone' },
                { to: '/admin/users?novo=diretor', label: 'Novo diretor', description: 'A direção cadastra a equipe, as turmas e os alunos da escola' },
                { to: '/admin/users', label: 'Administradores e diretores', description: 'Buscar, editar, redefinir senha, desativar' },
              ]}
            />
          </Panel>

          <Panel
            title="Escolas recentes"
            titleId="escolas-recentes"
            flush
            action={
              <Link to="/admin/schools" className="inline-flex min-h-11 items-center text-sm font-semibold text-lousa hover:underline sm:min-h-0">
                Ver todas
              </Link>
            }
          >
            {schools.length === 0 ? (
              <EmptyState icon={SchoolIcon} title={schoolsFailed ? 'Escolas indisponíveis' : 'Nenhuma escola cadastrada'} compact>
                {schoolsFailed ? 'Não foi possível carregar as escolas.' : 'Cadastre a primeira escola da rede.'}
              </EmptyState>
            ) : (
              <ul className="divide-y divide-rule">
                {schools.map(school => (
                  <li key={school.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{school.name}</p>
                      <p className="truncate text-sm text-ink-3">
                        {school.email} · desde <span className="figures">{formatDate(school.createdAt)}</span>
                      </p>
                    </div>
                    <ActiveStamp active={school.isActive} feminine />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </DashboardColumns>
    </>
  );
};

/** Tickets que a direção das escolas abriu e ainda pedem a administração, por tipo */
const TicketsPanel: React.FC<{ summary: TicketSummary | null; failed: boolean; onRetry: () => void }> = ({ summary, failed, onRetry }) => {
  const pending = summary ? summary.open + summary.inProgress : 0;
  return (
    <Panel
      title={pending > 0 ? `Tickets pendentes (${pending})` : 'Tickets pendentes'}
      titleId="tickets"
      flush
      action={
        <Link to="/admin/tickets" className="inline-flex min-h-11 items-center text-sm font-semibold text-lousa hover:underline sm:min-h-0">
          Ver tickets
        </Link>
      }
    >
      {failed || !summary ? (
        <LoadError message="Não foi possível carregar os tickets." onRetry={onRetry} className="m-5" />
      ) : pending === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nenhum ticket pendente" compact>
          Bugs e pedidos da direção das escolas aparecem aqui.
        </EmptyState>
      ) : (
        <div className="px-5 py-4">
          <dl className="grid grid-cols-2 gap-3">
            {(
              [
                ['Bugs', summary.bugs],
                ['Melhorias', summary.improvements],
                ['Dúvidas', summary.questions],
                ['Outros', summary.others],
              ] as const
            ).map(([label, count]) => (
              <div key={label} className="rounded-md border border-rule px-3 py-2">
                <dt className="text-sm text-ink-3">{label}</dt>
                <dd className="figures text-xl font-semibold text-ink">{count}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-ink-3">
            <Link to="/admin/tickets?situacao=1" className="font-semibold text-lousa hover:underline">
              {plural(summary.open, 'aberto', 'abertos')}
            </Link>{' '}
            esperando resposta · {plural(summary.inProgress, 'em andamento', 'em andamento')}
          </p>
        </div>
      )}
    </Panel>
  );
};

const ATTENTION_LIMIT = 5;

/** Um tipo de pendência: a explicação aparece uma vez, com até 5 escolas e o atalho para o resto. */
const AttentionGroup: React.FC<{
  title: string;
  explanation: string;
  schools: School[];
  action: (school: School) => { to: string; label: string };
  more: { to: string; label: string };
}> = ({ title, explanation, schools, action, more }) => {
  if (schools.length === 0) return null;
  const shown = schools.slice(0, ATTENTION_LIMIT);
  const rest = schools.length - shown.length;
  return (
    <section className="px-5 py-4" aria-label={title}>
      <h3 className="font-semibold text-ink">
        {title} <span className="figures text-ink-3">({schools.length.toLocaleString('pt-BR')})</span>
      </h3>
      <p className="mb-2 text-sm text-ink-3">{explanation}</p>
      <ul className="divide-y divide-rule">
        {shown.map(school => {
          const link = action(school);
          return (
            <li key={school.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
              <span className="min-w-0 text-[0.9375rem] text-ink">{school.name}</span>
              <Link to={link.to} className="inline-flex min-h-11 items-center text-sm font-semibold text-lousa hover:underline sm:min-h-0">
                {link.label}
                <span className="sr-only"> {school.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {rest > 0 && (
        <Link to={more.to} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-lousa hover:underline sm:min-h-0">
          e mais {plural(rest, 'escola', 'escolas')} · {more.label}
        </Link>
      )}
    </section>
  );
};
