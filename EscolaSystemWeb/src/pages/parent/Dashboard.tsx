import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import type { DisciplinaryCall, PagedResult } from '../../types';
import { disciplinaryApi } from '../../services/api';

const STATUS_LABELS: Record<number, string> = { 1: 'Pendente', 2: 'Aprovado', 3: 'Rejeitado' };
const STATUS_COLORS: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-red-100 text-red-800',
};

export const ParentDashboard: React.FC = () => {
  const [calls, setCalls] = useState<DisciplinaryCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    disciplinaryApi.list()
      .then((data: any) => setCalls((data as PagedResult<DisciplinaryCall>).items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const pending  = calls.filter(c => c.status === 1).length;
  const approved = calls.filter(c => c.status === 2).length;
  const rejected = calls.filter(c => c.status === 3).length;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Painel do Responsável</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Chamados Pendentes" value={pending}  icon={<AlertCircle className="w-8 h-8" />} color="bg-[#6f73d2]" />
        <StatCard title="Chamados Aprovados" value={approved} icon={<CheckCircle className="w-8 h-8" />} color="bg-[#83c9f4]" />
        <StatCard title="Total de Chamados"  value={calls.length} icon={<Clock className="w-8 h-8" />} color="bg-[#7681b3]" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Chamados Recentes</h2>
          <Link to="/parent/disciplinary" className="text-sm text-[#6f73d2] hover:underline">Ver todos</Link>
        </div>

        {calls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum chamado registrado.</p>
        ) : (
          <div className="space-y-4">
            {calls.slice(0, 5).map(call => (
              <div key={call.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{call.studentName}</p>
                    <p className="text-sm text-gray-600 mt-1 truncate">{call.description}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(call.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full shrink-0 ${STATUS_COLORS[call.status]}`}>
                    {STATUS_LABELS[call.status]}
                  </span>
                </div>
                {call.resolution && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500">Resolução:</p>
                    <p className="text-sm text-gray-700 mt-1">{call.resolution}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
