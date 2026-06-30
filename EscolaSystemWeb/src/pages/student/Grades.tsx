import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Loading';
import type { GradeItem, PagedResult } from '../../types';
import { gradeApi } from '../../services/api';

const GRADE_COLOR = (v: number) => v >= 7 ? 'text-green-600' : v >= 5 ? 'text-yellow-600' : 'text-red-600';
const GRADE_BG = (v: number) => v >= 7 ? 'bg-green-50 border-green-200' : v >= 5 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

export const StudentGrades: React.FC = () => {
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState('');

  useEffect(() => {
    gradeApi.list(1, 500)
      .then((data: any) => setGrades((data as PagedResult<GradeItem>).items))
      .catch(() => setError('Erro ao carregar notas.'))
      .finally(() => setLoading(false));
  }, []);

  const periods = [...new Set(grades.map(g => g.period))].sort();
  const filtered = periodFilter ? grades.filter(g => g.period === periodFilter) : grades;

  // agrupar por disciplina
  const bySubject = filtered.reduce<Record<string, GradeItem[]>>((acc, g) => {
    if (!acc[g.subject]) acc[g.subject] = [];
    acc[g.subject].push(g);
    return acc;
  }, {});

  const avgGrade = grades.length > 0 ? grades.reduce((s, g) => s + g.value, 0) / grades.length : null;

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Minhas Notas</h1>
      {avgGrade !== null && (
        <p className="text-gray-500 mb-8">
          Média geral: <span className={`font-bold text-lg ${GRADE_COLOR(avgGrade)}`}>{avgGrade.toFixed(1)}</span>
        </p>
      )}

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {periods.length > 1 && (
        <div className="mb-6">
          <select
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="">Todos os períodos</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      )}

      {Object.keys(bySubject).length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
          Nenhuma nota lançada ainda.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(bySubject).sort(([a], [b]) => a.localeCompare(b)).map(([subject, subjectGrades]) => {
            const subjectAvg = subjectGrades.reduce((s, g) => s + g.value, 0) / subjectGrades.length;
            return (
              <div key={subject} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">{subject}</h2>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Média</span>
                    <p className={`text-2xl font-bold ${GRADE_COLOR(subjectAvg)}`}>{subjectAvg.toFixed(1)}</p>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {subjectGrades.sort((a, b) => a.period.localeCompare(b.period)).map(g => (
                      <div key={g.id} className={`border rounded-lg p-3 ${GRADE_BG(g.value)}`}>
                        <p className="text-xs font-medium text-gray-500 mb-1">{g.period}</p>
                        <p className={`text-3xl font-bold ${GRADE_COLOR(g.value)}`}>{g.value.toFixed(1)}</p>
                        <p className="text-xs text-gray-400 mt-1">{g.className}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
