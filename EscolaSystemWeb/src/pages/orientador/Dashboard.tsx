import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Inbox, PenSquare } from 'lucide-react';
import type { ClassItem, StudentItem, DisciplinaryCall, PagedResult } from '../../types';
import { classApi, studentApi, disciplinaryApi } from '../../services/api';
import { ButtonLink, EmptyState, LoadError, PageLoader, Panel, Stamp } from '../../components/ui';
import { formatDate, plural } from '../../lib/format';
import { CallStatus } from '../../lib/school';
import { listAll } from '../../lib/paging';
import { ClassList, DashboardColumns, DashboardHeader } from '../../features/dashboard/DashboardParts';

/** A orientação abre no que espera decisão; as turmas levam direto a faltas e notas. */
export const OrientadorDashboard: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pendingCalls, setPendingCalls] = useState<DisciplinaryCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [classesData, studentsData, callsData] = await Promise.all([
        classApi.list(1, 100) as Promise<PagedResult<ClassItem>>,
        studentApi.list(1, 1) as Promise<PagedResult<StudentItem>>,
        listAll<DisciplinaryCall>((page, size) => disciplinaryApi.list(undefined, undefined, undefined, page, size)),
      ]);
      setClasses(classesData.items);
      setTotalStudents(studentsData.totalCount);
      setPendingCalls(callsData.items.filter(c => c.status === CallStatus.PENDING));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <>
      <DashboardHeader
        description={
          <span className="figures">
            Orientação
            {!failed && ` · ${plural(classes.length, 'turma', 'turmas')} · ${plural(totalStudents, 'aluno', 'alunos')}`}
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
          title={pendingCalls.length > 0 ? `Chamados aguardando decisão (${pendingCalls.length})` : 'Chamados aguardando decisão'}
          titleId="pendentes"
          flush
          action={
            pendingCalls.length > 0 && (
              <Link to="/orientador/disciplinary" className="inline-flex min-h-11 items-center text-sm font-semibold text-lousa hover:underline sm:min-h-0">
                Decidir
              </Link>
            )
          }
        >
          {pendingCalls.length === 0 ? (
            <EmptyState icon={Inbox} title={failed ? 'Chamados indisponíveis' : 'Nenhum chamado pendente'} compact>
              {failed ? 'Não foi possível carregar os chamados.' : 'Tudo decidido por aqui.'}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-rule">
              {pendingCalls.slice(0, 5).map(call => (
                <li key={call.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-semibold text-ink">{call.studentName}</p>
                    <Stamp tone="amber">Pendente</Stamp>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-2">{call.description}</p>
                  <p className="figures mt-0.5 text-[0.8125rem] text-ink-3">{formatDate(call.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Minhas turmas" titleId="turmas" flush>
          <ClassList
            classes={classes}
            failed={failed}
            actions={cls => (
              <>
                <ButtonLink
                  to={`/orientador/attendance?turma=${cls.id}`}
                  size="sm"
                  variant="secondary"
                  icon={<CalendarCheck className="h-4 w-4" aria-hidden="true" />}
                >
                  Faltas<span className="sr-only"> de {cls.name}</span>
                </ButtonLink>
                <ButtonLink to={`/orientador/grades?turma=${cls.id}`} size="sm" variant="secondary" icon={<PenSquare className="h-4 w-4" aria-hidden="true" />}>
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
