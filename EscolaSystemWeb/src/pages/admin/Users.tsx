import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Plus, Pencil, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
import type { UserListItem, PagedResult, School } from '../../types';
import { ROLES, RoleId } from '../../types';
import { authApi, userApi, schoolApi } from '../../services/api';
import { useAuth } from '../../contexts/auth';
import {
  ActiveStamp,
  Alert,
  BlockLoader,
  Button,
  CheckboxField,
  EmptyState,
  FilterBar,
  FilterSelect,
  FormDialog,
  IconButton,
  LoadError,
  NewPasswordField,
  PageHeader,
  PageLoader,
  Pagination,
  ReadOnlyField,
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
import { plural } from '../../lib/format';
import { listAll } from '../../lib/paging';
import { passwordIssues } from '../../lib/password';

const PAGE_SIZE = 15;

/** O admin cadastra só os perfis da rede; os perfis da escola são criados pela direção. */
const PLATFORM_ROLES = ROLES.filter(r => r.id === RoleId.ADMIN || r.id === RoleId.DIRECTOR);
const MULTI_SCHOOL_ROLES: number[] = [RoleId.TEACHER, RoleId.ORIENTADOR, RoleId.PARENT];

export const AdminUsers: React.FC = () => {
  const { user: sessionUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [pagedData, setPagedData] = useState<PagedResult<UserListItem> | null>(null);
  // Consulta (página + busca + perfil) cujo resultado está na tela; enquanto difere da atual, está carregando
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // A busca vai para a API só depois de uma pausa na digitação
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserListItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const query = `${page}|${search}|${roleFilter}`;

  const fetchUsers = useCallback(async () => {
    try {
      const data: PagedResult<UserListItem> = await userApi.list(page, PAGE_SIZE, {
        search: search || undefined,
        roleId: roleFilter ? Number(roleFilter) : undefined,
      });
      setPagedData(data);
      setError(null);
    } catch {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoadedQuery(`${page}|${search}|${roleFilter}`);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (user: UserListItem) => {
    const ok = await confirm({
      title: user.isActive ? `Desativar ${user.name}?` : `Ativar ${user.name}?`,
      description: user.email,
      consequence: user.isActive
        ? 'O usuário deixa de conseguir entrar no sistema. Os registros dele continuam guardados e ele pode ser reativado depois.'
        : 'O usuário volta a conseguir entrar no sistema com a senha atual.',
      confirmLabel: user.isActive ? 'Desativar' : 'Ativar',
      reversible: true,
      tone: user.isActive ? 'danger' : 'primary',
    });
    if (!ok) return;
    try {
      if (user.isActive) {
        // A "exclusão" da API é a desativação: preserva o histórico
        await userApi.delete(user.id);
      } else {
        await userApi.update(user.id, {
          name: user.name,
          email: user.email,
          roleId: ROLES.find(r => r.name === user.role)?.id ?? RoleId.DIRECTOR,
          schoolId: user.schoolId ?? null,
          isActive: true,
          phone: user.phone ?? null,
        });
      }
      toast.success(user.isActive ? `${user.name} foi desativado.` : `${user.name} foi ativado.`);
      fetchUsers();
    } catch (err) {
      toast.error(errorMessage(err, user.isActive ? 'Erro ao desativar usuário.' : 'Erro ao ativar usuário.'));
    }
  };

  const filtering = search !== '' || roleFilter !== '';
  const users = pagedData?.items ?? [];
  const loading = loadedQuery !== query;
  const isFirstLoad = loading && !pagedData;

  return (
    <>
      <PageHeader
        title="Usuários"
        description={pagedData && !filtering ? `${pagedData.totalCount.toLocaleString('pt-BR')} usuários na rede` : undefined}
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
          >
            Novo usuário
          </Button>
        }
      />

      {isFirstLoad ? (
        <PageLoader label="Carregando usuários…" />
      ) : (
        <>
          {error && <LoadError message={error} onRetry={fetchUsers} />}

          <FilterBar>
            <SearchInput
              label="Pesquisar usuários"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Pesquisar por nome ou e-mail em toda a rede…"
            />
            <FilterSelect
              label="Filtrar por perfil"
              value={roleFilter}
              onChange={v => {
                setRoleFilter(v);
                setPage(1);
              }}
            >
              <option value="">Todos os perfis</option>
              {ROLES.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </FilterSelect>
          </FilterBar>

          {filtering && pagedData && (
            <p className="-mt-3 mb-4 text-sm text-ink-3" aria-live="polite">
              {loading ? 'Pesquisando em toda a rede…' : `${plural(pagedData.totalCount, 'usuário encontrado', 'usuários encontrados')} em toda a rede`}
            </p>
          )}

          {loading ? (
            <BlockLoader label="Carregando usuários…" rows={8} />
          ) : (
            <TableFrame
              caption="Usuários"
              minWidth="56rem"
              footer={
                pagedData &&
                pagedData.totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={pagedData.totalPages}
                    totalCount={pagedData.totalCount}
                    pageSize={PAGE_SIZE}
                    noun="usuários"
                    onPage={setPage}
                  />
                )
              }
            >
              <THead>
                <Th sticky>Nome</Th>
                <Th>E-mail</Th>
                <Th>Perfil</Th>
                <Th>Escola</Th>
                <Th>Situação</Th>
                <Th align="right" srOnly>
                  Ações
                </Th>
              </THead>
              <TBody>
                {users.length === 0 ? (
                  <TableEmptyRow colSpan={6}>
                    <EmptyState icon={UsersIcon} title="Nenhum usuário encontrado" compact>
                      {filtering ? 'Ajuste a busca ou o filtro de perfil.' : undefined}
                    </EmptyState>
                  </TableEmptyRow>
                ) : (
                  users.map(user => (
                    <Tr key={user.id}>
                      <Td sticky strong className="whitespace-nowrap">
                        {user.name}
                      </Td>
                      <Td>{user.email}</Td>
                      <Td>
                        <RoleTag role={user.role} />
                      </Td>
                      <Td>
                        {user.schools && user.schools.length > 0 ? (
                          user.schools.map(sc => sc.name).join(', ')
                        ) : (
                          user.schoolName ?? <span className="text-ink-3">—</span>
                        )}
                      </Td>
                      <Td>
                        <ActiveStamp active={user.isActive} />
                      </Td>
                      <Td align="right">
                        <RowActions
                          destructive={
                            // Ninguém desativa a própria conta (a API também recusa)
                            user.isActive &&
                            user.id !== sessionUser?.id && (
                              <IconButton
                                tone="danger"
                                label={`Desativar ${user.name}`}
                                icon={<UserX className="h-5 w-5" />}
                                onClick={() => handleToggleActive(user)}
                              />
                            )
                          }
                        >
                          {!user.isActive && (
                            <IconButton label={`Ativar ${user.name}`} icon={<UserCheck className="h-5 w-5" />} onClick={() => handleToggleActive(user)} />
                          )}
                          {/* A própria senha é trocada em Configurações, com a senha atual */}
                          {user.isActive && user.id !== sessionUser?.id && (
                            <IconButton label={`Redefinir senha de ${user.name}`} icon={<KeyRound className="h-5 w-5" />} onClick={() => setResettingUser(user)} />
                          )}
                          <IconButton
                            label={`Editar ${user.name}`}
                            icon={<Pencil className="h-5 w-5" />}
                            onClick={() => {
                              setEditingUser(user);
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
          )}
        </>
      )}

      {resettingUser && (
        <ResetPasswordModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
          onSaved={() => {
            toast.success(`Senha de ${resettingUser.name} redefinida. As sessões abertas dessa conta foram encerradas.`);
            setResettingUser(null);
          }}
        />
      )}
      {showModal && (
        <UserModal
          user={editingUser}
          isSelf={editingUser !== null && editingUser.id === sessionUser?.id}
          onClose={() => setShowModal(false)}
          onSave={() => {
            toast.success(editingUser ? 'Usuário atualizado.' : 'Usuário criado.');
            setShowModal(false);
            fetchUsers();
          }}
        />
      )}
    </>
  );
};

interface UserModalProps {
  user: UserListItem | null;
  /** Editando a própria conta: perfil e situação não mudam por aqui */
  isSelf?: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, isSelf = false, onClose, onSave }) => {
  const currentRole = ROLES.find(r => r.name === user?.role);
  // Na edição, o perfil atual continua na lista mesmo que seja da escola (a API não troca para perfil da escola)
  const roleOptions = currentRole && !PLATFORM_ROLES.includes(currentRole) ? [...PLATFORM_ROLES, currentRole] : PLATFORM_ROLES;
  // Professor, orientador e responsável podem estar em várias escolas: quem cuida disso é a direção de cada uma
  const multiSchool = currentRole !== undefined && MULTI_SCHOOL_ROLES.includes(currentRole.id);
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    roleId: currentRole?.id ?? RoleId.DIRECTOR,
    schoolId: user?.schoolId ?? '',
    isActive: user?.isActive ?? true,
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolsFailed, setSchoolsFailed] = useState(false);

  useEffect(() => {
    listAll<School>((page, size) => schoolApi.list(page, size))
      .then(data => setSchools(data.items ?? []))
      .catch(() => setSchoolsFailed(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && passwordIssues(formData.password).length > 0) {
      setError('A senha não atende à regra: veja o que falta abaixo do campo.');
      return;
    }
    setSaving(true);
    setError(null);
    const schoolId = formData.roleId === RoleId.ADMIN ? null : formData.schoolId || null;
    try {
      if (user) {
        await userApi.update(user.id, {
          name: formData.name,
          email: formData.email,
          roleId: formData.roleId,
          schoolId,
          isActive: formData.isActive,
          phone: user.phone ?? null,
        });
      } else {
        await userApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          schoolId,
        });
      }
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar usuário.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title={user ? 'Editar usuário' : 'Novo usuário'} onClose={onClose} onSubmit={handleSubmit} saving={saving} submitLabel="Salvar">
      {error && <Alert tone="error">{error}</Alert>}
      {!user && (
        <p className="text-[0.9375rem] text-ink-2">
          Aqui a administração cadastra administradores e diretores. Professores, orientadores, alunos e responsáveis são cadastrados pela direção de cada
          escola.
        </p>
      )}
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
      {isSelf ? (
        <ReadOnlyField label="Perfil">
          {currentRole?.label ?? user?.role}
          <span className="mt-1 block text-[0.8125rem] text-ink-3">Outro administrador pode mudar o seu perfil.</span>
        </ReadOnlyField>
      ) : (
        <SelectField label="Perfil" value={formData.roleId} onChange={e => setFormData({ ...formData, roleId: Number(e.target.value) })} required>
          {roleOptions.map(r => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </SelectField>
      )}

      {multiSchool && formData.roleId === currentRole?.id ? (
        <ReadOnlyField label={user?.schools && user.schools.length > 1 ? 'Escolas' : 'Escola'}>
          {user?.schools?.map(sc => sc.name).join(', ') || user?.schoolName || '—'}
          <span className="mt-1 block text-[0.8125rem] text-ink-3">A direção de cada escola adiciona ou remove esta pessoa.</span>
        </ReadOnlyField>
      ) : formData.roleId !== RoleId.ADMIN && (
        <SelectField
          label="Escola"
          value={formData.schoolId}
          onChange={e => setFormData({ ...formData, schoolId: e.target.value })}
          error={schoolsFailed ? 'Não foi possível carregar as escolas. Feche e abra o formulário de novo.' : undefined}
          required
        >
          <option value="">Selecione a escola…</option>
          {/* Escola desativada não recebe ninguém novo; na edição, a escola atual aparece mesmo inativa */}
          {schools
            .filter(s => s.isActive || s.id === user?.schoolId)
            .map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.isActive ? '' : ' (inativa)'}
              </option>
            ))}
        </SelectField>
      )}

      {user && !isSelf && (
        <CheckboxField label="Usuário ativo" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
      )}
    </FormDialog>
  );
};

/** Senha nova para outra pessoa: o nome e o e-mail ficam à vista, para não redefinir a conta errada. */
const ResetPasswordModal: React.FC<{ user: UserListItem; onClose: () => void; onSaved: () => void }> = ({ user, onClose, onSaved }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mismatch = confirmation !== '' && password !== confirmation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    if (passwordIssues(password).length > 0) {
      setError('A senha não atende à regra: veja o que falta abaixo do campo.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await authApi.resetPassword(user.email, password);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao redefinir a senha.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title="Redefinir senha"
      description="A pessoa entra com a senha nova; as sessões abertas dela são encerradas."
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel="Redefinir senha"
      size="sm"
    >
      {error && <Alert tone="error">{error}</Alert>}
      <ReadOnlyField label="Conta">
        {user.name}
        <span className="block break-all text-[0.8125rem] text-ink-3">{user.email}</span>
      </ReadOnlyField>
      <NewPasswordField label="Nova senha" value={password} onChange={setPassword} />
      <TextField
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        value={confirmation}
        onChange={e => setConfirmation(e.target.value)}
        error={mismatch ? 'As senhas não coincidem.' : undefined}
        required
      />
    </FormDialog>
  );
};
