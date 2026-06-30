import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Loading } from '../../components/Loading';
import type { DisciplinaryCall, PagedResult } from '../../types';
import { disciplinaryApi } from '../../services/api';

const STATUS_LABELS: Record<number, string> = { 1: 'Pendente', 2: 'Aprovado', 3: 'Rejeitado' };
const STATUS_COLORS: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-red-100 text-red-800',
};

export const DirectorDisciplinary: React.FC = () => {
  const [calls, setCalls] = useState<DisciplinaryCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCall, setSelectedCall] = useState<DisciplinaryCall | null>(null);
  const [resolveModal, setResolveModal] = useState<{ call: DisciplinaryCall; action: 'approve' | 'reject' } | null>(null);

  useEffect(() => { fetchCalls(); }, []);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: PagedResult<DisciplinaryCall> = await disciplinaryApi.list();
      setCalls(data.items);
    } catch {
      setError('Erro ao carregar chamados.');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aluno</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Descrição</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum chamado encontrado</td></tr>
            ) : filtered.map(call => (
              <tr key={call.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{call.studentName}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{call.description}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">{new Date(call.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[call.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_LABELS[call.status] ?? call.statusName}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => setSelectedCall(call)} title="Ver detalhes" className="text-gray-500 hover:text-gray-700 transition-colors">
                      <Eye className="w-5 h-5" />
                    </button>
                    {call.status === 1 && (
                      <>
                        <button onClick={() => setResolveModal({ call, action: 'approve' })} title="Aprovar" className="text-green-600 hover:text-green-800 transition-colors">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => setResolveModal({ call, action: 'reject' })} title="Rejeitar" className="text-red-600 hover:text-red-800 transition-colors">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCall && (
        <DetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
      {resolveModal && (
        <ResolveModal
          call={resolveModal.call}
          action={resolveModal.action}
          onClose={() => setResolveModal(null)}
          onSave={() => { fetchCalls(); setResolveModal(null); }}
        />
      )}
    </div>
  );
};

const DetailModal: React.FC<{ call: DisciplinaryCall; onClose: () => void }> = ({ call, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Detalhes do Chamado</h2>
      <dl className="space-y-3 text-sm">
        <div><dt className="font-medium text-gray-500">Aluno</dt><dd className="text-gray-800">{call.studentName}</dd></div>
        <div><dt className="font-medium text-gray-500">Descrição</dt><dd className="text-gray-800 whitespace-pre-wrap">{call.description}</dd></div>
        <div><dt className="font-medium text-gray-500">Status</dt><dd><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[call.status]}`}>{STATUS_LABELS[call.status]}</span></dd></div>
        <div><dt className="font-medium text-gray-500">Criado em</dt><dd className="text-gray-800">{new Date(call.createdAt).toLocaleString('pt-BR')}</dd></div>
        {call.resolvedByName && <div><dt className="font-medium text-gray-500">Resolvido por</dt><dd className="text-gray-800">{call.resolvedByName}</dd></div>}
        {call.resolvedAt && <div><dt className="font-medium text-gray-500">Resolvido em</dt><dd className="text-gray-800">{new Date(call.resolvedAt).toLocaleString('pt-BR')}</dd></div>}
        {call.resolution && <div><dt className="font-medium text-gray-500">Resolução</dt><dd className="text-gray-800 whitespace-pre-wrap">{call.resolution}</dd></div>}
      </dl>
      <button onClick={onClose} className="mt-6 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors">Fechar</button>
    </div>
  </div>
);

const ResolveModal: React.FC<{ call: DisciplinaryCall; action: 'approve' | 'reject'; onClose: () => void; onSave: () => void }> = ({ call, action, onClose, onSave }) => {
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isApprove = action === 'approve';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isApprove) {
        await disciplinaryApi.approve(call.id, resolution);
      } else {
        await disciplinaryApi.reject(call.id, resolution);
      }
      onSave();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao processar chamado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{isApprove ? 'Aprovar Chamado' : 'Rejeitar Chamado'}</h2>
        <p className="text-sm text-gray-500 mb-4">Aluno: <strong>{call.studentName}</strong></p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolução / Justificativa</label>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              placeholder="Descreva a resolução do chamado..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors">Cancelar</button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-4 py-2 disabled:opacity-60 text-white rounded-lg transition-colors ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {saving ? 'Salvando...' : isApprove ? 'Aprovar' : 'Rejeitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
