import React, { useState } from 'react';
import { User, Lock, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ email: user?.email ?? '', newPassword: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPwStatus({ type: 'error', msg: 'As senhas não coincidem.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPwStatus({ type: 'error', msg: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    setSaving(true);
    setPwStatus(null);
    try {
      await authApi.resetPassword(passwordForm.email, passwordForm.newPassword);
      setPwStatus({ type: 'success', msg: 'Senha alterada com sucesso.' });
      setPasswordForm(prev => ({ ...prev, newPassword: '', confirm: '' }));
    } catch (err: any) {
      setPwStatus({ type: 'error', msg: err.message ?? 'Erro ao alterar senha.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Configurações</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Meu Perfil</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">E-mail</label>
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Perfil</label>
            <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Alterar Senha</h2>
        </div>

        {pwStatus && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${pwStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {pwStatus.msg}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail para confirmar</label>
            <input
              type="email"
              value={passwordForm.email}
              onChange={e => setPasswordForm({ ...passwordForm, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
              placeholder="Repita a nova senha"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
          >
            {saving ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Informações do Sistema</h2>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium">Sistema</span>
            <span>EscolaSystem v1.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium">API</span>
            <span>{import.meta.env.VITE_API_URL ?? 'http://localhost:5130/api'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="font-medium">Ambiente</span>
            <span>{import.meta.env.MODE}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
