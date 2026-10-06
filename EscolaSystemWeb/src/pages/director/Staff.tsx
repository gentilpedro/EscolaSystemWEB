import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Link2, Unlink, Briefcase, UserCheck, UserMinus, UserPlus, UserX } from 'lucide-react';
import type { UserListItem, ClassItem, PagedResult } from '../../types';
import { ROLES, RoleId } from '../../types';
import { userApi, classApi, schoolMemberApi } from '../../services/api';
import { useAuth } from '../../contexts/auth';
import { listAll } from '../../lib/paging';
import { passwordIssues } from '../../lib/password';
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
  NewPasswordField,
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

const STAFF_ROLE_IDS: number[] = [RoleId.DIRECTOR, RoleId.TEACHER, RoleId.ORIENTADOR];
const STAFF_ROLES = ROLES.filter(r => STAFF_ROLE_IDS.includes(r.id));

export const DirectorStaff: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [staff, setStaff] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserListItem | null>(null);
  const [addingExisting, setAddingExisting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      // Só os perfis de funcionário: alunos e responsáveis (a maioria das contas) ficam de fora
      const lists = await Promise.all(STAFF_ROLE_IDS.map(roleId => listAll<UserListItem>((page, size) => userApi.list(page, size, { roleId }))));
      setStaff(lists.flatMap(l => l.items).sort((a, b) => a.name.localeCompare(b.name)));
      setError(null);
    } catch {
      setError('Erro ao carregar funcionários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchStaff();
  }, [fetchStaff]);

  const handleToggleActive = async (member: UserListItem) => {
    const ok = await confirm({
      title: member.isActive ? `Desativar ${member.name}?` : `Ativar ${member.name}?`,
      description: member.email,
      consequence: member.isActive
        ? 'A pessoa deixa de conseguir entrar no sistema. As chamadas, notas e chamados que registrou continuam guardados, e ela pode ser reativada depois.'
        : 'A pessoa volta a conseguir entrar no sistema com a senha atual.',
      confirmLabel: member.isActive ? 'Desativar' : 'Ativar',
      tone: member.isActive ? 'danger' : 'primary',
    });
    if (!ok) return;
    try {
      if (member.isActive) {
        // A "exclusão" da API é a desativação: preserva o histórico
        await userApi.delete(member.id);
      } else {
        await userApi.update(member.id, {
          name: member.name,
          email: member.email,
          roleId: ROLES.find(r => r.name === member.role)?.id ?? RoleId.TEACHER,
          schoolId: member.schoolId ?? null,
          isActive: true,
          phone: member.phone ?? null,
        });
      }
      toast.success(member.isActive ? `${member.name} foi desativado.` : `${member.name} foi ativado.`);
      fetchStaff();
    } catch (err) {
      toast.error(errorMessage(err, member.isActive ? 'Erro ao desativar funcionário.' : 'Erro ao ativar funcionário.'));
    }
  };

  const otherSchools = (member: UserListItem) => (member.schools ?? []).filter(s => s.id !== user?.schoolId);

  const handleRemoveFromSchool = async (member: UserListItem) => {
    const others = otherSchools(member);
    const ok = await confirm({
      title: `Remover ${member.name} da escola?`,
      description: member.email,
      consequence:
        others.length > 0
          ? `A pessoa deixa de ver as turmas desta escola e continua em ${others.map(s => s.name).join(', ')}. As chamadas, notas e chamados que registrou aqui ficam guardados.`
          : 'A pessoa deixa de ver as turmas desta escola. Como não está em outra escola, a conta é desativada. As chamadas, notas e chamados que registrou ficam guardados.',
      confirmLabel: 'Remover da escola',
    });
    if (!ok || !user?.schoolId) return;
    try {
      await schoolMemberApi.remove(user.schoolId, member.id);
      toast.success(`${member.name} saiu da escola.`);
      fetchStaff();
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao remover da escola.'));
    }
  };

  const filtered = staff.filter(u => matches(searchTerm, u.name, u.email));

  return (
    <>
      <PageHeader
        title="Funcionários"
        description={!loading ? plural(staff.length, 'funcionário', 'funcionários') : undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<UserPlus className="h-4 w-4" aria-hidden="true" />} onClick={() => setAddingExisting(true)}>
              Adicionar existente
            </Button>
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                setEditingUser(null);
                setShowModal(true);
              }}
            >
              Novo funcionário
            </Button>
          </div>
        }
      />

      {loading ? (
        <PageLoader label="Carregando funcionários…" />
      ) : (
        <>
          {error && (
            <LoadError
              message={error}
              onRetry={() => {
                setLoading(true);
                fetchStaff();
              }}
            />
          )}

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
                filtered.map(member => {
                  // Ninguém desativa a própria conta por aqui
                  const isSelf = member.id === user?.id;
                  return (
                    <Tr key={member.id}>
                      <Td sticky strong className="whitespace-nowrap">
                        {member.name}
                        {otherSchools(member).length > 0 && (
                          <span className="block text-[0.8125rem] font-normal text-ink-3">
                            Também em {otherSchools(member).map(s => s.name).join(', ')}
                          </span>
                        )}
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
                            !isSelf &&
                            member.isActive &&
                            (canChangeSchool(member) ? (
                              <IconButton
                                tone="danger"
                                label={`Remover ${member.name} da escola`}
                                icon={<UserMinus className="h-5 w-5" />}
                                onClick={() => handleRemoveFromSchool(member)}
                              />
                            ) : (
                              <IconButton
                                tone="danger"
                                label={`Desativar ${member.name}`}
                                icon={<UserX className="h-5 w-5" />}
                                onClick={() => handleToggleActive(member)}
                              />
                            ))
                          }
                        >
                          {!isSelf && !member.isActive && (
                            <IconButton label={`Ativar ${member.name}`} icon={<UserCheck className="h-5 w-5" />} onClick={() => handleToggleActive(member)} />
                          )}
                          {(member.role === 'Teacher' || member.role === 'Orientador') && (
                            <IconButton label={`Turmas de ${member.name}`} icon={<Link2 className="h-5 w-5" />} onClick={() => setAssigningUser(member)} />
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
                  );
                })
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
      {addingExisting && user?.schoolId && (
        <AddExistingModal
          schoolId={user.schoolId}
          onClose={() => setAddingExisting(false)}
          onAdded={added => {
            toast.success(`${added.name} agora também faz parte desta escola.`);
            setAddingExisting(false);
            fetchStaff();
          }}
        />
      )}
      {assigningUser && (
        <AssignClassModal
          user={assigningUser}
          onClose={changed => {
            setAssigningUser(null);
            if (changed) fetchStaff();
          }}
        />
      )}
    </>
  );
};

const StaffModal: React.FC<{ user: UserListItem | null; onClose: () => void; onSave: () => void; directorSchoolId?: string }> = ({
  user,
  onClose,
  onSave,
  directorSchoolId,
}) => {
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    roleId: ROLES.find(r => r.name === user?.role)?.id ?? RoleId.TEACHER,
    isActive: user?.isActive ?? true,
    cpf: user?.cpf ?? '',
    phone: user?.phone ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrientador = formData.roleId === RoleId.ORIENTADOR;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && passwordIssues(formData.password).length > 0) {
      setError('A senha não atende à regra: veja o que falta abaixo do campo.');
      return;
    }
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
      const message = errorMessage(err, 'Erro ao salvar.');
      setError(
        !user && /e-mail já cadastrado/i.test(message)
          ? `${message} Se a pessoa já trabalha em outra escola, use "Adicionar existente" para trazê-la sem criar outra conta.`
          : message,
      );
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
      {!user && <NewPasswordField value={formData.password} onChange={v => setFormData({ ...formData, password: v })} />}
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
        <CheckboxField
          label="Funcionário ativo"
          checked={formData.isActive}
          onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
        />
      )}
    </FormDialog>
  );
};

