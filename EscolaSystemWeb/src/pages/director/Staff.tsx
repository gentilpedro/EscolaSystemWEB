import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Link2, Unlink } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { UserListItem, ClassItem, PagedResult } from '../../types';
import { ROLES } from '../../types';
import { userApi, classApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const STAFF_ROLES = ROLES.filter(r => r.name === 'Teacher' || r.name === 'Director' || r.name === 'Orientador');

const ROLE_COLORS: Record<string, string> = {
  Director: 'bg-purple-100 text-purple-800',
  Teacher: 'bg-blue-100 text-blue-800',
  Orientador: 'bg-teal-100 text-teal-800',
};
const ROLE_LABELS: Record<string, string> = {
  Director: 'Diretor',
  Teacher: 'Professor',
  Orientador: 'Orientador',
};

export const DirectorStaff: React.FC = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserListItem | null>(null);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: PagedResult<UserListItem> = await userApi.list(1, 100);
      setStaff(data.items.filter(u => u.role === 'Teacher' || u.role === 'Director' || u.role === 'Orientador'));
    } catch {
      setError('Erro ao carregar funcionários.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este funcionário?')) return;
    try {
      await userApi.delete(id);
      fetchStaff();
    } catch {
      alert('Erro ao excluir funcionário.');
    }
  };

  const filtered = staff.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Funcionários</h1>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Funcionário</span>
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Pesquisar por nome ou e-mail..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">E-mail</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Cargo</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum funcionário encontrado</td></tr>
            ) : filtered.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-800'}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center space-x-3">
                    {(user.role === 'Teacher' || user.role === 'Orientador') && (
                      <button
                        onClick={() => setAssigningUser(user)}
                        title="Vincular a turma"
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <Link2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => { setEditingUser(user); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <StaffModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={() => { fetchStaff(); setShowModal(false); }}
          directorSchoolId={user?.schoolId}
        />
      )}
      {assigningUser && (
        <AssignClassModal
          user={assigningUser}
          onClose={() => setAssigningUser(null)}
        />
      )}
    </div>
  );
};

const StaffModal: React.FC<{ user: UserListItem | null; onClose: () => void; onSave: () => void; directorSchoolId?: string }> = ({ user, onClose, onSave, directorSchoolId }) => {
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    roleId: ROLES.find(r => r.name === user?.role)?.id ?? 3,
    isActive: user?.isActive ?? true,
    cpf: (user as any)?.cpf ?? '',
    phone: (user as any)?.phone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrientador = ROLES.find(r => r.id === formData.roleId)?.name === 'Orientador';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (user) {
        await userApi.update(user.id, {
          name: formData.name,
          email: formData.email,
          roleId: formData.roleId,
          schoolId: user.schoolId ?? null,
          isActive: formData.isActive,
          cpf: isOrientador ? formData.cpf || null : null,
          phone: isOrientador ? formData.phone || null : null,
        });
      } else {
        await userApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          schoolId: directorSchoolId ?? null,
          cpf: isOrientador ? formData.cpf || null : null,
          phone: isOrientador ? formData.phone || null : null,
        });
      }
      onSave();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{user ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" required />
          </div>
          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" required minLength={6} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <select value={formData.roleId} onChange={e => setFormData({ ...formData, roleId: Number(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white" required>
              {STAFF_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          {isOrientador && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input type="text" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="(00) 00000-0000" />
              </div>
            </>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Funcionário ativo</label>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignClassModal: React.FC<{ user: UserListItem; onClose: () => void }> = ({ user, onClose }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classApi.list(1, 100).then((data: any) => setClasses(data.items ?? [])).catch(() => {});
  }, []);

  const isOrientador = user.role === 'Orientador';

  const handleAssign = async () => {
    if (!selectedClass) return;
    setSaving(true);
    setError(null);
    try {
      if (isOrientador) {
        await userApi.assignOrientadorClass(user.id, selectedClass);
        setSuccess('Orientador vinculado à turma com sucesso.');
      } else {
        await userApi.assignClass(user.id, selectedClass);
        setSuccess('Professor vinculado à turma com sucesso.');
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao vincular.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!selectedClass) return;
    setSaving(true);
    setError(null);
    try {
      if (isOrientador) {
        await userApi.unassignOrientadorClass(user.id, selectedClass);
        setSuccess('Orientador desvinculado da turma com sucesso.');
      } else {
        await userApi.unassignClass(user.id, selectedClass);
        setSuccess('Professor desvinculado da turma com sucesso.');
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao desvincular.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Vincular Turma</h2>
        <p className="text-sm text-gray-500 mb-6">Professor: <strong>{user.name}</strong></p>
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Selecione a Turma</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white">
            <option value="">Selecione...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors">Fechar</button>
          <button onClick={handleUnassign} disabled={saving || !selectedClass} className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
            <Unlink className="w-4 h-4" /> Desvincular
          </button>
          <button onClick={handleAssign} disabled={saving || !selectedClass} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
            <Link2 className="w-4 h-4" /> Vincular
          </button>
        </div>
      </div>
    </div>
  );
};
