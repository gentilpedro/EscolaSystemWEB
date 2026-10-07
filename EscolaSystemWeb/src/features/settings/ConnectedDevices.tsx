import React, { useCallback, useEffect, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import type { SessionItem } from '../../types';
import { authApi } from '../../services/api';
import { Button, EmptyState, LoadError, Panel, Stamp, errorMessage, useConfirm, useToast } from '../../components/ui';
import { formatDateTime } from '../../lib/format';

/** Aparelhos em que a conta está aberta, com a saída de um deles ou de todos os outros. */
export const ConnectedDevices: React.FC = () => {
  const confirm = useConfirm();
  const toast = useToast();
  const [sessions, setSessions] = useState<SessionItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setSessions(await authApi.sessions());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    load();
  }, [load]);

  const others = sessions?.filter(s => !s.isCurrent) ?? [];

  const signOut = async (session: SessionItem) => {
    const ok = await confirm({
      title: `Sair de ${session.device}?`,
      consequence: 'Esse aparelho volta para a tela de login. Para entrar de novo nele, basta a senha.',
      confirmLabel: 'Sair do aparelho',
      reversible: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await authApi.revokeSession(session.id);
      toast.success(`Você saiu de ${session.device}.`);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao sair do aparelho.'));
    } finally {
      setBusy(false);
    }
  };

  const signOutOthers = async () => {
    const ok = await confirm({
      title: 'Sair de todos os outros aparelhos?',
      consequence: `${others.length === 1 ? 'O outro aparelho volta' : `Os outros ${others.length} aparelhos voltam`} para a tela de login. Este continua conectado.`,
      confirmLabel: 'Sair dos outros',
      reversible: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await authApi.revokeOtherSessions();
      toast.success('Só este aparelho continua conectado.');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao sair dos outros aparelhos.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Aparelhos conectados"
      titleId="aparelhos"
      flush
      action={
        others.length > 0 && (
          <Button size="sm" variant="secondary" onClick={signOutOthers} disabled={busy}>
            Sair de todos os outros
          </Button>
        )
      }
    >
      {failed ? (
        <LoadError message="Não foi possível carregar os aparelhos conectados." onRetry={load} className="m-5" />
      ) : sessions === null ? (
        <p role="status" className="px-5 py-4 text-[0.9375rem] text-ink-3">
          Carregando aparelhos…
        </p>
      ) : sessions.length === 0 ? (
        <EmptyState icon={MonitorSmartphone} title="Nenhum aparelho conectado" compact />
      ) : (
        <ul className="divide-y divide-rule" aria-label="Aparelhos conectados">
          {sessions.map(session => (
            <li key={session.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  {session.device}
                  {session.isCurrent && <Stamp tone="lousa">Este aparelho</Stamp>}
                </p>
                <p className="text-sm text-ink-3">
                  Entrou em <span className="figures">{formatDateTime(session.createdAt)}</span> · último uso{' '}
                  <span className="figures">{formatDateTime(session.lastUsedAt)}</span>
                </p>
              </div>
              {!session.isCurrent && (
                <Button size="sm" variant="secondary" onClick={() => signOut(session)} disabled={busy}>
                  Sair deste aparelho<span className="sr-only"> ({session.device})</span>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
