import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import type { ClassItem, AttendanceItem, PagedResult } from '../../types';
import { classApi, attendanceApi } from '../../services/api';
import {
  AttendanceMark,
  BlockLoader,
  EmptyState,
  FilterBar,
  FilterSelect,
  LoadError,
  PageHeader,
  PageLoader,
  SearchInput,
  Segmented,
  Stamp,
  TableEmptyRow,
  TableFrame,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  controlClasses,
} from '../../components/ui';
import { formatDate, formatPercent, matches, plural } from '../../lib/format';
import { ATTENDANCE_MIN, attendanceRate, attendanceTone } from '../../lib/school';
import { listAll } from '../../lib/paging';
import { cn } from '../../lib/cn';

type View = 'students' | 'records';

interface StudentSummary {
  studentId: string;
  studentName: string;
  className: string;
  present: number;
  absent: number;
  rate: number | null;
}

/** Faltas da orientação: primeiro quem está abaixo da frequência mínima; o registro dia a dia fica a um toque. */
export const OrientadorAttendance: React.FC = () => {
  const dateId = useId();
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  // ?turma=<id> vem do painel
  const [selectedClass, setSelectedClass] = useState(() => searchParams.get('turma') ?? '');
  const [selectedDate, setSelectedDate] = useState('');
  const [view, setView] = useState<View>('students');
  const [onlyAbsences, setOnlyAbsences] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordsFailed, setRecordsFailed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadClasses = useCallback(() => {
    classApi
      .list(1, 100)
      .then((data: PagedResult<ClassItem>) => {
        setClasses(data.items);
        setError(null);
      })
      .catch(() => setError('Erro ao carregar turmas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const fetchAttendance = useCallback(async () => {
    try {
      const data = await listAll<AttendanceItem>((page, size) =>
        attendanceApi.list(page, size, selectedClass || undefined, undefined, selectedDate || undefined),
      );
      setAttendance(data.items);
      setRecordsFailed(false);
    } catch {
      setAttendance([]);
      setRecordsFailed(true);
    } finally {
      setLoadingRecords(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const filtered = useMemo(() => attendance.filter(a => matches(searchTerm, a.studentName)), [attendance, searchTerm]);
  const records = (onlyAbsences ? filtered.filter(a => !a.isPresent) : [...filtered]).sort(
    (a, b) => b.date.localeCompare(a.date) || a.studentName.localeCompare(b.studentName),
  );
  const absences = filtered.filter(a => !a.isPresent).length;

  // Frequência por aluno no recorte atual (turma/data), do menor para o maior
  const summaries = useMemo<StudentSummary[]>(() => {
    const map = new Map<string, StudentSummary>();
    for (const a of filtered) {
      const s = map.get(a.studentId) ?? { studentId: a.studentId, studentName: a.studentName, className: a.className, present: 0, absent: 0, rate: null };
      if (a.isPresent) s.present += 1;
      else s.absent += 1;
      map.set(a.studentId, s);
    }
    return [...map.values()]
      .map(s => ({ ...s, rate: attendanceRate(s.present, s.present + s.absent) }))
      .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101) || a.studentName.localeCompare(b.studentName));
  }, [filtered]);
  const belowMin = summaries.filter(s => s.rate !== null && s.rate < ATTENDANCE_MIN).length;

  const changeFilter = (apply: () => void) => {
    setLoadingRecords(true);
    apply();
  };

  return (
    <>
      <PageHeader
        title="Faltas"
        description={
          !loading && !loadingRecords && filtered.length > 0 ? (
            <span>
              <span className="figures">{filtered.length}</span> registros · <span className="figures text-red-ink">{absences}</span>{' '}
              {absences === 1 ? 'falta' : 'faltas'}
              {belowMin > 0 && (
                <>
                  {' '}
                  · <span className="font-semibold text-red-ink">{plural(belowMin, 'aluno', 'alunos')} abaixo de {ATTENDANCE_MIN}%</span>
                </>
              )}
            </span>
          ) : undefined
        }
      />

      {loading ? (
        <PageLoader label="Carregando turmas…" />
      ) : (
        <>
          {error && (
            <LoadError
              message={error}
              onRetry={() => {
                setLoading(true);
                loadClasses();
              }}
            />
          )}
          {recordsFailed && (
            <LoadError
              message="Erro ao carregar registros de presença."
              onRetry={() => {
                setLoadingRecords(true);
                fetchAttendance();
              }}
            />
          )}

          <FilterBar>
            <SearchInput label="Pesquisar aluno" value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar aluno…" />
            <FilterSelect label="Filtrar por turma" value={selectedClass} onChange={v => changeFilter(() => setSelectedClass(v))}>
              <option value="">Todas as turmas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.year})
                </option>
              ))}
            </FilterSelect>
            <div className="min-w-0 basis-44 grow sm:grow-0">
              <label htmlFor={dateId} className="sr-only">
                Filtrar por data
              </label>
              <input
                id={dateId}
                type="date"
                value={selectedDate}
                onChange={e => changeFilter(() => setSelectedDate(e.target.value))}
                className={cn(controlClasses, 'figures')}
              />
            </div>
          </FilterBar>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Segmented<View>
              label="Visão"
              value={view}
              onChange={setView}
              options={[
                { value: 'students', label: 'Por aluno', count: summaries.length },
                { value: 'records', label: 'Registros', count: filtered.length },
              ]}
            />
            {view === 'records' && (
              <label className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-ink-2">
                <input type="checkbox" checked={onlyAbsences} onChange={e => setOnlyAbsences(e.target.checked)} className="h-5 w-5 accent-lousa" />
                Só faltas
              </label>
            )}
          </div>

          {loadingRecords ? (
            <BlockLoader label="Carregando registros…" />
          ) : view === 'students' ? (
            <TableFrame caption="Frequência por aluno" minWidth="40rem">
              <THead>
                <Th sticky>Aluno</Th>
                <Th>Turma</Th>
                <Th align="right">Presenças</Th>
                <Th align="right">Faltas</Th>
                <Th align="right">Frequência</Th>
              </THead>
              <TBody>
                {summaries.length === 0 ? (
                  <TableEmptyRow colSpan={5}>
                    <EmptyState icon={CalendarCheck} title="Nenhum registro encontrado" compact>
                      {recordsFailed ? 'Os registros não puderam ser carregados.' : searchTerm || selectedClass || selectedDate ? 'Ajuste a busca, a turma ou a data.' : 'Ainda não há chamadas registradas.'}
                    </EmptyState>
                  </TableEmptyRow>
                ) : (
                  summaries.map(s => {
                    const tone = attendanceTone(s.rate);
                    return (
                      <Tr key={s.studentId} tone={tone === 'red' ? 'flag' : 'default'}>
                        <Td sticky strong className="whitespace-nowrap">
                          {s.studentName}
                        </Td>
                        <Td className="whitespace-nowrap">{s.className}</Td>
                        <Td align="right" className="figures">
                          {s.present}
                        </Td>
                        <Td align="right" className="figures">
                          {s.absent}
                        </Td>
                        <Td align="right">
                          {s.rate !== null && (
                            <span className="inline-flex items-center gap-2">
                              {tone === 'red' && <Stamp tone="red">Abaixo de {ATTENDANCE_MIN}%</Stamp>}
                              <span className={cn('figures font-bold', tone === 'red' ? 'text-red-ink' : 'text-blue-ink')}>{formatPercent(s.rate)}</span>
                            </span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </TBody>
            </TableFrame>
          ) : (
            <TableFrame caption="Registros de presença" minWidth="44rem">
              <THead>
                <Th sticky>Aluno</Th>
                <Th>Turma</Th>
                <Th>Data</Th>
                <Th>Presença</Th>
                <Th>Observações</Th>
              </THead>
              <TBody>
                {records.length === 0 ? (
                  <TableEmptyRow colSpan={5}>
                    <EmptyState icon={CalendarCheck} title={onlyAbsences ? 'Nenhuma falta encontrada' : 'Nenhum registro encontrado'} compact>
                      {recordsFailed ? 'Os registros não puderam ser carregados.' : searchTerm || selectedClass || selectedDate ? 'Ajuste a busca, a turma ou a data.' : 'Ainda não há chamadas registradas.'}
                    </EmptyState>
                  </TableEmptyRow>
                ) : (
                  records.map(a => (
                    <Tr key={a.id} tone={a.isPresent ? 'default' : 'flag'}>
                      <Td sticky strong className="whitespace-nowrap">
                        {a.studentName}
                      </Td>
                      <Td className="whitespace-nowrap">{a.className}</Td>
                      <Td className="figures whitespace-nowrap text-sm">{formatDate(a.date)}</Td>
                      <Td>
                        <AttendanceMark present={a.isPresent} />
                      </Td>
                      <Td muted className="text-sm">
                        {a.notes || '—'}
                      </Td>
                    </Tr>
                  ))
                )}
              </TBody>
            </TableFrame>
          )}
          <p className="mt-3 text-sm text-ink-3">
            Frequência calculada sobre os registros do filtro atual. Mínimo de referência: {ATTENDANCE_MIN}%.
          </p>
        </>
      )}
    </>
  );
};
