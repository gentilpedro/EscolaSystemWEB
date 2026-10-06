import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Trash2, PenSquare, BookOpen, Save } from 'lucide-react';
import type { ClassItem, StudentItem, GradeItem, PagedResult } from '../../types';
import { classApi, studentApi, gradeApi } from '../../services/api';
import {
  Alert,
  BlockLoader,
  Button,
  EmptyState,
  FilterBar,
  FilterSelect,
  FormDialog,
  GradeLegend,
  GradeValue,
  IconButton,
  LoadError,
  PageHeader,
  PageLoader,
  Panel,
  ReadOnlyField,
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
  controlClasses,
  errorMessage,
  useConfirm,
  useToast,
} from '../../components/ui';
import { useRegisterUnsaved, useUnsavedChanges } from '../../components/layout/UnsavedChanges';
import { PERIODS, comparePeriods, gradeLevel, trimesterOf, trimesterPeriod } from '../../lib/school';
import { listAll } from '../../lib/paging';
import { formatGrade, matches, parseDecimal, plural, todayIso } from '../../lib/format';
import { cn } from '../../lib/cn';

/** Valida o que foi digitado numa célula do boletim. */
function cellError(raw: string): string | null {
  if (raw.trim() === '') return null;
  const n = parseDecimal(raw);
  if (n === null) return 'Use um número, com vírgula ou ponto (ex.: 7,5).';
  if (n < 0 || n > 10) return 'A nota vai de 0 a 10.';
  return null;
}

