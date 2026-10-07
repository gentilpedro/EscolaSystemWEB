import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Power, PowerOff, UserPlus } from 'lucide-react';
import type { School, SchoolSummary } from '../../types';
import { adminSchoolsApi, schoolApi } from '../../services/api';
import { ActiveStamp, Button, LoadError, PageLoader, Panel, errorMessage, useConfirm, useToast } from '../../components/ui';
import { formatDate, formatDateTime, plural } from '../../lib/format';
import { confirmActivation } from '../../features/schools/activation';
import { SchoolModal } from '../../features/schools/SchoolModal';

/** Uma escola para a administração: contato, direção e números, sem dados pessoais da equipe ou dos alunos. */
export const AdminSchoolDetail: React.FC = () => {
  const { id = '' } = useParams();
  const confirm = useConfirm();
  const toast = useToast();
  const [summary, setSummary] = useState<SchoolSummary | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    try {
      setSummary(await adminSchoolsApi.summary(id));
      setFailed(null);
    } catch (err) {
      setFailed(errorMessage(err, 'Não foi possível carregar a escola.'));
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    load();
  }, [load]);

  const backLink = (
    <Link to="/admin/schools" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-lousa hover:underline sm:min-h-0">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Voltar para Escolas
    </Link>
  );

  if (failed) {
    return (
      <>
        {backLink}
        <LoadError message={failed} onRetry={load} />
      </>
    );
  }
  if (!summary) return <PageLoader label="Carregando escola…" />;

  const school: School = {
    id: summary.id,
    name: summary.name,
    email: summary.email,
    phone: summary.phone,
    address: summary.address,
    isActive: summary.isActive,
    createdAt: summary.createdAt,
  };

  const toggleActive = async () => {
    const activate = !school.isActive;
    if (!(await confirmActivation(confirm, school, activate))) return;
    setToggling(true);
    try {
      const { name, email, address, phone } = school;
      await schoolApi.update(school.id, { name, email, address, phone, isActive: activate });
      toast.success(activate ? `${school.name} foi reativada.` : `${school.name} foi desativada.`);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, activate ? 'Erro ao reativar escola.' : 'Erro ao desativar escola.'));
    } finally {
      setToggling(false);
    }
  };

  const people: Array<[string, number]> = [
    ['Diretores', summary.users.directors],
    ['Professores', summary.users.teachers],
    ['Orientadores', summary.users.orientadores],
    ['Responsáveis', summary.users.parents],
    ['Alunos com acesso', summary.users.students],
  ];

  return (
    <>
      {backLink}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-rule pb-4">
        <div className="min-w-0">
          <p className="mb-2 flex flex-wrap items-center gap-2">
            <ActiveStamp active={summary.isActive} feminine />
            <span className="text-sm text-ink-3">
              desde <span className="figures">{formatDate(summary.createdAt)}</span>
            </span>
          </p>
          <h1 className="text-[1.75rem] font-bold leading-tight text-ink text-balance">{summary.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button
            variant="secondary"
            icon={summary.isActive ? <PowerOff className="h-4 w-4" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
            onClick={toggleActive}
            loading={toggling}
            loadingLabel="Salvando…"
          >
            {summary.isActive ? 'Desativar escola' : 'Reativar escola'}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Direção" titleId="direcao">
          {summary.director ? (
            <dl className="space-y-1 text-[0.9375rem]">
              <dt className="sr-only">Diretor</dt>
              <dd className="font-semibold text-ink">{summary.director.name}</dd>
              <dt className="sr-only">E-mail</dt>
              <dd className="break-all text-ink-2">{summary.director.email}</dd>
              <dt className="sr-only">Telefone</dt>
              <dd className="figures text-ink-2">{summary.director.phone || 'Sem telefone cadastrado'}</dd>
              <dd className="pt-2">
                {/* Senha, bloqueio, aparelhos e edição do diretor ficam em Usuários */}
                <Link
                  to={`/admin/users?busca=${encodeURIComponent(summary.director.email)}`}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-lousa hover:underline sm:min-h-0"
                >
                  Ver em Usuários<span className="sr-only"> ({summary.director.name})</span>
                </Link>
              </dd>
            </dl>
          ) : (
            <div className="space-y-3">
              <p className="text-[0.9375rem] text-ink-2">
                <strong className="text-ink">Sem diretor.</strong> Sem direção, ninguém cadastra a equipe, as turmas e os alunos.
              </p>
              <Link
                to={`/admin/users?novo=diretor&escola=${summary.id}`}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-lousa hover:underline sm:min-h-0"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Cadastrar diretor
              </Link>
            </div>
          )}
        </Panel>

        <Panel title="Contato da escola" titleId="contato">
          <dl className="grid gap-x-4 gap-y-2 text-[0.9375rem] sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold text-ink-2">E-mail</dt>
            <dd className="break-all text-ink">{summary.email}</dd>
            <dt className="font-semibold text-ink-2">Telefone</dt>
            <dd className="figures text-ink">{summary.phone}</dd>
            <dt className="font-semibold text-ink-2">Endereço</dt>
            <dd className="text-ink">{summary.address}</dd>
          </dl>
        </Panel>

        <Panel title="Uso do sistema" titleId="uso" className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ['Turmas ativas', summary.activeClasses],
                ['Alunos ativos', summary.activeStudents],
                ['Pessoas com acesso', summary.users.total],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-md border border-rule px-3 py-2">
                <dt className="text-sm text-ink-3">{label}</dt>
                <dd className="figures text-xl font-semibold text-ink">{value.toLocaleString('pt-BR')}</dd>
              </div>
            ))}
            <div className="rounded-md border border-rule px-3 py-2">
              <dt className="text-sm text-ink-3">Último lançamento</dt>
              <dd className="figures font-semibold text-ink">
                {summary.lastRecordAt ? formatDateTime(summary.lastRecordAt) : 'Nenhum ainda'}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-3">
            Pessoas com acesso por perfil:{' '}
            {people
              .filter(([, count]) => count > 0)
              .map(([label, count]) => `${label.toLowerCase()} ${count.toLocaleString('pt-BR')}`)
              .join(' · ') || 'ninguém ainda'}
            . Os nomes ficam com a direção da escola.
          </p>
          {summary.activeClasses === 0 && summary.director && (
            <p className="mt-2 text-sm text-ink-2">
              A escola tem diretor e ainda não tem turmas: a implantação não começou. {plural(summary.users.total, 'pessoa tem', 'pessoas têm')} acesso.
            </p>
          )}
        </Panel>
      </div>

      {editing && (
        <SchoolModal
          school={school}
          onClose={() => setEditing(false)}
          onSave={() => {
            toast.success('Escola atualizada.');
            setEditing(false);
            load();
          }}
        />
      )}
    </>
  );
};
