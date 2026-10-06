import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, GraduationCap, KeyRound, Users, Link2, Unlink, UserPlus } from 'lucide-react';
import type { StudentItem, ClassItem, PagedResult, UserListItem } from '../../types';
import { RoleId } from '../../types';
import { studentApi, classApi, userApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
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
  FilterSelect,
  FormDialog,
  IconButton,
  LoadError,
  NewPasswordField,
  PageHeader,
  PageLoader,
  ReadOnlyField,
  RowActions,
  SearchInput,
  SelectField,
  Stamp,
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
import { formatDate, matches, plural } from '../../lib/format';

export const DirectorStudents: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  // Contas de aluno e de responsável da escola, para mostrar quem já tem acesso
  const [studentAccounts, setStudentAccounts] = useState<UserListItem[]>([]);
  const [parents, setParents] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [accessFor, setAccessFor] = useState<StudentItem | null>(null);
  const [parentsFor, setParentsFor] = useState<StudentItem | null>(null);

  const fetchAccounts = useCallback(async () => {
    const [accounts, parentList] = await Promise.all([
      listAll<UserListItem>((page, size) => userApi.list(page, size, { roleId: RoleId.STUDENT })),
      listAll<UserListItem>((page, size) => userApi.list(page, size, { roleId: RoleId.PARENT })),
    ]);
    setStudentAccounts(accounts.items);
    setParents(parentList.items);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        listAll<StudentItem>((page, size) => studentApi.list(page, size)),
        classApi.list(1, 100) as Promise<PagedResult<ClassItem>>,
        fetchAccounts(),
      ]);
      setStudents(studentsData.items);
      setClasses(classesData.items);
      setError(null);
    } catch {
      setError('Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }, [fetchAccounts]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (student: StudentItem) => {
    const ok = await confirm({
      title: `Excluir o aluno ${student.name}?`,
      description: `Matrícula ${student.registration} · ${student.className}`,
      consequence:
        'Só é possível excluir aluno sem notas, chamadas, chamados ou trabalhos. Para registrar uma transferência sem apagar o histórico, edite e desmarque "Aluno ativo".',
      confirmLabel: 'Excluir aluno',
    });
    if (!ok) return;
    try {
      await studentApi.delete(student.id);
      toast.success(`${student.name} foi excluído.`);
      fetchAll();
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao excluir aluno.'));
    }
  };

  const accountOf = (studentId: string) => studentAccounts.find(a => a.studentId === studentId);
  const parentsOf = (studentId: string) => parents.filter(p => p.studentIds?.includes(studentId));

  const filtered = students.filter(s => matches(searchTerm, s.name, s.email, s.registration) && (classFilter ? s.classId === classFilter : true));

  return (
    <>
      <PageHeader
        title="Alunos"
        description={!loading ? plural(students.length, 'aluno matriculado', 'alunos matriculados') : undefined}
        actions={
          <Button
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setEditingStudent(null);
              setShowModal(true);
            }}
          >
            Novo aluno
          </Button>
        }
      />

      {loading ? (
        <PageLoader label="Carregando alunos…" />
      ) : (
        <>
          {error && (
            <LoadError
              message={error}
              onRetry={() => {
                setLoading(true);
                fetchAll();
              }}
            />
          )}

          <FilterBar>
            <SearchInput label="Pesquisar alunos" value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar por nome, e-mail ou matrícula…" />
            <FilterSelect label="Filtrar por turma" value={classFilter} onChange={setClassFilter}>
              <option value="">Todas as turmas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FilterSelect>
          </FilterBar>

          <TableFrame caption="Alunos matriculados" minWidth="64rem">
            <THead>
              <Th sticky>Nome</Th>
              <Th>Matrícula</Th>
              <Th>Turma</Th>
              <Th>Nascimento</Th>
              <Th>Acesso do aluno</Th>
              <Th>Responsáveis</Th>
              <Th>Situação</Th>
              <Th align="right" srOnly>
                Ações
              </Th>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmptyRow colSpan={8}>
                  <EmptyState icon={GraduationCap} title={students.length === 0 ? 'Nenhum aluno matriculado' : 'Nenhum aluno encontrado'} compact>
                    {students.length === 0 ? 'Use “Novo aluno” para matricular.' : 'Ajuste a busca ou o filtro de turma.'}
                  </EmptyState>
                </TableEmptyRow>
              ) : (
                filtered.map(student => {
                  const account = accountOf(student.id);
                  const studentParents = parentsOf(student.id);
                  return (
                    <Tr key={student.id}>
                      <Td sticky strong className="whitespace-nowrap">
                        {student.name}
                        <span className="block text-[0.8125rem] font-normal text-ink-3">{student.email}</span>
                      </Td>
                      <Td className="figures text-sm">{student.registration}</Td>
                      <Td className="whitespace-nowrap">{student.className}</Td>
                      <Td className="figures text-sm">{formatDate(student.birthDate)}</Td>
                      <Td>
                        {account ? (
                          <Stamp tone={account.isActive ? 'blue' : 'neutral'}>{account.isActive ? 'Com acesso' : 'Acesso desativado'}</Stamp>
                        ) : (
                          <span className="text-ink-3">Sem acesso</span>
                        )}
                      </Td>
                      <Td className="max-w-56">
                        {studentParents.length === 0 ? <span className="text-ink-3">Nenhum</span> : studentParents.map(p => p.name).join(', ')}
                      </Td>
                      <Td>
                        <ActiveStamp active={student.isActive} />
                      </Td>
                      <Td align="right">
                        <RowActions
                          destructive={
                            <IconButton tone="danger" label={`Excluir ${student.name}`} icon={<Trash2 className="h-5 w-5" />} onClick={() => handleDelete(student)} />
                          }
                        >
                          {!account && student.isActive && (
                            <IconButton label={`Criar acesso de ${student.name}`} icon={<KeyRound className="h-5 w-5" />} onClick={() => setAccessFor(student)} />
                          )}
                          <IconButton label={`Responsáveis de ${student.name}`} icon={<Users className="h-5 w-5" />} onClick={() => setParentsFor(student)} />
                          <IconButton
                            label={`Editar ${student.name}`}
                            icon={<Pencil className="h-5 w-5" />}
                            onClick={() => {
                              setEditingStudent(student);
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
        <StudentModal
          student={editingStudent}
          classes={classes}
          onClose={() => setShowModal(false)}
          onSave={() => {
            toast.success(editingStudent ? 'Aluno atualizado.' : 'Aluno matriculado.');
            setShowModal(false);
            fetchAll();
          }}
        />
      )}
      {accessFor && (
        <StudentAccessModal
          student={accessFor}
          schoolId={user?.schoolId}
          onClose={() => setAccessFor(null)}
          onSave={() => {
            toast.success(`${accessFor.name} já pode entrar no sistema.`);
            setAccessFor(null);
            fetchAccounts().catch(() => setError('Erro ao atualizar os acessos.'));
          }}
        />
      )}
      {parentsFor && (
        <ParentsModal
          student={parentsFor}
          schoolId={user?.schoolId}
          parents={parents}
          onChanged={() => fetchAccounts().catch(() => setError('Erro ao atualizar os responsáveis.'))}
          onClose={() => setParentsFor(null)}
        />
      )}
    </>
  );
};

const StudentModal: React.FC<{ student: StudentItem | null; classes: ClassItem[]; onClose: () => void; onSave: () => void }> = ({
  student,
  classes,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: student?.name ?? '',
    email: student?.email ?? '',
    registration: student?.registration ?? '',
    birthDate: student?.birthDate ?? '',
    classId: student?.classId ?? '',
    isActive: student?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (student) {
        await studentApi.update(student.id, {
          name: formData.name,
          email: formData.email,
          registration: formData.registration,
          birthDate: formData.birthDate,
          classId: formData.classId,
          isActive: formData.isActive,
        });
      } else {
        await studentApi.create({
          name: formData.name,
          email: formData.email,
          registration: formData.registration,
          birthDate: formData.birthDate,
          classId: formData.classId,
        });
      }
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar aluno.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title={student ? 'Editar aluno' : 'Novo aluno'} onClose={onClose} onSubmit={handleSubmit} saving={saving} submitLabel="Salvar">
      {error && <Alert tone="error">{error}</Alert>}
      <TextField label="Nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
      <TextField label="E-mail" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Matrícula"
          className="figures"
          value={formData.registration}
          onChange={e => setFormData({ ...formData, registration: e.target.value })}
          placeholder="Ex.: 2024001"
          required
        />
        <TextField
          label="Data de nascimento"
          type="date"
          className="figures"
          value={formData.birthDate}
          onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
          required
        />
      </div>
      <SelectField label="Turma" value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} required>
        <option value="">Selecione a turma…</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.year})
          </option>
        ))}
      </SelectField>
      {student && <CheckboxField label="Aluno ativo" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />}
    </FormDialog>
  );
};

