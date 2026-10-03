import React from 'react';
import { cn } from '../../lib/cn';

/** Marca EscolaSystem: uma folha de diário pautada sobre a lousa, com o visto de presença. */
export const BrandMark: React.FC<{ className?: string; onLousa?: boolean }> = ({ className, onLousa }) => (
  <svg viewBox="0 0 32 32" className={cn('h-8 w-8 shrink-0', className)} aria-hidden="true" focusable="false">
    <rect width="32" height="32" rx="7" fill={onLousa ? '#e9f0ec' : '#1f5c47'} />
    <g stroke={onLousa ? '#1f5c47' : '#e9f0ec'} strokeLinecap="round">
      <path d="M8 10.5h16M8 16h9M8 21.5h7" strokeWidth="2" opacity="0.55" />
      <path d="M18.5 21l2.6 2.6 4.4-6" strokeWidth="2.4" strokeLinejoin="round" fill="none" />
    </g>
  </svg>
);

export const Wordmark: React.FC<{ className?: string; onLousa?: boolean }> = ({ className, onLousa }) => (
  <span className={cn('inline-flex items-center gap-2.5', className)}>
    <BrandMark onLousa={onLousa} />
    <span className={cn('text-lg font-bold tracking-[-0.01em]', onLousa ? 'text-chalk' : 'text-ink')}>EscolaSystem</span>
  </span>
);
