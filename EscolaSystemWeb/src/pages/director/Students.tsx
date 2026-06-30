import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { StudentItem, ClassItem, PagedResult } from '../../types';
import { studentApi, classApi } from '../../services/api';

export const DirectorStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsData, classesData] = await Promise.all([
        studentApi.list(1, 200) as Promise<PagedResult<StudentItem>>,
        classApi.list(1, 100) as Promise<PagedResult<ClassItem>>,
      ]);
      setStudents(studentsData.items);
      setClasses(classesData.items);
    } catch {
      setError('Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este aluno?')) return;
    try {
      await studentApi.delete(id);
      fetchAll();
    } catch {
      alert('Erro ao excluir aluno.');
    }
  };

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registration.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter ? s.classId === classFilter : true;
    return matchSearch && matchClass;
  });

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Alunos</h1>
        <button
          onClick={() => { setEditingStudent(null); setShowModal(true); }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Aluno</span>
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, e-mail ou matrícula..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
        >
          <option value="">Todas as turmas</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Matrícula</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">E-mail</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Turma</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nascimento</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Nenhum aluno encontrado</td></tr>
            ) : filtered.map(student => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{student.name}</td>
                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{student.registration}</td>
                <td className="px-6 py-4 text-gray-600">{student.email}</td>
                <td className="px-6 py-4 text-gray-600">{student.className}</td>
                <td className="px-6 py-4 text-gray-600">{student.birthDate}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center space-x-3">
                    <button onClick={() => { setEditingStudent(student); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-800 transition-colors">
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
        <StudentModal
          student={editingStudent}
          classes={classes}
          onClose={() => setShowModal(false)}
          onSave={() => { fetchAll(); setShowModal(false); }}
        />
      )}
    </div>
  );
};

const StudentModal: React.FC<{ student: StudentItem | null; classes: ClassItem[]; onClose: () => void; onSave: () => void }> = ({ student, classes, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: student?.name ?? '',
    email: student?.email ?? '',
    registration: student?.registration ?? '',
    birthDate: student?.birthDate ?? '',
    classId: student?.classId ?? '',
    isActive: student?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (student) {
        await studentApi.update(student.id, {
          name: formData.name,
          email: formData.email,
          registration: formData.registration,
          birthDate: formData.birthDate,
          classId: formData.classId,
          isActive: formData.isActive,
        });
      } else {
        await studentApi.create({
          name: formData.name,
          email: formData.email,
          registration: formData.registration,
          birthDate: formData.birthDate,
          classId: formData.classId,
        });
      }
      onSave();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar aluno.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{student ? 'Editar Aluno' : 'Novo Aluno'}</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
            <input type="text" value={formData.registration} onChange={e => setFormData({ ...formData, registration: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" required placeholder="Ex: 2024001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
            <input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
            <select value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white" required>
              <option value="">Selecione a turma...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
            </select>
          </div>
          {student && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Aluno ativo</label>
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