/** Conta de acesso do aluno: perfil Aluno ligado ao cadastro de matrícula. */
const StudentAccessModal: React.FC<{ student: StudentItem; schoolId?: string; onClose: () => void; onSave: () => void }> = ({
  student,
  schoolId,
  onClose,
  onSave,
}) => {
  const [email, setEmail] = useState(student.email);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordIssues(password).length > 0) {
      setError('A senha não atende à regra: veja o que falta abaixo do campo.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await userApi.create({ name: student.name, email, password, roleId: RoleId.STUDENT, schoolId: schoolId ?? null, studentId: student.id });
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao criar o acesso do aluno.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title="Criar acesso do aluno"
      description="Com o acesso, o aluno entra no portal para ver notas, frequência e trabalhos."
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel="Criar acesso"
      size="sm"
    >
      {error && <Alert tone="error">{error}</Alert>}
      <ReadOnlyField label="Aluno">
        {student.name} · {student.className}
      </ReadOnlyField>
      <TextField
        label="E-mail de acesso"
        type="email"
        autoComplete="off"
        value={email}
        onChange={e => setEmail(e.target.value)}
        hint="Vem do cadastro do aluno; troque se ele vai entrar com outro e-mail."
        required
      />
      <NewPasswordField label="Senha inicial" value={password} onChange={setPassword} />
    </FormDialog>
  );
};

