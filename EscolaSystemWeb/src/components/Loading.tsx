import React from 'react';
import { BrandMark } from './layout/BrandMark';

/** Carregamento de tela inteira: só na verificação inicial da sessão. */
export const Loading: React.FC<{ label?: string }> = ({ label = 'Carregando…' }) => (
  <div role="status" aria-live="polite" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper">
    <BrandMark className="h-12 w-12 motion-safe:animate-pulse" />
    <p className="text-[0.9375rem] text-ink-3">{label}</p>
  </div>
);
