import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/ui';
import { SESSION_ROLE_LABEL } from '../../lib/school';
import type { ClassItem } from '../../types';
import { ActiveStamp, EmptyState } from '../../components/ui';
import { BookOpen } from 'lucide-react';

/** Cabeçalho dos painéis: quem está logado e em que papel. */
export const DashboardHeader: React.FC<{ title?: string; description?: React.ReactNode }> = ({ title, description }) => {
  const { user } = useAuth();
  const firstName = user?.name.split(' ')[0] ?? '';
  return (
    <PageHeader
      title={title ?? (firstName ? `Olá, ${firstName}` : 'Painel')}
      description={description ?? (user ? SESSION_ROLE_LABEL[user.role] : undefined)}
    />
  );
};

/** Valor do resumo: "—" quando o dado não pôde ser carregado (nunca um zero falso). */
export function figure(value: number | null | undefined, failed: boolean): React.ReactNode {
  if (failed || value === null || value === undefined) return '—';
  return value.toLocaleString('pt-BR');
}

/** Duas colunas no desktop quando há dois blocos; um bloco só ocupa a largura de leitura. */
export const DashboardColumns: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className={
      React.Children.toArray(children).filter(Boolean).length > 1
        ? 'grid items-start gap-6 lg:grid-cols-2 [&>*]:min-w-0'
        : 'max-w-3xl [&>*]:min-w-0'
    }
  >
    {children}
  </div>
);

interface ClassListProps {
  classes: ClassItem[];
  failed?: boolean;
  /** Situação da turma hoje (ex.: chamada feita / pendente). */
  status?: (cls: ClassItem) => React.ReactNode;
  /** Atalhos para a tarefa daquela turma (chamada, notas). */
  actions?: (cls: ClassItem) => React.ReactNode;
}

/** Turmas do perfil: ativas primeiro, cada uma com a sua situação e o atalho para a tarefa. */
export const ClassList: React.FC<ClassListProps> = ({ classes, failed, status, actions }) => {
  if (classes.length === 0) {
    return (
      <EmptyState icon={BookOpen} title={failed ? 'Turmas indisponíveis' : 'Nenhuma turma atribuída'} compact>
        {failed ? 'Não foi possível carregar as turmas.' : 'A diretoria faz o vínculo com as turmas.'}
      </EmptyState>
    );
  }
  const ordered = [...classes].sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.year - a.year || a.name.localeCompare(b.name));
  return (
    <ul className="divide-y divide-rule">
      {ordered.map(cls => (
        <li key={cls.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{cls.name}</p>
            <p className="text-sm text-ink-3">
              Ano letivo <span className="figures">{cls.year}</span>
              {cls.isActive && status && <> · {status(cls)}</>}
            </p>
          </div>
          {cls.isActive ? actions && <div className="flex flex-wrap gap-2">{actions(cls)}</div> : <ActiveStamp active={false} feminine />}
        </li>
      ))}
    </ul>
  );
};
