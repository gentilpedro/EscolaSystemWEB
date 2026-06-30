import React, { useState, useEffect } from 'react';
import { BookOpen, Users, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import type { ClassItem, StudentItem, DisciplinaryCall, PagedResult } from '../../types';
import { classApi, studentApi, disciplinaryApi } from '../../services/api';

export const OrientadorDashboard: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingCalls, setPendingCalls] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesData, studentsData, callsData] = await Promise.all([
          classApi.list(1, 100) as Promise<PagedResult<ClassItem>>,
          studentApi.list(1, 1) as Promise<PagedResult<StudentItem>>,
          disciplinaryApi.list() as Promise<PagedResult<DisciplinaryCall>>,
        ]);
        setClasses(classesData.items);
        setTotalStudents(studentsData.totalCount);
        setPendingCalls(callsData.items.filter(c => c.status === 0).length);
      } catch {
        // mantém zeros
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Orientador</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Minhas Turmas" value={classes.length} icon={<BookOpen className="w-8 h-8" />} color="bg-[#6f73d2]" />
        <StatCard title="Total de Alunos" value={totalStudents} icon={<Users className="w-8 h-8" />} color="bg-[#83c9f4]" />
        <StatCard title="Chamados Pendentes" value={pendingCalls} icon={<AlertCircle className="w-8 h-8" />} color="bg-[#7681b3]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Minhas Turmas</h2>
          {classes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma turma atribuída.</p>
          ) : (
            <div className="space-y-3">
              {classes.slice(0, 5).map(cls => (
                <div key={cls.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                  <div>
                    <p className="font-semibold text-gray-800">{cls.name}</p>
                    <p className="text-sm text-gray-500">Ano letivo: {cls.year}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cls.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {cls.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <ActionButton text="Ver Alunos" href="/orientador/students" />
            <ActionButton text="Consultar Faltas" href="/orientador/attendance" />
            <ActionButton text="Consultar Notas" href="/orientador/grades" />
            <ActionButton text="Gerenciar Chamados" href="/orientador/disciplinary" />
          </div>
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
