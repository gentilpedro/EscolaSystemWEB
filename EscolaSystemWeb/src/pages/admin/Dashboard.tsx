import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { School as SchoolIcon } from 'lucide-react';
import type { School } from '../../types';
import { dashboardApi, schoolApi } from '../../services/api';
import { ActiveStamp, EmptyState, LoadError, PageLoader, Panel } from '../../components/ui';
import { formatDate, plural } from '../../lib/format';
import { listAll } from '../../lib/paging';
import { DashboardColumns, DashboardHeader } from '../../features/dashboard/DashboardParts';

// Espelha AdminStatsDto (GET /api/admin/stats)
interface AdminStats {
  totalSchools: number;
  activeSchools: number;
  totalUsers: number;
  totalClasses: number;
  totalStudents: number;
}

/**
 * Antes este painel exibia números fixos simulados (setTimeout). Agora usa o
 * endpoint de estatísticas que a API já oferece e as escolas mais recentes.
 */
export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsFailed, setStatsFailed] = useState(false);
  const [schoolsFailed, setSchoolsFailed] = useState(false);

  const fetchData = useCallback(() => {
    Promise.allSettled([
      dashboardApi.adminStats() as Promise<AdminStats>,
      listAll<School>((page, size) => schoolApi.list(page, size)),
    ])
      .then(([statsResult, schoolsResult]) => {
        setStatsFailed(statsResult.status === 'rejected');
        if (statsResult.status === 'fulfilled') setStats(statsResult.value);
        setSchoolsFailed(schoolsResult.status === 'rejected');
        if (schoolsResult.status === 'fulfilled') {
          const recent = [...schoolsResult.value.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
          setSchools(recent);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <>
        <DashboardHeader title="Painel administrativo" />
        <PageLoader label="Carregando painel…" rows={4} />
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title="Painel administrativo"
        description={
          stats ? (
            <span className="figures">
              {plural(stats.totalSchools, 'escola', 'escolas')} ({stats.activeSchools.toLocaleString('pt-BR')} ativas) ·{' '}
              {plural(stats.totalUsers, 'usuário ativo', 'usuários ativos')} · {plural(stats.totalClasses, 'turma ativa', 'turmas ativas')} ·{' '}
              {plural(stats.totalStudents, 'aluno ativo', 'alunos ativos')}
            </span>
          ) : (
            'Visão da rede de escolas'
          )
        }
      />
      {statsFailed && <LoadError message="Não foi possível carregar os números da rede." onRetry={() => {
            setLoading(true);
            fetchData();
          }} />}

      <DashboardColumns>
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

      </DashboardColumns>
    </>
  );
};
