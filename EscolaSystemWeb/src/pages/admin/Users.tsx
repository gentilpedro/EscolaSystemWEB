import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
import type { UserListItem, StudentItem, PagedResult, School } from '../../types';
import { ROLES } from '../../types';
import { userApi, schoolApi, studentApi } from '../../services/api';
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
  PageHeader,
  PageLoader,
  Pagination,
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
import { listAll } from '../../lib/paging';

const PAGE_SIZE = 15;

export const AdminUsers: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [pagedData, setPagedData] = useState<PagedResult<UserListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  // Com busca ou filtro ativos, a pesquisa cobre a rede inteira (não só a página atual)
  const [allUsers, setAllUsers] = useState<UserListItem[] | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data: PagedResult<UserListItem> = await userApi.list(page, PAGE_SIZE);
      setPagedData(data);
      setError(null);
    } catch {
      setError('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchAllUsers = useCallback(async () => {
    setLoadingAll(true);
    try {
      const data = await listAll<UserListItem>((p, size) => userApi.list(p, size));
      setAllUsers(data.items);
    } catch {
      setError('Erro ao pesquisar usuários.');
    } finally {
      setLoadingAll(false);
    }
  }, []);

  const refresh = () => {
    fetchUsers();
    if (allUsers) fetchAllUsers();
  };

  const updateFilter = (apply: () => void) => {
    apply();
    if (!allUsers && !loadingAll) fetchAllUsers();
  };

  const handleDelete = async (user: UserListItem) => {
    const ok = await confirm({ title: `Excluir o usuário ${user.name}?`, description: user.email, confirmLabel: 'Excluir usuário' });
    if (!ok) return;
    try {
      await userApi.delete(user.id);
      toast.success('Usuário excluído.');
      refresh();
    } catch {
      toast.error('Erro ao excluir usuário.');
    }
  };

  const handleToggleActive = async (user: UserListItem) => {
    const ok = await confirm({
      title: user.isActive ? `Desativar ${user.name}?` : `Ativar ${user.name}?`,
      description: user.email,
      consequence: user.isActive
        ? 'O usuário deixa de conseguir entrar no sistema. Os registros dele continuam guardados e ele pode ser reativado depois.'
        : 'O usuário volta a conseguir entrar no sistema com a senha atual.',
      confirmLabel: user.isActive ? 'Desativar' : 'Ativar',
      tone: user.isActive ? 'danger' : 'primary',
    });
    if (!ok) return;
    try {
      await userApi.update(user.id, {
        name: user.name,
        email: user.email,
        roleId: ROLES.find(r => r.name === user.role)?.id ?? 3,
        schoolId: user.schoolId ?? null,
        isActive: !user.isActive,
      });
      toast.success(user.isActive ? `${user.name} foi desativado.` : `${user.name} foi ativado.`);
      refresh();
    } catch {
      toast.error('Erro ao atualizar usuário.');
    }
  };

  const filtering = searchTerm.trim() !== '' || roleFilter !== '';
  const source = filtering && allUsers ? allUsers : pagedData?.items ?? [];
  const filteredUsers = source.filter(u => matches(searchTerm, u.name, u.email) && (roleFilter ? u.role === roleFilter : true));

  const isFirstLoad = loading && !pagedData;

  return (
    <>
      <PageHeader
        title="Usuários"
        description={pagedData ? `${pagedData.totalCount.toLocaleString('pt-BR')} usuários na rede` : undefined}
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
          {error && <LoadError message={error} onRetry={() => { setLoading(true); fetchUsers(); }} />}

          <FilterBar>
            <SearchInput
              label="Pesquisar usuários"
              value={searchTerm}
              onChange={v => updateFilter(() => setSearchTerm(v))}
              placeholder="Pesquisar por nome ou e-mail em toda a rede…"
            />
            <FilterSelect label="Filtrar por perfil" value={roleFilter} onChange={v => updateFilter(() => setRoleFilter(v))}>
              <option value="">Todos os perfis</option>
              {ROLES.map(r => (
                <option key={r.id} value={r.name}>
                  {r.label}
                </option>
              ))}
            </FilterSelect>
          </FilterBar>

          {filtering && (
            <p className="-mt-3 mb-4 text-sm text-ink-3" aria-live="polite">
              {loadingAll ? 'Pesquisando em toda a rede…' : `${plural(filteredUsers.length, 'usuário encontrado', 'usuários encontrados')} em toda a rede`}
            </p>
          )}

          {loading || (filtering && loadingAll) ? (
            <BlockLoader label="Carregando usuários…" rows={8} />
          ) : (
            <TableFrame
              caption="Usuários"
              minWidth="56rem"
              footer={
                !filtering &&
                pagedData &&
                pagedData.totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={pagedData.totalPages}
                    totalCount={pagedData.totalCount}
                    pageSize={PAGE_SIZE}
                    noun="usuários"
                    onPage={p => {
                      setLoading(true);
                      setPage(p);
                    }}
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
                {filteredUsers.length === 0 ? (
                  <TableEmptyRow colSpan={6}>
                    <EmptyState icon={UsersIcon} title="Nenhum usuário encontrado" compact>
                      {searchTerm || roleFilter ? 'Ajuste a busca ou o filtro de perfil nesta página.' : undefined}
                    </EmptyState>
                  </TableEmptyRow>
                ) : (
                  filteredUsers.map(user => (
                    <Tr key={user.id}>
                      <Td sticky strong className="whitespace-nowrap">
                        {user.name}
                      </Td>
                      <Td>{user.email}</Td>
                      <Td>
                        <RoleTag role={user.role} />
                      </Td>
                      <Td>{user.schoolName ?? <span className="text-ink-3">—</span>}</Td>
                      <Td>
                        <ActiveStamp active={user.isActive} />
                      </Td>
                      <Td align="right">
                        <RowActions
                          destructive={
                            <IconButton
                              tone="danger"
                              label={`Excluir ${user.name}`}
                              icon={<Trash2 className="h-5 w-5" />}
                              onClick={() => handleDelete(user)}
                            />
                          }
                        >
                          <IconButton
                            label={user.isActive ? `Desativar ${user.name}` : `Ativar ${user.name}`}
                            icon={user.isActive ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                            onClick={() => handleToggleActive(user)}
                          />
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

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => setShowModal(false)}
          onSave={() => {
            toast.success(editingUser ? 'Usuário atualizado.' : 'Usuário criado.');
            setShowModal(false);
            refresh();
          }}
        />
      )}
    </>
  );
};

interface UserModalProps {
  user: UserListItem | null;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    roleId: ROLES.find(r => r.name === user?.role)?.id ?? 3,
    schoolId: user?.schoolId ?? '',
    studentId: '',
    isActive: user?.isActive ?? true,
  });
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolsFailed, setSchoolsFailed] = useState(false);
  const [studentsFailed, setStudentsFailed] = useState(false);

  useEffect(() => {
    listAll<School>((page, size) => schoolApi.list(page, size))
      .then(data => setSchools(data.items ?? []))
      .catch(() => setSchoolsFailed(true));
  }, []);

  useEffect(() => {
    if (formData.roleId === 4) {
      listAll<StudentItem>((page, size) => studentApi.list(page, size))
        .then(data => setStudents(data.items ?? []))
        .catch(() => setStudentsFailed(true));
    }
  }, [formData.roleId]);

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
          schoolId: formData.schoolId || null,
          isActive: formData.isActive,
        });
      } else {
        await userApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId,
          schoolId: formData.schoolId || null,
          studentId: formData.roleId === 4 ? formData.studentId || null : null,
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
      <SelectField label="Perfil" value={formData.roleId} onChange={e => setFormData({ ...formData, roleId: Number(e.target.value) })} required>
        {ROLES.map(r => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </SelectField>

      {formData.roleId === 4 && !user && (
        <SelectField
          label="Aluno vinculado"
          value={formData.studentId}
          onChange={e => setFormData({ ...formData, studentId: e.target.value })}
          error={studentsFailed ? 'Não foi possível carregar os alunos. Feche e abra o formulário de novo.' : undefined}
          required
        >
          <option value="">Selecione o aluno…</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.className}
            </option>
          ))}
        </SelectField>
      )}

      {formData.roleId !== 1 && (
        <SelectField
          label="Escola"
          value={formData.schoolId}
          onChange={e => setFormData({ ...formData, schoolId: e.target.value })}
          error={schoolsFailed ? 'Não foi possível carregar as escolas. Feche e abra o formulário de novo.' : undefined}
          required={!user}
        >
          <option value="">Selecione a escola…</option>
          {schools.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
      )}

      {user && (
        <CheckboxField label="Usuário ativo" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
      )}
    </FormDialog>
  );
};