/** Responsáveis do aluno: vincular um já cadastrado, cadastrar um novo ou desvincular. */
const ParentsModal: React.FC<{
  student: StudentItem;
  schoolId?: string;
  parents: UserListItem[];
  onChanged: () => void;
  onClose: () => void;
}> = ({ student, schoolId, parents, onChanged, onClose }) => {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const linked = parents.filter(p => p.studentIds?.includes(student.id));
  const available = parents.filter(p => p.isActive && !p.studentIds?.includes(student.id));

  const run = async (action: () => Promise<void>, ok: string, fallback: string) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await action();
      setSuccess(ok);
      onChanged();
    } catch (err) {
      setError(errorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const linkExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    const parent = parents.find(p => p.id === existingId);
    if (!parent) return;
    await run(
      async () => {
        await userApi.assignStudent(parent.id, student.id);
        setExistingId('');
      },
      `${parent.name} agora acompanha ${student.name}.`,
      'Erro ao vincular o responsável.',
    );
  };

  const createAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordIssues(form.password).length > 0) {
      setError('A senha não atende à regra: veja o que falta abaixo do campo.');
      return;
    }
    await run(
      async () => {
        const created: UserListItem = await userApi.create({
          name: form.name,
          email: form.email,
          password: form.password,
          roleId: RoleId.PARENT,
          schoolId: schoolId ?? null,
          phone: form.phone || null,
        });
        try {
          await userApi.assignStudent(created.id, student.id);
        } catch (err) {
          throw new Error(`O responsável foi cadastrado, mas não foi vinculado: ${errorMessage(err, 'tente vincular pela lista acima')}`, { cause: err });
        }
        setForm({ name: '', email: '', phone: '', password: '' });
      },
      `${form.name} foi cadastrado e já acompanha ${student.name}.`,
      'Erro ao cadastrar o responsável.',
    );
  };

  const unlink = async (parent: UserListItem) => {
    const ok = await confirm({
      title: `Desvincular ${parent.name} de ${student.name}?`,
      consequence: 'O responsável deixa de ver os chamados deste aluno. A conta dele continua ativa.',
      confirmLabel: 'Desvincular',
    });
    if (!ok) return;
    await run(() => userApi.unassignStudent(parent.id, student.id), `${parent.name} foi desvinculado de ${student.name}.`, 'Erro ao desvincular.');
  };

  return (
    <Dialog
      title="Responsáveis"
      description={
        <>
          Aluno: <strong className="text-ink">{student.name}</strong> · {student.className}
        </>
      }
      onClose={onClose}
      busy={busy}
      footer={
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Fechar
        </Button>
      }
    >
      <div className="space-y-6">
        {success && <Alert tone="success">{success}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}

        <section aria-labelledby="responsaveis-vinculados">
          <h3 id="responsaveis-vinculados" className="mb-2 text-sm font-semibold text-ink">
            Vinculados
          </h3>
          {linked.length === 0 ? (
            <p className="text-[0.9375rem] text-ink-3">Nenhum responsável vinculado ainda.</p>
          ) : (
            <ul className="divide-y divide-rule rounded-md border border-rule">
              {linked.map(p => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 text-[0.9375rem]">
                    <span className="font-semibold text-ink">{p.name}</span>
                    <span className="block break-all text-[0.8125rem] text-ink-3">
                      {p.email}
                      {p.phone ? ` · ${p.phone}` : ''}
                      {!p.isActive ? ' · conta desativada' : ''}
                    </span>
                  </span>
                  <Button size="sm" variant="danger-quiet" icon={<Unlink className="h-4 w-4" aria-hidden="true" />} onClick={() => unlink(p)} disabled={busy}>
                    Desvincular<span className="sr-only"> {p.name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={linkExisting} className="flex flex-wrap items-end gap-3" aria-label="Vincular responsável já cadastrado">
          <SelectField
            label="Vincular responsável já cadastrado"
            value={existingId}
            onChange={e => setExistingId(e.target.value)}
            containerClassName="min-w-0 grow"
            hint={available.length === 0 ? 'Nenhum outro responsável ativo na escola.' : 'Útil para irmãos: o mesmo responsável acompanha mais de um aluno.'}
          >
            <option value="">Selecione…</option>
            {available.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.email}
              </option>
            ))}
          </SelectField>
          <Button type="submit" variant="secondary" icon={<Link2 className="h-4 w-4" aria-hidden="true" />} disabled={!existingId || busy}>
            Vincular
          </Button>
        </form>

        <form onSubmit={createAndLink} className="space-y-4 border-t border-rule pt-5" aria-labelledby="novo-responsavel">
          <h3 id="novo-responsavel" className="text-sm font-semibold text-ink">
            Cadastrar novo responsável
          </h3>
          <TextField label="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="E-mail" type="email" autoComplete="off" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <TextField
              label="Telefone"
              type="tel"
              className="figures"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
          <NewPasswordField label="Senha inicial" value={form.password} onChange={v => setForm({ ...form, password: v })} />
          <Button type="submit" icon={<UserPlus className="h-4 w-4" aria-hidden="true" />} loading={busy} loadingLabel="Salvando…">
            Cadastrar e vincular
          </Button>
        </form>
      </div>
    </Dialog>
  );
};
