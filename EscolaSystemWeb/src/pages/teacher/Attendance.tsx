import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, ChevronLeft, ChevronRight, Users, BookOpen, ArrowUp, ArrowDown, Plus, RotateCcw } from 'lucide-react';
import type { ClassItem, StudentItem, AttendanceItem, PagedResult } from '../../types';
import { classApi, studentApi, attendanceApi } from '../../services/api';
import {
  Alert,
  BlockLoader,
  Button,
  EmptyState,
  IconButton,
  LoadError,
  PageHeader,
  PageLoader,
  SelectField,
  controlClasses,
  errorMessage,
  useToast,
} from '../../components/ui';
import { useRegisterUnsaved, useUnsavedChanges } from '../../components/layout/useUnsavedChanges';
import { cn } from '../../lib/cn';
import { listAll } from '../../lib/paging';
import { formatDate, formatTime, formatWeekday, isWeekend, shiftIsoDate, todayIso } from '../../lib/format';

interface AttendanceEntry {
  studentId: string;
  studentName: string;
  isPresent: boolean;
  notes: string;
  existingId?: string;
}

const snapshot = (entries: AttendanceEntry[]) => entries.map(e => `${e.studentId}:${e.isPresent ? 1 : 0}:${e.notes}`).join('|');

export const TeacherAttendance: React.FC = () => {
  const toast = useToast();
  const { confirmLeave } = useUnsavedChanges();
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [baseline, setBaseline] = useState('');
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const today = todayIso();

  const loadClasses = useCallback(() => {
    classApi
      .list(1, 100)
      .then((data: PagedResult<ClassItem>) => {
        setClasses(data.items);
        // ?turma=<id> vem do painel ("Fazer chamada de hoje")
        const fromUrl = searchParams.get('turma');
        const initial = data.items.find(c => c.id === fromUrl) ?? data.items[0];
        if (initial) setSelectedClass(initial.id);
        else setLoadingAttendance(false);
      })
      .catch(() => {
        setLoadError('Erro ao carregar turmas.');
        setLoadingAttendance(false);
      })
      .finally(() => setLoadingClasses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lê a URL só na abertura
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const buildAttendanceEntries = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const [studentsData, attendanceData] = await Promise.all([
        listAll<StudentItem>((page, size) => studentApi.list(page, size, selectedClass, undefined, true)),
        listAll<AttendanceItem>((page, size) => attendanceApi.list(page, size, selectedClass, undefined, selectedDate)),
      ]);

      const existingMap = new Map(attendanceData.items.map(a => [a.studentId, a]));
      const next = studentsData.items.map(s => {
        const existing = existingMap.get(s.id);
        return {
          studentId: s.id,
          studentName: s.name,
          isPresent: existing ? existing.isPresent : true,
          notes: existing?.notes ?? '',
          existingId: existing?.id,
        };
      });
      setEntries(next);
      setBaseline(snapshot(next));
      setOpenNotes(new Set());
      setLoadError(null);
    } catch {
      // Nunca deixar a lista da turma anterior na tela: salvar gravaria na turma errada
      setEntries([]);
      setBaseline('');
      setLoadError('Erro ao carregar a lista desta turma.');
    } finally {
      setLoadingAttendance(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    buildAttendanceEntries();
  }, [buildAttendanceEntries]);

  const dirty = useMemo(() => entries.length > 0 && snapshot(entries) !== baseline, [entries, baseline]);
  useRegisterUnsaved(dirty, 'A chamada tem marcações que ainda não foram salvas e serão perdidas.');

  // Trocar turma ou dia recarrega a lista do diário; com marcações pendentes, pergunta antes
  const changeDay = async (classId: string, date: string) => {
    if (classId === selectedClass && date === selectedDate) return;
    if (dirty && !(await confirmLeave())) return;
    setLoadingAttendance(true);
    setSaveError(null);
    setSavedAt(null);
    setSelectedClass(classId);
    setSelectedDate(date);
  };

  const setPresence = (studentId: string, isPresent: boolean) => {
    setEntries(prev => prev.map(e => (e.studentId === studentId ? { ...e, isPresent } : e)));
  };

  const setNotes = (studentId: string, notes: string) => {
    setEntries(prev => prev.map(e => (e.studentId === studentId ? { ...e, notes } : e)));
  };

  const openNote = (studentId: string) => {
    setOpenNotes(prev => new Set(prev).add(studentId));
    requestAnimationFrame(() => document.getElementById(`obs-${studentId}`)?.focus());
  };

  const handleSave = async () => {
    if (entries.length === 0 || loadError) return;
    setSaving(true);
    setSaveError(null);
    try {
      const toCreate = entries.filter(e => !e.existingId);
      const toUpdate = entries.filter(e => e.existingId);

      if (toCreate.length > 0) {
        await attendanceApi.bulkCreate(
          toCreate.map(e => ({
            studentId: e.studentId,
            classId: selectedClass,
            date: selectedDate,
            isPresent: e.isPresent,
            notes: e.notes || null,
          })),
        );
      }

      await Promise.all(toUpdate.map(e => attendanceApi.update(e.existingId!, { isPresent: e.isPresent, notes: e.notes || null })));

      setSavedAt(new Date());
      toast.success(`Chamada de ${formatDate(selectedDate)} salva.`);
      buildAttendanceEntries();
    } catch (err) {
      // As marcações ficam na tela; o erro aparece junto do botão de salvar
      setSaveError(errorMessage(err, 'Não foi possível salvar a chamada.'));
    } finally {
      setSaving(false);
    }
  };

  // Teclado do diário: ↑/↓ muda de aluno, P/F marca, mantendo o foco na mesma coluna.
  const handleRowKey = (e: React.KeyboardEvent<HTMLElement>, index: number, studentId: string) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT') return;
    const key = e.key.toLowerCase();
    if (key === 'p' || key === 'f') {
      e.preventDefault();
      setPresence(studentId, key === 'p');
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const col = target.dataset.col ?? 'p';
      const next = index + (e.key === 'ArrowDown' ? 1 : -1);
      listRef.current?.querySelector<HTMLElement>(`[data-row="${next}"][data-col="${col}"]`)?.focus();
    }
  };

  const presentCount = entries.filter(e => e.isPresent).length;
  const absentCount = entries.length - presentCount;
  const alreadyRecorded = entries.some(e => e.existingId);
  const isToday = selectedDate === today;
  const weekend = isWeekend(selectedDate);

  const header = (
    <PageHeader
      title="Chamada"
      description={
        <span className="figures">
          {formatDate(selectedDate)} · <span className="capitalize">{formatWeekday(selectedDate)}</span>
          {isToday && <span> (hoje)</span>}
        </span>
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
        {loadError ? (
          <LoadError
            message={loadError}
            onRetry={() => {
              setLoadingClasses(true);
              setLoadError(null);
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

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <SelectField
          label="Turma"
          value={selectedClass}
          onChange={e => changeDay(e.target.value, selectedDate)}
          containerClassName="min-w-0 basis-60 grow sm:grow-0"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.year})
            </option>
          ))}
        </SelectField>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="data-chamada" className="text-sm font-semibold text-ink">
            Data
          </label>
          <div className="flex items-center gap-1">
            <IconButton
              label="Dia anterior"
              icon={<ChevronLeft className="h-5 w-5" />}
              onClick={() => changeDay(selectedClass, shiftIsoDate(selectedDate, -1))}
              className="border border-control bg-surface"
            />
            <input
              id="data-chamada"
              type="date"
              value={selectedDate}
              max={today}
              onChange={e => e.target.value && e.target.value <= today && changeDay(selectedClass, e.target.value)}
              className={cn(controlClasses, 'figures w-auto')}
            />
            <IconButton
              label="Próximo dia"
              icon={<ChevronRight className="h-5 w-5" />}
              onClick={() => changeDay(selectedClass, shiftIsoDate(selectedDate, 1))}
              disabled={selectedDate >= today}
              className="border border-control bg-surface"
            />
          </div>
        </div>
      </div>

      {loadError && (
        <LoadError
          message={loadError}
          onRetry={() => {
            setLoadingAttendance(true);
            buildAttendanceEntries();
          }}
        />
      )}

      {loadingAttendance ? (
        <BlockLoader label="Carregando chamada…" rows={8} />
      ) : loadError ? null : entries.length === 0 ? (
        <div className="rounded-lg border border-rule bg-surface">
          <EmptyState icon={Users} title="Nenhum aluno nesta turma">
            Quando a direção matricular alunos nesta turma, eles aparecem aqui.
          </EmptyState>
        </div>
      ) : (
        <>
          {weekend && (
            <Alert tone="warning" className="mb-4">
              {formatDate(selectedDate)} cai num fim de semana. Confira a data antes de salvar.
            </Alert>
          )}
          {alreadyRecorded && (
            <Alert tone="info" className="mb-4">
              A chamada deste dia já foi registrada. Ao salvar, as alterações atualizam o registro.
            </Alert>
          )}

          <div className="overflow-hidden rounded-lg border border-rule bg-surface">
            <div className="hidden grid-cols-[2.5rem_minmax(0,1fr)_7rem_minmax(0,1fr)] items-center gap-4 border-b border-rule-strong bg-sunken px-4 py-3 text-sm font-bold text-ink-2 md:grid">
              <span className="text-right">Nº</span>
              <span>Aluno</span>
              <span className="text-center">Presença</span>
              <span>Observação</span>
            </div>
            <ol ref={listRef} className="divide-y divide-rule" aria-label="Lista de presença">
              {entries.map((entry, index) => {
                // Observação só aparece quando há texto, falta, ou quando o professor pede
                const showNote = entry.notes !== '' || !entry.isPresent || openNotes.has(entry.studentId);
                return (
                  <li
                    key={entry.studentId}
                    onKeyDown={e => handleRowKey(e, index, entry.studentId)}
                    className={cn(
                      'grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 transition-colors duration-100',
                      'md:grid-cols-[2.5rem_minmax(0,1fr)_7rem_minmax(0,1fr)] md:gap-x-4',
                      !entry.isPresent && 'bg-red-wash',
                    )}
                  >
                    <span className="figures text-right text-sm text-ink-3">{index + 1}</span>
                    <span className="truncate font-semibold text-ink">{entry.studentName}</span>
                    <div role="group" aria-label={`Presença de ${entry.studentName}`} className="flex justify-center gap-1.5">
                      {[true, false].map(value => {
                        const active = entry.isPresent === value;
                        return (
                          <button
                            key={String(value)}
                            type="button"
                            data-row={index}
                            data-col={value ? 'p' : 'f'}
                            aria-pressed={active}
                            aria-label={value ? 'Presente' : 'Falta'}
                            onClick={() => setPresence(entry.studentId, value)}
                            className={cn(
                              'figures inline-flex h-11 w-11 items-center justify-center rounded-[4px] border-[1.5px] text-base font-bold transition-colors duration-150 sm:h-10 sm:w-10',
                              active
                                ? value
                                  ? 'border-blue-ink bg-blue-ink text-white'
                                  : 'border-red-ink bg-red-ink text-white'
                                : 'border-control bg-surface text-ink-3 hover:border-ink-3 hover:text-ink-2',
                            )}
                          >
                            {value ? 'P' : 'F'}
                          </button>
                        );
                      })}
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      {showNote ? (
                        <>
                          <label htmlFor={`obs-${entry.studentId}`} className="sr-only">
                            Observação para {entry.studentName}
                          </label>
                          <input
                            id={`obs-${entry.studentId}`}
                            type="text"
                            value={entry.notes}
                            onChange={e => setNotes(entry.studentId, e.target.value)}
                            placeholder={entry.isPresent ? 'Observação (opcional)' : 'Motivo da falta (opcional)'}
                            className={controlClasses}
                          />
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openNote(entry.studentId)}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-ink-3 hover:text-ink sm:min-h-9"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Observação<span className="sr-only"> para {entry.studentName}</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="mt-3 hidden text-sm text-ink-3 md:block">
            Dica: use{' '}
            <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border border-control bg-surface align-middle">
              <ArrowUp className="h-3.5 w-3.5" aria-label="seta para cima" />
            </kbd>{' '}
            <kbd className="inline-flex h-5 w-5 items-center justify-center rounded border border-control bg-surface align-middle">
              <ArrowDown className="h-3.5 w-3.5" aria-label="seta para baixo" />
            </kbd>{' '}
            para mudar de aluno e <kbd className="figures rounded border border-control bg-surface px-1">P</kbd> /{' '}
            <kbd className="figures rounded border border-control bg-surface px-1">F</kbd> para marcar.
          </p>

          {/* Totais, estado do registro e salvar: sempre à mão, onde o polegar está */}
          <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-rule bg-paper/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-lg lg:border lg:px-5">
            {saveError && (
              <Alert
                tone="error"
                title="Não foi possível salvar a chamada."
                className="mb-3"
                action={
                  <Button size="sm" variant="secondary" icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />} onClick={handleSave} disabled={saving}>
                    Tentar salvar de novo
                  </Button>
                }
              >
                Suas marcações continuam aqui. Verifique a conexão e tente de novo.
                {saveError && <span className="block text-sm text-ink-3">Detalhe: {saveError}</span>}
              </Alert>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.9375rem] text-ink-2" aria-live="polite">
                  <strong className="figures text-blue-ink">{presentCount}</strong> {presentCount === 1 ? 'presente' : 'presentes'} ·{' '}
                  <strong className="figures text-red-ink">{absentCount}</strong> {absentCount === 1 ? 'falta' : 'faltas'}
                  <span className="text-ink-3"> de {entries.length}</span>
                </p>
                <p className="text-sm" aria-live="polite">
                  {dirty ? (
                    <span className="font-semibold text-amber-ink">Alterações não salvas</span>
                  ) : savedAt ? (
                    <span className="text-ink-3">
                      Salva às <span className="figures">{formatTime(savedAt)}</span>
                    </span>
                  ) : alreadyRecorded ? (
                    <span className="text-ink-3">Registro em dia</span>
                  ) : (
                    <span className="text-ink-3">Ainda não registrada</span>
                  )}
                </p>
              </div>
              <Button
                icon={<Save className="h-4 w-4" aria-hidden="true" />}
                onClick={handleSave}
                loading={saving}
                loadingLabel="Salvando…"
                disabled={!!loadError}
              >
                Salvar chamada
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
