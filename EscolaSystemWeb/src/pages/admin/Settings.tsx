import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi, API_BASE_URL } from '../../services/api';
import { Alert, Button, NewPasswordField, PageHeader, Panel, ReadOnlyField, TextField, errorMessage } from '../../components/ui';
import { passwordIssues } from '../../lib/password';
import { SESSION_ROLE_LABEL } from '../../lib/school';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ email: user?.email ?? '', newPassword: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const mismatch = passwordForm.confirm !== '' && passwordForm.newPassword !== passwordForm.confirm;

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPwStatus({ type: 'error', msg: 'As senhas não coincidem.' });
      return;
    }
    if (passwordIssues(passwordForm.newPassword).length > 0) {
      setPwStatus({ type: 'error', msg: 'A nova senha não atende à regra: veja o que falta abaixo do campo.' });
      return;
    }
    setSaving(true);
    setPwStatus(null);
    try {
      await authApi.resetPassword(passwordForm.email, passwordForm.newPassword);
      setPwStatus({ type: 'success', msg: 'Senha redefinida. A conta já entra com a nova senha.' });
      setPasswordForm(prev => ({ ...prev, newPassword: '', confirm: '' }));
    } catch (err) {
      setPwStatus({ type: 'error', msg: errorMessage(err, 'Erro ao alterar senha.') });
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

        <Panel title="Redefinir senha" titleId="senha">
          {pwStatus && (
            <Alert tone={pwStatus.type} className="mb-4">
              {pwStatus.msg}
            </Alert>
          )}
          <p className="mb-4 text-[0.9375rem] text-ink-2">
            Define uma nova senha para a conta do e-mail informado. O seu e-mail já vem preenchido; troque-o para redefinir a senha de outro usuário.
          </p>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <TextField
              label="E-mail da conta"
              type="email"
              autoComplete="username"
              value={passwordForm.email}
              onChange={e => setPasswordForm({ ...passwordForm, email: e.target.value })}
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
              Redefinir senha
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
