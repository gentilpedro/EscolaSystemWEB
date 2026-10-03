import React, { useCallback, useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import type { AttendanceItem } from '../../types';
import { attendanceApi } from '../../services/api';
import { listAll } from '../../lib/paging';
import {
  Alert,
  AttendanceMark,
  EmptyState,
  FilterBar,
  FilterSelect,
  LoadError,
  PageHeader,
  PageLoader,
  SummaryStrip,
  TableEmptyRow,
  TableFrame,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '../../components/ui';
import { ATTENDANCE_MIN, attendanceRate, attendanceTone } from '../../lib/school';
import { formatDate, formatPercent } from '../../lib/format';

export const StudentAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState('');

  const fetchRecords = useCallback(() => {
    listAll<AttendanceItem>((page, size) => attendanceApi.list(page, size))
      .then(data => {
        setRecords([...data.items].sort((a, b) => b.date.localeCompare(a.date)));
        setError(null);
      })
      .catch(() => setError('Erro ao carregar frequência.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const classes = [...new Set(records.map(r => r.className))].sort();
  const filtered = classFilter ? records.filter(r => r.className === classFilter) : records;

  const total = filtered.length;
  const present = filtered.filter(r => r.isPresent).length;
  const absent = total - present;
  const rate = attendanceRate(present, total);

  const header = <PageHeader title="Minha frequência" description={`A frequência mínima de referência é ${ATTENDANCE_MIN}%.`} />;

  if (loading) {
    return (
      <>
        {header}
        <PageLoader label="Carregando frequência…" />
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
            fetchRecords();
          }}
        />
      )}

      <SummaryStrip
        items={[
          { label: 'Presenças', value: error ? '—' : present, tone: 'blue' },
          { label: 'Faltas', value: error ? '—' : absent, tone: !error && attendanceTone(rate) === 'red' ? 'red' : 'default' },
          {
            label: 'Presença',
            value: rate !== null ? formatPercent(rate) : '—',
            tone: error ? 'default' : attendanceTone(rate),
          },
        ]}
      />

      {rate !== null && absent > 0 && rate < ATTENDANCE_MIN && (
        <Alert tone="error" title={`Sua presença está abaixo de ${ATTENDANCE_MIN}%.`} className="mb-5">
          Isso pode impactar sua aprovação. Converse com a orientação da escola.
        </Alert>
      )}

      {classes.length > 1 && (
        <FilterBar>
          <FilterSelect label="Filtrar por turma" value={classFilter} onChange={setClassFilter}>
            <option value="">Todas as turmas</option>
            {classes.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
        </FilterBar>
      )}

      <TableFrame caption="Registros de presença" minWidth="34rem">
        <THead>
          <Th sticky>Data</Th>
          <Th>Turma</Th>
          <Th>Presença</Th>
          <Th>Observação</Th>
        </THead>
        <TBody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={4}>
              <EmptyState icon={CalendarCheck} title="Nenhum registro encontrado" compact>
                As chamadas aparecem aqui conforme os professores registram.
              </EmptyState>
            </TableEmptyRow>
          ) : (
            filtered.map(r => (
              <Tr key={r.id} tone={r.isPresent ? 'default' : 'flag'}>
                <Td sticky strong className="figures whitespace-nowrap">
                  {formatDate(r.date)}
                </Td>
                <Td className="whitespace-nowrap">{r.className}</Td>
                <Td>
                  <AttendanceMark present={r.isPresent} />
                </Td>
                <Td muted className="text-sm">
                  {r.notes || '—'}
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableFrame>
    </>
  );
};
