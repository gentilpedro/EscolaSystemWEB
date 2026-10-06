import React, { useState } from 'react';
import { useAuth } from '../../contexts/auth';
import { authApi, API_BASE_URL } from '../../services/api';
import { Alert, Button, NewPasswordField, PageHeader, Panel, ReadOnlyField, TextField, errorMessage } from '../../components/ui';
import { passwordIssues } from '../../lib/password';
import { SESSION_ROLE_LABEL } from '../../lib/school';

const EMPTY_FORM = { current: '', newPassword: '', confirm: '' };

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState(EMPTY_FORM);
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const mismatch = passwordForm.confirm !== '' && passwordForm.newPassword !== passwordForm.confirm;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPwStatus({ type: 'error', msg: 'As senhas novas não coincidem.' });
      return;
    }
    if (passwordIssues(passwordForm.newPassword).length > 0) {
      setPwStatus({ type: 'error', msg: 'A nova senha não atende à regra: veja o que falta abaixo do campo.' });
      return;
    }
    setSaving(true);
    setPwStatus(null);
    try {
      await authApi.changePassword(passwordForm.current, passwordForm.newPassword);
      setPwStatus({ type: 'success', msg: 'Senha trocada. Nos outros navegadores e aparelhos, será preciso entrar de novo.' });
      setPasswordForm(EMPTY_FORM);
    } catch (err) {
      setPwStatus({ type: 'error', msg: errorMessage(err, 'Erro ao trocar a senha.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Configurações" />

      <div className="max-w-3xl space-y-6">
        <Panel title="Meu perfil" titleId="perfil">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Nome">{user?.name}</ReadOnlyField>
            <ReadOnlyField label="E-mail">{user?.email}</ReadOnlyField>
            <ReadOnlyField label="Perfil">{user ? SESSION_ROLE_LABEL[user.role] ?? user.role : '—'}</ReadOnlyField>
          </div>
        </Panel>

        <Panel title="Trocar minha senha" titleId="senha">
          {pwStatus && (
            <Alert tone={pwStatus.type} className="mb-4">
              {pwStatus.msg}
            </Alert>
          )}
          <p className="mb-4 text-[0.9375rem] text-ink-2">
            Para redefinir a senha de outra pessoa, use a ação <strong className="text-ink">Redefinir senha</strong> na linha dela, em Usuários.
          </p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Campo oculto com o e-mail: o gerenciador de senhas do navegador sabe de qual conta é a troca */}
            <input type="email" autoComplete="username" value={user?.email ?? ''} readOnly hidden />
            <TextField
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              value={passwordForm.current}
              onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
              containerClassName="sm:max-w-[calc(50%-0.5rem)]"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NewPasswordField
                label="Nova senha"
                value={passwordForm.newPassword}
                onChange={v => setPasswordForm({ ...passwordForm, newPassword: v })}
              />
              <TextField
                label="Confirmar nova senha"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirm}
                onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                error={mismatch ? 'As senhas não coincidem.' : undefined}
                required
              />
            </div>
            <Button type="submit" loading={saving} loadingLabel="Salvando…">
              Trocar senha
            </Button>
          </form>
        </Panel>

        <Panel title="Informações do sistema" titleId="sistema" flush>
          <dl className="divide-y divide-rule text-[0.9375rem]">
            {[
              ['Sistema', 'EscolaSystem v1.0'],
              ['API', API_BASE_URL],
              ['Ambiente', import.meta.env.MODE],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-x-6 gap-y-1 px-5 py-3">
                <dt className="font-semibold text-ink-2">{k}</dt>
                <dd className="figures break-all text-sm text-ink-3">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
};
