import React, { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import type { AuditLogItem, PagedResult } from '../../types';
import { auditApi } from '../../services/api';
import { BlockLoader, EmptyState, FilterBar, LoadError, PageHeader, Pagination, SelectField, Stamp, TextField } from '../../components/ui';
import { formatDateTime, plural, shiftIsoDate } from '../../lib/format';
import { AUDIT_ACTION_LABEL, AUDIT_RESTRICTIVE, auditActionLabel } from '../../lib/audit';

const PAGE_SIZE = 25;

/** Início do dia escolhido, no fuso de quem está usando, em ISO para a API */
const startOfDay = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toISOString();
};

/** Quem fez o quê no sistema: escolas, administradores e diretores. */
export const AdminActivity: React.FC = () => {
  const [data, setData] = useState<PagedResult<AuditLogItem> | null>(null);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const query = `${page}|${action}|${from}|${to}`;

  const fetchLogs = useCallback(async () => {
    try {
      setData(
        await auditApi.list(page, PAGE_SIZE, {
          action: action || undefined,
          from: from ? startOfDay(from) : undefined,
          // "Até" inclui o dia escolhido: a API recebe o começo do dia seguinte
          to: to ? startOfDay(shiftIsoDate(to, 1)) : undefined,
        }),
      );
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoadedQuery(`${page}|${action}|${from}|${to}`);
    }
  }, [page, action, from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchLogs();
  }, [fetchLogs]);

  const loading = loadedQuery !== query;
  const logs = data?.items ?? [];
  const filtering = action !== '' || from !== '' || to !== '';
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Atividades"
        description="Quem fez o quê no sistema: escolas, administradores e diretores. O que a direção faz com a equipe e os alunos fica com ela."
      />

      <FilterBar>
        <SelectField label="Ação" value={action} onChange={e => resetPage(setAction)(e.target.value)}>
          <option value="">Todas as ações</option>
          {Object.entries(AUDIT_ACTION_LABEL).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </SelectField>
        <TextField label="De" type="date" value={from} max={to || undefined} onChange={e => resetPage(setFrom)(e.target.value)} />
        <TextField label="Até" type="date" value={to} min={from || undefined} onChange={e => resetPage(setTo)(e.target.value)} />
      </FilterBar>

      {error && <LoadError message="Não foi possível carregar as atividades." onRetry={fetchLogs} />}

      {loading && !data ? (
        <BlockLoader label="Carregando atividades…" rows={8} />
      ) : (
        <section aria-label="Atividades" className="overflow-hidden rounded-lg border border-rule bg-surface" aria-busy={loading}>
          {data && (
            <p className="border-b border-rule px-5 py-2.5 text-sm text-ink-3" aria-live="polite">
              {loading ? 'Carregando…' : plural(data.totalCount, 'atividade', 'atividades')}
              {filtering && !loading ? ' com estes filtros' : ''}
            </p>
          )}
          {logs.length === 0 ? (
            <EmptyState icon={History} title={filtering ? 'Nenhuma atividade com estes filtros' : 'Nenhuma atividade ainda'} compact>
              {filtering ? 'Ajuste a ação ou o período.' : 'Cadastros, edições e desativações aparecem aqui.'}
            </EmptyState>
          ) : (
            <ol className="divide-y divide-rule">
              {logs.map(log => (
                <li key={log.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <time dateTime={log.createdAt} className="figures text-sm text-ink-3">
                    {formatDateTime(log.createdAt)}
                  </time>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Stamp tone={AUDIT_RESTRICTIVE.has(log.action) ? 'red' : 'neutral'}>{auditActionLabel(log.action)}</Stamp>
                      <span className="font-semibold text-ink">{log.targetName}</span>
                      <span className="text-sm text-ink-3">por {log.actorName}</span>
                    </p>
                    {log.details && <p className="mt-1 break-words text-sm text-ink-2">{log.details}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {data && data.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              pageSize={PAGE_SIZE}
              noun="atividades"
              onPage={setPage}
            />
          )}
        </section>
      )}
    </>
  );
};
