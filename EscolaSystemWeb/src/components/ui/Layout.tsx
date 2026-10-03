import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Cabeçalho de página com a régua dupla do livro de registro. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b-[3px] border-double border-rule-strong pb-4">
    <div className="min-w-0">
      <h1 className="text-[1.75rem] font-bold leading-tight text-ink sm:text-[2rem]">{title}</h1>
      {description && <div className="mt-1 text-[0.9375rem] text-ink-3">{description}</div>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

interface PanelProps {
  title?: string;
  titleId?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}

/** Seção com régua: o contêiner padrão do sistema (sem sombra decorativa). */
export const Panel: React.FC<PanelProps> = ({ title, titleId, action, children, className, flush }) => (
  <section aria-labelledby={title ? titleId : undefined} className={cn('rounded-lg border border-rule bg-surface', className)}>
    {title && (
      <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-3.5">
        <h2 id={titleId} className="text-base font-bold text-ink">
          {title}
        </h2>
        {action}
      </div>
    )}
    <div className={flush ? undefined : 'p-5'}>{children}</div>
  </section>
);

export interface SummaryItem {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'default' | 'blue' | 'red' | 'amber';
}

const summaryTone = {
  default: 'text-ink',
  blue: 'text-blue-ink',
  red: 'text-red-ink',
  amber: 'text-amber-ink',
};

/**
 * Linha de totais do diário: números lado a lado separados por réguas,
 * no lugar de cartões coloridos com ícone.
 */
export const SummaryStrip: React.FC<{ items: SummaryItem[]; className?: string; label?: string }> = ({
  items,
  className,
  label = 'Resumo',
}) => (
  <dl
    aria-label={label}
    className={cn(
      'mb-6 grid grid-cols-2 overflow-hidden rounded-lg border border-rule bg-surface',
      items.length >= 4 ? 'lg:grid-cols-4' : items.length === 3 ? 'sm:grid-cols-3' : '',
      className,
    )}
  >
    {items.map((item, i) => (
      <div
        key={item.label}
        className={cn(
          'flex flex-col gap-1 px-5 py-4',
          // réguas internas: horizontal entre linhas, vertical entre colunas
          'border-rule',
          i % 2 === 1 && 'border-l',
          i >= 2 && 'border-t',
          items.length >= 4 && 'lg:border-t-0',
          items.length >= 4 && i > 0 && 'lg:border-l',
          items.length === 3 && 'sm:border-t-0',
          items.length === 3 && i > 0 && 'sm:border-l',
          items.length === 3 && i === 2 && 'col-span-2 sm:col-span-1',
        )}
      >
        <dt className="text-sm font-semibold text-ink-3">{item.label}</dt>
        <dd className={cn('figures-display text-[1.75rem] font-bold leading-none', summaryTone[item.tone ?? 'default'])}>{item.value}</dd>
        {item.hint && <dd className="text-[0.8125rem] text-ink-3">{item.hint}</dd>}
      </div>
    ))}
  </dl>
);

export interface TaskLink {
  to: string;
  label: string;
  description?: string;
}

/** Lista pautada de tarefas do perfil (substitui os botões "Ações rápidas"). */
export const TaskList: React.FC<{ items: TaskLink[] }> = ({ items }) => (
  <ul className="divide-y divide-rule">
    {items.map(item => (
      <li key={item.to}>
        <Link
          to={item.to}
          className="group flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-sunken focus-visible:bg-sunken"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">{item.label}</span>
            {item.description && <span className="block text-sm text-ink-3">{item.description}</span>}
          </span>
          <ChevronRight
            className="h-5 w-5 shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </li>
    ))}
  </ul>
);

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
}

/** Alternância de visão (ex.: Pendentes / Entregues / Todos). */
export function Segmented<T extends string>({ label, value, onChange, options }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap rounded-md border border-control bg-surface p-1">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded px-3 text-sm font-semibold transition-colors duration-150 sm:min-h-9',
              active ? 'bg-lousa text-white' : 'text-ink-2 hover:bg-sunken',
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cn('figures text-[0.8125rem]', active ? 'text-white/85' : 'text-ink-3')}>{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
