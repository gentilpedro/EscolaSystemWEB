import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { StudentItem, ClassItem, PagedResult } from '../../types';
import { studentApi, classApi } from '../../services/api';

export const OrientadorStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
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
    fetchAll();
  }, []);

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
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="mb-6 flex gap-4">
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
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">E-mail</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Matrícula</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Turma</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum aluno encontrado</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                <td className="px-6 py-4 text-gray-600">{s.email}</td>
                <td className="px-6 py-4 text-gray-600">{s.registration}</td>
                <td className="px-6 py-4 text-gray-600">{s.className}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isActive ? 'Ativo' : 'Inativo'}
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
