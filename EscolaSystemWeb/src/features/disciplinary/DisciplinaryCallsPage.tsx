import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Eye, ClipboardList } from 'lucide-react';
import type { DisciplinaryCall, PagedResult } from '../../types';
import { disciplinaryApi } from '../../services/api';
import {
  Button,
  CallStatusStamp,
  EmptyState,
  FilterBar,
  FilterSelect,
  IconButton,
  LoadError,
  PageHeader,
  PageLoader,
  SearchInput,
  TableEmptyRow,
  TableFrame,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
} from '../../components/ui';
import { CALL_STATUS_OPTIONS, CallStatus } from '../../lib/school';
import { formatDate, formatLongDate, matches, plural } from '../../lib/format';
import { CallDetailDialog, CreateCallDialog, ResolveCallDialog } from './CallDialogs';
import { listAll } from '../../lib/paging';

export interface DisciplinaryCallsPageProps {
  /** Professor e orientador abrem chamados. */
  canCreate?: boolean;
  /** Diretor e orientador aprovam/rejeitam. */
  canResolve?: boolean;
  /** Responsável lê os chamados como entradas do livro, com a resolução à vista. */
  layout?: 'table' | 'entries';
  description?: string;
}

export const DisciplinaryCallsPage: React.FC<DisciplinaryCallsPageProps> = ({
  canCreate = false,
  canResolve = false,
  layout = 'table',
  description,
}) => {
  const toast = useToast();
  const [calls, setCalls] = useState<DisciplinaryCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCall, setSelectedCall] = useState<DisciplinaryCall | null>(null);
  const [resolveModal, setResolveModal] = useState<{ call: DisciplinaryCall; action: 'approve' | 'reject' } | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      // Lista completa (sem page a API devolve só 20)
      const data: PagedResult<DisciplinaryCall> = await listAll<DisciplinaryCall>((page, size) => disciplinaryApi.list(undefined, undefined, undefined, page, size));
      setCalls(data.items);
      setError(null);
    } catch {
      setError('Erro ao carregar chamados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const filtered = calls.filter(c => {
    const matchSearch = matches(searchTerm, c.studentName, c.description);
    const matchStatus = statusFilter ? String(c.status) === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const pendingCount = calls.filter(c => c.status === CallStatus.PENDING).length;
  const hasFilters = searchTerm !== '' || statusFilter !== '';

  const header = (
    <PageHeader
      title="Chamados disciplinares"
      description={description ?? (calls.length > 0 ? `${plural(calls.length, 'chamado', 'chamados')} · ${plural(pendingCount, 'pendente', 'pendentes')}` : undefined)}
      actions={
        canCreate && (
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setShowCreate(true)}>
            Novo chamado
          </Button>
        )
      }
    />
  );

  if (loading) {
    return (
      <>
        {header}
        <PageLoader label="Carregando chamados…" />
      </>
    );
  }

  const empty = (
    <EmptyState icon={ClipboardList} title={hasFilters ? 'Nenhum chamado encontrado' : 'Nenhum chamado registrado'} compact>
      {hasFilters ? 'Ajuste a busca ou o filtro de situação.' : canCreate ? 'Use “Novo chamado” para registrar uma ocorrência.' : undefined}
    </EmptyState>
  );

  return (
    <>
      {header}

      {error && <LoadError message={error} onRetry={() => { setLoading(true); fetchCalls(); }} />}

      <FilterBar>
        <SearchInput label="Pesquisar chamados" value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar por aluno ou descrição…" />
        <FilterSelect label="Filtrar por situação" value={statusFilter} onChange={setStatusFilter}>
          <option value="">Todas as situações</option>
          {CALL_STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </FilterSelect>
      </FilterBar>

      {/* Responsável sempre vê entradas; os demais perfis veem entradas no celular e tabela a partir do tablet */}
      <div className={layout === 'entries' ? undefined : 'md:hidden'}>
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-rule bg-surface">{empty}</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(call => (
              <li key={call.id}>
                <CallEntry
                  call={call}
                  audience={layout === 'entries' ? 'family' : 'school'}
                  onOpen={() => setSelectedCall(call)}
                  actions={
                    canResolve &&
                    call.status === CallStatus.PENDING && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setResolveModal({ call, action: 'approve' })}>
                          Aprovar
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setResolveModal({ call, action: 'reject' })}>
                          Rejeitar
                        </Button>
                      </>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {layout === 'table' && (
        <TableFrame caption="Chamados disciplinares" minWidth="48rem" className="hidden md:block">
          <THead>
            <Th sticky>Aluno</Th>
            <Th>Descrição</Th>
            <Th>Data</Th>
            <Th>Situação</Th>
            <Th align="right" srOnly>
              Ações
            </Th>
          </THead>
          <TBody>
            {filtered.length === 0 ? (
              <TableEmptyRow colSpan={5}>{empty}</TableEmptyRow>
            ) : (
              filtered.map(call => (
                <Tr key={call.id}>
                  <Td sticky strong className="whitespace-nowrap">
                    {call.studentName}
                  </Td>
                  <Td className="max-w-[22rem]">
                    <span className="line-clamp-2">{call.description}</span>
                  </Td>
                  <Td className="figures whitespace-nowrap text-sm">{formatDate(call.createdAt)}</Td>
                  <Td>
                    <CallStatusStamp status={call.status} fallback={call.statusName} />
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {canResolve && call.status === CallStatus.PENDING && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setResolveModal({ call, action: 'approve' })}>
                            Aprovar
                          </Button>
                          <Button size="sm" variant="danger-quiet" onClick={() => setResolveModal({ call, action: 'reject' })}>
                            Rejeitar
                          </Button>
                        </>
                      )}
                      <IconButton
                        label={`Ver detalhes do chamado de ${call.studentName}`}
                        icon={<Eye className="h-5 w-5" />}
                        onClick={() => setSelectedCall(call)}
                      />
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </TBody>
        </TableFrame>
      )}

      {showCreate && (
        <CreateCallDialog
          onClose={() => setShowCreate(false)}
          onSave={() => {
            setShowCreate(false);
            toast.success('Chamado criado. Ele fica pendente até a decisão.');
            fetchCalls();
          }}
        />
      )}
      {selectedCall && (
        <CallDetailDialog
          call={selectedCall}
          audience={layout === 'entries' ? 'family' : 'school'}
          onClose={() => setSelectedCall(null)}
          onResolve={
            canResolve
              ? action => {
                  setResolveModal({ call: selectedCall, action });
                  setSelectedCall(null);
                }
              : undefined
          }
        />
      )}
      {resolveModal && (
        <ResolveCallDialog
          call={resolveModal.call}
          action={resolveModal.action}
          onClose={() => setResolveModal(null)}
          onSave={() => {
            const approved = resolveModal.action === 'approve';
            setResolveModal(null);
            toast.success(approved ? 'Chamado aprovado.' : 'Chamado rejeitado.');
            fetchCalls();
          }}
        />
      )}
    </>
  );
};

/** Entrada do livro de ocorrências (visão do responsável). */
export const CallEntry: React.FC<{
  call: DisciplinaryCall;
  onOpen?: () => void;
  actions?: React.ReactNode;
  audience?: 'school' | 'family';
  /** Nível do título: 2 numa página de lista, 3 quando já há um h2 acima (ex.: painel). */
  headingLevel?: 2 | 3;
}> = ({ call, onOpen, actions, audience = 'school', headingLevel = 2 }) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
  <article className="rounded-lg border border-rule bg-surface">
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Heading className="text-base font-bold text-ink">{call.studentName}</Heading>
          <CallStatusStamp status={call.status} fallback={call.statusName} audience={audience} />
        </div>
        <p className="figures mt-0.5 text-sm text-ink-3">{formatLongDate(call.createdAt)}</p>
        <p className="mt-2 line-clamp-3 text-[0.9375rem] text-ink-2">{call.description}</p>
      </div>
      {onOpen && <IconButton label={`Ver detalhes do chamado de ${call.studentName}`} icon={<Eye className="h-5 w-5" />} onClick={onOpen} />}
    </div>
    {call.status !== CallStatus.PENDING && call.resolution && (
      <div className="border-t border-rule bg-paper px-5 py-3 text-[0.9375rem]">
        <p className="text-sm font-semibold text-ink-3">Resolução da escola</p>
        <p className="mt-0.5 whitespace-pre-wrap text-ink-2">{call.resolution}</p>
        {call.resolvedAt && (
          <p className="mt-1 text-sm text-ink-3">
            Resolvido em <span className="figures">{formatDate(call.resolvedAt)}</span>
            {call.resolvedByName && ` por ${call.resolvedByName}`}
          </p>
        )}
      </div>
    )}
    {actions && <div className="flex flex-wrap justify-end gap-2 border-t border-rule px-5 py-3">{actions}</div>}
  </article>
  );
};
