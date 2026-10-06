import React, { useCallback, useEffect, useState } from 'react';
import { PenSquare } from 'lucide-react';
import type { GradeItem } from '../../types';
import { gradeApi } from '../../services/api';
import {
  EmptyState,
  FilterBar,
  FilterSelect,
  GradeLegend,
  GradeValue,
  LoadError,
  PageHeader,
  PageLoader,
  TableEmptyRow,
  TableFrame,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '../../components/ui';
import { PERIODS, average, comparePeriods } from '../../lib/school';
import { listAll } from '../../lib/paging';

const SHORT_PERIOD: Record<string, string> = {
  '1º Trimestre': '1º Tri',
  '2º Trimestre': '2º Tri',
  '3º Trimestre': '3º Tri',
  // Notas antigas, de antes da troca para trimestres
  '1º Bimestre': '1º Bim',
  '2º Bimestre': '2º Bim',
  '3º Bimestre': '3º Bim',
  '4º Bimestre': '4º Bim',
  Recuperação: 'Rec.',
  Final: 'Final',
};

/**
 * Boletim do aluno: disciplinas nas linhas, períodos nas colunas e a média de cada
 * disciplina como o número de destaque. Várias notas no mesmo período viram a média do período.
 */
export const StudentGrades: React.FC = () => {
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState('');

  const fetchGrades = useCallback(() => {
    listAll<GradeItem>((page, size) => gradeApi.list(page, size))
      .then(data => {
        setGrades(data.items);
        setError(null);
      })
      .catch(() => setError('Erro ao carregar notas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const periodsWithData = [...new Set(grades.map(g => g.period))].sort(comparePeriods);
  // Sempre os três trimestres; recuperação, final e períodos antigos só quando existirem
  const columns = (periodFilter ? [periodFilter] : [...new Set([...PERIODS.slice(0, 3), ...periodsWithData])].sort(comparePeriods));

  const subjects = [...new Set(grades.map(g => g.subject))].sort((a, b) => a.localeCompare(b));
  const cell = (subject: string, period: string) => {
    const values = grades.filter(g => g.subject === subject && g.period === period).map(g => g.value);
    return { value: average(values), count: values.length };
  };
  const subjectAverage = (subject: string) => average(grades.filter(g => g.subject === subject).map(g => g.value));
  const overall = average(grades.map(g => g.value));

  const header = (
    <PageHeader
      title="Minhas notas"
      description={
        overall !== null ? (
          <span className="inline-flex items-baseline gap-2">
            Média geral <GradeValue value={overall} size="md" />
          </span>
        ) : undefined
      }
    />
  );

  if (loading) {
    return (
      <>
        {header}
        <PageLoader label="Carregando notas…" rows={4} />
      </>
    );
  }

  return (
    <>
      {header}
      {error && (
        <LoadError
          message={error}
          onRetry={() => {
            setLoading(true);
            fetchGrades();
          }}
        />
      )}

      {periodsWithData.length > 1 && (
        <FilterBar>
          <FilterSelect label="Filtrar por período" value={periodFilter} onChange={setPeriodFilter}>
            <option value="">Todos os períodos</option>
            {periodsWithData.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </FilterSelect>
        </FilterBar>
      )}

      {!error && (
        <>
          <TableFrame caption="Boletim: notas por disciplina e período" minWidth={`${12 + columns.length * 6 + 7}rem`}>
            <THead>
              <Th sticky>Disciplina</Th>
              {columns.map(p => (
                <Th key={p} align="center">
                  <abbr title={p} className="no-underline">
                    {SHORT_PERIOD[p] ?? p}
                  </abbr>
                </Th>
              ))}
              <Th align="right">Média</Th>
            </THead>
            <TBody>
              {subjects.length === 0 ? (
                <TableEmptyRow colSpan={columns.length + 2}>
                  <EmptyState icon={PenSquare} title="Nenhuma nota lançada ainda" compact>
                    As notas aparecem aqui assim que os professores lançarem.
                  </EmptyState>
                </TableEmptyRow>
              ) : (
                subjects.map(subject => {
                  const avg = subjectAverage(subject);
                  return (
                    <Tr key={subject}>
                      <Td sticky strong className="whitespace-nowrap">
                        {subject}
                      </Td>
                      {columns.map(p => {
                        const c = cell(subject, p);
                        return (
                          <Td key={p} align="center">
                            {c.value !== null ? (
                              <span className="inline-flex flex-col items-center">
                                <GradeValue value={c.value} size="md" />
                                {c.count > 1 && <span className="text-[0.75rem] text-ink-3">média de {c.count}</span>}
                              </span>
                            ) : (
                              <span className="text-ink-3" aria-label="sem nota">
                                —
                              </span>
                            )}
                          </Td>
                        );
                      })}
                      <Td align="right" className="bg-paper">
                        {avg !== null && <GradeValue value={avg} size="lg" />}
                      </Td>
                    </Tr>
                  );
                })
              )}
            </TBody>
          </TableFrame>
          <GradeLegend />
        </>
      )}
    </>
  );
};
