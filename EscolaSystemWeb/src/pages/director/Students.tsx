import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import type { StudentItem, ClassItem, PagedResult } from '../../types';
import { studentApi, classApi } from '../../services/api';
import { listAll } from '../../lib/paging';
import {
  ActiveStamp,
  Alert,
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
import { formatDate, matches, plural } from '../../lib/format';

export const DirectorStudents: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        listAll<StudentItem>((page, size) => studentApi.list(page, size)),
        classApi.list(1, 100) as Promise<PagedResult<ClassItem>>,
      ]);
      setStudents(studentsData.items);
      setClasses(classesData.items);
      setError(null);
    } catch {
      setError('Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (student: StudentItem) => {
    const ok = await confirm({
      title: `Excluir o aluno ${student.name}?`,
      description: `Matrícula ${student.registration} · ${student.className}`,
      consequence: 'As notas, a frequência e os chamados do aluno deixam de aparecer. Para registrar uma transferência sem apagar o histórico, edite e desmarque "Aluno ativo".',
      confirmLabel: 'Excluir aluno',
    });
    if (!ok) return;
    try {
      await studentApi.delete(student.id);
      toast.success('Aluno excluído.');
      fetchAll();
    } catch {
      toast.error('Erro ao excluir aluno.');
    }
  };

  const filtered = students.filter(
    s => matches(searchTerm, s.name, s.email, s.registration) && (classFilter ? s.classId === classFilter : true),
  );

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
          {error && <LoadError message={error} onRetry={() => { setLoading(true); fetchAll(); }} />}

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

          <TableFrame caption="Alunos matriculados" minWidth="52rem">
            <THead>
              <Th sticky>Nome</Th>
              <Th>Matrícula</Th>
              <Th>E-mail</Th>
              <Th>Turma</Th>
              <Th>Nascimento</Th>
              <Th>Situação</Th>
              <Th align="right" srOnly>
                Ações
              </Th>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmptyRow colSpan={7}>
                  <EmptyState icon={GraduationCap} title={students.length === 0 ? 'Nenhum aluno matriculado' : 'Nenhum aluno encontrado'} compact>
                    {students.length === 0 ? 'Use “Novo aluno” para matricular.' : 'Ajuste a busca ou o filtro de turma.'}
                  </EmptyState>
                </TableEmptyRow>
              ) : (
                filtered.map(student => (
                  <Tr key={student.id}>
                    <Td sticky strong className="whitespace-nowrap">
                      {student.name}
                    </Td>
                    <Td className="figures text-sm">{student.registration}</Td>
                    <Td>{student.email}</Td>
                    <Td className="whitespace-nowrap">{student.className}</Td>
                    <Td className="figures text-sm">{formatDate(student.birthDate)}</Td>
                    <Td>
                      <ActiveStamp active={student.isActive} />
                    </Td>
                    <Td align="right">
                      <RowActions
                        destructive={
                          <IconButton
                            tone="danger"
                            label={`Excluir ${student.name}`}
                            icon={<Trash2 className="h-5 w-5" />}
                            onClick={() => handleDelete(student)}
                          />
                        }
                      >
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
                ))
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
      <TextField
        label="E-mail"
        type="email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        required
      />
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
      {student && (
        <CheckboxField label="Aluno ativo" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
      )}
    </FormDialog>
  );
};
