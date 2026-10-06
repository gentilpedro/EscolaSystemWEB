import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, School as SchoolIcon } from 'lucide-react';
import type { School, PagedResult } from '../../types';
import { schoolApi } from '../../services/api';
import {
  ActiveStamp,
  Alert,
  Button,
  CheckboxField,
  EmptyState,
  FilterBar,
  FormDialog,
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
  TextField,
  Th,
  THead,
  Tr,
  errorMessage,
  useConfirm,
  useToast,
} from '../../components/ui';
import { matches, plural } from '../../lib/format';

export const AdminSchools: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const fetchSchools = useCallback(async () => {
    try {
      const data: PagedResult<School> = await schoolApi.list(1, 100);
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
      consequence: 'Só é possível excluir escola sem turmas nem usuários. Para suspender uma escola em uso, edite e desmarque "Escola ativa".',
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

  const filteredSchools = schools.filter(s => matches(searchTerm, s.name, s.email));

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

          <TableFrame caption="Escolas cadastradas" minWidth="52rem">
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
                <TableEmptyRow colSpan={6}>
                  <EmptyState icon={SchoolIcon} title={schools.length === 0 ? 'Nenhuma escola cadastrada' : 'Nenhuma escola encontrada'} compact>
                    {schools.length === 0 ? 'Use “Nova escola” para cadastrar a primeira.' : 'Ajuste a busca.'}
                  </EmptyState>
                </TableEmptyRow>
              ) : (
                filteredSchools.map(school => (
                  <Tr key={school.id}>
                    <Td sticky strong>
                      {school.name}
                    </Td>
                    <Td>{school.email}</Td>
                    <Td className="max-w-[16rem]">
                      <span className="line-clamp-2">{school.address}</span>
                    </Td>
                    <Td className="figures whitespace-nowrap text-sm">{school.phone}</Td>
                    <Td>
                      <ActiveStamp active={school.isActive} feminine />
                    </Td>
                    <Td align="right">
                      <RowActions
                        destructive={
                          <IconButton
                            tone="danger"
                            label={`Excluir ${school.name}`}
                            icon={<Trash2 className="h-5 w-5" />}
                            onClick={() => handleDelete(school)}
                          />
                        }
                      >
                        <IconButton
                          label={`Editar ${school.name}`}
                          icon={<Pencil className="h-5 w-5" />}
                          onClick={() => {
                            setEditingSchool(school);
                            setShowModal(true);
                          }}
                        />
                      </RowActions>
                    </Td>
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

interface SchoolModalProps {
  school: School | null;
  onClose: () => void;
  onSave: () => void;
}

const SchoolModal: React.FC<SchoolModalProps> = ({ school, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: school?.name ?? '',
    email: school?.email ?? '',
    address: school?.address ?? '',
    phone: school?.phone ?? '',
    isActive: school?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (school) {
        await schoolApi.update(school.id, formData);
      } else {
        await schoolApi.create(formData);
      }
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar escola.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title={school ? 'Editar escola' : 'Nova escola'} onClose={onClose} onSubmit={handleSubmit} saving={saving} submitLabel="Salvar">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField label="Nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
      <TextField
        label="E-mail"
        type="email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <TextField label="Endereço" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
      <TextField
        label="Telefone"
        type="tel"
        value={formData.phone}
        onChange={e => setFormData({ ...formData, phone: e.target.value })}
        placeholder="(00) 00000-0000"
        required
      />
      {school && (
        <CheckboxField label="Escola ativa" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
      )}
    </FormDialog>
  );
};
