import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

interface TableFrameProps {
  /** Descreve a tabela para leitores de tela (vira <caption>). */
  caption: string;
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
  footer?: React.ReactNode;
}

/**
 * Tabela pautada. Em telas estreitas rola na horizontal dentro da moldura
 * (a página não rola de lado), a primeira coluna fica fixa e uma sombra na
 * borda direita avisa que há mais colunas (ex.: as ações).
 */
export const TableFrame: React.FC<TableFrameProps> = ({ caption, children, className, minWidth = '44rem', footer }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [moreRight, setMoreRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-rule bg-surface', className)}>
      {/* relative: mantém textos sr-only (absolutos) dentro da área que rola */}
      <div ref={scrollRef} className="relative overflow-x-auto" tabIndex={0} role="region" aria-label={caption}>
        <table className="w-full border-collapse text-left text-[0.9375rem]" style={{ minWidth }}>
          <caption className="sr-only">{caption}</caption>
          {children}
        </table>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-[2] w-8 bg-gradient-to-l from-ink/12 to-transparent transition-opacity duration-150',
          moreRight ? 'opacity-100' : 'opacity-0',
        )}
      />
      {footer}
    </div>
  );
};

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="border-b border-rule-strong bg-sunken">
    <tr>{children}</tr>
  </thead>
);

type Align = 'left' | 'center' | 'right';
const alignClass: Record<Align, string> = { left: 'text-left', center: 'text-center', right: 'text-right' };

export const Th: React.FC<{ children?: React.ReactNode; align?: Align; className?: string; sticky?: boolean; srOnly?: boolean }> = ({
  children,
  align = 'left',
  className,
  sticky,
  srOnly,
}) => (
  <th
    scope="col"
    className={cn(
      'px-4 py-3 text-sm font-bold text-ink-2 whitespace-nowrap',
      alignClass[align],
      sticky && 'sticky left-0 z-[1] bg-sunken',
      className,
    )}
  >
    {srOnly ? <span className="sr-only">{children}</span> : children}
  </th>
);

export const TBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-rule">{children}</tbody>
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { tone?: 'default' | 'flag' }> = ({
  className,
  tone = 'default',
  ...rest
}) => (
  <tr
    data-flag={tone === 'flag' || undefined}
    className={cn('group transition-colors duration-100 hover:bg-paper', tone === 'flag' && 'bg-red-wash', className)}
    {...rest}
  />
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement> & { align?: Align; sticky?: boolean; strong?: boolean; muted?: boolean }> = ({
  align = 'left',
  sticky,
  strong,
  muted,
  className,
  ...rest
}) => (
  <td
    className={cn(
      'px-4 py-3 align-middle',
      alignClass[align],
      strong ? 'font-semibold text-ink' : muted ? 'text-ink-3' : 'text-ink-2',
      sticky && 'sticky left-0 z-[1] bg-surface group-hover:bg-paper group-data-[flag]:bg-red-wash',
      className,
    )}
    {...rest}
  />
);

/** Linha única de vazio, ocupando todas as colunas. */
export const TableEmptyRow: React.FC<{ colSpan: number; children: React.ReactNode }> = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-2">
      {children}
    </td>
  </tr>
);

/** Ações de linha: editar/vincular juntos; excluir isolado por um respiro. */
export const RowActions: React.FC<{ children: React.ReactNode; destructive?: React.ReactNode }> = ({ children, destructive }) => (
  <div className="flex items-center justify-end gap-1">
    {children}
    {destructive && (
      <>
        <span className="mx-1 h-6 w-px bg-rule" aria-hidden="true" />
        {destructive}
      </>
    )}
  </div>
);

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  noun: string;
  onPage: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, totalCount, pageSize, noun, onPage }) => (
  <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3">
    <p className="text-sm text-ink-3">
      <span className="figures">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
      </span>{' '}
      de <span className="figures">{totalCount}</span> {noun}
    </p>
    <div className="flex items-center gap-1">
      <IconButton label="Página anterior" icon={<ChevronLeft className="h-5 w-5" />} onClick={() => onPage(page - 1)} disabled={page <= 1} />
      <span className="figures px-2 text-sm text-ink-2">
        <span className="sr-only">Página </span>
        {page}
        <span aria-hidden="true"> / </span>
        <span className="sr-only"> de </span>
        {totalPages}
      </span>
      <IconButton
        label="Próxima página"
        icon={<ChevronRight className="h-5 w-5" />}
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
      />
    </div>
  </nav>
);
