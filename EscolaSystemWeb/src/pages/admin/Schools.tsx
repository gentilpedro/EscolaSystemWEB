import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, School as SchoolIcon } from 'lucide-react';
import type { School } from '../../types';
import { schoolApi, userApi } from '../../services/api';
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
import { listAll } from '../../lib/paging';
import { emailError, maskPhone, minLengthError, phoneError } from '../../lib/contact';

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
  const confirm = useConfirm();
  const [formData, setFormData] = useState({
    name: school?.name ?? '',
    email: school?.email ?? '',
    address: school?.address ?? '',
    phone: maskPhone(school?.phone ?? ''),
    isActive: school?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Os erros de campo aparecem depois de sair do campo ou de tentar salvar, não enquanto a pessoa digita
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const fieldErrors = {
    name: minLengthError(formData.name, 3, 'O nome'),
    address: minLengthError(formData.address, 5, 'O endereço'),
    email: emailError(formData.email),
    phone: phoneError(formData.phone),
  };
  const shown = (field: keyof typeof fieldErrors) => (touched[field] ? fieldErrors[field] : undefined);
  const touch = (field: keyof typeof fieldErrors) => () => setTouched(t => ({ ...t, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(fieldErrors).some(Boolean)) {
      setTouched({ name: true, address: true, email: true, phone: true });
      setError('Corrija os campos destacados.');
      return;
    }
    // Ligar ou desligar a escola afeta todo mundo dela: confirma dizendo quantas pessoas
    if (school && formData.isActive !== school.isActive && !(await confirmActivation(school, formData.isActive))) return;
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

  const confirmActivation = async (target: School, activate: boolean) => {
    let people: number | null = null;
    try {
      people = (await userApi.list(1, 1, { schoolId: target.id, isActive: true })).totalCount;
    } catch {
      // Sem a contagem, a confirmação continua, só sem o número
    }
    const who = people === null ? 'As pessoas desta escola' : people === 0 ? 'Ninguém' : plural(people, 'pessoa', 'pessoas');
    return confirm(
      activate
        ? {
            title: `Reativar ${target.name}?`,
            consequence: `${who} com conta ativa ${people === 1 ? 'volta' : 'voltam'} a entrar no sistema.`,
            confirmLabel: 'Reativar escola',
            reversible: true,
            tone: 'primary',
          }
        : {
            title: `Desativar ${target.name}?`,
            consequence:
              people === 0
                ? 'Ninguém da escola tem conta ativa agora. Nada é apagado, e a escola pode ser reativada depois.'
                : `${who} ${people === 1 ? 'perde' : 'perdem'} o acesso na hora: não ${people === 1 ? 'consegue' : 'conseguem'} entrar até a escola ser reativada. Nada é apagado.`,
            confirmLabel: 'Desativar escola',
            reversible: true,
          },
    );
  };

  return (
    <FormDialog title={school ? 'Editar escola' : 'Nova escola'} onClose={onClose} onSubmit={handleSubmit} saving={saving} submitLabel="Salvar">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        label="Nome"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        onBlur={touch('name')}
        error={shown('name')}
        maxLength={300}
        required
      />
      <TextField
        label="E-mail"
        type="email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        onBlur={touch('email')}
        error={shown('email')}
        maxLength={200}
        required
      />
      <TextField
        label="Endereço"
        value={formData.address}
        onChange={e => setFormData({ ...formData, address: e.target.value })}
        onBlur={touch('address')}
        error={shown('address')}
        maxLength={500}
        required
      />
      <TextField
        label="Telefone"
        type="tel"
        inputMode="numeric"
        className="figures"
        value={formData.phone}
        onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
        onBlur={touch('phone')}
        error={shown('phone')}
        placeholder="(00) 00000-0000"
        required
      />
      {school && (
        <CheckboxField label="Escola ativa" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
      )}
    </FormDialog>
  );
};
