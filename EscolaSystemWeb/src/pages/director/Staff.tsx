import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Link2, Unlink, Briefcase } from 'lucide-react';
import type { UserListItem, ClassItem, PagedResult } from '../../types';
import { ROLES } from '../../types';
import { userApi, classApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { listAll } from '../../lib/paging';
import {
  ActiveStamp,
  Alert,
  Button,
  CheckboxField,
  Dialog,
  EmptyState,
  FilterBar,
  FormDialog,
  IconButton,
  LoadError,
  PageHeader,
  PageLoader,
  RoleTag,
  RowActions,
  SearchInput,
  SelectField,
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

const STAFF_ROLES = ROLES.filter(r => r.name === 'Teacher' || r.name === 'Director' || r.name === 'Orientador');

// Campos opcionais que a API pode devolver para orientadores
type StaffItem = UserListItem & { cpf?: string; phone?: string };

export const DirectorStaff: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffItem | null>(null);
  const [assigningUser, setAssigningUser] = useState<StaffItem | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const data = await listAll<StaffItem>((page, size) => userApi.list(page, size));
      setStaff(data.items.filter(u => u.role === 'Teacher' || u.role === 'Director' || u.role === 'Orientador'));
      setError(null);
    } catch {
      setError('Erro ao carregar funcionários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = async (member: StaffItem) => {
    const ok = await confirm({
      title: `Excluir ${member.name}?`,
      description: member.email,
      consequence: 'A pessoa perde o acesso e sai das turmas a que estava vinculada. Para afastar sem excluir, edite e desmarque "Funcionário ativo".',
      confirmLabel: 'Excluir funcionário',
    });
    if (!ok) return;
    try {
      await userApi.delete(member.id);
      toast.success('Funcionário excluído.');
      fetchStaff();
    } catch {
      toast.error('Erro ao excluir funcionário.');
    }
  };

  const filtered = staff.filter(u => matches(searchTerm, u.name, u.email));

  return (
    <>
      <PageHeader
        title="Funcionários"
        description={!loading ? plural(staff.length, 'funcionário', 'funcionários') : undefined}
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
          >
            Novo funcionário
          </Button>
        }
      />

      {loading ? (
        <PageLoader label="Carregando funcionários…" />
      ) : (
        <>
          {error && <LoadError message={error} onRetry={() => { setLoading(true); fetchStaff(); }} />}

          <FilterBar>
            <SearchInput label="Pesquisar funcionários" value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar por nome ou e-mail…" />
          </FilterBar>

          <TableFrame caption="Funcionários da escola" minWidth="44rem">
            <THead>
              <Th sticky>Nome</Th>
              <Th>E-mail</Th>
              <Th>Cargo</Th>
              <Th>Situação</Th>
              <Th align="right" srOnly>
                Ações
              </Th>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmptyRow colSpan={5}>
                  <EmptyState icon={Briefcase} title={staff.length === 0 ? 'Nenhum funcionário cadastrado' : 'Nenhum funcionário encontrado'} compact>
                    {staff.length === 0 ? 'Use “Novo funcionário” para cadastrar.' : 'Ajuste a busca.'}
                  </EmptyState>
                </TableEmptyRow>
              ) : (
                filtered.map(member => (
                  <Tr key={member.id}>
                    <Td sticky strong className="whitespace-nowrap">
                      {member.name}
                    </Td>
                    <Td>{member.email}</Td>
                    <Td>
                      <RoleTag role={member.role} />
                    </Td>
                    <Td>
                      <ActiveStamp active={member.isActive} />
                    </Td>
                    <Td align="right">
                      <RowActions
                        destructive={
                          // Ninguém exclui a própria conta por aqui
                          member.id !== user?.id && (
                            <IconButton
                              tone="danger"
                              label={`Excluir ${member.name}`}
                              icon={<Trash2 className="h-5 w-5" />}
                              onClick={() => handleDelete(member)}
                            />
                          )
                        }
                      >
                        {(member.role === 'Teacher' || member.role === 'Orientador') && (
                          <IconButton
                            label={`Vincular ${member.name} a uma turma`}
                            icon={<Link2 className="h-5 w-5" />}
                            onClick={() => setAssigningUser(member)}
                          />
                        )}
                        <IconButton
                          label={`Editar ${member.name}`}
                          icon={<Pencil className="h-5 w-5" />}
                          onClick={() => {
                            setEditingUser(member);
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
        <StaffModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={() => {
            toast.success(editingUser ? 'Funcionário atualizado.' : 'Funcionário cadastrado.');
            setShowModal(false);
            fetchStaff();
          }}
          directorSchoolId={user?.schoolId}
        />
      )}
      {assigningUser && <AssignClassModal user={assigningUser} onClose={() => setAssigningUser(null)} />}
    </>
  );
};

const StaffModal: React.FC<{ user: StaffItem | null; onClose: () => void; onSave: () => void; directorSchoolId?: string }> = ({
  user,
  onClose,
  onSave,
  directorSchoolId,
}) => {
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    roleId: ROLES.find(r => r.name === user?.role)?.id ?? 3,
    isActive: user?.isActive ?? true,
    cpf: user?.cpf ?? '',
    phone: user?.phone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrientador = ROLES.find(r => r.id === formData.roleId)?.name === 'Orientador';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (user) {
        await userApi.update(user.id, {
          name: formData.name,
          email: formData.email,
          roleId: formData.roleId,
          schoolId: user.schoolId ?? null,
          isActive: formData.isActive,
          cpf: isOrientador ? formData.cpf || null : null,
          phone: isOrientador ? formData.phone || null : null,
        });
      } else {
        await userApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          schoolId: directorSchoolId ?? null,
          cpf: isOrientador ? formData.cpf || null : null,
          phone: isOrientador ? formData.phone || null : null,
        });
      }
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title={user ? 'Editar funcionário' : 'Novo funcionário'} onClose={onClose} onSubmit={handleSubmit} saving={saving} submitLabel="Salvar">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField label="Nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="off"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        required
      />
      {!user && (
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          hint="Mínimo de 6 caracteres."
          required
          minLength={6}
        />
      )}
      <SelectField label="Cargo" value={formData.roleId} onChange={e => setFormData({ ...formData, roleId: Number(e.target.value) })} required>
        {STAFF_ROLES.map(r => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </SelectField>
      {isOrientador && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="CPF"
            className="figures"
            inputMode="numeric"
            value={formData.cpf}
            onChange={e => setFormData({ ...formData, cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
          <TextField
            label="Telefone"
            type="tel"
            className="figures"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
      )}
      {user && (
        <CheckboxField label="Funcionário ativo" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
      )}
    </FormDialog>
  );
};

const AssignClassModal: React.FC<{ user: StaffItem; onClose: () => void }> = ({ user, onClose }) => {
  const confirm = useConfirm();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [action, setAction] = useState<'assign' | 'unassign' | null>(null);
  const saving = action !== null;
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classApi
      .list(1, 100)
      .then((data: PagedResult<ClassItem>) => setClasses(data.items ?? []))
      .catch(() => setError('Erro ao carregar turmas.'));
  }, []);

  const isOrientador = user.role === 'Orientador';
  const roleLabel = isOrientador ? 'Orientador' : 'Professor';

  const className = classes.find(c => c.id === selectedClass)?.name ?? 'a turma';

  const handleAssign = async () => {
    if (!selectedClass) return;
    setAction('assign');
    setError(null);
    setSuccess(null);
    try {
      if (isOrientador) {
        await userApi.assignOrientadorClass(user.id, selectedClass);
      } else {
        await userApi.assignClass(user.id, selectedClass);
      }
      setSuccess(`${user.name} agora está vinculado(a) a ${className}.`);
    } catch (err) {
      setError(errorMessage(err, 'Erro ao vincular.'));
    } finally {
      setAction(null);
    }
  };

  const handleUnassign = async () => {
    if (!selectedClass) return;
    const ok = await confirm({
      title: `Desvincular ${user.name} de ${className}?`,
      consequence: `${isOrientador ? 'O orientador' : 'O professor'} deixa de ver os alunos, as notas e a chamada desta turma.`,
      confirmLabel: 'Desvincular',
    });
    if (!ok) return;
    setAction('unassign');
    setError(null);
    setSuccess(null);
    try {
      if (isOrientador) {
        await userApi.unassignOrientadorClass(user.id, selectedClass);
      } else {
        await userApi.unassignClass(user.id, selectedClass);
      }
      setSuccess(`${user.name} foi desvinculado(a) de ${className}.`);
    } catch (err) {
      setError(errorMessage(err, 'Erro ao desvincular.'));
    } finally {
      setAction(null);
    }
  };

  return (
    <Dialog
      title="Vincular turma"
      description={
        <>
          {roleLabel}: <strong className="text-ink">{user.name}</strong>
        </>
      }
      onClose={onClose}
      busy={saving}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Fechar
          </Button>
          <Button
            variant="danger-quiet"
            icon={<Unlink className="h-4 w-4" aria-hidden="true" />}
            onClick={handleUnassign}
            disabled={!selectedClass || action === 'assign'}
            loading={action === 'unassign'}
            loadingLabel="Desvinculando…"
          >
            Desvincular
          </Button>
          <Button icon={<Link2 className="h-4 w-4" aria-hidden="true" />} onClick={handleAssign} disabled={!selectedClass || action === 'unassign'} loading={action === 'assign'} loadingLabel="Vinculando…">
            Vincular
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {success && <Alert tone="success">{success}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        <p className="text-[0.9375rem] text-ink-2">
          Escolha a turma e use Vincular para dar acesso, ou Desvincular para retirar. Repetir um vínculo que já existe não muda nada.
        </p>
        <SelectField label="Turma" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">Selecione…</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.year})
            </option>
          ))}
        </SelectField>
      </div>
    </Dialog>
  );
};
