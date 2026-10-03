import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, PenSquare } from 'lucide-react';
import type { ClassItem, StudentItem, DisciplinaryCall, PagedResult, AttendanceItem } from '../../types';
import { classApi, studentApi, disciplinaryApi, attendanceApi } from '../../services/api';
import { ButtonLink, LoadError, PageLoader, Panel } from '../../components/ui';
import { plural, todayIso } from '../../lib/format';
import { CallStatus } from '../../lib/school';
import { listAll } from '../../lib/paging';
import { ClassList, DashboardColumns, DashboardHeader } from '../../features/dashboard/DashboardParts';

/** O professor abre na tarefa do dia: a chamada de cada turma, com o atalho para fazê-la. */
export const TeacherDashboard: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingCalls, setPendingCalls] = useState(0);
  const [recordedToday, setRecordedToday] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const today = todayIso();

  const fetchData = useCallback(async () => {
    try {
      const [classesData, studentsData, callsData] = await Promise.all([
        classApi.list(1, 100) as Promise<PagedResult<ClassItem>>,
        studentApi.list(1, 1) as Promise<PagedResult<StudentItem>>,
        listAll<DisciplinaryCall>((page, size) => disciplinaryApi.list(undefined, undefined, undefined, page, size)),
      ]);
      // Chamada de hoje já registrada? Uma consulta leve por turma ativa
      const active = classesData.items.filter(c => c.isActive);
      const todayResults = await Promise.all(
        active.map(c =>
          (attendanceApi.list(1, 1, c.id, undefined, today) as Promise<PagedResult<AttendanceItem>>)
            .then(r => [c.id, r.totalCount > 0] as const)
            .catch(() => [c.id, false] as const),
        ),
      );
      setClasses(classesData.items);
      setTotalStudents(studentsData.totalCount);
      setPendingCalls(callsData.items.filter(c => c.status === CallStatus.PENDING).length);
      setRecordedToday(Object.fromEntries(todayResults));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <>
        <DashboardHeader />
        <PageLoader label="Carregando painel…" rows={4} />
      </>
    );
  }

  const pendingToday = classes.filter(c => c.isActive && !recordedToday[c.id]).length;

  return (
    <>
      <DashboardHeader
        description={
          <span className="figures">
            Professor
            {!failed &&
              ` · ${plural(classes.length, 'turma', 'turmas')} · ${plural(totalStudents, 'aluno', 'alunos')} · ${plural(pendingCalls, 'chamado pendente', 'chamados pendentes')}`}
          </span>
        }
      />
      {failed && (
        <LoadError
          message="Não foi possível carregar o painel."
          onRetry={() => {
            setLoading(true);
            fetchData();
          }}
        />
      )}

      <DashboardColumns>
        <Panel
          title={!failed && pendingToday > 0 ? `Chamada de hoje · ${plural(pendingToday, 'turma pendente', 'turmas pendentes')}` : 'Chamada de hoje'}
          titleId="turmas"
          flush
        >
          <ClassList
            classes={classes}
            failed={failed}
            status={cls =>
              recordedToday[cls.id] ? (
                <span className="font-semibold text-blue-ink">chamada feita</span>
              ) : (
                <span className="font-semibold text-amber-ink">chamada pendente</span>
              )
            }
            actions={cls => (
              <>
                <ButtonLink
                  to={`/teacher/attendance?turma=${cls.id}`}
                  size="sm"
                  variant={recordedToday[cls.id] ? 'secondary' : 'primary'}
                  icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
                >
                  {recordedToday[cls.id] ? 'Rever chamada' : 'Fazer chamada'}
                  <span className="sr-only"> de {cls.name}</span>
                </ButtonLink>
                <ButtonLink to={`/teacher/grades?turma=${cls.id}`} size="sm" variant="secondary" icon={<PenSquare className="h-4 w-4" aria-hidden="true" />}>
                  Notas<span className="sr-only"> de {cls.name}</span>
                </ButtonLink>
              </>
            )}
          />
        </Panel>
      </DashboardColumns>
    </>
  );
};
