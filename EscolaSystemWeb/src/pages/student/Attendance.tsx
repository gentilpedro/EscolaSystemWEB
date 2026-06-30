import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { AttendanceItem, PagedResult } from '../../types';
import { attendanceApi } from '../../services/api';

export const StudentAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    attendanceApi.list(1, 500)
      .then((data: any) => {
        const items = (data as PagedResult<AttendanceItem>).items;
        setRecords(items.sort((a, b) => b.date.localeCompare(a.date)));
      })
      .catch(() => setError('Erro ao carregar frequência.'))
      .finally(() => setLoading(false));
  }, []);

  const classes = [...new Set(records.map(r => r.className))].sort();
  const filtered = classFilter ? records.filter(r => r.className === classFilter) : records;

  const total    = filtered.length;
  const present  = filtered.filter(r => r.isPresent).length;
  const absent   = total - present;
  const rate     = total > 0 ? ((present / total) * 100).toFixed(1) : '—';

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Minha Frequência</h1>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <p className="text-sm text-gray-500">Presenças</p>
          <p className="text-3xl font-bold text-green-600">{present}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <p className="text-sm text-gray-500">Faltas</p>
          <p className={`text-3xl font-bold ${absent > 10 ? 'text-red-600' : 'text-orange-500'}`}>{absent}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <p className="text-sm text-gray-500">% Presença</p>
          <p className={`text-3xl font-bold ${Number(rate) >= 75 ? 'text-green-600' : 'text-red-600'}`}>{rate}{rate !== '—' ? '%' : ''}</p>
        </div>
      </div>

      {absent > 0 && Number(rate) < 75 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
          ⚠️ Atenção: sua taxa de presença está abaixo de 75%. Isso pode impactar sua aprovação.
        </div>
      )}

      {classes.length > 1 && (
        <div className="mb-6">
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="">Todas as turmas</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Turma</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Observação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className={`hover:bg-gray-50 ${!r.isPresent ? 'bg-red-50/30' : ''}`}>
                <td className="px-6 py-4 font-medium text-gray-800">
                  {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-gray-600">{r.className}</td>
                <td className="px-6 py-4 text-center">
                  {r.isPresent ? (
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Presente</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Ausente</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{r.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
