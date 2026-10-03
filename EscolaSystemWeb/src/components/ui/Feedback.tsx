import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

type Tone = 'error' | 'success' | 'warning' | 'info';

const toneStyles: Record<Tone, string> = {
  error: 'border-red-ink/35 bg-red-tint text-red-ink',
  success: 'border-blue-ink/30 bg-blue-tint text-blue-ink',
  warning: 'border-amber-ink/35 bg-amber-tint text-amber-ink',
  info: 'border-rule-strong bg-sunken text-ink-2',
};

const toneIcons: Record<Tone, React.ElementType> = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

interface AlertProps {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** Aviso em linha. Erros e alertas são anunciados por leitores de tela. */
export const Alert: React.FC<AlertProps> = ({ tone = 'info', title, children, action, className }) => {
  const Icon = toneIcons[tone];
  return (
    <div
      // Só erro interrompe o leitor de tela; avisos estáticos não são reanunciados a cada render
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-md border px-4 py-3 text-[0.9375rem]', toneStyles[tone], className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-ink-2')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
};

/** Falha ao carregar dados, com opção de tentar de novo. */
export const LoadError: React.FC<{ message: string; onRetry?: () => void; className?: string }> = ({
  message,
  onRetry,
  className,
}) => (
  <Alert
    tone="error"
    title={message}
    className={cn('mb-6', className)}
    action={
      onRetry && (
        <Button variant="secondary" size="sm" icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />} onClick={onRetry}>
          Tentar de novo
        </Button>
      )
    }
  >
    Verifique a conexão e tente novamente.
  </Alert>
);

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, children, action, className, compact }) => (
  <div className={cn('flex flex-col items-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
    {Icon && (
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-rule bg-sunken text-ink-3">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
    )}
    <p className="text-base font-semibold text-ink">{title}</p>
    {children && <div className="mt-1 max-w-md text-[0.9375rem] text-ink-3">{children}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded bg-rule/70', className)} aria-hidden="true" />
);

/** Carregamento dentro do conteúdo: mantém o layout no lugar em vez de trocar a página. */
export const PageLoader: React.FC<{ label?: string; rows?: number }> = ({ label = 'Carregando…', rows = 6 }) => (
  <div role="status" aria-live="polite" className="py-2">
    <span className="sr-only">{label}</span>
    <div className="mb-6 space-y-3">
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
    <div className="overflow-hidden rounded-lg border border-rule bg-surface">
      <Skeleton className="h-11 w-full rounded-none" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-t border-rule px-4 py-3.5">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

/** Carregamento em bloco (seção dentro de uma página). */
export const BlockLoader: React.FC<{ label?: string; rows?: number }> = ({ label = 'Carregando…', rows = 5 }) => (
  <div role="status" aria-live="polite" className="overflow-hidden rounded-lg border border-rule bg-surface">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={cn('flex items-center gap-6 px-4 py-3.5', i > 0 && 'border-t border-rule')}>
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/5" />
        <Skeleton className="ml-auto h-4 w-20" />
      </div>
    ))}
  </div>
);
