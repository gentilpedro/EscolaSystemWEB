import React, { useState, useEffect } from 'react';
import { BarChart3, Users, BookOpen, TrendingUp } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { ClassItem, StudentItem, GradeItem, AttendanceItem, DisciplinaryCall, PagedResult } from '../../types';
import { classApi, studentApi, gradeApi, attendanceApi, disciplinaryApi } from '../../services/api';

interface ClassSummary {
  class: ClassItem;
  studentCount: number;
  avgGrade: number | null;
  attendanceRate: number | null;
  pendingCalls: number;
}

export const DirectorReports: React.FC = () => {
  const [summaries, setSummaries] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesData, studentsData, gradesData, attendanceData, callsData] = await Promise.all([
        classApi.list(1, 100) as Promise<PagedResult<ClassItem>>,
        studentApi.list(1, 500) as Promise<PagedResult<StudentItem>>,
        gradeApi.list() as Promise<PagedResult<GradeItem>>,
        attendanceApi.list() as Promise<PagedResult<AttendanceItem>>,
        disciplinaryApi.list() as Promise<PagedResult<DisciplinaryCall>>,
      ]);

      const classes = classesData.items;
      const students = studentsData.items;
      const grades = gradesData.items;
      const attendances = attendanceData.items;
      const calls = callsData.items;

      const result: ClassSummary[] = classes.map(cls => {
        const classStudents = students.filter(s => s.classId === cls.id);
        const classGrades = grades.filter(g => g.classId === cls.id);
        const classAttendances = attendances.filter(a => a.classId === cls.id);
        const classCalls = calls.filter(c => classStudents.some(s => s.id === c.studentId) && c.status === 1);

        const avgGrade = classGrades.length > 0
          ? classGrades.reduce((sum, g) => sum + g.value, 0) / classGrades.length
          : null;

        const attendanceRate = classAttendances.length > 0
          ? (classAttendances.filter(a => a.isPresent).length / classAttendances.length) * 100
          : null;

        return {
          class: cls,
          studentCount: classStudents.length,
          avgGrade,
          attendanceRate,
          pendingCalls: classCalls.length,
        };
      });

      setSummaries(result);
    } catch {
      setError('Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = summaries.reduce((s, c) => s + c.studentCount, 0);
  const globalAvgGrade = (() => {
    const valid = summaries.filter(s => s.avgGrade !== null);
    return valid.length > 0 ? valid.reduce((s, c) => s + c.avgGrade!, 0) / valid.length : null;
  })();
  const globalAttendance = (() => {
    const valid = summaries.filter(s => s.attendanceRate !== null);
    return valid.length > 0 ? valid.reduce((s, c) => s + c.attendanceRate!, 0) / valid.length : null;
  })();
  const totalPendingCalls = summaries.reduce((s, c) => s + c.pendingCalls, 0);

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Relatórios</h1>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {/* Global stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total de Alunos" value={String(totalStudents)} icon={<Users className="w-7 h-7" />} color="bg-blue-500" />
        <StatCard title="Média Geral" value={globalAvgGrade !== null ? globalAvgGrade.toFixed(1) : '—'} icon={<TrendingUp className="w-7 h-7" />} color="bg-green-500" />
        <StatCard title="Taxa de Presença" value={globalAttendance !== null ? `${globalAttendance.toFixed(1)}%` : '—'} icon={<BarChart3 className="w-7 h-7" />} color="bg-purple-500" />
        <StatCard title="Chamados Pendentes" value={String(totalPendingCalls)} icon={<BookOpen className="w-7 h-7" />} color="bg-orange-500" />
      </div>

      {/* Per class table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Resumo por Turma</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Turma</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ano</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Alunos</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Média Notas</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Presença</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Chamados Pend.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {summaries.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Nenhuma turma encontrada</td></tr>
            ) : summaries.map(s => (
              <tr key={s.class.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{s.class.name}</td>
                <td className="px-6 py-4 text-gray-600">{s.class.year}</td>
                <td className="px-6 py-4 text-center text-gray-700">{s.studentCount}</td>
                <td className="px-6 py-4 text-center">
                  {s.avgGrade !== null ? (
                    <span className={`font-semibold ${s.avgGrade >= 7 ? 'text-green-600' : s.avgGrade >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {s.avgGrade.toFixed(1)}
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4 text-center">
                  {s.attendanceRate !== null ? (
                    <span className={`font-semibold ${s.attendanceRate >= 75 ? 'text-green-600' : s.attendanceRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {s.attendanceRate.toFixed(1)}%
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-4 text-center">
                  {s.pendingCalls > 0 ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">{s.pendingCalls}</span>
                  ) : <span className="text-gray-400">0</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className={`${color} text-white rounded-lg p-3 w-fit mb-4`}>{icon}</div>
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
  </div>
);
