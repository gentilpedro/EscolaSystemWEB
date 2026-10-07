import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KeyRound, Plus, Pencil, Unlock, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
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
  Stamp,
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
import { formatTime, plural } from '../../lib/format';
import { listAll } from '../../lib/paging';
import { passwordIssues } from '../../lib/password';

const PAGE_SIZE = 15;

/** O admin cuida do sistema: vê e gerencia só administradores e diretores. As pessoas das escolas ficam com a direção. */
const PLATFORM_ROLES = ROLES.filter(r => r.id === RoleId.ADMIN || r.id === RoleId.DIRECTOR);

export const AdminUsers: React.FC = () => {
  const { user: sessionUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [pagedData, setPagedData] = useState<PagedResult<UserListItem> | null>(null);
  // Consulta (página + busca + perfil) cujo resultado está na tela; enquanto difere da atual, está carregando
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  // Atalho do painel: ?busca= já filtra (ex.: a conta bloqueada a desbloquear)
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('busca') ?? '');
  // A busca vai para a API só depois de uma pausa na digitação
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [page, setPage] = useState(1);
  // Atalho do painel: ?novo=diretor&escola=<id> abre o cadastro de diretor já com a escola
  const [showModal, setShowModal] = useState(() => searchParams.get('novo') === 'diretor');
  const [presetSchoolId] = useState(() => searchParams.get('escola') ?? '');
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserListItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    // Sem a lista de escolas, o filtro só não aparece; a lista de usuários continua
    listAll<School>((p, size) => schoolApi.list(p, size))
      .then(data => setSchools([...data.items].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setSchools([]));
  }, []);

  const query = `${page}|${search}|${roleFilter}|${schoolFilter}`;

  const fetchUsers = useCallback(async () => {
    try {
      const data: PagedResult<UserListItem> = await userApi.list(page, PAGE_SIZE, {
        search: search || undefined,
        roleId: roleFilter ? Number(roleFilter) : undefined,
        schoolId: schoolFilter || undefined,
      });
      setPagedData(data);
      setError(null);
    } catch {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoadedQuery(`${page}|${search}|${roleFilter}|${schoolFilter}`);
    }
  }, [page, search, roleFilter, schoolFilter]);

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

  const handleUnlock = async (user: UserListItem) => {
    const ok = await confirm({
      title: `Desbloquear ${user.name}?`,
      description: user.email,
      consequence: 'A pessoa volta a entrar na hora, com a senha que já tem, sem esperar o fim do bloqueio.',
      confirmLabel: 'Desbloquear',
      reversible: true,
      tone: 'primary',
    });
    if (!ok) return;
    try {
      await userApi.unlock(user.id);
      toast.success(`${user.name} foi desbloqueado.`);
      fetchUsers();
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao desbloquear.'));
    }
  };

  const filtering = search !== '' || roleFilter !== '' || schoolFilter !== '';
  const users = pagedData?.items ?? [];
  const loading = loadedQuery !== query;
  const isFirstLoad = loading && !pagedData;

  const actionsFor = (user: UserListItem) => (
    <RowActions
      destructive={
        // Ninguém desativa a própria conta (a API também recusa)
        user.isActive &&
        user.id !== sessionUser?.id && (
          <IconButton tone="danger" label={`Desativar ${user.name}`} icon={<UserX className="h-5 w-5" />} onClick={() => handleToggleActive(user)} />
        )
      }
    >
      {!user.isActive && <IconButton label={`Ativar ${user.name}`} icon={<UserCheck className="h-5 w-5" />} onClick={() => handleToggleActive(user)} />}
      {isLocked(user) && user.id !== sessionUser?.id && (
        <IconButton label={`Desbloquear ${user.name}`} icon={<Unlock className="h-5 w-5" />} onClick={() => handleUnlock(user)} />
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
  );

  const empty = (
    <EmptyState icon={UsersIcon} title="Nenhum usuário encontrado" compact>
      {filtering ? 'Ajuste a busca ou os filtros.' : undefined}
    </EmptyState>
  );

  const pagination = pagedData && pagedData.totalPages > 1 && (
    <Pagination page={page} totalPages={pagedData.totalPages} totalCount={pagedData.totalCount} pageSize={PAGE_SIZE} noun="usuários" onPage={setPage} />
  );

  return (
    <>
      <PageHeader
        title="Usuários"
        description={
          pagedData && !filtering
            ? `${plural(pagedData.totalCount, 'conta', 'contas')} de administração e direção. As pessoas de cada escola ficam com a direção dela.`
            : undefined
        }
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
              placeholder="Pesquisar administradores e diretores por nome ou e-mail…"
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
              {PLATFORM_ROLES.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </FilterSelect>
            {schools.length > 0 && (
              <FilterSelect
                label="Filtrar por escola"
                value={schoolFilter}
                onChange={v => {
                  setSchoolFilter(v);
                  setPage(1);
                }}
              >
                <option value="">Todas as escolas</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.isActive ? s.name : `${s.name} (inativa)`}
                  </option>
                ))}
              </FilterSelect>
            )}
          </FilterBar>

          {filtering && pagedData && (
            <p className="-mt-3 mb-4 text-sm text-ink-3" aria-live="polite">
              {loading ? 'Pesquisando…' : plural(pagedData.totalCount, 'conta encontrada', 'contas encontradas')}
            </p>
          )}

          {loading ? (
            <BlockLoader label="Carregando usuários…" rows={8} />
          ) : (
            <>
              {/* Celular: um cartão por usuário, sem rolar para o lado */}
              <div className="md:hidden">
                {users.length === 0 ? (
                  <div className="rounded-lg border border-rule bg-surface">{empty}</div>
                ) : (
                  <ul className="space-y-3" aria-label="Usuários">
                    {users.map(user => (
                      <li key={user.id} className="rounded-lg border border-rule bg-surface px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">{user.name}</p>
                            <p className="break-all text-sm text-ink-3">{user.email}</p>
                          </div>
                          <AccountStatus user={user} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
                          <RoleTag role={user.role} />
                          <span>{schoolsOf(user) ?? 'Sem escola'}</span>
                        </div>
                        <div className="mt-2 border-t border-rule pt-2">{actionsFor(user)}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {pagination && <div className="mt-3 overflow-hidden rounded-lg border border-rule bg-surface">{pagination}</div>}
              </div>

              <TableFrame caption="Usuários" minWidth="56rem" className="hidden md:block" footer={pagination}>
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
                    <TableEmptyRow colSpan={6}>{empty}</TableEmptyRow>
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
                        <Td>{schoolsOf(user) ?? <span className="text-ink-3">—</span>}</Td>
                        <Td>
                          <AccountStatus user={user} />
                        </Td>
                        <Td align="right">{actionsFor(user)}</Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </TableFrame>
            </>
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
          initialSchoolId={editingUser ? undefined : presetSchoolId}
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

/** Bloqueio por senha errada ainda valendo */
const isLocked = (user: UserListItem) => !!user.lockedUntil && new Date(user.lockedUntil) > new Date();

/** Situação da conta: ativa ou inativa e, se for o caso, até quando está bloqueada (em texto, não só cor) */
const AccountStatus: React.FC<{ user: UserListItem }> = ({ user }) => (
  <span className="inline-flex flex-wrap items-center gap-1.5">
    <ActiveStamp active={user.isActive} />
    {isLocked(user) && <Stamp tone="amber">Bloqueada até {formatTime(new Date(user.lockedUntil!))}</Stamp>}
  </span>
);

/** Escolas em que a pessoa está (várias para professor, orientador e responsável) */
const schoolsOf = (user: UserListItem): string | null =>
  user.schools && user.schools.length > 0 ? user.schools.map(sc => sc.name).join(', ') : (user.schoolName ?? null);

interface UserModalProps {
  user: UserListItem | null;
  /** Editando a própria conta: perfil e situação não mudam por aqui */
  isSelf?: boolean;
  /** Escola já escolhida no cadastro (atalho "Cadastrar diretor" do painel) */
  initialSchoolId?: string;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, isSelf = false, initialSchoolId, onClose, onSave }) => {
  const currentRole = ROLES.find(r => r.name === user?.role);
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    roleId: currentRole?.id ?? RoleId.DIRECTOR,
    schoolId: user?.schoolId ?? initialSchoolId ?? '',
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
          {PLATFORM_ROLES.map(r => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </SelectField>
      )}

      {formData.roleId !== RoleId.ADMIN && (
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
