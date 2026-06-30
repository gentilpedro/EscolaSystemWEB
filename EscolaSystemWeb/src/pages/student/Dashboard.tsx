import React, { useState, useEffect } from 'react';
import { BarChart3, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import type { GradeItem, AttendanceItem, PendingWorkItem, PagedResult } from '../../types';
import { gradeApi, attendanceApi, pendingWorkApi } from '../../services/api';

export const StudentDashboard: React.FC = () => {
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [absences, setAbsences] = useState(0);
  const [pendingWorks, setPendingWorks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesData, attendanceData, worksData] = await Promise.all([
          gradeApi.list(1, 200) as Promise<PagedResult<GradeItem>>,
          attendanceApi.list(1, 500) as Promise<PagedResult<AttendanceItem>>,
          pendingWorkApi.list(1, 100) as Promise<PagedResult<PendingWorkItem>>,
        ]);
        setGrades(gradesData.items);
        setAbsences(attendanceData.items.filter(a => !a.isPresent).length);
        setPendingWorks(worksData.items.filter(w => !w.isDelivered).length);
      } catch {
        // mantém zeros
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const avgGrade = grades.length > 0
    ? grades.reduce((s, g) => s + g.value, 0) / grades.length
    : null;

  // últimas notas por disciplina (uma por disciplina, a mais recente)
  const bySubject = grades.reduce<Record<string, GradeItem>>((acc, g) => {
    if (!acc[g.subject] || new Date(g.createdAt) > new Date(acc[g.subject].createdAt)) {
      acc[g.subject] = g;
    }
    return acc;
  }, {});
  const recentGrades = Object.values(bySubject).slice(0, 5);

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Meu Painel</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Média Geral"
          value={avgGrade !== null ? avgGrade.toFixed(1) : '—'}
          icon={<BarChart3 className="w-8 h-8" />}
          color={avgGrade === null ? 'bg-gray-400' : avgGrade >= 7 ? 'bg-green-500' : avgGrade >= 5 ? 'bg-yellow-500' : 'bg-red-500'}
        />
        <StatCard title="Faltas" value={String(absences)} icon={<Users className="w-8 h-8" />} color={absences > 10 ? 'bg-red-500' : 'bg-orange-500'} />
        <StatCard title="Trabalhos Pendentes" value={String(pendingWorks)} icon={<BookOpen className="w-8 h-8" />} color="bg-[#7681b3]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <ActionButton text="Ver Notas" href="/student/grades" />
            <ActionButton text="Visualizar Faltas" href="/student/attendance" />
            <ActionButton text="Ver Trabalhos Pendentes" href="/student/assignments" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Notas por Matéria</h2>
            <Link to="/student/grades" className="text-sm text-[#6f73d2] hover:underline">Ver todas</Link>
          </div>
          {recentGrades.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Nenhuma nota lançada ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentGrades.map(g => (
                <div key={g.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-b-0">
                  <span className="text-gray-800 font-medium">{g.subject}</span>
                  <span className={`text-2xl font-bold ${g.value >= 7 ? 'text-green-600' : g.value >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {g.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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

const ActionButton: React.FC<{ text: string; href: string }> = ({ text, href }) => (
  <Link to={href} className="block px-4 py-3 bg-[#d9f0ff] hover:bg-[#a3d5ff] text-[#6f73d2] rounded-lg transition-colors font-medium">
    {text}
  </Link>
);
