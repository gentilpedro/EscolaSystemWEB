import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, CalendarRange, Download, PenSquare, Printer } from 'lucide-react';
import type { AttendanceItem, ClassItem, GradeItem, PagedResult, StudentItem } from '../../types';
import { attendanceApi, classApi, gradeApi, studentApi } from '../../services/api';
import {
  BlockLoader,
  Button,
  EmptyState,
  GradeLegend,
  GradeValue,
  LoadError,
  PageHeader,
  PageLoader,
  Segmented,
  SelectField,
  Stamp,
  SummaryStrip,
  TableEmptyRow,
  TableFrame,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  controlClasses,
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import {
  ATTENDANCE_MIN,
  GRADE_PASS,
  type Trimester,
  attendanceRate,
  attendanceTone,
  average,
  gradeLevel,
  trimesterOf,
  trimesterPeriod,
  trimesterRange,
  trimestersInRange,
} from '../../lib/school';
import { listAll } from '../../lib/paging';
import { formatDate, formatGrade, formatPercent, plural, todayIso } from '../../lib/format';
import { csvNumber, downloadCsv, fileSlug } from '../../lib/csv';
import { cn } from '../../lib/cn';

type Preset = '1' | '2' | '3' | 'custom';
type Tab = 'frequencia' | 'notas' | 'conselho';
type Situation = 'regular' | 'acompanhar' | 'atencao' | 'sem-dados';

const TAB_LABEL: Record<Tab, string> = {
  frequencia: 'Frequência',
  notas: 'Notas',
  conselho: 'Resumo do conselho',
};

const SITUATION_LABEL: Record<Situation, string> = {
  regular: 'Regular',
  acompanhar: 'Acompanhar',
  atencao: 'Atenção',
  'sem-dados': 'Sem registros',
};

const SITUATION_TONE: Record<Situation, 'blue' | 'amber' | 'red' | 'neutral'> = {
  regular: 'blue',
  acompanhar: 'amber',
  atencao: 'red',
  'sem-dados': 'neutral',
};

const presetOf = (iso: string): Preset => String(trimesterOf(iso)) as Preset;
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

interface StudentRow {
  id: string;
  name: string;
  registration: string;
  present: number;
  absent: number;
  rate: number | null;
  byDate: Map<string, AttendanceItem>;
  /** Nota por disciplina no período (média, se houver mais de uma) */
  bySubject: Map<string, number>;
  gradeAverage: number | null;
  lowSubjects: string[];
  situation: Situation;
}

/**
 * Situação do aluno para o conselho: atenção com frequência abaixo do mínimo ou nota vermelha;
 * acompanhar com nota em âmbar ou média abaixo de 7; regular no resto.
 */
function situationOf(rate: number | null, bySubject: Map<string, number>, gradeAverage: number | null): Situation {
  if (rate === null && bySubject.size === 0) return 'sem-dados';
  const levels = [...bySubject.values()].map(gradeLevel);
  if ((rate !== null && rate < ATTENDANCE_MIN) || levels.includes('low')) return 'atencao';
  // Pela média como ela aparece (uma casa): 6,96 sai como 7,0 e não é "abaixo de 7"
  if (levels.includes('warn') || (gradeAverage !== null && gradeLevel(gradeAverage) !== 'ok')) return 'acompanhar';
  return 'regular';
}

/**
 * Relatórios da turma por trimestre, para o conselho de classe: frequência, notas e o resumo
 * por aluno, cada um com impressão e exportação para planilha.
 */
export const TeacherReports: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayIso();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [preset, setPreset] = useState<Preset>(presetOf(today));
  const [range, setRange] = useState(() => trimesterRange(trimesterOf(today), Number(today.slice(0, 4))));
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabParam = searchParams.get('aba');
  const tab: Tab = tabParam === 'notas' || tabParam === 'conselho' ? tabParam : 'frequencia';
  const chooseTab = (next: Tab) =>
    setSearchParams(
      prev => {
        const params = new URLSearchParams(prev);
        params.set('aba', next);
        return params;
      },
      { replace: true },
    );

  const loadClasses = useCallback(() => {
    classApi
      .list(1, 100)
      .then((data: PagedResult<ClassItem>) => {
        setClasses(data.items);
        const fromUrl = searchParams.get('turma');
        const initial = data.items.find(c => c.id === fromUrl) ?? data.items.find(c => c.isActive) ?? data.items[0];
        if (initial) {
          setSelectedClass(initial.id);
          // O ano do período segue o ano letivo da turma
          if (initial.year !== Number(today.slice(0, 4))) {
            setPreset('1');
            setRange(trimesterRange(1, initial.year));
          }
        } else setLoadingData(false);
        setError(null);
      })
      .catch(() => {
        setError('Erro ao carregar turmas.');
        setLoadingData(false);
      })
      .finally(() => setLoadingClasses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lê a URL só na abertura
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const loadData = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const [studentsData, attendanceData, gradesData] = await Promise.all([
        listAll<StudentItem>((page, size) => studentApi.list(page, size, selectedClass)),
        listAll<AttendanceItem>((page, size) => attendanceApi.list(page, size, selectedClass)),
        listAll<GradeItem>((page, size) => gradeApi.list(page, size, selectedClass)),
      ]);
      setStudents(studentsData.items);
      setRecords(attendanceData.items);
      setGrades(gradesData.items);
      setError(null);
    } catch {
      setStudents([]);
      setRecords([]);
      setGrades([]);
      setError('Erro ao carregar os dados da turma.');
    } finally {
      setLoadingData(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cls = classes.find(c => c.id === selectedClass);
  const year = cls?.year ?? Number(today.slice(0, 4));
  const validRange = range.from !== '' && range.to !== '' && range.from <= range.to;

  // Notas são lançadas por trimestre: o período usa os trimestres que ele cruza
  const trimesters = useMemo<Trimester[]>(() => (validRange ? trimestersInRange(range.from, range.to) : []), [range, validRange]);
  const gradePeriods = useMemo(() => new Set(trimesters.map(trimesterPeriod)), [trimesters]);

  const inRange = useMemo(
    () => (validRange ? records.filter(r => r.date.slice(0, 10) >= range.from && r.date.slice(0, 10) <= range.to) : []),
    [records, range, validRange],
  );
  const dates = useMemo(() => [...new Set(inRange.map(r => r.date.slice(0, 10)))].sort(), [inRange]);
  const periodGrades = useMemo(() => grades.filter(g => gradePeriods.has(g.period)), [grades, gradePeriods]);
  const subjects = useMemo(() => [...new Set(periodGrades.map(g => g.subject))].sort((a, b) => a.localeCompare(b)), [periodGrades]);

  const rows = useMemo<StudentRow[]>(() => {
    const blank = (id: string, name: string, registration: string) => ({
      id,
      name,
      registration,
      present: 0,
      absent: 0,
      byDate: new Map<string, AttendanceItem>(),
      values: new Map<string, number[]>(),
    });
    const map = new Map<string, ReturnType<typeof blank>>();
    // Alunos ativos da turma, e também quem tem registro no período mas saiu depois
    for (const s of students) if (s.isActive) map.set(s.id, blank(s.id, s.name, s.registration));
    for (const r of inRange) {
      const row = map.get(r.studentId) ?? blank(r.studentId, r.studentName, '');
      row.byDate.set(r.date.slice(0, 10), r);
      if (r.isPresent) row.present += 1;
      else row.absent += 1;
      map.set(r.studentId, row);
    }
    for (const g of periodGrades) {
      const row = map.get(g.studentId) ?? blank(g.studentId, g.studentName, '');
      row.values.set(g.subject, [...(row.values.get(g.subject) ?? []), g.value]);
      map.set(g.studentId, row);
    }
    return [...map.values()]
      .map(({ values, ...row }) => {
        const bySubject = new Map([...values].map(([subject, list]) => [subject, average(list)!]));
        const rate = attendanceRate(row.present, row.present + row.absent);
        const gradeAverage = average([...bySubject.values()]);
        return {
          ...row,
          rate,
          bySubject,
          gradeAverage,
          lowSubjects: [...bySubject].filter(([, v]) => gradeLevel(v) === 'low').map(([s]) => s).sort((a, b) => a.localeCompare(b)),
          situation: situationOf(rate, bySubject, gradeAverage),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, inRange, periodGrades]);

  const withAttendance = rows.filter(r => r.rate !== null);
  const totalPresent = withAttendance.reduce((s, r) => s + r.present, 0);
  const totalMarks = withAttendance.reduce((s, r) => s + r.present + r.absent, 0);
  const classRate = attendanceRate(totalPresent, totalMarks);
  const belowMin = withAttendance.filter(r => r.rate! < ATTENDANCE_MIN).length;
  const classAverage = average(rows.flatMap(r => (r.gradeAverage === null ? [] : [r.gradeAverage])));
  const withLow = rows.filter(r => r.lowSubjects.length > 0).length;
  const bySituation = (s: Situation) => rows.filter(r => r.situation === s).length;

  const periodLabel = validRange ? `${formatDate(range.from)} a ${formatDate(range.to)}` : '';
  const presetLabel = preset === 'custom' ? 'Período personalizado' : `${preset}º trimestre`;
  const gradePeriodLabel = trimesters.length === 0 ? '' : trimesters.map(t => `${t}º`).join(', ') + (trimesters.length === 1 ? ' trimestre' : ' trimestres');

  const choosePreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') setRange(trimesterRange(Number(p) as Trimester, year));
  };

  const chooseClass = (id: string) => {
    const next = classes.find(c => c.id === id);
    setLoadingData(true);
    setSelectedClass(id);
    if (next && preset !== 'custom') setRange(trimesterRange(Number(preset) as Trimester, next.year));
  };

  const exportCsv = () => {
    if (!cls) return;
    const meta = [
      [`Turma: ${cls.name} (${cls.year})`],
      [`Período: ${presetLabel} · ${periodLabel}`],
      [`Relatório: ${TAB_LABEL[tab]}`],
      [`Professor(a): ${user?.name ?? ''}`],
      [],
    ];
    let table: (string | number)[][];
    if (tab === 'frequencia') {
      table = [
        ['Nº', 'Aluno', 'Matrícula', 'Presenças', 'Faltas', 'Frequência (%)', ...dates.map(d => formatDate(d))],
        ...rows.map((r, i) => [
          i + 1,
          r.name,
          r.registration,
          r.present,
          r.absent,
          csvNumber(r.rate),
          ...dates.map(d => {
            const rec = r.byDate.get(d);
            return rec ? (rec.isPresent ? 'P' : 'F') : '';
          }),
        ]),
      ];
    } else if (tab === 'notas') {
      table = [
        ['Nº', 'Aluno', 'Matrícula', ...subjects, 'Média'],
        ...rows.map((r, i) => [
          i + 1,
          r.name,
          r.registration,
          ...subjects.map(s => csvNumber(r.bySubject.get(s) ?? null)),
          csvNumber(r.gradeAverage),
        ]),
      ];
    } else {
      table = [
        ['Nº', 'Aluno', 'Matrícula', 'Frequência (%)', 'Faltas', 'Média', 'Disciplinas abaixo da média', 'Situação'],
        ...rows.map((r, i) => [
          i + 1,
          r.name,
          r.registration,
          csvNumber(r.rate),
          r.absent,
          csvNumber(r.gradeAverage),
          r.lowSubjects.join(', '),
          SITUATION_LABEL[r.situation],
        ]),
      ];
    }
    downloadCsv(`${fileSlug(TAB_LABEL[tab])}-${fileSlug(cls.name)}-${range.from}-a-${range.to}.csv`, [...meta, ...table]);
  };

  const hasData = tab === 'frequencia' ? dates.length > 0 : tab === 'notas' ? subjects.length > 0 : dates.length > 0 || subjects.length > 0;
  const canExport = !loadingData && !error && validRange && rows.length > 0 && hasData;

  const header = (
    <PageHeader
      title="Relatórios"
      description={
        cls && validRange ? (
          <span>
            {cls.name} · {presetLabel} · <span className="figures">{periodLabel}</span>
            <span className="hidden print:inline">
              {' '}
              · {TAB_LABEL[tab]} · Professor(a): {user?.name}
            </span>
          </span>
        ) : (
          'Frequência, notas e situação da turma por trimestre, para o conselho de classe.'
        )
      }
      actions={
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={exportCsv} disabled={!canExport}>
            Exportar planilha
          </Button>
          <Button variant="secondary" icon={<Printer className="h-4 w-4" aria-hidden="true" />} onClick={() => window.print()} disabled={!canExport}>
            Imprimir
          </Button>
        </div>
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

  const emptyPeriod = (title: string, text: string) => (
    <div className="rounded-lg border border-rule bg-surface">
      <EmptyState icon={tab === 'notas' ? PenSquare : CalendarRange} title={title}>
        {validRange ? text : 'Ajuste as datas do período.'}
      </EmptyState>
    </div>
  );

  return (
    <>
      {header}

      {/* Filtros: fora da impressão */}
      <div className="mb-6 space-y-4 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <SelectField
            label="Turma"
            value={selectedClass}
            onChange={e => chooseClass(e.target.value)}
            containerClassName="min-w-0 basis-60 grow sm:grow-0"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.year})
              </option>
            ))}
          </SelectField>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink" aria-hidden="true">
              Período
            </span>
            <Segmented<Preset>
              label="Período"
              value={preset}
              onChange={choosePreset}
              options={[
                { value: '1', label: '1º tri' },
                { value: '2', label: '2º tri' },
                { value: '3', label: '3º tri' },
                { value: 'custom', label: 'Personalizado' },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="relatorio-de" className="text-sm font-semibold text-ink">
              De
            </label>
            <input
              id="relatorio-de"
              type="date"
              value={range.from}
              onChange={e => {
                setPreset('custom');
                setRange(r => ({ ...r, from: e.target.value }));
              }}
              className={cn(controlClasses, 'figures w-auto')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="relatorio-ate" className="text-sm font-semibold text-ink">
              Até
            </label>
            <input
              id="relatorio-ate"
              type="date"
              value={range.to}
              onChange={e => {
                setPreset('custom');
                setRange(r => ({ ...r, to: e.target.value }));
              }}
              className={cn(controlClasses, 'figures w-auto')}
            />
          </div>
          {!validRange && <p className="pb-3 text-sm font-semibold text-red-ink">A data inicial precisa ser anterior à final.</p>}
        </div>
        <Segmented<Tab>
          label="Relatório"
          value={tab}
          onChange={chooseTab}
          options={(['frequencia', 'notas', 'conselho'] as Tab[]).map(t => ({ value: t, label: TAB_LABEL[t] }))}
        />
      </div>

      {error && (
        <LoadError
          message={error}
          onRetry={() => {
            setLoadingData(true);
            loadData();
          }}
        />
      )}

      {loadingData ? (
        <BlockLoader label="Carregando relatório…" rows={8} />
      ) : error ? null : tab === 'frequencia' ? (
        dates.length === 0 ? (
          emptyPeriod('Nenhuma chamada registrada neste período', `Não há chamadas de ${cls?.name ?? 'esta turma'} entre ${periodLabel}.`)
        ) : (
          <AttendanceReport rows={rows} dates={dates} classRate={classRate} belowMin={belowMin} />
        )
      ) : tab === 'notas' ? (
        subjects.length === 0 ? (
          emptyPeriod(
            'Nenhuma nota lançada neste período',
            trimesters.length === 0
              ? 'O período escolhido não cruza nenhum trimestre do ano letivo.'
              : `Não há notas de ${cls?.name ?? 'esta turma'} no ${gradePeriodLabel}.`,
          )
        ) : (
          <GradesReport rows={rows} subjects={subjects} classAverage={classAverage} withLow={withLow} gradePeriodLabel={gradePeriodLabel} />
        )
      ) : dates.length === 0 && subjects.length === 0 ? (
        emptyPeriod('Nenhum registro neste período', `Não há chamadas nem notas de ${cls?.name ?? 'esta turma'} entre ${periodLabel}.`)
      ) : (
        <>
          <SummaryStrip
            label="Situação da turma"
            items={[
              { label: 'Regular', value: bySituation('regular'), tone: 'blue' },
              { label: 'Acompanhar', value: bySituation('acompanhar'), tone: bySituation('acompanhar') > 0 ? 'amber' : 'default' },
              { label: 'Atenção', value: bySituation('atencao'), tone: bySituation('atencao') > 0 ? 'red' : 'default' },
            ]}
          />
          <CouncilReport rows={rows} />
        </>
      )}
    </>
  );
};

/* ---------- Frequência ---------- */

const AttendanceReport: React.FC<{ rows: StudentRow[]; dates: string[]; classRate: number | null; belowMin: number }> = ({
  rows,
  dates,
  classRate,
  belowMin,
}) => (
  <>
    <SummaryStrip
      label="Totais do período"
      items={[
        { label: 'Aulas no período', value: dates.length },
        { label: 'Frequência da turma', value: classRate === null ? '—' : formatPercent(classRate), tone: attendanceTone(classRate) },
        {
          label: `Abaixo de ${ATTENDANCE_MIN}%`,
          value: belowMin,
          hint: belowMin > 0 ? plural(belowMin, 'aluno precisa de atenção', 'alunos precisam de atenção') : 'Todos acima do mínimo',
          tone: belowMin > 0 ? 'red' : 'default',
        },
      ]}
    />

    <h2 className="mb-3 text-lg font-bold text-ink">Resumo por aluno</h2>
    <TableFrame caption="Frequência por aluno no período" minWidth="36rem" className="mb-8 print:mb-6">
      <THead>
        <Th align="right" className="w-12">
          Nº
        </Th>
        <Th sticky>Aluno</Th>
        <Th align="right">Presenças</Th>
        <Th align="right">Faltas</Th>
        <Th align="right">Frequência</Th>
      </THead>
      <TBody>
        {rows.length === 0 ? (
          <TableEmptyRow colSpan={5}>
            <EmptyState icon={BookOpen} title="Nenhum aluno nesta turma" compact />
          </TableEmptyRow>
        ) : (
          rows.map((r, i) => {
            const tone = attendanceTone(r.rate);
            return (
              <Tr key={r.id} tone={tone === 'red' ? 'flag' : 'default'}>
                <Td align="right" muted className="figures text-sm">
                  {i + 1}
                </Td>
                <Td sticky strong className="whitespace-nowrap">
                  {r.name}
                </Td>
                <Td align="right" className="figures">
                  {r.present}
                </Td>
                <Td align="right" className="figures">
                  {r.absent}
                </Td>
                <Td align="right">
                  <RateValue rate={r.rate} />
                </Td>
              </Tr>
            );
          })
        )}
      </TBody>
    </TableFrame>

    {/* Diário: começa em página nova na impressão */}
    <section aria-labelledby="diario-periodo" className="print:break-before-page">
      <h2 id="diario-periodo" className="mb-3 text-lg font-bold text-ink">
        Diário do período
      </h2>
      <TableFrame caption="Presença dia a dia no período" minWidth={`${14 + dates.length * 3}rem`}>
        <THead>
          <Th sticky>Aluno</Th>
          {dates.map(d => (
            <Th key={d} align="center" className="px-1.5 text-[0.75rem]">
              <span className="figures">{shortDate(d)}</span>
            </Th>
          ))}
          <Th align="right">Faltas</Th>
        </THead>
        <TBody>
          {rows.map(r => (
            <Tr key={r.id}>
              <Td sticky strong className="whitespace-nowrap">
                {r.name}
              </Td>
              {dates.map(d => {
                const rec = r.byDate.get(d);
                return (
                  <Td key={d} align="center" className="px-1.5 py-2" title={rec?.notes ?? undefined}>
                    {rec ? (
                      <span
                        className={cn(
                          'figures inline-flex h-6 w-6 items-center justify-center rounded-[3px] border text-[0.75rem] font-bold',
                          rec.isPresent ? 'border-blue-ink/40 text-blue-ink' : 'border-red-ink bg-red-ink text-white',
                          rec.notes && 'ring-2 ring-amber-ink/60 ring-offset-1',
                        )}
                      >
                        {rec.isPresent ? 'P' : 'F'}
                        <span className="sr-only">
                          {' '}
                          em {formatDate(d)}
                          {rec.notes ? `: ${rec.notes}` : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="text-ink-3" aria-label="sem registro">
                        ·
                      </span>
                    )}
                  </Td>
                );
              })}
              <Td align="right" className={cn('figures font-bold', r.absent > 0 ? 'text-red-ink' : 'text-ink-3')}>
                {r.absent}
              </Td>
            </Tr>
          ))}
        </TBody>
      </TableFrame>
      <p className="mt-3 text-sm text-ink-3">
        P = presente · F = falta · contorno âmbar = aula com observação (passe o mouse para ler). Frequência mínima de referência: {ATTENDANCE_MIN}%.
      </p>
    </section>
  </>
);

const RateValue: React.FC<{ rate: number | null }> = ({ rate }) => {
  if (rate === null) return <span className="text-ink-3">sem registro</span>;
  const tone = attendanceTone(rate);
  return (
    <span className="inline-flex items-center gap-2">
      {tone === 'red' && <Stamp tone="red">Abaixo de {ATTENDANCE_MIN}%</Stamp>}
      <span className={cn('figures font-bold', tone === 'red' ? 'text-red-ink' : 'text-blue-ink')}>{formatPercent(rate)}</span>
    </span>
  );
};

/* ---------- Notas ---------- */

const GradesReport: React.FC<{ rows: StudentRow[]; subjects: string[]; classAverage: number | null; withLow: number; gradePeriodLabel: string }> = ({
  rows,
  subjects,
  classAverage,
  withLow,
  gradePeriodLabel,
}) => (
  <>
    <SummaryStrip
      label="Notas do período"
      items={[
        { label: 'Disciplinas com nota', value: subjects.length, hint: gradePeriodLabel },
        { label: 'Média da turma', value: classAverage === null ? '—' : formatGrade(classAverage), tone: classAverage !== null && classAverage < GRADE_PASS ? 'amber' : 'blue' },
        {
          label: 'Com nota vermelha',
          value: withLow,
          hint: withLow > 0 ? plural(withLow, 'aluno abaixo de 5 em alguma disciplina', 'alunos abaixo de 5 em alguma disciplina') : 'Nenhum aluno abaixo de 5',
          tone: withLow > 0 ? 'red' : 'default',
        },
      ]}
    />
    <TableFrame caption={`Notas por disciplina · ${gradePeriodLabel}`} minWidth={`${18 + subjects.length * 7}rem`}>
      <THead>
        <Th align="right" className="w-12">
          Nº
        </Th>
        <Th sticky>Aluno</Th>
        {subjects.map(s => (
          <Th key={s} align="right">
            {s}
          </Th>
        ))}
        <Th align="right">Média</Th>
      </THead>
      <TBody>
        {rows.map((r, i) => (
          <Tr key={r.id} tone={r.lowSubjects.length > 0 ? 'flag' : 'default'}>
            <Td align="right" muted className="figures text-sm">
              {i + 1}
            </Td>
            <Td sticky strong className="whitespace-nowrap">
              {r.name}
            </Td>
            {subjects.map(s => {
              const v = r.bySubject.get(s);
              return (
                <Td key={s} align="right">
                  {v === undefined ? <span className="text-ink-3" aria-label="sem nota">—</span> : <GradeValue value={v} size="sm" />}
                </Td>
              );
            })}
            <Td align="right">{r.gradeAverage === null ? <span className="text-ink-3">—</span> : <GradeValue value={r.gradeAverage} />}</Td>
          </Tr>
        ))}
      </TBody>
    </TableFrame>
    <GradeLegend />
    <p className="mt-1 text-sm text-ink-3">Em período com mais de um trimestre, a nota da disciplina é a média dos trimestres.</p>
  </>
);

/* ---------- Resumo do conselho ---------- */

const CouncilReport: React.FC<{ rows: StudentRow[] }> = ({ rows }) => (
  <>
    <TableFrame caption="Resumo por aluno para o conselho de classe" minWidth="48rem">
      <THead>
        <Th align="right" className="w-12">
          Nº
        </Th>
        <Th sticky>Aluno</Th>
        <Th align="right">Frequência</Th>
        <Th align="right">Média</Th>
        <Th>Abaixo da média</Th>
        <Th>Situação</Th>
      </THead>
      <TBody>
        {rows.map((r, i) => (
          <Tr key={r.id} tone={r.situation === 'atencao' ? 'flag' : 'default'}>
            <Td align="right" muted className="figures text-sm">
              {i + 1}
            </Td>
            <Td sticky strong className="whitespace-nowrap">
              {r.name}
            </Td>
            <Td align="right">
              <RateValue rate={r.rate} />
            </Td>
            <Td align="right">{r.gradeAverage === null ? <span className="text-ink-3">—</span> : <GradeValue value={r.gradeAverage} />}</Td>
            <Td>{r.lowSubjects.length === 0 ? <span className="text-ink-3">Nenhuma</span> : r.lowSubjects.join(', ')}</Td>
            <Td>
              <Stamp tone={SITUATION_TONE[r.situation]}>{SITUATION_LABEL[r.situation]}</Stamp>
            </Td>
          </Tr>
        ))}
      </TBody>
    </TableFrame>
    <p className="mt-3 text-sm text-ink-3">
      Atenção: frequência abaixo de {ATTENDANCE_MIN}% ou nota vermelha (abaixo de 5). Acompanhar: nota entre 5 e 7 ou média abaixo de {GRADE_PASS}.
      Regular: o restante.
    </p>
  </>
);