/** Turmas do professor ou orientador: mostra os vínculos atuais e permite vincular e desvincular. */
const AssignClassModal: React.FC<{ user: UserListItem; onClose: (changed: boolean) => void }> = ({ user, onClose }) => {
  const confirm = useConfirm();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [linked, setLinked] = useState<string[]>(user.classIds ?? []);
  const [changed, setChanged] = useState(false);
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
  const nameOf = (id: string) => classes.find(c => c.id === id)?.name ?? 'a turma';
  const linkedClasses = classes.filter(c => linked.includes(c.id));
  const isLinked = linked.includes(selectedClass);

  const handleAssign = async () => {
    if (!selectedClass) return;
    setAction('assign');
    setError(null);
    setSuccess(null);
    try {
      if (isOrientador) await userApi.assignOrientadorClass(user.id, selectedClass);
      else await userApi.assignClass(user.id, selectedClass);
      setLinked(prev => [...new Set([...prev, selectedClass])]);
      setChanged(true);
      setSuccess(`${user.name} agora está vinculado(a) a ${nameOf(selectedClass)}.`);
      setSelectedClass('');
    } catch (err) {
      setError(errorMessage(err, 'Erro ao vincular.'));
    } finally {
      setAction(null);
    }
  };

  const handleUnassign = async (classId: string) => {
    const ok = await confirm({
      title: `Desvincular ${user.name} de ${nameOf(classId)}?`,
      consequence: `${isOrientador ? 'O orientador' : 'O professor'} deixa de ver os alunos, as notas e a chamada desta turma.`,
      confirmLabel: 'Desvincular',
    });
    if (!ok) return;
    setAction('unassign');
    setError(null);
    setSuccess(null);
    try {
      if (isOrientador) await userApi.unassignOrientadorClass(user.id, classId);
      else await userApi.unassignClass(user.id, classId);
      setLinked(prev => prev.filter(id => id !== classId));
      setChanged(true);
      setSuccess(`${user.name} foi desvinculado(a) de ${nameOf(classId)}.`);
    } catch (err) {
      setError(errorMessage(err, 'Erro ao desvincular.'));
    } finally {
      setAction(null);
    }
  };

  return (
    <Dialog
      title="Turmas"
      description={
        <>
          {roleLabel}: <strong className="text-ink">{user.name}</strong>
        </>
      }
      onClose={() => onClose(changed)}
      busy={saving}
      size="sm"
      footer={
        <Button variant="secondary" onClick={() => onClose(changed)} disabled={saving}>
          Fechar
        </Button>
      }
    >
      <div className="space-y-5">
        {success && <Alert tone="success">{success}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}

        <section aria-labelledby="turmas-vinculadas">
          <h3 id="turmas-vinculadas" className="mb-2 text-sm font-semibold text-ink">
            Vinculado(a) a
          </h3>
          {linkedClasses.length === 0 ? (
            <p className="text-[0.9375rem] text-ink-3">Nenhuma turma ainda.</p>
          ) : (
            <ul className="divide-y divide-rule rounded-md border border-rule">
              {linkedClasses.map(c => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-[0.9375rem] text-ink">
                    {c.name} <span className="text-ink-3">({c.year})</span>
                  </span>
                  <Button
                    size="sm"
                    variant="danger-quiet"
                    icon={<Unlink className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => handleUnassign(c.id)}
                    disabled={saving}
                  >
                    Desvincular<span className="sr-only"> de {c.name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap items-end gap-3">
          <SelectField
            label="Vincular a outra turma"
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            containerClassName="min-w-0 grow"
          >
            <option value="">Selecione…</option>
            {classes.map(c => (
              <option key={c.id} value={c.id} disabled={linked.includes(c.id)}>
                {c.name} ({c.year}){linked.includes(c.id) ? ' · já vinculada' : ''}
              </option>
            ))}
          </SelectField>
          <Button
            icon={<Link2 className="h-4 w-4" aria-hidden="true" />}
            onClick={handleAssign}
            disabled={!selectedClass || isLinked || action === 'unassign'}
            loading={action === 'assign'}
            loadingLabel="Vinculando…"
          >
            Vincular
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

/** Professor e orientador podem estar em várias escolas (vínculo por escola na API). */
function canChangeSchool(member: UserListItem): boolean {
  return member.role === 'Teacher' || member.role === 'Orientador';
}

/** Traz para a escola alguém que já tem conta (por exemplo, professor que dá aula em outra escola). */
const AddExistingModal: React.FC<{ schoolId: string; onClose: () => void; onAdded: (user: UserListItem) => void }> = ({ schoolId, onClose, onAdded }) => {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onAdded(await schoolMemberApi.add(schoolId, email.trim()));
    } catch (err) {
      setError(errorMessage(err, 'Erro ao adicionar à escola.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title="Adicionar funcionário existente"
      description="Para professor ou orientador que já tem conta, por exemplo porque dá aula em outra escola. Ele continua nas outras escolas."
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel="Adicionar à escola"
      size="sm"
    >
      {error && <Alert tone="error">{error}</Alert>}
      <TextField
        label="E-mail da conta"
        type="email"
        autoComplete="off"
        value={email}
        onChange={e => setEmail(e.target.value)}
        hint="O mesmo e-mail com que a pessoa entra no sistema."
        required
      />
    </FormDialog>
  );
};
