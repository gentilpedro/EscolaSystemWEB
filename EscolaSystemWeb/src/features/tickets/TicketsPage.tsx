import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LifeBuoy, Plus } from 'lucide-react';
import type { PagedResult, School, TicketListItem, TicketStatus, TicketType } from '../../types';
import { TicketType as TicketTypes } from '../../types';
import { schoolApi, ticketApi } from '../../services/api';
import {
  Alert,
  BlockLoader,
  Button,
  EmptyState,
  FilterBar,
  FormDialog,
  LoadError,
  PageHeader,
  Pagination,
  SelectField,
  Stamp,
  TextAreaField,
  TextField,
  errorMessage,
} from '../../components/ui';
import { formatDateTime, plural } from '../../lib/format';
import { listAll } from '../../lib/paging';
import { TICKETS_BASE, TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_TYPE_LABEL, type TicketAudience } from './labels';

const PAGE_SIZE = 20;

const COPY: Record<TicketAudience, { title: string; description: string }> = {
  admin: {
    title: 'Tickets',
    description: 'Bugs, melhorias e dúvidas que a direção das escolas abriu para a administração do sistema.',
  },
  director: {
    title: 'Suporte',
    description: 'Relate um problema, peça uma melhoria ou tire uma dúvida com a administração do EscolaSystem.',
  },
};

/** Lista de tickets: a direção vê os da escola e abre novos; o admin vê todos e filtra por escola. */
export const TicketsPage: React.FC<{ audience: TicketAudience }> = ({ audience }) => {
  const navigate = useNavigate();
  const base = TICKETS_BASE[audience];
  // Atalho do painel: ?situacao=1 já abre filtrando
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(() => searchParams.get('situacao') ?? '');
  const [type, setType] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResult<TicketListItem> | null>(null);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState(false);

  const query = `${page}|${status}|${type}|${schoolId}`;

  const fetchTickets = useCallback(async () => {
    try {
      setData(
        await ticketApi.list(page, PAGE_SIZE, {
          status: status ? (Number(status) as TicketStatus) : undefined,
          type: type ? (Number(type) as TicketType) : undefined,
          schoolId: schoolId || undefined,
        }),
      );
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoadedQuery(`${page}|${status}|${type}|${schoolId}`);
    }
  }, [page, status, type, schoolId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (audience !== 'admin') return;
    listAll<School>((p, size) => schoolApi.list(p, size))
      .then(res => setSchools([...res.items].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setSchools([]));
  }, [audience]);

  const filterChange = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    set(e.target.value);
    setPage(1);
  };

  const loading = loadedQuery !== query;
  const tickets = data?.items ?? [];
  const filtering = status !== '' || type !== '' || schoolId !== '';

  return (
    <>
      <PageHeader
        title={COPY[audience].title}
        description={COPY[audience].description}
        actions={
          audience === 'director' && (
            <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setOpening(true)}>
              Abrir ticket
            </Button>
          )
        }
      />

      <FilterBar>
        <SelectField label="Situação" value={status} onChange={filterChange(setStatus)}>
          <option value="">Todas</option>
          {Object.entries(TICKET_STATUS_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Tipo" value={type} onChange={filterChange(setType)}>
          <option value="">Todos</option>
          {Object.entries(TICKET_TYPE_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </SelectField>
        {audience === 'admin' && schools.length > 0 && (
          <SelectField label="Escola" value={schoolId} onChange={filterChange(setSchoolId)}>
            <option value="">Todas</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        )}
      </FilterBar>

      {error && <LoadError message="Não foi possível carregar os tickets." onRetry={fetchTickets} />}

      {loading && !data ? (
        <BlockLoader label="Carregando tickets…" rows={6} />
      ) : (
        <section aria-label={COPY[audience].title} aria-busy={loading} className="overflow-hidden rounded-lg border border-rule bg-surface">
          {data && (
            <p className="border-b border-rule px-5 py-2.5 text-sm text-ink-3" aria-live="polite">
              {loading ? 'Carregando…' : plural(data.totalCount, 'ticket', 'tickets')}
              {filtering && !loading ? ' com estes filtros' : ''}
            </p>
          )}
          {tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title={filtering ? 'Nenhum ticket com estes filtros' : 'Nenhum ticket ainda'} compact>
              {filtering
                ? 'Ajuste a situação ou o tipo.'
                : audience === 'director'
                  ? 'Use “Abrir ticket” para falar com a administração do sistema.'
                  : 'Quando a direção de uma escola abrir um ticket, ele aparece aqui.'}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-rule">
              {tickets.map(ticket => (
                <li key={ticket.id}>
                  <Link
                    to={`${base}/${ticket.id}`}
                    className="block px-5 py-3 hover:bg-sunken focus-visible:bg-sunken"
                  >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Stamp tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Stamp>
                      <Stamp>{TICKET_TYPE_LABEL[ticket.type]}</Stamp>
                      <span className="font-semibold text-ink">{ticket.title}</span>
                    </span>
                    <span className="mt-1 block text-sm text-ink-3">
                      {audience === 'admin' && <>{ticket.schoolName} · </>}
                      aberto por {ticket.openedByName} em <span className="figures">{formatDateTime(ticket.createdAt)}</span> ·{' '}
                      {plural(ticket.messageCount, 'resposta', 'respostas')} · última atividade{' '}
                      <span className="figures">{formatDateTime(ticket.lastActivityAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {data && data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} totalCount={data.totalCount} pageSize={PAGE_SIZE} noun="tickets" onPage={setPage} />
          )}
        </section>
      )}

      {opening && (
        <OpenTicketDialog
          onClose={() => setOpening(false)}
          onOpened={id => {
            setOpening(false);
            navigate(`${base}/${id}`);
          }}
        />
      )}
    </>
  );
};

const OpenTicketDialog: React.FC<{ onClose: () => void; onOpened: (id: string) => void }> = ({ onClose, onOpened }) => {
  const [form, setForm] = useState({ type: String(TicketTypes.BUG), title: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleError = form.title.trim().length > 0 && form.title.trim().length < 5 ? 'Escreva um título com pelo menos 5 caracteres.' : undefined;
  const descriptionError =
    form.description.trim().length > 0 && form.description.trim().length < 10 ? 'Conte com pelo menos 10 caracteres o que aconteceu.' : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (titleError || descriptionError) {
      setError('Corrija os campos destacados.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const ticket = await ticketApi.create({
        type: Number(form.type) as TicketType,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      onOpened(ticket.id);
    } catch (err) {
      setError(errorMessage(err, 'Erro ao abrir o ticket.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title="Abrir ticket" onClose={onClose} onSubmit={handleSubmit} saving={saving} submitLabel="Abrir ticket" savingLabel="Abrindo…">
      {error && <Alert tone="error">{error}</Alert>}
      <SelectField label="Tipo" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
        {Object.entries(TICKET_TYPE_LABEL).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Título"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        error={titleError}
        maxLength={200}
        placeholder="Ex.: A chamada do 6º A não salva"
        required
      />
      <TextAreaField
        label="Descrição"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        error={descriptionError}
        hint="O que você fez, o que esperava e o que aconteceu. Não inclua dados de alunos."
        maxLength={4000}
        required
      />
    </FormDialog>
  );
};
