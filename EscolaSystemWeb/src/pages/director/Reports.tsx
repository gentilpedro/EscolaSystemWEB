import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { ClassItem, StudentItem, GradeItem, AttendanceItem, DisciplinaryCall } from '../../types';
import { classApi, studentApi, gradeApi, attendanceApi, disciplinaryApi } from '../../services/api';
import { listAll } from '../../lib/paging';
import {
  EmptyState,
  GradeLegend,
  GradeValue,
  LoadError,
  PageHeader,
  PageLoader,
  Stamp,
  SummaryStrip,
  TableEmptyRow,
  TableFrame,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '../../components/ui';
import { ATTENDANCE_MIN, CallStatus, GRADE_LEVEL_TONE, gradeLevel } from '../../lib/school';
import { formatGrade, formatPercent } from '../../lib/format';
import { cn } from '../../lib/cn';

interface ClassSummary {
  class: ClassItem;
  studentCount: number;
  avgGrade: number | null;
  attendanceRate: number | null;
  pendingCalls: number;
}

const AttendanceRate: React.FC<{ value: number }> = ({ value }) => {
  const level = value >= ATTENDANCE_MIN ? 'ok' : value >= 50 ? 'warn' : 'low';
  return (
    <span
      className={cn(
        'figures font-bold',
        level === 'ok' ? 'text-blue-ink' : level === 'warn' ? 'text-amber-ink' : 'text-red-ink underline decoration-2 underline-offset-4',
      )}
    >
      {formatPercent(value)}
      {level !== 'ok' && <span className="sr-only"> (abaixo de {ATTENDANCE_MIN}%)</span>}
    </span>
  );
};

export const DirectorReports: React.FC = () => {
  const [summaries, setSummaries] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {

      const [classesData, studentsData, gradesData, attendanceData, callsData] = await Promise.all([
        // Registros completos: antes o relatório olhava só os 200/500 primeiros
        listAll<ClassItem>((page, size) => classApi.list(page, size)),
        listAll<StudentItem>((page, size) => studentApi.list(page, size)),
        listAll<GradeItem>((page, size) => gradeApi.list(page, size)),
        listAll<AttendanceItem>((page, size) => attendanceApi.list(page, size)),
        listAll<DisciplinaryCall>((page, size) => disciplinaryApi.list(undefined, undefined, undefined, page, size)),
      ]);

      const students = studentsData.items;
      const grades = gradesData.items;
      const attendances = attendanceData.items;
      const calls = callsData.items;

      const result: ClassSummary[] = classesData.items.map(cls => {
        const classStudents = students.filter(s => s.classId === cls.id);
        const classGrades = grades.filter(g => g.classId === cls.id);
        const classAttendances = attendances.filter(a => a.classId === cls.id);
        const classCalls = calls.filter(c => classStudents.some(s => s.id === c.studentId) && c.status === CallStatus.PENDING);

        const avgGrade = classGrades.length > 0 ? classGrades.reduce((sum, g) => sum + g.value, 0) / classGrades.length : null;
        const attendanceRate =
          classAttendances.length > 0 ? (classAttendances.filter(a => a.isPresent).length / classAttendances.length) * 100 : null;

        return { class: cls, studentCount: classStudents.length, avgGrade, attendanceRate, pendingCalls: classCalls.length };
      });

      setSummaries(result);
      setError(null);
    } catch {
      setError('Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalStudents = summaries.reduce((s, c) => s + c.studentCount, 0);
  const validGrades = summaries.filter(s => s.avgGrade !== null);
  const globalAvgGrade = validGrades.length > 0 ? validGrades.reduce((s, c) => s + c.avgGrade!, 0) / validGrades.length : null;
  const validAttendance = summaries.filter(s => s.attendanceRate !== null);
  const globalAttendance =
    validAttendance.length > 0 ? validAttendance.reduce((s, c) => s + c.attendanceRate!, 0) / validAttendance.length : null;
  const totalPendingCalls = summaries.reduce((s, c) => s + c.pendingCalls, 0);

  const header = <PageHeader title="Relatórios" description="Situação de cada turma: alunos, média das notas, presença e chamados pendentes." />;

  if (loading) {
    return (
      <>
        {header}
        <PageLoader label="Calculando relatórios…" />
      </>
    );
  }

  return (
    <>
      {header}
      {error && <LoadError message={error} onRetry={() => { setLoading(true); fetchData(); }} />}

      <SummaryStrip
        label="Totais da escola"
        items={[
          { label: 'Total de alunos', value: error ? '—' : totalStudents.toLocaleString('pt-BR') },
          {
            label: 'Média geral',
            value: globalAvgGrade !== null ? formatGrade(globalAvgGrade) : '—',
            tone: globalAvgGrade === null ? 'default' : GRADE_LEVEL_TONE[gradeLevel(globalAvgGrade)],
          },
          {
            label: 'Taxa de presença',
            value: globalAttendance !== null ? formatPercent(globalAttendance) : '—',
            tone: globalAttendance === null ? 'default' : globalAttendance >= ATTENDANCE_MIN ? 'blue' : 'red',
          },
          { label: 'Chamados pendentes', value: error ? '—' : totalPendingCalls, tone: totalPendingCalls > 0 ? 'amber' : 'default' },
        ]}
      />

      <h2 className="mb-3 text-lg font-bold text-ink">Resumo por turma</h2>
      <TableFrame caption="Resumo por turma" minWidth="44rem">
        <THead>
          <Th sticky>Turma</Th>
          <Th>Ano</Th>
          <Th align="right">Alunos</Th>
          <Th align="right">Média das notas</Th>
          <Th align="right">Presença</Th>
          <Th align="right">Chamados pendentes</Th>
        </THead>
        <TBody>
          {summaries.length === 0 ? (
            <TableEmptyRow colSpan={6}>
              <EmptyState icon={BarChart3} title="Nenhuma turma encontrada" compact>
                Os relatórios aparecem quando houver turmas cadastradas.
              </EmptyState>
            </TableEmptyRow>
          ) : (
            summaries.map(s => (
              <Tr key={s.class.id}>
                <Td sticky strong className="whitespace-nowrap">
                  {s.class.name}
                </Td>
                <Td className="figures">{s.class.year}</Td>
                <Td align="right" className="figures">
                  {s.studentCount}
                </Td>
                <Td align="right">{s.avgGrade !== null ? <GradeValue value={s.avgGrade} size="sm" /> : <span className="text-ink-3">—</span>}</Td>
                <Td align="right">{s.attendanceRate !== null ? <AttendanceRate value={s.attendanceRate} /> : <span className="text-ink-3">—</span>}</Td>
                <Td align="right">
                  {s.pendingCalls > 0 ? <Stamp tone="amber">{s.pendingCalls}</Stamp> : <span className="figures text-ink-3">0</span>}
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableFrame>
      <GradeLegend />
      <p className="text-sm text-ink-3">Presença destacada em vermelho abaixo de {ATTENDANCE_MIN}%.</p>
    </>
  );
};
