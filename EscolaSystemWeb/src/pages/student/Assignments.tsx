import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { PendingWorkItem, PagedResult } from '../../types';
import { pendingWorkApi } from '../../services/api';

const isOverdue = (dueDate: string, isDelivered: boolean) =>
  !isDelivered && new Date(dueDate + 'T23:59:59') < new Date();

export const StudentAssignments: React.FC = () => {
  const [works, setWorks] = useState<PendingWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [delivering, setDelivering] = useState<string | null>(null);

  useEffect(() => { fetchWorks(); }, []);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const data = await pendingWorkApi.list(1, 100) as PagedResult<PendingWorkItem>;
      setWorks(data.items.sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
    } catch {
      setError('Erro ao carregar trabalhos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (id: string) => {
    if (!window.confirm('Confirmar entrega deste trabalho?')) return;
    setDelivering(id);
    try {
      await pendingWorkApi.markDelivered(id);
      setWorks(prev => prev.map(w => w.id === id ? { ...w, isDelivered: true, deliveredAt: new Date().toISOString() } : w));
    } catch {
      alert('Erro ao registrar entrega.');
    } finally {
      setDelivering(null);
    }
  };

  const filtered = works.filter(w => {
    if (filter === 'pending') return !w.isDelivered;
    if (filter === 'delivered') return w.isDelivered;
    return true;
  });

  const pendingCount   = works.filter(w => !w.isDelivered).length;
  const deliveredCount = works.filter(w => w.isDelivered).length;
  const overdueCount   = works.filter(w => isOverdue(w.dueDate, w.isDelivered)).length;

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Trabalhos</h1>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilter('pending')}
          className={`rounded-lg shadow-md p-4 text-center transition-all ${filter === 'pending' ? 'ring-2 ring-blue-500' : ''} bg-white`}
        >
          <p className="text-sm text-gray-500">Pendentes</p>
          <p className={`text-3xl font-bold ${pendingCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>{pendingCount}</p>
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`rounded-lg shadow-md p-4 text-center transition-all ${filter === 'delivered' ? 'ring-2 ring-blue-500' : ''} bg-white`}
        >
          <p className="text-sm text-gray-500">Entregues</p>
          <p className="text-3xl font-bold text-green-600">{deliveredCount}</p>
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg shadow-md p-4 text-center transition-all ${filter === 'all' ? 'ring-2 ring-blue-500' : ''} bg-white`}
        >
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-3xl font-bold text-gray-700">{works.length}</p>
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">Você tem {overdueCount} trabalho{overdueCount > 1 ? 's' : ''} em atraso!</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
          Nenhum trabalho encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(work => {
            const overdue = isOverdue(work.dueDate, work.isDelivered);
            return (
              <div
                key={work.id}
                className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${
                  work.isDelivered ? 'border-green-400' : overdue ? 'border-red-400' : 'border-orange-400'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{work.title}</h3>
                      {work.isDelivered && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">Entregue</span>
                      )}
                      {overdue && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Em atraso</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{work.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Prazo: <strong className={overdue ? 'text-red-600' : 'text-gray-700'}>
                          {new Date(work.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </strong>
                      </span>
                      <span>Turma: {work.className}</span>
                      {work.isDelivered && work.deliveredAt && (
                        <span className="text-green-600">
                          Entregue em: {new Date(work.deliveredAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {!work.isDelivered && (
                    <button
                      onClick={() => handleDeliver(work.id)}
                      disabled={delivering === work.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {delivering === work.id ? 'Confirmando...' : 'Marcar entregue'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
