import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, ChevronDown, ClipboardCheck, PenSquare, Users } from 'lucide-react';
import type { ClassItem, StudentItem, PagedResult } from '../../types';
import { classApi, studentApi } from '../../services/api';
import { BlockLoader, ButtonLink, EmptyState, LoadError, PageHeader, PageLoader, TableFrame, TBody, Td, Th, THead, Tr } from '../../components/ui';
import { listAll } from '../../lib/paging';
import { cn } from '../../lib/cn';
import { plural } from '../../lib/format';

export const TeacherClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [studentsByClass, setStudentsByClass] = useState<Record<string, StudentItem[]>>({});
  const [loadingStudents, setLoadingStudents] = useState<string | null>(null);
  const [failedStudents, setFailedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(() => {
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
    fetchClasses();
  }, [fetchClasses]);

  const toggleClass = async (classId: string) => {
    if (expanded === classId) {
      setExpanded(null);
      return;
    }
    setExpanded(classId);
    if (studentsByClass[classId]) return;
    await loadStudents(classId);
  };

  const loadStudents = async (classId: string) => {
    setLoadingStudents(classId);
    try {
      const data = await listAll<StudentItem>((page, size) => studentApi.list(page, size, classId));
      setStudentsByClass(prev => ({ ...prev, [classId]: data.items }));
      setFailedStudents(prev => {
        const next = new Set(prev);
        next.delete(classId);
        return next;
      });
    } catch {
      // Falha não vira "turma vazia": mostra o erro com opção de tentar de novo
      setFailedStudents(prev => new Set(prev).add(classId));
    } finally {
      setLoadingStudents(null);
    }
  };

  const header = (
    <PageHeader
      title="Minhas turmas"
      description={!loading ? `${plural(classes.length, 'turma atribuída', 'turmas atribuídas')}` : undefined}
    />
  );

  if (loading) {
    return (
      <>
        {header}
        <PageLoader label="Carregando turmas…" rows={4} />
      </>
    );
  }

  return (
    <>
      {header}
      {error && <LoadError message={error} onRetry={() => {
            setLoading(true);
            fetchClasses();
          }} />}

      {classes.length === 0 ? (
        <div className="rounded-lg border border-rule bg-surface">
          <EmptyState icon={BookOpen} title="Nenhuma turma atribuída">
            Entre em contato com a diretoria para ser vinculado a uma turma.
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3">
          {classes.map(cls => {
            const students = studentsByClass[cls.id] ?? [];
            const isOpen = expanded === cls.id;
            const isLoadingThis = loadingStudents === cls.id;
            const panelId = `turma-${cls.id}`;

            return (
              <li key={cls.id} className="overflow-hidden rounded-lg border border-rule bg-surface">
                <h2>
                  <button
                    type="button"
                    onClick={() => toggleClass(cls.id)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-paper"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-bold text-ink">{cls.name}</span>
                      <span className="block text-sm text-ink-3">
                        Ano letivo <span className="figures">{cls.year}</span> · {cls.schoolName}
                      </span>
                    </span>
                    {isOpen && !isLoadingThis && studentsByClass[cls.id] && (
                      <span className="hidden items-center gap-1.5 text-sm text-ink-3 sm:inline-flex">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {plural(students.length, 'aluno', 'alunos')}
                      </span>
                    )}
                    <ChevronDown
                      className={cn('h-5 w-5 shrink-0 text-ink-3 transition-transform duration-200', isOpen && 'rotate-180')}
                      aria-hidden="true"
                    />
                  </button>
                </h2>

                {isOpen && (
                  <div id={panelId} className="border-t border-rule p-4">
                    {cls.isActive && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        <ButtonLink to={`/teacher/attendance?turma=${cls.id}`} size="sm" icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}>
                          Fazer chamada
                        </ButtonLink>
                        <ButtonLink to={`/teacher/grades?turma=${cls.id}`} size="sm" variant="secondary" icon={<PenSquare className="h-4 w-4" aria-hidden="true" />}>
                          Lançar notas
                        </ButtonLink>
                      </div>
                    )}
                    {isLoadingThis ? (
                      <BlockLoader label="Carregando alunos…" rows={3} />
                    ) : failedStudents.has(cls.id) ? (
                      <LoadError message="Não foi possível carregar os alunos desta turma." onRetry={() => loadStudents(cls.id)}/>
                    ) : students.length === 0 ? (
                      <EmptyState icon={Users} title="Nenhum aluno nesta turma ainda" compact />
                    ) : (
                      <TableFrame caption={`Alunos da turma ${cls.name}`} minWidth="32rem">
                        <THead>
                          <Th sticky>Nome</Th>
                          <Th>Matrícula</Th>
                          <Th>E-mail</Th>
                        </THead>
                        <TBody>
                          {students.map(s => (
                            <Tr key={s.id}>
                              <Td sticky strong className="whitespace-nowrap">
                                {s.name}
                              </Td>
                              <Td className="figures text-sm">{s.registration}</Td>
                              <Td>{s.email}</Td>
                            </Tr>
                          ))}
                        </TBody>
                      </TableFrame>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};
