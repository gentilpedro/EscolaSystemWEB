import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { ClassItem, GradeItem, PagedResult } from '../../types';
import { classApi, gradeApi } from '../../services/api';

export const OrientadorGrades: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    classApi.list(1, 100)
      .then((data: any) => setClasses((data as PagedResult<ClassItem>).items))
      .catch(() => setError('Erro ao carregar turmas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [selectedClass]);

  const fetchGrades = async () => {
    try {
      const data = await gradeApi.list(1, 200, selectedClass || undefined) as PagedResult<GradeItem>;
      setGrades(data.items);
    } catch {
      setGrades([]);
    }
  };

  const filtered = grades.filter(g =>
    g.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Notas</h1>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar aluno ou disciplina..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
        >
          <option value="">Todas as turmas</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aluno</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Turma</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Disciplina</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Período</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhuma nota encontrada</td></tr>
            ) : filtered.map(g => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{g.studentName}</td>
                <td className="px-6 py-4 text-gray-600">{g.className}</td>
                <td className="px-6 py-4 text-gray-600">{g.subject}</td>
                <td className="px-6 py-4 text-gray-600">{g.period}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${g.value >= 6 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {g.value.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
