import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import type { DashboardStats, DisciplinaryCall, PagedResult } from '../../types';
import { dashboardApi, disciplinaryApi } from '../../services/api';
import { EmptyState, LoadError, PageLoader, Panel, Stamp, TaskList } from '../../components/ui';
import { CallStatus } from '../../lib/school';
import { formatDate, plural } from '../../lib/format';
import { DashboardColumns, DashboardHeader } from '../../features/dashboard/DashboardParts';

/** A direção abre no que precisa de decisão; os totais ficam numa linha do cabeçalho. */
export const DirectorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // Só os mais recentes para a lista; o total vem da API
  const [pendingCalls, setPendingCalls] = useState<DisciplinaryCall[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const [statsData, callsData] = await Promise.all([
        dashboardApi.stats(),
        disciplinaryApi.list(undefined, undefined, String(CallStatus.PENDING), 1, 5) as Promise<PagedResult<DisciplinaryCall>>,
      ]);

      setStats(statsData);
      setPendingCalls(callsData.items);
      setPendingTotal(callsData.totalCount);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <PageLoader label="Carregando painel…" rows={4} />
      </>
    );
  }

  const totals = stats
    ? `${plural(stats.totalStaff, 'funcionário', 'funcionários')} · ${plural(stats.totalClasses, 'turma', 'turmas')} · ${plural(stats.totalStudents, 'aluno', 'alunos')}`
    : undefined;

  return (
    <>
      <DashboardHeader description={totals && <span className="figures">Direção · {totals}</span>} />
      {failed && <LoadError message="Não foi possível carregar os dados do painel." onRetry={() => {
            setLoading(true);
            fetchStats();
          }} />}

      <DashboardColumns>
        <Panel
          title={pendingTotal > 0 ? `Chamados aguardando decisão (${pendingTotal})` : 'Chamados aguardando decisão'}
          titleId="pendentes"
          flush
          action={
            pendingCalls.length > 0 && (
              <Link to="/director/disciplinary" className="inline-flex min-h-11 items-center text-sm font-semibold text-lousa hover:underline sm:min-h-0">
                Decidir
              </Link>
            )
          }
        >
          {pendingCalls.length === 0 ? (
            <EmptyState icon={Inbox} title={failed ? 'Chamados indisponíveis' : 'Nenhum chamado pendente'} compact>
              {failed ? 'Não foi possível carregar os chamados.' : 'Tudo decidido por aqui.'}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-rule">
              {pendingCalls.map(call => (
                <li key={call.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold text-ink">{call.studentName}</p>
                    <Stamp tone="amber">Pendente</Stamp>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-2">{call.description}</p>
                  <p className="figures mt-0.5 text-[0.8125rem] text-ink-3">{formatDate(call.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Cadastros e relatórios" titleId="tarefas" flush>
          <TaskList
            items={[
              { to: '/director/staff', label: 'Adicionar funcionário', description: 'Professores, orientadores e diretores' },
              { to: '/director/classes', label: 'Criar turma', description: 'Turmas do ano letivo' },
              { to: '/director/students', label: 'Adicionar aluno', description: 'Matrícula e turma' },
              { to: '/director/reports', label: 'Ver relatórios', description: 'Média, presença e chamados por turma' },
            ]}
          />
        </Panel>
      </DashboardColumns>
    </>
  );
};
