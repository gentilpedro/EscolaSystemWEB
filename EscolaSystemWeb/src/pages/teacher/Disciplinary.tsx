import React, { useState, useEffect } from 'react';
import { Plus, Eye } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { DisciplinaryCall, StudentItem, ClassItem, PagedResult } from '../../types';
import { disciplinaryApi, studentApi, classApi } from '../../services/api';

const STATUS_LABELS: Record<number, string> = { 1: 'Pendente', 2: 'Aprovado', 3: 'Rejeitado' };
const STATUS_COLORS: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-red-100 text-red-800',
};

export const TeacherDisciplinary: React.FC = () => {
  const [calls, setCalls] = useState<DisciplinaryCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<DisciplinaryCall | null>(null);

  useEffect(() => { fetchCalls(); }, []);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await disciplinaryApi.list() as PagedResult<DisciplinaryCall>;
      setCalls(data.items);
    } catch {
      setError('Erro ao carregar chamados.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Chamados Disciplinares</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Chamado</span>
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aluno</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Descrição</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {calls.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum chamado registrado.</td></tr>
            ) : calls.map(call => (
              <tr key={call.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{call.studentName}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{call.description}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{new Date(call.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[call.status]}`}>
                    {STATUS_LABELS[call.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => setSelectedCall(call)} className="text-gray-500 hover:text-gray-700 transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateCallModal
          onClose={() => setShowModal(false)}
          onSave={() => { fetchCalls(); setShowModal(false); }}
        />
      )}
      {selectedCall && (
        <DetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </div>
  );
};

const CreateCallModal: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({ studentId: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classApi.list(1, 100).then((data: any) => {
      const items = (data as PagedResult<ClassItem>).items;
      setClasses(items);
      if (items.length > 0) setSelectedClass(items[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setFormData(prev => ({ ...prev, studentId: '' }));
    studentApi.list(1, 200, selectedClass).then((data: any) => {
      setStudents((data as PagedResult<StudentItem>).items);
    }).catch(() => setStudents([]));
  }, [selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await disciplinaryApi.create({ studentId: formData.studentId, description: formData.description });
      onSave();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao criar chamado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Novo Chamado Disciplinar</h2>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aluno</label>
            <select
              value={formData.studentId}
              onChange={e => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
              required
            >
              <option value="">Selecione o aluno...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da ocorrência</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              placeholder="Descreva detalhadamente a ocorrência disciplinar..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors">
              {saving ? 'Enviando...' : 'Criar Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetailModal: React.FC<{ call: DisciplinaryCall; onClose: () => void }> = ({ call, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Detalhes do Chamado</h2>
      <dl className="space-y-3 text-sm">
        <div><dt className="font-medium text-gray-500">Aluno</dt><dd className="text-gray-800">{call.studentName}</dd></div>
        <div><dt className="font-medium text-gray-500">Descrição</dt><dd className="text-gray-800 whitespace-pre-wrap">{call.description}</dd></div>
        <div>
          <dt className="font-medium text-gray-500">Status</dt>
          <dd><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[call.status]}`}>{STATUS_LABELS[call.status]}</span></dd>
        </div>
        <div><dt className="font-medium text-gray-500">Criado em</dt><dd className="text-gray-800">{new Date(call.createdAt).toLocaleString('pt-BR')}</dd></div>
        {call.resolvedByName && <div><dt className="font-medium text-gray-500">Resolvido por</dt><dd className="text-gray-800">{call.resolvedByName}</dd></div>}
        {call.resolution && <div><dt className="font-medium text-gray-500">Resolução</dt><dd className="text-gray-800 whitespace-pre-wrap">{call.resolution}</dd></div>}
      </dl>
      <button onClick={onClose} className="mt-6 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors">Fechar</button>
    </div>
  </div>
);
