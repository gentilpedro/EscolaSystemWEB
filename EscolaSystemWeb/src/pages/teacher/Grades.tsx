import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { ClassItem, StudentItem, GradeItem, PagedResult } from '../../types';
import { classApi, studentApi, gradeApi } from '../../services/api';

const PERIODS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre', 'Recuperação', 'Final'];

export const TeacherGrades: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeItem | null>(null);

  useEffect(() => {
    classApi.list(1, 100)
      .then((data: any) => {
        const items = (data as PagedResult<ClassItem>).items;
        setClasses(items);
        if (items.length > 0) setSelectedClass(items[0].id);
      })
      .catch(() => setError('Erro ao carregar turmas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    fetchClassData();
  }, [selectedClass]);

  const fetchClassData = async () => {
    if (!selectedClass) return;
    setLoadingData(true);
    setError(null);
    try {
      const [studentsData, gradesData] = await Promise.all([
        studentApi.list(1, 200, selectedClass) as Promise<PagedResult<StudentItem>>,
        gradeApi.list(1, 500, selectedClass) as Promise<PagedResult<GradeItem>>,
      ]);
      setStudents(studentsData.items);
      setGrades(gradesData.items);
    } catch {
      setError('Erro ao carregar dados da turma.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta nota?')) return;
    try {
      await gradeApi.delete(id);
      setGrades(prev => prev.filter(g => g.id !== id));
    } catch {
      alert('Erro ao excluir nota.');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Notas</h1>
        <button
          onClick={() => { setEditingGrade(null); setShowModal(true); }}
          disabled={!selectedClass || students.length === 0}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Lançar Nota</span>
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {/* Class selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Turma</label>
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white w-64"
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
        </select>
      </div>

      {loadingData ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aluno</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Disciplina</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Período</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Nota</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Nenhuma nota lançada para esta turma.
                  </td>
                </tr>
              ) : (
                grades.map(grade => (
                  <tr key={grade.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{grade.studentName}</td>
                    <td className="px-6 py-4 text-gray-600">{grade.subject}</td>
                    <td className="px-6 py-4 text-gray-600">{grade.period}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-lg font-bold ${grade.value >= 7 ? 'text-green-600' : grade.value >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {grade.value.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => { setEditingGrade(grade); setShowModal(true); }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(grade.id)} className="text-red-600 hover:text-red-800 transition-colors">
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
      )}

      {showModal && (
        <GradeModal
          grade={editingGrade}
          classId={selectedClass}
          students={students}
          onClose={() => setShowModal(false)}
          onSave={() => { fetchClassData(); setShowModal(false); }}
        />
      )}
    </div>
  );
};

interface GradeModalProps {
  grade: GradeItem | null;
  classId: string;
  students: StudentItem[];
  onClose: () => void;
  onSave: () => void;
}

const GradeModal: React.FC<GradeModalProps> = ({ grade, classId, students, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    studentId: grade?.studentId ?? '',
    subject: grade?.subject ?? '',
    period: grade?.period ?? PERIODS[0],
    value: grade?.value ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.value < 0 || formData.value > 10) {
      setError('A nota deve ser entre 0 e 10.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (grade) {
        await gradeApi.update(grade.id, { subject: formData.subject, value: formData.value, period: formData.period });
      } else {
        await gradeApi.create({ studentId: formData.studentId, classId, subject: formData.subject, value: formData.value, period: formData.period });
      }
      onSave();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar nota.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{grade ? 'Editar Nota' : 'Lançar Nota'}</h2>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!grade && (
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
          )}
          {grade && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aluno</label>
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-800">{grade.studentName}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
            <input
              type="text"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Ex: Matemática"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <select
              value={formData.period}
              onChange={e => setFormData({ ...formData, period: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
              required
            >
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota (0–10)</label>
            <input
              type="number"
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              min={0} max={10} step={0.1} required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
