import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, ListTodo } from 'lucide-react';
import type { PendingWorkItem } from '../../types';
import { pendingWorkApi } from '../../services/api';
import { listAll } from '../../lib/paging';
import { Alert, Button, EmptyState, LoadError, PageHeader, PageLoader, Segmented, Stamp, errorMessage, useConfirm, useToast } from '../../components/ui';
import { formatDate, plural } from '../../lib/format';
import { cn } from '../../lib/cn';

const isOverdue = (dueDate: string, isDelivered: boolean) => !isDelivered && new Date(dueDate + 'T23:59:59') < new Date();

type Filter = 'all' | 'pending' | 'delivered';

export const StudentAssignments: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [works, setWorks] = useState<PendingWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Abre no que o aluno precisa fazer: os pendentes
  const [filter, setFilter] = useState<Filter>('pending');
  const [delivering, setDelivering] = useState<string | null>(null);

  const fetchWorks = useCallback(async () => {
    try {
      const data = await listAll<PendingWorkItem>((page, size) => pendingWorkApi.list(page, size));
      setWorks([...data.items].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      setError(null);
    } catch {
      setError('Erro ao carregar trabalhos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  const handleDeliver = async (work: PendingWorkItem) => {
    const ok = await confirm({
      title: 'Confirmar entrega deste trabalho?',
      description: work.title,
      confirmLabel: 'Confirmar entrega',
      tone: 'primary',
    });
    if (!ok) return;
    setDelivering(work.id);
    try {
      await pendingWorkApi.markDelivered(work.id);
      setWorks(prev => prev.map(w => (w.id === work.id ? { ...w, isDelivered: true, deliveredAt: new Date().toISOString() } : w)));
      toast.success('Entrega registrada.');
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao registrar entrega.'));
    } finally {
      setDelivering(null);
    }
  };

  const filtered = works.filter(w => (filter === 'pending' ? !w.isDelivered : filter === 'delivered' ? w.isDelivered : true));

  const pendingCount = works.filter(w => !w.isDelivered).length;
  const deliveredCount = works.filter(w => w.isDelivered).length;
  const overdueCount = works.filter(w => isOverdue(w.dueDate, w.isDelivered)).length;

  const header = (
    <PageHeader
      title="Trabalhos"
      description={!loading && works.length > 0 ? `${plural(pendingCount, 'pendente', 'pendentes')} · ${plural(deliveredCount, 'entregue', 'entregues')}` : undefined}
    />
  );

  if (loading) {
    return (
      <>
        {header}
        <PageLoader label="Carregando trabalhos…" rows={4} />
      </>
    );
  }

  return (
    <>
      {header}
      {error && <LoadError message={error} onRetry={() => { setLoading(true); fetchWorks(); }} />}

      {overdueCount > 0 && (
        <Alert tone="error" className="mb-5" title={`Você tem ${plural(overdueCount, 'trabalho em atraso', 'trabalhos em atraso')}.`}>
          Entregue o quanto antes e avise o professor.
        </Alert>
      )}

      <div className="mb-5">
        <Segmented<Filter>
          label="Mostrar trabalhos"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'pending', label: 'Pendentes', count: pendingCount },
            { value: 'delivered', label: 'Entregues', count: deliveredCount },
            { value: 'all', label: 'Todos', count: works.length },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-rule bg-surface">
          <EmptyState icon={ListTodo} title={filter === 'pending' ? 'Nenhum trabalho pendente' : 'Nenhum trabalho encontrado'} compact />
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map(work => {
            const overdue = isOverdue(work.dueDate, work.isDelivered);
            return (
              <li key={work.id} className={cn('rounded-lg border bg-surface', overdue ? 'border-red-ink/40' : 'border-rule')}>
                <div className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1 basis-64">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h2 className="text-base font-bold text-ink">{work.title}</h2>
                      {work.isDelivered ? (
                        <Stamp tone="blue">Entregue</Stamp>
                      ) : overdue ? (
                        <Stamp tone="red">Em atraso</Stamp>
                      ) : (
                        <Stamp tone="amber">Pendente</Stamp>
                      )}
                    </div>
                    {work.description && <p className="mt-1.5 text-[0.9375rem] text-ink-2">{work.description}</p>}
                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <dt>Prazo</dt>
                        <dd className={cn('figures font-semibold', overdue ? 'text-red-ink' : 'text-ink-2')}>{formatDate(work.dueDate)}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Turma</dt>
                        <dd className="text-ink-2">{work.className}</dd>
                      </div>
                      {work.isDelivered && work.deliveredAt && (
                        <div className="flex gap-1.5">
                          <dt>Entregue em</dt>
                          <dd className="figures text-blue-ink">{formatDate(work.deliveredAt)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {!work.isDelivered && (
                    <Button
                      variant="secondary"
                      icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => handleDeliver(work)}
                      loading={delivering === work.id}
                      loadingLabel="Confirmando…"
                    >
                      Marcar como entregue
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};
