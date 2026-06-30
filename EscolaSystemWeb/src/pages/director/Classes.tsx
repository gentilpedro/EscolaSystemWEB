import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { ClassItem, PagedResult } from '../../types';
import { classApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const DirectorClasses: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: PagedResult<ClassItem> = await classApi.list(1, 100);
      setClasses(data.items);
    } catch {
      setError('Erro ao carregar turmas.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta turma?')) return;
    try {
      await classApi.delete(id);
      fetchClasses();
    } catch {
      alert('Erro ao excluir turma.');
    }
  };

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.year).includes(searchTerm)
  );

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Turmas</h1>
        <button
          onClick={() => { setEditingClass(null); setShowModal(true); }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Turma</span>
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Pesquisar por nome ou ano..."
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ano</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Escola</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhuma turma encontrada</td></tr>
            ) : filtered.map(cls => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{cls.name}</td>
                <td className="px-6 py-4 text-gray-600">{cls.year}</td>
                <td className="px-6 py-4 text-gray-600">{cls.schoolName}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cls.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {cls.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center space-x-3">
                    <button onClick={() => { setEditingClass(cls); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(cls.id)} className="text-red-600 hover:text-red-800 transition-colors">
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
        <ClassModal
          cls={editingClass}
          directorSchoolId={user?.schoolId}
          onClose={() => setShowModal(false)}
          onSave={() => { fetchClasses(); setShowModal(false); }}
        />
      )}
    </div>
  );
};

const ClassModal: React.FC<{ cls: ClassItem | null; directorSchoolId?: string; onClose: () => void; onSave: () => void }> = ({ cls, directorSchoolId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: cls?.name ?? '',
    year: cls?.year ?? new Date().getFullYear(),
    schoolId: cls?.schoolId ?? '',
    isActive: cls?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (cls) {
        await classApi.update(cls.id, { name: formData.name, year: formData.year, schoolId: cls.schoolId, isActive: formData.isActive });
      } else {
        await classApi.create({ name: formData.name, year: formData.year, schoolId: directorSchoolId ?? undefined });
      }
      onSave();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar turma.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{cls ? 'Editar Turma' : 'Nova Turma'}</h2>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" placeholder="Ex: 6º Ano A" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano Letivo</label>
            <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" min={2020} max={2100} required />
          </div>
          {cls && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Turma ativa</label>
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
