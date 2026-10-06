import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, ChevronDown, Clock, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ClassItem, PagedResult, PendingWorkItem, StudentItem } from '../../types';
import { classApi, pendingWorkApi, studentApi } from '../../services/api';
import {
  Alert,
  BlockLoader,
  Button,
  EmptyState,
  FormDialog,
  IconButton,
  LoadError,
  PageHeader,
  PageLoader,
  SelectField,
  Stamp,
  TextAreaField,
  TextField,
  errorMessage,
  useConfirm,
  useToast,
} from '../../components/ui';
import { listAll } from '../../lib/paging';
import { formatDate, formatDateTime, plural, shiftIsoDate, todayIso } from '../../lib/format';
import { cn } from '../../lib/cn';

/** Um trabalho da turma: a API guarda um registro por aluno, ligados pelo assignmentId. */
interface Assignment {
  key: string;
  title: string;
  description: string;
  dueDate: string;
  works: PendingWorkItem[];
  delivered: number;
}

const isPastDue = (dueDate: string) => new Date(`${dueDate}T23:59:59`) < new Date();

export const TeacherAssignments: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [works, setWorks] = useState<PendingWorkItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingWorks, setLoadingWorks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [delivering, setDelivering] = useState<string | null>(null);

  const loadClasses = useCallback(() => {
    classApi
      .list(1, 100)
      .then((data: PagedResult<ClassItem>) => {
        setClasses(data.items);
        const fromUrl = searchParams.get('turma');
        const initial = data.items.find(c => c.id === fromUrl) ?? data.items.find(c => c.isActive) ?? data.items[0];
        if (initial) setSelectedClass(initial.id);
        else setLoadingWorks(false);
        setError(null);
      })
      .catch(() => {
        setError('Erro ao carregar turmas.');
        setLoadingWorks(false);
      })
      .finally(() => setLoadingClasses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lê a URL só na abertura
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const loadWorks = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const data = await listAll<PendingWorkItem>((page, size) => pendingWorkApi.list(page, size, selectedClass));
      setWorks(data.items);
      setError(null);
    } catch {
      setWorks([]);
      setError('Erro ao carregar os trabalhos da turma.');
    } finally {
      setLoadingWorks(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    loadWorks();
  }, [loadWorks]);

  const assignments = useMemo<Assignment[]>(() => {
    const map = new Map<string, Assignment>();
    for (const w of works) {
      const key = w.assignmentId;
      const a = map.get(key) ?? { key, title: w.title, description: w.description, dueDate: w.dueDate, works: [], delivered: 0 };
      a.works.push(w);
      if (w.isDelivered) a.delivered += 1;
      map.set(key, a);
    }
    // Prazos mais próximos primeiro; os já vencidos depois dos que estão em aberto
    return [...map.values()]
      .map(a => ({ ...a, works: [...a.works].sort((x, y) => x.studentName.localeCompare(y.studentName)) }))
      .sort((a, b) => Number(isPastDue(a.dueDate)) - Number(isPastDue(b.dueDate)) || a.dueDate.localeCompare(b.dueDate));
  }, [works]);

  const markDelivered = async (work: PendingWorkItem) => {
    setDelivering(work.id);
    try {
      await pendingWorkApi.markDelivered(work.id);
      setWorks(prev => prev.map(w => (w.id === work.id ? { ...w, isDelivered: true, deliveredAt: new Date().toISOString() } : w)));
      toast.success(`Entrega de ${work.studentName} registrada.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao registrar entrega.'));
    } finally {
      setDelivering(null);
    }
  };

  const handleDelete = async (a: Assignment) => {
    const ok = await confirm({
      title: `Excluir o trabalho "${a.title}"?`,
      description: `Prazo ${formatDate(a.dueDate)} · ${plural(a.works.length, 'aluno', 'alunos')}`,
      consequence:
        a.delivered > 0
          ? `O trabalho some do portal de todos os alunos, inclusive o registro de ${plural(a.delivered, 'entrega já feita', 'entregas já feitas')}.`
          : 'O trabalho some do portal de todos os alunos da turma.',
      confirmLabel: 'Excluir trabalho',
    });
    if (!ok) return;
    try {
      await pendingWorkApi.deleteAssignment(a.key);
      setWorks(prev => prev.filter(w => w.assignmentId !== a.key));
      toast.success(`"${a.title}" foi excluído.`);
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao excluir o trabalho.'));
    }
  };

  const cls = classes.find(c => c.id === selectedClass);

  const header = (
    <PageHeader
      title="Trabalhos"
      description={cls && !loadingWorks ? `${cls.name} · ${plural(assignments.length, 'trabalho', 'trabalhos')}` : 'Trabalhos lançados para a turma e quem já entregou.'}
      actions={
        classes.length > 0 && (
          <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setShowForm(true)} disabled={!selectedClass}>
            Novo trabalho
          </Button>
        )
      }
    />
  );

  if (loadingClasses) {
    return (
      <>
        {header}
        <PageLoader label="Carregando turmas…" />
      </>
    );
  }

  if (classes.length === 0) {
    return (
      <>
        {header}
        {error ? (
          <LoadError
            message={error}
            onRetry={() => {
              setLoadingClasses(true);
              loadClasses();
            }}
          />
        ) : (
          <div className="rounded-lg border border-rule bg-surface">
            <EmptyState icon={BookOpen} title="Nenhuma turma atribuída">
              Entre em contato com a diretoria para ser vinculado a uma turma.
            </EmptyState>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {header}

      <div className="mb-6 max-w-sm">
        <SelectField
          label="Turma"
          value={selectedClass}
          onChange={e => {
            setLoadingWorks(true);
            setExpanded(null);
            setSelectedClass(e.target.value);
          }}
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.year})
            </option>
          ))}
        </SelectField>
      </div>

      {error && (
        <LoadError
          message={error}
          onRetry={() => {
            setLoadingWorks(true);
            loadWorks();
          }}
        />
      )}

      {loadingWorks ? (
        <BlockLoader label="Carregando trabalhos…" rows={4} />
      ) : error ? null : assignments.length === 0 ? (
        <div className="rounded-lg border border-rule bg-surface">
          <EmptyState
            icon={ListTodo}
            title="Nenhum trabalho lançado para esta turma"
            action={
              <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setShowForm(true)}>
                Novo trabalho
              </Button>
            }
          >
            O trabalho aparece no portal de cada aluno ativo da turma, com o prazo.
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3">
          {assignments.map(a => {
            const total = a.works.length;
            const pastDue = isPastDue(a.dueDate);
            const missing = total - a.delivered;
            const open = expanded === a.key;
            const panelId = `entregas-${a.works[0].id}`;
            return (
              <li key={a.key} className="rounded-lg border border-rule bg-surface">
                <div className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1 basis-64">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h2 className="text-base font-bold text-ink">{a.title}</h2>
                      {missing === 0 ? (
                        <Stamp tone="blue">Todos entregaram</Stamp>
                      ) : pastDue ? (
                        <Stamp tone="red">Prazo vencido</Stamp>
                      ) : (
                        <Stamp tone="amber">Em aberto</Stamp>
                      )}
                    </div>
                    {a.description && <p className="mt-1.5 text-[0.9375rem] text-ink-2">{a.description}</p>}
                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <dt>Prazo</dt>
                        <dd className={cn('figures font-semibold', pastDue && missing > 0 ? 'text-red-ink' : 'text-ink-2')}>{formatDate(a.dueDate)}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Entregas</dt>
                        <dd className="figures font-semibold text-ink-2">
                          {a.delivered} de {total}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-expanded={open}
                      aria-controls={panelId}
                      icon={<ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />}
                      onClick={() => setExpanded(open ? null : a.key)}
                    >
                      {open ? 'Ocultar alunos' : 'Ver alunos'}
                    </Button>
                    <IconButton label={`Editar ${a.title}`} icon={<Pencil className="h-5 w-5" />} onClick={() => setEditing(a)} />
                    <IconButton tone="danger" label={`Excluir ${a.title}`} icon={<Trash2 className="h-5 w-5" />} onClick={() => handleDelete(a)} />
                  </div>
                </div>
                {open && (
                  <ul id={panelId} className="divide-y divide-rule border-t border-rule">
                    {a.works.map(w => (
                      <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5">
                        <span className="min-w-0 font-semibold text-ink">{w.studentName}</span>
                        {w.isDelivered ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-ink">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            Entregue{w.deliveredAt ? ` em ${formatDateTime(w.deliveredAt)}` : ''}
                          </span>
                        ) : (
                          <span className="flex flex-wrap items-center gap-3">
                            <span className={cn('text-sm font-semibold', pastDue ? 'text-red-ink' : 'text-amber-ink')}>
                              {pastDue ? 'Em atraso' : 'Pendente'}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => markDelivered(w)}
                              loading={delivering === w.id}
                              loadingLabel="Registrando…"
                              disabled={delivering !== null && delivering !== w.id}
                            >
                              Registrar entrega<span className="sr-only"> de {w.studentName}</span>
                            </Button>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(showForm || editing) && cls && (
        <AssignmentForm
          cls={cls}
          assignment={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={message => {
            toast.success(message);
            setShowForm(false);
            setEditing(null);
            setLoadingWorks(true);
            loadWorks();
          }}
        />
      )}
    </>
  );
};

/** Novo trabalho para a turma (uma gravação só na API) ou correção de um já lançado. */
const AssignmentForm: React.FC<{ cls: ClassItem; assignment: Assignment | null; onClose: () => void; onSaved: (message: string) => void }> = ({
  cls,
  assignment,
  onClose,
  onSaved,
}) => {
  const editing = assignment !== null;
  const [form, setForm] = useState({
    title: assignment?.title ?? '',
    description: assignment?.description ?? '',
    dueDate: assignment?.dueDate ?? shiftIsoDate(todayIso(), 7),
  });
  // Só no lançamento: quantos alunos ativos vão receber
  const [students, setStudents] = useState<StudentItem[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) return;
    listAll<StudentItem>((page, size) => studentApi.list(page, size, cls.id, undefined, true))
      .then(data => setStudents(data.items))
      .catch(() => setError('Não foi possível carregar os alunos da turma. Feche e abra o formulário de novo.'));
  }, [cls.id, editing]);

  const pastDate = form.dueDate !== '' && form.dueDate < todayIso() && form.dueDate !== assignment?.dueDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { title: form.title.trim(), description: form.description.trim(), dueDate: form.dueDate };
    try {
      if (assignment) {
        await pendingWorkApi.updateAssignment(assignment.key, body);
        onSaved(`"${body.title}" foi atualizado para ${plural(assignment.works.length, 'aluno', 'alunos')}.`);
      } else {
        const created = await pendingWorkApi.createForClass(cls.id, body);
        onSaved(`Trabalho lançado para ${plural(created.studentCount, 'aluno', 'alunos')} de ${cls.name}.`);
      }
    } catch (err) {
      setError(errorMessage(err, editing ? 'Erro ao salvar o trabalho.' : 'Erro ao lançar o trabalho.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      title={editing ? 'Editar trabalho' : 'Novo trabalho'}
      description={`${cls.name} (${cls.year})`}
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      savingLabel={editing ? 'Salvando…' : 'Lançando…'}
      submitLabel={editing ? 'Salvar' : students ? `Lançar para ${plural(students.length, 'aluno', 'alunos')}` : 'Lançar'}
      submitDisabled={!editing && (!students || students.length === 0)}
    >
      {error && <Alert tone="error">{error}</Alert>}
      {editing && (
        <Alert tone="info">
          A correção vale para {plural(assignment.works.length, 'aluno', 'alunos')}.
          {assignment.delivered > 0 && ` ${plural(assignment.delivered, 'entrega já registrada continua', 'entregas já registradas continuam')} como está.`}
        </Alert>
      )}
      {!editing && students && students.length === 0 && <Alert tone="info">A turma não tem alunos ativos.</Alert>}
      <TextField label="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required maxLength={300} />
      <TextAreaField
        label="Descrição"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        rows={4}
        maxLength={2000}
        hint="O que entregar e como. Aparece para o aluno no portal."
        required
      />
      <TextField
        label="Prazo"
        type="date"
        className="figures"
        value={form.dueDate}
        onChange={e => setForm({ ...form, dueDate: e.target.value })}
        error={pastDate ? 'O prazo já passou. Confira a data.' : undefined}
        required
      />
    </FormDialog>
  );
};
