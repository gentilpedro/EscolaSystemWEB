// Marcas do registro escolar: carimbos de situação, notas e presença.
import React from 'react';
import { cn } from '../../lib/cn';
import { CALL_STATUS_FAMILY_LABEL, CALL_STATUS_LABEL, CALL_STATUS_TONE, GRADE_LEVEL_LABEL, gradeLevel, API_ROLE_LABEL } from '../../lib/school';
import { formatGrade } from '../../lib/format';

type StampTone = 'blue' | 'red' | 'amber' | 'neutral' | 'lousa';

const stampTones: Record<StampTone, string> = {
  blue: 'border-blue-ink/55 text-blue-ink bg-blue-tint/60',
  red: 'border-red-ink/55 text-red-ink bg-red-tint/60',
  amber: 'border-amber-ink/55 text-amber-ink bg-amber-tint/70',
  neutral: 'border-rule-strong text-ink-3 bg-sunken',
  lousa: 'border-lousa/45 text-lousa bg-lousa-tint/70',
};

/** Carimbo retangular de situação, como no livro de registro. */
export const Stamp: React.FC<{ tone?: StampTone; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  children,
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded-[3px] border-[1.5px] px-1.5 py-px text-[0.6875rem] font-bold uppercase leading-4 tracking-[0.06em] whitespace-nowrap',
      stampTones[tone],
      className,
    )}
  >
    {children}
  </span>
);

/**
 * Situação do chamado. A tinta segue o desfecho para o aluno: advertência confirmada
 * em vermelho, arquivado em neutro, pendente em âmbar. Para a família, o rótulo diz o
 * que a decisão significa ("Advertência confirmada" / "Arquivado").
 */
export const CallStatusStamp: React.FC<{ status: number; fallback?: string; audience?: 'school' | 'family' }> = ({
  status,
  fallback,
  audience = 'school',
}) => (
  <Stamp tone={CALL_STATUS_TONE[status] ?? 'neutral'}>
    {(audience === 'family' ? CALL_STATUS_FAMILY_LABEL[status] : CALL_STATUS_LABEL[status]) ?? fallback ?? '—'}
  </Stamp>
);

export const ActiveStamp: React.FC<{ active: boolean; feminine?: boolean }> = ({ active, feminine }) => (
  <Stamp tone={active ? 'lousa' : 'neutral'}>{active ? (feminine ? 'Ativa' : 'Ativo') : feminine ? 'Inativa' : 'Inativo'}</Stamp>
);

/** Perfil de usuário: etiqueta sóbria, sem arco-íris de cores. */
export const RoleTag: React.FC<{ role: string }> = ({ role }) => (
  <span className="inline-flex items-center rounded-md border border-rule bg-sunken px-2 py-0.5 text-[0.8125rem] font-semibold text-ink-2 whitespace-nowrap">
    {API_ROLE_LABEL[role] ?? role}
  </span>
);

const gradeInk = {
  ok: 'text-blue-ink',
  warn: 'text-amber-ink',
  low: 'text-red-ink',
};

interface GradeValueProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const gradeSizes = {
  sm: 'text-[0.9375rem]',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

/**
 * Nota do boletim. Cor = tinta azul/âmbar/vermelha; nota vermelha também leva sublinhado,
 * para não depender só da cor; a situação vai por extenso para leitores de tela.
 */
export const GradeValue: React.FC<GradeValueProps> = ({ value, size = 'md', className }) => {
  const level = gradeLevel(value);
  return (
    <span className={cn(size === 'lg' || size === 'xl' ? 'figures-display' : 'figures', 'font-bold', gradeInk[level], gradeSizes[size], className)}>
      <span className={cn(level === 'low' && 'underline decoration-2 underline-offset-4')}>{formatGrade(value)}</span>
      <span className="sr-only"> ({GRADE_LEVEL_LABEL[level]})</span>
    </span>
  );
};

/** Marca do diário: P (presente, tinta azul) ou F (falta, tinta vermelha). */
export const AttendanceMark: React.FC<{ present: boolean; withLabel?: boolean }> = ({ present, withLabel = true }) => (
  <span className={cn('inline-flex items-center gap-2', present ? 'text-blue-ink' : 'text-red-ink')}>
    <span
      aria-hidden="true"
      className={cn(
        'figures inline-flex h-6 w-6 items-center justify-center rounded-[3px] border-[1.5px] text-[0.8125rem] font-bold',
        present ? 'border-blue-ink/55 bg-blue-tint' : 'border-red-ink/55 bg-red-tint',
      )}
    >
      {present ? 'P' : 'F'}
    </span>
    {withLabel ? (
      <span className="text-[0.9375rem] font-semibold">{present ? 'Presente' : 'Falta'}</span>
    ) : (
      <span className="sr-only">{present ? 'Presente' : 'Falta'}</span>
    )}
  </span>
);

/** Legenda do boletim — sempre como nota de rodapé, no mesmo lugar em todas as telas de nota. */
export const GradeLegend: React.FC<{ className?: string }> = ({ className }) => (
  <p className={cn('mt-3 text-sm text-ink-3', className)}>
    Tinta azul a partir de 7; âmbar entre 5 e 7; nota vermelha (sublinhada) abaixo de 5.
  </p>
);