export const TeacherGrades: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const { confirmLeave } = useUnsavedChanges();
  const [searchParams] = useSearchParams();
  const subjectListId = useId();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Grade de lançamento: disciplina + período escolhidos, uma célula por aluno
  const [subject, setSubject] = useState('');
  // Abre no trimestre corrente
  const [period, setPeriod] = useState(() => trimesterPeriod(trimesterOf(todayIso())));
  const [cells, setCells] = useState<Record<string, string>>({});
  const [savingGrid, setSavingGrid] = useState(false);
  const [gridError, setGridError] = useState<string | null>(null);
  const gridRef = useRef<HTMLOListElement>(null);

  // Lista de notas lançadas
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [editingGrade, setEditingGrade] = useState<GradeItem | null>(null);

  const loadClasses = useCallback(() => {
    classApi
      .list(1, 100)
      .then((data: PagedResult<ClassItem>) => {
        setClasses(data.items);
        const fromUrl = searchParams.get('turma');
        const initial = data.items.find(c => c.id === fromUrl) ?? data.items[0];
        if (initial) setSelectedClass(initial.id);
        else setLoadingData(false);
      })
      .catch(() => {
        setError('Erro ao carregar turmas.');
        setLoadingData(false);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lê a URL só na abertura
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const fetchClassData = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const [studentsData, gradesData] = await Promise.all([
        listAll<StudentItem>((page, size) => studentApi.list(page, size, selectedClass)),
        listAll<GradeItem>((page, size) => gradeApi.list(page, size, selectedClass)),
      ]);
      setStudents(studentsData.items);
      setGrades(gradesData.items);
      setError(null);
    } catch {
      setStudents([]);
      setGrades([]);
      setError('Erro ao carregar dados da turma.');
    } finally {
      setLoadingData(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  // Nota já lançada para (aluno, disciplina, período), se houver
  const existingFor = useMemo(() => {
    const map = new Map<string, GradeItem>();
    const key = subject.trim().toLowerCase();
    for (const g of grades) {
      if (g.subject.trim().toLowerCase() === key && g.period === period && !map.has(g.studentId)) map.set(g.studentId, g);
    }
    return map;
  }, [grades, subject, period]);

  const subjects = useMemo(() => [...new Set(grades.map(g => g.subject))].sort((a, b) => a.localeCompare(b)), [grades]);

  // O que mudou na grade em relação ao que está gravado
  const changes = useMemo(() => {
    const out: { student: StudentItem; value: number; existing?: GradeItem }[] = [];
    for (const s of students) {
      const raw = cells[s.id];
      if (raw === undefined || raw.trim() === '' || cellError(raw)) continue;
      const value = parseDecimal(raw)!;
      const existing = existingFor.get(s.id);
      if (!existing || existing.value !== value) out.push({ student: s, value, existing });
    }
    return out;
  }, [cells, students, existingFor]);

  const invalidCount = students.filter(s => cells[s.id] !== undefined && cellError(cells[s.id]) !== null).length;
  const dirty = changes.length > 0 || invalidCount > 0;
  useRegisterUnsaved(dirty, 'Há notas digitadas na grade que ainda não foram salvas e serão perdidas.');

  const resetGrid = () => {
    setCells({});
    setGridError(null);
  };

  const guarded = async (apply: () => void) => {
    if (dirty && !(await confirmLeave())) return;
    resetGrid();
    apply();
  };

  const cellValue = (studentId: string) => {
    if (cells[studentId] !== undefined) return cells[studentId];
    const existing = existingFor.get(studentId);
    return existing ? formatGrade(existing.value) : '';
  };

  const handleGridKey = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = index + (e.key === 'ArrowUp' ? -1 : 1);
      gridRef.current?.querySelector<HTMLInputElement>(`[data-cell="${next}"]`)?.focus();
    }
  };

  const handleSaveGrid = async () => {
    if (changes.length === 0 || invalidCount > 0) return;
    setSavingGrid(true);
    setGridError(null);
    const subjectName = subject.trim();
    const results = await Promise.allSettled(
      changes.map(c =>
        c.existing
          ? gradeApi.update(c.existing.id, { subject: c.existing.subject, value: c.value, period })
          : gradeApi.create({ studentId: c.student.id, classId: selectedClass, subject: subjectName, value: c.value, period }),
      ),
    );
    const failed = changes
      .map((c, i) => ({ ...c, result: results[i] }))
      .filter((c): c is typeof c & { result: PromiseRejectedResult } => c.result.status === 'rejected');
    const savedCount = changes.length - failed.length;
    // Mantém na grade só o que falhou, para tentar de novo sem redigitar
    setCells(prev => {
      const next: Record<string, string> = {};
      for (const f of failed) next[f.student.id] = prev[f.student.id];
      return next;
    });
    if (failed.length > 0) {
      // Motivo de cada falha, como a API respondeu (ex.: nota já lançada nesta matéria e período)
      const reasons = failed.map(f => `${f.student.name}: ${errorMessage(f.result.reason, 'erro ao salvar')}`);
      setGridError(`${plural(failed.length, 'nota não foi salva', 'notas não foram salvas')}. ${reasons.join(' · ')}`);
    }
    if (savedCount > 0) toast.success(`${plural(savedCount, 'nota salva', 'notas salvas')} em ${subjectName} · ${period}.`);
    setSavingGrid(false);
    fetchClassData();
  };

  const handleDelete = async (grade: GradeItem) => {
    const ok = await confirm({
      title: 'Excluir esta nota?',
      description: `${grade.studentName} · ${grade.subject} · ${grade.period}`,
      consequence: 'A nota sai do boletim do aluno e da média da disciplina.',
      confirmLabel: 'Excluir nota',
    });
    if (!ok) return;
    try {
      await gradeApi.delete(grade.id);
      setGrades(prev => prev.filter(g => g.id !== grade.id));
      toast.success('Nota excluída.');
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao excluir nota.'));
    }
  };

  const filtered = grades
    .filter(g => matches(searchTerm, g.studentName, g.subject) && (periodFilter ? g.period === periodFilter : true))
    .sort((a, b) => a.studentName.localeCompare(b.studentName) || a.subject.localeCompare(b.subject) || comparePeriods(a.period, b.period));

  const header = (
    <PageHeader
      title="Notas"
      description={grades.length > 0 ? `${plural(grades.length, 'nota lançada', 'notas lançadas')} nesta turma` : undefined}
    />
  );

  if (loading) {
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
              setLoading(true);
              setError(null);
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

  const subjectReady = subject.trim() !== '';

  return (
    <>
      {header}

      <div className="mb-6 max-w-sm">
        <SelectField
          label="Turma"
          value={selectedClass}
          onChange={e => {
            const id = e.target.value;
            guarded(() => {
              setLoadingData(true);
              setSelectedClass(id);
            });
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
            setLoadingData(true);
            fetchClassData();
          }}
        />
      )}

      {loadingData ? (
        <BlockLoader label="Carregando notas…" />
      ) : error ? null : (
        <>
          {/* Boletim da turma: escreve-se direto nas células, como no diário */}
          <Panel title="Lançar notas" titleId="lancar-notas" className="mb-8" flush>
            <div className="grid gap-4 border-b border-rule px-5 py-4 sm:grid-cols-2">
              <TextField
                label="Disciplina"
                list={subjectListId}
                value={subject}
                onChange={e => {
                  const v = e.target.value;
                  if (dirty) {
                    guarded(() => setSubject(v));
                  } else {
                    setCells({});
                    setSubject(v);
                  }
                }}
                placeholder="Ex.: Matemática"
                hint={subjects.length > 0 ? 'Escolha uma disciplina já usada para manter o boletim unificado.' : undefined}
                autoComplete="off"
              />
              <datalist id={subjectListId}>
                {subjects.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <SelectField label="Período" value={period} onChange={e => guarded(() => setPeriod(e.target.value))}>
                {PERIODS.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </SelectField>
            </div>

            {students.length === 0 ? (
              <EmptyState icon={PenSquare} title="A turma ainda não tem alunos" compact />
            ) : !subjectReady ? (
              <EmptyState icon={PenSquare} title="Escolha a disciplina para abrir o boletim" compact>
                A grade mostra um campo de nota por aluno, já com as notas lançadas neste período.
              </EmptyState>
            ) : (
              <>
                <ol ref={gridRef} aria-label={`Notas de ${subject.trim()} · ${period}`} className="divide-y divide-rule">
                  {students.map((s, index) => {
                    const raw = cellValue(s.id);
                    const err = cells[s.id] !== undefined ? cellError(cells[s.id]) : null;
                    const existing = existingFor.get(s.id);
                    const changed = changes.some(c => c.student.id === s.id);
                    const parsed = parseDecimal(raw);
                    const level = parsed !== null && !err ? gradeLevel(parsed) : null;
                    const inputId = `nota-${s.id}`;
                    return (
                      <li key={s.id} className="grid grid-cols-[2rem_minmax(0,1fr)_6.5rem] items-center gap-x-3 px-5 py-2">
                        <span className="figures text-right text-sm text-ink-3">{index + 1}</span>
                        <label htmlFor={inputId} className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{s.name}</span>
                          <span className={cn('block text-[0.8125rem]', err ? 'font-semibold text-red-ink' : 'text-ink-3')}>
                            {err ?? (changed ? (existing ? 'Alterada · não salva' : 'Nova · não salva') : existing ? 'Lançada' : 'Sem nota')}
                          </span>
                        </label>
                        <input
                          id={inputId}
                          data-cell={index}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={raw}
                          onChange={e => setCells(prev => ({ ...prev, [s.id]: e.target.value }))}
                          onKeyDown={e => handleGridKey(e, index)}
                          aria-invalid={err ? true : undefined}
                          className={cn(
                            controlClasses,
                            'figures text-right text-lg font-bold',
                            level === 'ok' && 'text-blue-ink!',
                            level === 'warn' && 'text-amber-ink!',
                            level === 'low' && 'text-red-ink! underline decoration-2 underline-offset-4',
                            changed && 'border-lousa ring-1 ring-lousa/30',
                          )}
                        />
                      </li>
                    );
                  })}
                </ol>

                <div className="sticky bottom-0 z-10 border-t border-rule bg-paper/95 px-5 py-3 backdrop-blur-sm">
                  {gridError && (
                    <Alert tone="error" className="mb-3" title={gridError}>
                      As notas que falharam continuam na grade. Se o aluno já tinha nota nesta disciplina e período, a grade foi recarregada com ela: confira e
                      salve de novo para editar.
                    </Alert>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm" aria-live="polite">
                      {invalidCount > 0 ? (
                        <span className="font-semibold text-red-ink">{plural(invalidCount, 'nota inválida', 'notas inválidas')}</span>
                      ) : changes.length > 0 ? (
                        <span className="font-semibold text-amber-ink">{plural(changes.length, 'nota a salvar', 'notas a salvar')}</span>
                      ) : (
                        <span className="text-ink-3">Nada a salvar</span>
                      )}
                      <span className="hidden text-ink-3 md:inline"> · Enter ou seta para baixo vai para o próximo aluno</span>
                    </p>
                    <Button
                      icon={<Save className="h-4 w-4" aria-hidden="true" />}
                      onClick={handleSaveGrid}
                      disabled={changes.length === 0 || invalidCount > 0}
                      loading={savingGrid}
                      loadingLabel="Salvando…"
                    >
                      Salvar notas
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Panel>

          <h2 className="mb-3 text-lg font-bold text-ink">Notas lançadas</h2>
          <FilterBar>
            <SearchInput label="Pesquisar notas" value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar aluno ou disciplina…" />
            <FilterSelect label="Filtrar por período" value={periodFilter} onChange={setPeriodFilter}>
              <option value="">Todos os períodos</option>
              {PERIODS.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </FilterSelect>
          </FilterBar>

          <TableFrame caption="Notas lançadas na turma" minWidth="40rem">
            <THead>
              <Th sticky>Aluno</Th>
              <Th>Disciplina</Th>
              <Th>Período</Th>
              <Th align="right">Nota</Th>
              <Th align="right" srOnly>
                Ações
              </Th>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmptyRow colSpan={5}>
                  <EmptyState icon={PenSquare} title={grades.length === 0 ? 'Nenhuma nota lançada para esta turma' : 'Nenhuma nota encontrada'} compact>
                    {grades.length === 0 ? 'Use a grade acima para lançar as primeiras.' : 'Ajuste a busca ou o período.'}
                  </EmptyState>
                </TableEmptyRow>
              ) : (
                filtered.map(grade => (
                  <Tr key={grade.id}>
                    <Td sticky strong className="whitespace-nowrap">
                      {grade.studentName}
                    </Td>
                    <Td>{grade.subject}</Td>
                    <Td className="whitespace-nowrap">{grade.period}</Td>
                    <Td align="right">
                      <GradeValue value={grade.value} />
                    </Td>
                    <Td align="right">
                      <RowActions
                        destructive={
                          <IconButton
                            tone="danger"
                            label={`Excluir nota de ${grade.studentName}`}
                            icon={<Trash2 className="h-5 w-5" />}
                            onClick={() => handleDelete(grade)}
                          />
                        }
                      >
                        <IconButton label={`Editar nota de ${grade.studentName}`} icon={<Pencil className="h-5 w-5" />} onClick={() => setEditingGrade(grade)} />
                      </RowActions>
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </TableFrame>
          <GradeLegend />
        </>
      )}

      {editingGrade && (
        <EditGradeModal
          grade={editingGrade}
          onClose={() => setEditingGrade(null)}
          onSave={() => {
            toast.success('Nota atualizada.');
            setEditingGrade(null);
            fetchClassData();
          }}
        />
      )}
    </>
  );
};

interface EditGradeModalProps {
  grade: GradeItem;
  onClose: () => void;
  onSave: () => void;
}

/** Correção pontual de uma nota já lançada (disciplina, período e valor). */
const EditGradeModal: React.FC<EditGradeModalProps> = ({ grade, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    subject: grade.subject,
    period: grade.period,
    value: formatGrade(grade.value),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valueError = formData.value.trim() === '' ? 'Informe a nota.' : cellError(formData.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valueError) {
      setError(valueError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await gradeApi.update(grade.id, { subject: formData.subject, value: parseDecimal(formData.value)!, period: formData.period });
      onSave();
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar nota.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog title="Editar nota" onClose={onClose} onSubmit={handleSubmit} saving={saving} submitLabel="Salvar" size="sm">
      {error && <Alert tone="error">{error}</Alert>}
      <ReadOnlyField label="Aluno">{grade.studentName}</ReadOnlyField>
      <TextField label="Disciplina" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Período" value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })} required>
          {/* Nota de período antigo (bimestre): o período atual continua na lista para não ser trocado sem querer */}
          {!PERIODS.includes(grade.period) && <option value={grade.period}>{grade.period} (período antigo)</option>}
          {PERIODS.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Nota (0 a 10)"
          inputMode="decimal"
          className="figures"
          value={formData.value}
          onChange={e => setFormData({ ...formData, value: e.target.value })}
          error={formData.value.trim() !== '' ? cellError(formData.value) ?? undefined : undefined}
          hint="Vírgula ou ponto, ex.: 7,5"
          required
        />
      </div>
    </FormDialog>
  );
};
