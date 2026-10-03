import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import type { DisciplinaryCall } from '../../types';
import { disciplinaryApi } from '../../services/api';
import { EmptyState, LoadError, PageLoader } from '../../components/ui';
import { plural } from '../../lib/format';
import { listAll } from '../../lib/paging';
import { CallStatus } from '../../lib/school';
import { CallEntry } from '../../features/disciplinary/DisciplinaryCallsPage';
import { DashboardHeader } from '../../features/dashboard/DashboardParts';

export const ParentDashboard: React.FC = () => {
  const [calls, setCalls] = useState<DisciplinaryCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchCalls = useCallback(() => {
    listAll<DisciplinaryCall>((page, size) => disciplinaryApi.list(undefined, undefined, undefined, page, size))
      .then(data => {
        setCalls(data.items);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <PageLoader label="Carregando painel…" rows={4} />
      </>
    );
  }

  const pending = calls.filter(c => c.status === CallStatus.PENDING).length;
  const confirmed = calls.filter(c => c.status === CallStatus.APPROVED).length;

  return (
    <>
      <DashboardHeader
        description={
          failed ? (
            'Acompanhe as ocorrências registradas pela escola.'
          ) : (
            <span className="figures">
              {plural(calls.length, 'ocorrência', 'ocorrências')} · {pending} em análise ·{' '}
              {plural(confirmed, 'advertência confirmada', 'advertências confirmadas')}
            </span>
          )
        }
      />
      {failed && <LoadError message="Não foi possível carregar os chamados." onRetry={() => {
            setLoading(true);
            fetchCalls();
          }} />}

      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-ink">Ocorrências recentes</h2>
        {calls.length > 0 && (
          <Link to="/parent/disciplinary" className="inline-flex min-h-11 items-center text-sm font-semibold text-lousa hover:underline sm:min-h-0">
            Ver todos
          </Link>
        )}
      </div>

      {calls.length === 0 ? (
        <div className="rounded-lg border border-rule bg-surface">
          <EmptyState icon={ClipboardList} title={failed ? 'Chamados indisponíveis' : 'Nenhum chamado registrado'} compact>
            {failed ? 'Tente novamente em instantes.' : 'Quando a escola registrar uma ocorrência, ela aparece aqui.'}
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3">
          {calls.slice(0, 5).map(call => (
            <li key={call.id}>
              <CallEntry call={call} audience="family" headingLevel={3} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
