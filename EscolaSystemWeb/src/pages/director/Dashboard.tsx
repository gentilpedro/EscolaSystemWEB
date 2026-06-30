import React, { useState, useEffect } from 'react';
import { Users, BookOpen, BarChart3, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import type { DisciplinaryCall, PagedResult } from '../../types';
import { userApi, classApi, studentApi, disciplinaryApi } from '../../services/api';

interface DirectorStats {
  totalStaff: number;
  totalClasses: number;
  totalStudents: number;
  openDisciplinaryReports: number;
}

export const DirectorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DirectorStats>({ totalStaff: 0, totalClasses: 0, totalStudents: 0, openDisciplinaryReports: 0 });
  const [pendingCalls, setPendingCalls] = useState<DisciplinaryCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersData, classesData, studentsData, callsData] = await Promise.all([
          userApi.list(1, 1) as Promise<PagedResult<any>>,
          classApi.list(1, 1) as Promise<PagedResult<any>>,
          studentApi.list(1, 1) as Promise<PagedResult<any>>,
          disciplinaryApi.list() as Promise<PagedResult<DisciplinaryCall>>,
        ]);

        const allCalls = callsData.items;
        const pending = allCalls.filter(c => c.status === 1);

        setStats({
          totalStaff: usersData.totalCount,
          totalClasses: classesData.totalCount,
          totalStudents: studentsData.totalCount,
          openDisciplinaryReports: pending.length,
        });
        setPendingCalls(pending.slice(0, 3));
      } catch {
        // mantém os zeros no erro
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Diretoria</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Funcionários" value={stats.totalStaff} icon={<Users className="w-8 h-8" />} color="bg-[#6f73d2]" />
        <StatCard title="Turmas" value={stats.totalClasses} icon={<BookOpen className="w-8 h-8" />} color="bg-[#83c9f4]" />
        <StatCard title="Alunos" value={stats.totalStudents} icon={<Users className="w-8 h-8" />} color="bg-[#7681b3]" />
        <StatCard title="Chamados Pendentes" value={stats.openDisciplinaryReports} icon={<AlertCircle className="w-8 h-8" />} color="bg-[#6f73d2]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <ActionButton text="Adicionar Funcionário" href="/director/staff" />
            <ActionButton text="Criar Turma" href="/director/classes" />
            <ActionButton text="Adicionar Aluno" href="/director/students" />
            <ActionButton text="Ver Relatórios" href="/director/reports" />
            <ActionButton text="Ver Chamados" href="/director/disciplinary" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Chamados Pendentes</h2>
          {pendingCalls.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum chamado pendente.</p>
          ) : (
            <div className="space-y-4">
              {pendingCalls.map(call => (
                <div key={call.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <p className="font-semibold text-gray-800">{call.studentName}</p>
                  <p className="text-sm text-gray-600 truncate">{call.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(call.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}
          {stats.openDisciplinaryReports > 3 && (
            <Link to="/director/disciplinary" className="block mt-4 text-sm text-[#6f73d2] hover:underline">
              Ver todos ({stats.openDisciplinaryReports} pendentes)
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
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
