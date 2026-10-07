import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Power, PowerOff, Trash2, School as SchoolIcon } from 'lucide-react';
import type { School } from '../../types';
import { schoolApi } from '../../services/api';
import {
  ActiveStamp,
  Button,
  EmptyState,
  FilterBar,
  IconButton,
  LoadError,
  PageHeader,
  PageLoader,
  RowActions,
  SearchInput,
  TableEmptyRow,
  TableFrame,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  errorMessage,
  useConfirm,
  useToast,
} from '../../components/ui';
import { matches, plural } from '../../lib/format';
import { listAll } from '../../lib/paging';
import { confirmActivation } from '../../features/schools/activation';
import { SchoolModal } from '../../features/schools/SchoolModal';

export const AdminSchools: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Atalhos do painel: ?nova=1 abre o cadastro; ?busca= já filtra
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('busca') ?? '');
  const [showModal, setShowModal] = useState(() => searchParams.get('nova') === '1');
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const fetchSchools = useCallback(async () => {
    try {
      // Todas as páginas: pedir só a primeira cortava a lista (e a busca) a partir da 101ª escola
      const data = await listAll<School>((page, size) => schoolApi.list(page, size));
      setSchools(data.items);
      setError(null);
    } catch {
      setError('Erro ao carregar escolas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchSchools();
  }, [fetchSchools]);

  const handleDelete = async (school: School) => {
    const ok = await confirm({
      title: `Excluir a escola ${school.name}?`,
      consequence: 'Só é possível excluir escola sem turmas nem usuários. Para suspender uma escola em uso, use Desativar.',
      confirmLabel: 'Excluir escola',
    });
    if (!ok) return;
    try {
      await schoolApi.delete(school.id);
      setSchools(prev => prev.filter(s => s.id !== school.id));
      toast.success(`${school.name} foi excluída.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao excluir escola.'));
    }
  };

  const handleToggleActive = async (school: School) => {
    const activate = !school.isActive;
    if (!(await confirmActivation(confirm, school, activate))) return;
    try {
      const { name, email, address, phone } = school;
      await schoolApi.update(school.id, { name, email, address, phone, isActive: activate });
      setSchools(prev => prev.map(s => (s.id === school.id ? { ...s, isActive: activate } : s)));
      toast.success(activate ? `${school.name} foi reativada.` : `${school.name} foi desativada.`);
    } catch (err) {
      toast.error(errorMessage(err, activate ? 'Erro ao reativar escola.' : 'Erro ao desativar escola.'));
    }
  };

  const filteredSchools = schools.filter(s => matches(searchTerm, s.name, s.email));

  const actionsFor = (school: School) => (
    <RowActions
      destructive={
        <>
          {school.isActive && (
            <IconButton tone="danger" label={`Desativar ${school.name}`} icon={<PowerOff className="h-5 w-5" />} onClick={() => handleToggleActive(school)} />
          )}
          <IconButton tone="danger" label={`Excluir ${school.name}`} icon={<Trash2 className="h-5 w-5" />} onClick={() => handleDelete(school)} />
        </>
      }
    >
      {!school.isActive && (
        <IconButton label={`Reativar ${school.name}`} icon={<Power className="h-5 w-5" />} onClick={() => handleToggleActive(school)} />
      )}
      <IconButton
        label={`Editar ${school.name}`}
        icon={<Pencil className="h-5 w-5" />}
        onClick={() => {
          setEditingSchool(school);
          setShowModal(true);
        }}
      />
    </RowActions>
  );

  const empty = (
    <EmptyState icon={SchoolIcon} title={schools.length === 0 ? 'Nenhuma escola cadastrada' : 'Nenhuma escola encontrada'} compact>
      {schools.length === 0 ? 'Use “Nova escola” para cadastrar a primeira.' : 'Ajuste a busca.'}
    </EmptyState>
  );

  const header = (
    <PageHeader
      title="Escolas"
      description={!loading ? plural(schools.length, 'escola cadastrada', 'escolas cadastradas') : undefined}
      actions={
        <Button
          icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => {
            setEditingSchool(null);
            setShowModal(true);
          }}
        >
          Nova escola
        </Button>
      }
    />
  );

  return (
    <>
      {header}
      {loading ? (
        <PageLoader label="Carregando escolas…" />
      ) : (
        <>
          {error && <LoadError message={error} onRetry={() => { setLoading(true); fetchSchools(); }} />}

          <FilterBar>
            <SearchInput label="Pesquisar escolas" value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar por nome ou e-mail…" />
          </FilterBar>

          {/* Celular: um cartão por escola, sem rolar para o lado */}
          <div className="md:hidden">
            {filteredSchools.length === 0 ? (
              <div className="rounded-lg border border-rule bg-surface">{empty}</div>
            ) : (
              <ul className="space-y-3" aria-label="Escolas cadastradas">
                {filteredSchools.map(school => (
                  <li key={school.id} className="rounded-lg border border-rule bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/admin/schools/${school.id}`} className="min-w-0 font-semibold text-ink hover:text-lousa hover:underline">
                        {school.name}
                      </Link>
                      <ActiveStamp active={school.isActive} feminine />
                    </div>
                    <p className="mt-1 break-all text-sm text-ink-3">{school.email}</p>
                    <p className="text-sm text-ink-3">
                      <span className="figures">{school.phone}</span> · {school.address}
                    </p>
                    <div className="mt-2 border-t border-rule pt-2">{actionsFor(school)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <TableFrame caption="Escolas cadastradas" minWidth="52rem" className="hidden md:block">
            <THead>
              <Th sticky>Nome</Th>
              <Th>E-mail</Th>
              <Th>Endereço</Th>
              <Th>Telefone</Th>
              <Th>Situação</Th>
              <Th align="right" srOnly>
                Ações
              </Th>
            </THead>
            <TBody>
              {filteredSchools.length === 0 ? (
                <TableEmptyRow colSpan={6}>{empty}</TableEmptyRow>
              ) : (
                filteredSchools.map(school => (
                  <Tr key={school.id}>
                    <Td sticky strong>
                      <Link to={`/admin/schools/${school.id}`} className="text-ink hover:text-lousa hover:underline">
                        {school.name}
                      </Link>
                    </Td>
                    <Td>{school.email}</Td>
                    <Td className="max-w-[16rem]">
                      <span className="line-clamp-2">{school.address}</span>
                    </Td>
                    <Td className="figures whitespace-nowrap text-sm">{school.phone}</Td>
                    <Td>
                      <ActiveStamp active={school.isActive} feminine />
                    </Td>
                    <Td align="right">{actionsFor(school)}</Td>
                  </Tr>
                ))
              )}
            </TBody>
          </TableFrame>
        </>
      )}

      {showModal && (
        <SchoolModal
          school={editingSchool}
          onClose={() => setShowModal(false)}
          onSave={() => {
            toast.success(editingSchool ? 'Escola atualizada.' : 'Escola cadastrada.');
            setShowModal(false);
            fetchSchools();
          }}
        />
      )}
    </>
  );
};
