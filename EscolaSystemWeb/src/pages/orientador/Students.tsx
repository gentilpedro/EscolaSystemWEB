import React, { useCallback, useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import type { StudentItem, ClassItem } from '../../types';
import { studentApi, classApi } from '../../services/api';
import { listAll } from '../../lib/paging';
import {
  ActiveStamp,
  EmptyState,
  FilterBar,
  FilterSelect,
  LoadError,
  PageHeader,
  PageLoader,
  SearchInput,
  TableEmptyRow,
  TableFrame,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '../../components/ui';
import { matches, plural } from '../../lib/format';

export const OrientadorStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        listAll<StudentItem>((page, size) => studentApi.list(page, size)),
        classApi.list(1, 100),
      ]);
      setStudents(studentsData.items);
      setClasses(classesData.items);
      setError(null);
    } catch {
      setError('Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchAll();
  }, [fetchAll]);

  const filtered = students.filter(
    s => matches(searchTerm, s.name, s.email, s.registration) && (classFilter ? s.classId === classFilter : true),
  );

  return (
    <>
      <PageHeader title="Alunos" description={!loading ? `${plural(students.length, 'aluno', 'alunos')} nas turmas acompanhadas` : undefined} />

      {loading ? (
        <PageLoader label="Carregando alunos…" />
      ) : (
        <>
          {error && <LoadError message={error} onRetry={() => { setLoading(true); fetchAll(); }} />}
          <FilterBar>
            <SearchInput label="Pesquisar alunos" value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar por nome, e-mail ou matrícula…" />
            <FilterSelect label="Filtrar por turma" value={classFilter} onChange={setClassFilter}>
              <option value="">Todas as turmas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.year})
                </option>
              ))}
            </FilterSelect>
          </FilterBar>

          <TableFrame caption="Alunos" minWidth="44rem">
            <THead>
              <Th sticky>Nome</Th>
              <Th>Matrícula</Th>
              <Th>E-mail</Th>
              <Th>Turma</Th>
              <Th>Situação</Th>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmptyRow colSpan={5}>
                  <EmptyState icon={GraduationCap} title="Nenhum aluno encontrado" compact>
                    {searchTerm || classFilter ? 'Ajuste a busca ou o filtro de turma.' : 'Nenhum aluno nas turmas acompanhadas.'}
                  </EmptyState>
                </TableEmptyRow>
              ) : (
                filtered.map(s => (
                  <Tr key={s.id}>
                    <Td sticky strong className="whitespace-nowrap">
                      {s.name}
                    </Td>
                    <Td className="figures text-sm">{s.registration}</Td>
                    <Td>{s.email}</Td>
                    <Td className="whitespace-nowrap">{s.className}</Td>
                    <Td>
                      <ActiveStamp active={s.isActive} />
                    </Td>
                  </Tr>
                ))
              )}
            </TBody>
          </TableFrame>
        </>
      )}
    </>
  );
};
