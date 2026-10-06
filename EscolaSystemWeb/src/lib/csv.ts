// Exportação de planilhas que abrem direto no Excel em português

type Cell = string | number | null | undefined;

function escapeCell(value: Cell): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Gera o CSV (BOM + ";" para o Excel pt-BR abrir com acentos e colunas certas) e baixa o arquivo. */
export function downloadCsv(fileName: string, rows: Cell[][]): void {
  const csv = '﻿' + rows.map(line => line.map(escapeCell).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** Trecho seguro para nome de arquivo: "6º Ano A" → "6º-ano-a". */
export function fileSlug(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/** Número com vírgula decimal, como o Excel pt-BR espera. */
export function csvNumber(value: number | null, digits = 1): string {
  return value === null ? '' : value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
