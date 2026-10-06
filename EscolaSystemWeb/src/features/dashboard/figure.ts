import type React from 'react';

/** Valor do resumo: "—" quando o dado não pôde ser carregado (nunca um zero falso). */
export function figure(value: number | null | undefined, failed: boolean): React.ReactNode {
  if (failed || value === null || value === undefined) return '—';
  return value.toLocaleString('pt-BR');
}
