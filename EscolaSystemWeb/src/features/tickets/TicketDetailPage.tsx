import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { TicketDetail, TicketStatus } from '../../types';
import { TicketStatus as Statuses } from '../../types';
import { ticketApi } from '../../services/api';
import { Alert, Button, LoadError, PageLoader, Panel, SelectField, Stamp, TextAreaField, errorMessage, useToast } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import { TICKETS_BASE, TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_TYPE_LABEL, type TicketAudience } from './labels';

/** Um ticket: a descrição, a conversa e a resposta. O admin também muda a situação. */
export const TicketDetailPage: React.FC<{ audience: TicketAudience }> = ({ audience }) => {
  const { id = '' } = useParams();
  const toast = useToast();
  const base = TICKETS_BASE[audience];
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ticketApi.get(id);
      setTicket(data);
      setStatus(String(data.status));
      setFailed(null);
    } catch (err) {
      setFailed(errorMessage(err, 'Não foi possível carregar o ticket.'));
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    load();
  }, [load]);

  const backLink = (
    <Link to={base} className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-lousa hover:underline sm:min-h-0">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {audience === 'admin' ? 'Voltar para Tickets' : 'Voltar para Suporte'}
    </Link>
  );

  if (failed) {
    return (
      <>
        {backLink}
        <LoadError message={failed} onRetry={load} />
      </>
    );
  }
  if (!ticket) return <PageLoader label="Carregando ticket…" />;

  const closed = ticket.status === Statuses.CLOSED;

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) {
      setReplyError('Escreva a resposta antes de enviar.');
      return;
    }
    setSending(true);
    setReplyError(null);
    try {
      const updated = await ticketApi.reply(ticket.id, reply.trim());
      setTicket(updated);
      setStatus(String(updated.status));
      setReply('');
      toast.success('Resposta enviada.');
    } catch (err) {
      setReplyError(errorMessage(err, 'Erro ao enviar a resposta.'));
    } finally {
      setSending(false);
    }
  };

  const saveStatus = async () => {
    setSavingStatus(true);
    try {
      const updated = await ticketApi.setStatus(ticket.id, Number(status) as TicketStatus);
      setTicket(updated);
      toast.success(`Ticket marcado como ${TICKET_STATUS_LABEL[updated.status].toLowerCase()}.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao mudar a situação.'));
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <>
      {backLink}
      <header className="mb-6 border-b border-rule pb-4">
        <p className="mb-2 flex flex-wrap items-center gap-2">
          <Stamp tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Stamp>
          <Stamp>{TICKET_TYPE_LABEL[ticket.type]}</Stamp>
        </p>
        <h1 className="text-[1.75rem] font-bold leading-tight text-ink text-balance">{ticket.title}</h1>
        <p className="mt-1 text-[0.9375rem] text-ink-3">
          {ticket.schoolName} · aberto por {ticket.openedByName} em <span className="figures">{formatDateTime(ticket.createdAt)}</span>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <div className="space-y-6">
          <Panel title="Descrição" titleId="descricao">
            <p className="whitespace-pre-wrap break-words text-[0.9375rem] text-ink-2">{ticket.description}</p>
          </Panel>

          <Panel title="Conversa" titleId="conversa" flush>
            {ticket.messages.length === 0 ? (
              <p className="px-5 py-4 text-[0.9375rem] text-ink-3">
                {audience === 'admin' ? 'Ninguém respondeu ainda.' : 'A administração ainda não respondeu.'}
              </p>
            ) : (
              <ol className="divide-y divide-rule" aria-label="Mensagens">
                {ticket.messages.map(message => (
                  <li key={message.id} className="px-5 py-3">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-ink">{message.authorName}</span>
                      {message.fromAdministration && <Stamp tone="lousa">Administração</Stamp>}
                      <time dateTime={message.createdAt} className="figures text-ink-3">
                        {formatDateTime(message.createdAt)}
                      </time>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-[0.9375rem] text-ink-2">{message.body}</p>
                  </li>
                ))}
              </ol>
            )}
            <div className="border-t border-rule px-5 py-4">
              {closed ? (
                <p className="text-[0.9375rem] text-ink-3">
                  Este ticket está fechado.{' '}
                  {audience === 'director' ? 'Se o problema continua, abra um novo ticket.' : 'Para responder, mude a situação antes.'}
                </p>
              ) : (
                <form onSubmit={sendReply} className="space-y-3">
                  {replyError && <Alert tone="error">{replyError}</Alert>}
                  <TextAreaField
                    label="Sua resposta"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    maxLength={4000}
                    hint={
                      audience === 'director' && ticket.status === Statuses.RESOLVED
                        ? 'Responder um ticket resolvido o reabre.'
                        : audience === 'admin' && ticket.status === Statuses.OPEN
                          ? 'Responder passa o ticket para “Em andamento”.'
                          : undefined
                    }
                  />
                  <Button type="submit" loading={sending} loadingLabel="Enviando…">
                    Enviar resposta
                  </Button>
                </form>
              )}
            </div>
          </Panel>
        </div>

        {audience === 'admin' && (
          <Panel title="Situação" titleId="situacao" className="self-start">
            <div className="space-y-3">
              <SelectField label="Situação do ticket" value={status} onChange={e => setStatus(e.target.value)}>
                {Object.entries(TICKET_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </SelectField>
              <Button variant="secondary" onClick={saveStatus} loading={savingStatus} loadingLabel="Salvando…" disabled={status === String(ticket.status)}>
                Salvar situação
              </Button>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
};
