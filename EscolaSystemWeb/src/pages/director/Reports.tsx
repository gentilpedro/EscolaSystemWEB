import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { ClassReport, DashboardStats } from '../../types';
import { dashboardApi, reportApi } from '../../services/api';
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
import { ATTENDANCE_MIN, GRADE_LEVEL_TONE, gradeLevel } from '../../lib/school';
import { formatGrade, formatPercent } from '../../lib/format';
import { cn } from '../../lib/cn';

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
  const [reports, setReports] = useState<ClassReport[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Indicadores calculados pela API: não depende de baixar o histórico inteiro da escola
      const [reportsData, statsData] = await Promise.all([reportApi.classes(), dashboardApi.stats()]);
      setReports(reportsData);
      setStats(statsData);
      setError(null);
    } catch {
      setError('Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchData();
  }, [fetchData]);

  // Totais da escola: média e presença sobre todos os registros (não a média das médias das turmas)
  const globalAvgGrade = stats?.averageGrade ?? null;
  const globalAttendance = stats?.attendanceRate ?? null;

  const header = <PageHeader title="Relatórios" description="Situação de cada turma: alunos, média das notas, presença e chamados pendentes." />;

  if (loading) {
    return (
      <>
        {header}
        <PageLoader label="Carregando relatórios…" />
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
          { label: 'Alunos ativos', value: !stats ? '—' : stats.totalStudents.toLocaleString('pt-BR') },
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
          {
            label: 'Chamados pendentes',
            value: !stats ? '—' : stats.pendingDisciplinaryCalls,
            tone: stats && stats.pendingDisciplinaryCalls > 0 ? 'amber' : 'default',
          },
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
          <Th align="right">Chamados</Th>
          <Th align="right">Pendentes</Th>
        </THead>
        <TBody>
          {reports.length === 0 ? (
            <TableEmptyRow colSpan={7}>
              <EmptyState icon={BarChart3} title="Nenhuma turma encontrada" compact>
                Os relatórios aparecem quando houver turmas cadastradas.
              </EmptyState>
            </TableEmptyRow>
          ) : (
            reports.map(r => (
              <Tr key={r.classId}>
                <Td sticky strong className="whitespace-nowrap">
                  {r.className}
                </Td>
                <Td className="figures">{r.year}</Td>
                <Td align="right" className="figures">
                  {r.studentCount}
                </Td>
                <Td align="right">{r.averageGrade !== null ? <GradeValue value={r.averageGrade} size="sm" /> : <span className="text-ink-3">—</span>}</Td>
                <Td align="right">{r.attendanceRate !== null ? <AttendanceRate value={r.attendanceRate} /> : <span className="text-ink-3">—</span>}</Td>
                <Td align="right" className="figures">
                  {r.disciplinaryCalls}
                </Td>
                <Td align="right">
                  {r.pendingDisciplinaryCalls > 0 ? (
                    <Stamp tone="amber">{r.pendingDisciplinaryCalls}</Stamp>
                  ) : (
                    <span className="figures text-ink-3">0</span>
                  )}
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
