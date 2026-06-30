import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { ClassItem, AttendanceItem, PagedResult } from '../../types';
import { classApi, attendanceApi } from '../../services/api';

export const OrientadorAttendance: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
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
    fetchAttendance();
  }, [selectedClass, selectedDate]);

  const fetchAttendance = async () => {
    try {
      const data = await attendanceApi.list(
        1, 200,
        selectedClass || undefined,
        undefined,
        selectedDate || undefined
      ) as PagedResult<AttendanceItem>;
      setAttendance(data.items);
    } catch {
      setAttendance([]);
    }
  };

  const filtered = attendance.filter(a =>
    a.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Faltas</h1>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar aluno..."
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
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aluno</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Turma</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Presença</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum registro encontrado</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{a.studentName}</td>
                <td className="px-6 py-4 text-gray-600">{a.className}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(a.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${a.isPresent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {a.isPresent ? 'Presente' : 'Ausente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{a.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
