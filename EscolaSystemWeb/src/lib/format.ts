// Formatação de registros escolares (pt-BR)

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Datas "YYYY-MM-DD" vêm sem fuso; ancorar ao meio-dia evita voltar um dia.
function toDate(value: string): Date {
  return DATE_ONLY.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('pt-BR');
}

export function formatLongDate(value?: string | null): string {
  if (!value) return '—';
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('pt-BR', { dateStyle: 'long' });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = toDate(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatWeekday(value: string): string {
  return toDate(value).toLocaleDateString('pt-BR', { weekday: 'long' });
}

export function formatGrade(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function todayIso(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

export function shiftIsoDate(value: string, days: number): string {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function matches(query: string, ...fields: Array<string | number | null | undefined>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(f => f !== null && f !== undefined && String(f).toLowerCase().includes(q));
}

/** Lê nota digitada com vírgula ou ponto ("7,5" ou "7.5"). Vazio ou inválido → null. */
export function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function isWeekend(isoDate: string): boolean {
  const day = new Date(`${isoDate}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
