import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import type { ClassItem, GradeItem, PagedResult } from '../../types';
import { classApi, gradeApi } from '../../services/api';
import {
  BlockLoader,
  EmptyState,
  FilterBar,
  FilterSelect,
  GradeLegend,
  GradeValue,
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
import { matches } from '../../lib/format';
import { listAll } from '../../lib/paging';

export const OrientadorGrades: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [searchParams] = useSearchParams();
  // ?turma=<id> vem do painel
  const [selectedClass, setSelectedClass] = useState(() => searchParams.get('turma') ?? '');
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradesFailed, setGradesFailed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    classApi
      .list(1, 100)
      .then((data: PagedResult<ClassItem>) => setClasses(data.items))
      .catch(() => setError('Erro ao carregar turmas.'))
      .finally(() => setLoading(false));
  }, []);

  const fetchGrades = useCallback(async () => {
    try {
      const data = await listAll<GradeItem>((page, size) => gradeApi.list(page, size, selectedClass || undefined));
      setGrades(data.items);
      setGradesFailed(false);
    } catch {
      setGrades([]);
      setGradesFailed(true);
    } finally {
      setLoadingGrades(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona: o setState só acontece depois do await
    fetchGrades();
  }, [fetchGrades]);

  const filtered = grades.filter(g => matches(searchTerm, g.studentName, g.subject));

  return (
    <>
      <PageHeader
        title="Notas"
      />

      {loading ? (
        <PageLoader label="Carregando turmas…" />
      ) : (
        <>
          {error && <LoadError message={error} />}
          {gradesFailed && <LoadError message="Erro ao carregar notas." onRetry={() => {
            setLoadingGrades(true);
            fetchGrades();
          }} />}

          <FilterBar>
            <SearchInput label="Pesquisar notas" value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar aluno ou disciplina…" />
            <FilterSelect
              label="Filtrar por turma"
              value={selectedClass}
              onChange={v => {
                setLoadingGrades(true);
                setSelectedClass(v);
              }}
            >
              <option value="">Todas as turmas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.year})
                </option>
              ))}
            </FilterSelect>
          </FilterBar>

          {loadingGrades ? (
            <BlockLoader label="Carregando notas…" />
          ) : (
            <TableFrame caption="Notas lançadas" minWidth="40rem">
              <THead>
                <Th sticky>Aluno</Th>
                <Th>Turma</Th>
                <Th>Disciplina</Th>
                <Th>Período</Th>
                <Th align="right">Nota</Th>
              </THead>
              <TBody>
                {filtered.length === 0 ? (
                  <TableEmptyRow colSpan={5}>
                    <EmptyState icon={PenSquare} title="Nenhuma nota encontrada" compact>
                      {searchTerm || selectedClass ? 'Ajuste a busca ou a turma.' : 'Ainda não há notas lançadas.'}
                    </EmptyState>
                  </TableEmptyRow>
                ) : (
                  filtered.map(g => (
                    <Tr key={g.id}>
                      <Td sticky strong className="whitespace-nowrap">
                        {g.studentName}
                      </Td>
                      <Td className="whitespace-nowrap">{g.className}</Td>
                      <Td>{g.subject}</Td>
                      <Td className="whitespace-nowrap">{g.period}</Td>
                      <Td align="right">
                        <GradeValue value={g.value} />
                      </Td>
                    </Tr>
                  ))
                )}
              </TBody>
            </TableFrame>
          )}
          {!loadingGrades && (
            <GradeLegend />
          )}
        </>
      )}
    </>
  );
};
