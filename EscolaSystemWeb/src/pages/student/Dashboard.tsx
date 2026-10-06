import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import type { GradeItem, AttendanceItem, PendingWorkItem } from '../../types';
import { gradeApi, attendanceApi, pendingWorkApi } from '../../services/api';
import { EmptyState, GradeValue, LoadError, PageLoader, Panel, SummaryStrip } from '../../components/ui';
import { formatGrade, formatPercent } from '../../lib/format';
import { ATTENDANCE_MIN, GRADE_LEVEL_TONE, attendanceRate, attendanceTone, average, comparePeriods, gradeLevel } from '../../lib/school';
import { listAll } from '../../lib/paging';
import { DashboardColumns, DashboardHeader } from '../../features/dashboard/DashboardParts';
import { figure } from '../../features/dashboard/figure';

export const StudentDashboard: React.FC = () => {
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [absences, setAbsences] = useState(0);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [pendingWorks, setPendingWorks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [gradesData, attendanceData, worksData] = await Promise.all([
        listAll<GradeItem>((page, size) => gradeApi.list(page, size)),
        listAll<AttendanceItem>((page, size) => attendanceApi.list(page, size)),
        listAll<PendingWorkItem>((page, size) => pendingWorkApi.list(page, size)),
      ]);
      setGrades(gradesData.items);
      setAbsences(attendanceData.items.filter(a => !a.isPresent).length);
      setAttendanceTotal(attendanceData.items.length);
      setPendingWorks(worksData.items.filter(w => !w.isDelivered).length);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchData();
  }, [fetchData]);

  const avgGrade = average(grades.map(g => g.value));
  const rate = attendanceRate(attendanceTotal - absences, attendanceTotal);

  // Média de cada disciplina (é ela que define a situação), não a última nota isolada
  const subjects = [...new Set(grades.map(g => g.subject))].sort((a, b) => a.localeCompare(b));
  const subjectRows = subjects.map(subject => {
    const own = grades.filter(g => g.subject === subject);
    const lastPeriod = [...new Set(own.map(g => g.period))].sort(comparePeriods).pop();
    return { subject, avg: average(own.map(g => g.value))!, lastPeriod, count: own.length };
  });

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <PageLoader label="Carregando painel…" rows={4} />
      </>
    );
  }

  const avgTone = avgGrade === null ? 'default' : GRADE_LEVEL_TONE[gradeLevel(avgGrade)];

  return (
    <>
      <DashboardHeader />
      {failed && (
        <LoadError
          message="Não foi possível carregar seus números."
          onRetry={() => {
            setLoading(true);
            fetchData();
          }}
        />
      )}

      <SummaryStrip
        items={[
          { label: 'Média geral', value: failed || avgGrade === null ? '—' : formatGrade(avgGrade), tone: failed ? 'default' : avgTone },
          {
            label: 'Faltas',
            value: figure(absences, failed),
            hint: !failed && rate !== null ? `Presença de ${formatPercent(rate)} (mínimo ${ATTENDANCE_MIN}%)` : undefined,
            tone: !failed && attendanceTone(rate) === 'red' ? 'red' : 'default',
          },
          { label: 'Trabalhos pendentes', value: figure(pendingWorks, failed), tone: !failed && pendingWorks > 0 ? 'amber' : 'default' },
        ]}
      />

      <DashboardColumns>
        <Panel
          title="Média por disciplina"
          titleId="notas-disciplina"
          flush
          action={
            <Link to="/student/grades" className="inline-flex min-h-11 items-center text-sm font-semibold text-lousa hover:underline sm:min-h-0">
              Ver boletim
            </Link>
          }
        >
          {failed ? (
            <EmptyState icon={PenSquare} title="Notas indisponíveis" compact>
              Não foi possível carregar suas notas.
            </EmptyState>
          ) : subjectRows.length === 0 ? (
            <EmptyState icon={PenSquare} title="Nenhuma nota lançada ainda" compact />
          ) : (
            <ul className="divide-y divide-rule">
              {subjectRows.map(row => (
                <li key={row.subject} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{row.subject}</p>
                    <p className="text-sm text-ink-3">
                      Média de {row.count === 1 ? '1 nota' : `${row.count} notas`}
                      {row.lastPeriod && ` · até ${row.lastPeriod}`}
                    </p>
                  </div>
                  <GradeValue value={row.avg} size="lg" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </DashboardColumns>
    </>
  );
};
