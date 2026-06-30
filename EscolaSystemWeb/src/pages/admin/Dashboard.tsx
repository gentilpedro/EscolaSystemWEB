import React, { useState, useEffect } from 'react';
import { Building2, Users, BookOpen, BarChart3 } from 'lucide-react';
import { Loading } from '../../components/Loading';

interface DashboardStats {
  totalSchools: number;
  totalUsers: number;
  totalClasses: number;
  totalStudents: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalUsers: 0,
    totalClasses: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch admin dashboard stats from API
    // Example:
    // const fetchStats = async () => {
    //   try {
    //     const response = await api.get('/admin/stats');
    //     setStats(response);
    //   } catch (error) {
    //     console.error('Error fetching stats:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchStats();

    // Mock data for now
    setTimeout(() => {
      setStats({
        totalSchools: 15,
        totalUsers: 324,
        totalClasses: 45,
        totalStudents: 890,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Administrativo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Escolas"
          value={stats.totalSchools}
          icon={<Building2 className="w-8 h-8" />}
          color="bg-[#6f73d2]"
        />
        <StatCard
          title="Total de Usuários"
          value={stats.totalUsers}
          icon={<Users className="w-8 h-8" />}
          color="bg-[#83c9f4]"
        />
        <StatCard
          title="Total de Turmas"
          value={stats.totalClasses}
          icon={<BookOpen className="w-8 h-8" />}
          color="bg-[#7681b3]"
        />
        <StatCard
          title="Total de Alunos"
          value={stats.totalStudents}
          icon={<BarChart3 className="w-8 h-8" />}
          color="bg-[#6f73d2]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Schools */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Escolas Recentes</h2>
          <div className="space-y-4">
            <SchoolItem name="Escola Municipal A" director="João Silva" status="ativa" />
            <SchoolItem name="Escola Municipal B" director="Maria Santos" status="ativa" />
            <SchoolItem name="Escola Privada C" director="Pedro Costa" status="ativa" />
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Atividades Recentes</h2>
          <div className="space-y-4">
            <ActivityItem
              title="Novo usuário criado"
              description="Admin criou novo diretor em Escola A"
              time="Há 2 horas"
            />
            <ActivityItem
              title="Turma registrada"
              description="Nova turma do 6º ano criada"
              time="Há 4 horas"
            />
            <ActivityItem
              title="Aluno adicionado"
              description="5 novos alunos adicionados à Turma B"
              time="Há 1 dia"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`${color} text-white rounded-lg p-3 w-fit mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  );
};

interface SchoolItemProps {
  name: string;
  director: string;
  status: string;
}

const SchoolItem: React.FC<SchoolItemProps> = ({ name, director, status }) => {
  return (
    <div className="border-b border-gray-200 pb-4 last:border-b-0">
      <p className="font-semibold text-gray-800">{name}</p>
      <p className="text-sm text-gray-600">Diretor: {director}</p>
      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
        {status}
      </span>
    </div>
  );
};

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ title, description, time }) => {
  return (
    <div className="border-b border-gray-200 pb-4 last:border-b-0">
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
      <p className="text-xs text-gray-500 mt-1">{time}</p>
    </div>
  );
};
