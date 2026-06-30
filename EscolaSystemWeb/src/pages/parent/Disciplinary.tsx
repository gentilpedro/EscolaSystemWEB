import React, { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { DisciplinaryCall, PagedResult } from '../../types';
import { disciplinaryApi } from '../../services/api';

const STATUS_LABELS: Record<number, string> = { 1: 'Pendente', 2: 'Aprovado', 3: 'Rejeitado' };
const STATUS_COLORS: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-red-100 text-red-800',
};

export const ParentDisciplinary: React.FC = () => {
  const [calls, setCalls] = useState<DisciplinaryCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<DisciplinaryCall | null>(null);

  useEffect(() => {
    disciplinaryApi.list()
      .then((data: any) => setCalls((data as PagedResult<DisciplinaryCall>).items))
      .catch(() => setError('Erro ao carregar chamados.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = calls.filter(c => {
    const matchSearch = c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter ? String(c.status) === statusFilter : true;
    return matchSearch && matchStatus;
  });

  if (loading) return <Loading />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Chamados Disciplinares</h1>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por aluno ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
        >
          <option value="">Todos os status</option>
          <option value="1">Pendente</option>
          <option value="2">Aprovado</option>
          <option value="3">Rejeitado</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
          Nenhum chamado encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(call => (
            <div key={call.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-gray-800 text-lg">{call.studentName}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[call.status]}`}>
                      {STATUS_LABELS[call.status]}
                    </span>
                  </div>
                  <p className="text-gray-600 line-clamp-2">{call.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(call.createdAt).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</p>
                </div>
                <button
                  onClick={() => setSelected(call)}
                  className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                  title="Ver detalhes"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              {call.status !== 1 && call.resolution && (
                <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Resolução da diretoria:</p>
                  <p className="text-sm text-gray-700">{call.resolution}</p>
                  {call.resolvedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Resolvido em {new Date(call.resolvedAt).toLocaleDateString('pt-BR')}
                      {call.resolvedByName && ` por ${call.resolvedByName}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Detalhes do Chamado</h2>
            <dl className="space-y-3 text-sm">
              <div><dt className="font-medium text-gray-500">Aluno</dt><dd className="text-gray-800">{selected.studentName}</dd></div>
              <div><dt className="font-medium text-gray-500">Descrição</dt><dd className="text-gray-800 whitespace-pre-wrap">{selected.description}</dd></div>
              <div>
                <dt className="font-medium text-gray-500">Status</dt>
                <dd><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span></dd>
              </div>
              <div><dt className="font-medium text-gray-500">Data do chamado</dt><dd className="text-gray-800">{new Date(selected.createdAt).toLocaleString('pt-BR')}</dd></div>
              {selected.resolvedByName && <div><dt className="font-medium text-gray-500">Resolvido por</dt><dd className="text-gray-800">{selected.resolvedByName}</dd></div>}
              {selected.resolvedAt && <div><dt className="font-medium text-gray-500">Data da resolução</dt><dd className="text-gray-800">{new Date(selected.resolvedAt).toLocaleString('pt-BR')}</dd></div>}
              {selected.resolution && <div><dt className="font-medium text-gray-500">Resolução</dt><dd className="text-gray-800 whitespace-pre-wrap">{selected.resolution}</dd></div>}
            </dl>
            <button onClick={() => setSelected(null)} className="mt-6 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};
