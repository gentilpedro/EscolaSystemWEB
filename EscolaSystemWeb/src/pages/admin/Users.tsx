import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, UserCheck, UserX } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { UserListItem, StudentItem, PagedResult } from '../../types';
import { ROLES } from '../../types';
import { userApi, schoolApi, studentApi } from '../../services/api';

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-red-100 text-red-800',
  Director: 'bg-purple-100 text-purple-800',
  Teacher: 'bg-blue-100 text-blue-800',
  Student: 'bg-green-100 text-green-800',
  Parent: 'bg-yellow-100 text-yellow-800',
};

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Administrador',
  Director: 'Diretor',
  Teacher: 'Professor',
  Student: 'Aluno',
  Parent: 'Responsável',
};

export const AdminUsers: React.FC = () => {
  const [pagedData, setPagedData] = useState<PagedResult<UserListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: PagedResult<UserListItem> = await userApi.list(page, 15);
      setPagedData(data);
    } catch (err) {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await userApi.delete(id);
      fetchUsers();
    } catch {
      alert('Erro ao excluir usuário.');
    }
  };

  const handleToggleActive = async (user: UserListItem) => {
    try {
      await userApi.update(user.id, {
        name: user.name,
        email: user.email,
        roleId: ROLES.find(r => r.name === user.role)?.id ?? 3,
        schoolId: user.schoolId ?? null,
        isActive: !user.isActive,
      });
      fetchUsers();
    } catch {
      alert('Erro ao atualizar usuário.');
    }
  };

  const filteredUsers = (pagedData?.items ?? []).filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Usuários</h1>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou e-mail..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
        >
          <option value="">Todos os perfis</option>
          {ROLES.map(r => (
            <option key={r.id} value={r.name}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">E-mail</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Perfil</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Escola</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-800'}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.schoolName ?? '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => handleToggleActive(user)}
                        title={user.isActive ? 'Desativar' : 'Ativar'}
                        className={`transition-colors ${user.isActive ? 'text-yellow-500 hover:text-yellow-700' : 'text-green-500 hover:text-green-700'}`}
                      >
                        {user.isActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => { setEditingUser(user); setShowModal(true); }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagedData && pagedData.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Mostrando {(page - 1) * 15 + 1}–{Math.min(page * 15, pagedData.totalCount)} de {pagedData.totalCount} usuários
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              {page} / {pagedData.totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === pagedData.totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={() => { fetchUsers(); setShowModal(false); }}
        />
      )}
    </div>
  );
};

interface UserModalProps {
  user: UserListItem | null;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    roleId: ROLES.find(r => r.name === user?.role)?.id ?? 3,
    schoolId: user?.schoolId ?? '',
    studentId: '',
    isActive: user?.isActive ?? true,
  });
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    schoolApi.list(1, 100).then((data: any) => setSchools(data.items ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.roleId === 4) {
      studentApi.list(1, 500).then((data: any) => setStudents(data.items ?? [])).catch(() => {});
    }
  }, [formData.roleId]);

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
          schoolId: formData.schoolId || null,
          isActive: formData.isActive,
        });
      } else {
        await userApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          schoolId: formData.schoolId || null,
          studentId: formData.roleId === 4 ? (formData.studentId || null) : null,
        });
      }
      onSave();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>

            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required={!user}
                  minLength={6}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
              <select
                value={formData.roleId}
                onChange={e => setFormData({ ...formData, roleId: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                required
              >
                {ROLES.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            {formData.roleId === 4 && !user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aluno vinculado <span className="text-red-500">*</span></label>
                <select
                  value={formData.studentId}
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                  required={formData.roleId === 4}
                >
                  <option value="">Selecione o aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.className}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.roleId !== 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Escola {!user && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={formData.schoolId}
                  onChange={e => setFormData({ ...formData, schoolId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
                  required={!user && formData.roleId !== 1}
                >
                  <option value="">Selecione a escola...</option>
                  {schools.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Usuário ativo</label>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
