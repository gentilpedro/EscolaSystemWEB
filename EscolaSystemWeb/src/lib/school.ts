// Regras de leitura do registro escolar, num lugar só.
import { UserRole } from '../types';

/** Status de chamado disciplinar — espelha DisciplinaryCallStatus da API (1, 2, 3). */
export const CallStatus = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;

export type CallStatusValue = (typeof CallStatus)[keyof typeof CallStatus];

export const CALL_STATUS_LABEL: Record<number, string> = {
  [CallStatus.PENDING]: 'Pendente',
  [CallStatus.APPROVED]: 'Aprovado',
  [CallStatus.REJECTED]: 'Rejeitado',
};

export const CALL_STATUS_OPTIONS = [
  { value: String(CallStatus.PENDING), label: 'Pendente' },
  { value: String(CallStatus.APPROVED), label: 'Aprovado' },
  { value: String(CallStatus.REJECTED), label: 'Rejeitado' },
];

/** Limites do boletim: 7 ou mais = na média; 5 a 6,9 = atenção; abaixo de 5 = nota vermelha. */
export const GRADE_PASS = 7;
export const GRADE_WARN = 5;
export type GradeLevel = 'ok' | 'warn' | 'low';

export function gradeLevel(value: number): GradeLevel {
  // Classifica o valor como ele aparece (uma casa decimal): "7,0" nunca sai em âmbar
  const shown = Math.round(value * 10) / 10;
  if (shown >= GRADE_PASS) return 'ok';
  if (shown >= GRADE_WARN) return 'warn';
  return 'low';
}

export const GRADE_LEVEL_TONE: Record<GradeLevel, 'blue' | 'amber' | 'red'> = { ok: 'blue', warn: 'amber', low: 'red' };

export const GRADE_LEVEL_LABEL: Record<GradeLevel, string> = {
  ok: 'na média',
  warn: 'atenção',
  low: 'abaixo da média',
};

/** Frequência mínima de referência para aprovação. */
export const ATTENDANCE_MIN = 75;

export const PERIODS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre', 'Recuperação', 'Final'];

/** Nomes de perfil como vêm da API (UserListItem.role). */
export const API_ROLE_LABEL: Record<string, string> = {
  Admin: 'Administrador',
  Director: 'Diretor',
  Teacher: 'Professor',
  Orientador: 'Orientador',
  Student: 'Aluno',
  Parent: 'Responsável',
};

/** Perfis da sessão (User.role normalizado em minúsculas). */
export const SESSION_ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administração',
  [UserRole.DIRECTOR]: 'Direção',
  [UserRole.TEACHER]: 'Professor',
  [UserRole.ORIENTADOR]: 'Orientação',
  [UserRole.PARENT]: 'Responsável',
  [UserRole.STUDENT]: 'Aluno',
};

/* ---------- Chamados: a tinta segue o desfecho para o aluno ---------- */

/** Pendente = âmbar; aprovado (sanção confirmada) = vermelho; rejeitado (arquivado) = neutro. */
export const CALL_STATUS_TONE: Record<number, 'amber' | 'red' | 'neutral'> = {
  [CallStatus.PENDING]: 'amber',
  [CallStatus.APPROVED]: 'red',
  [CallStatus.REJECTED]: 'neutral',
};

/** Rótulos para a família: o que a decisão significa para o aluno. */
export const CALL_STATUS_FAMILY_LABEL: Record<number, string> = {
  [CallStatus.PENDING]: 'Em análise',
  [CallStatus.APPROVED]: 'Advertência confirmada',
  [CallStatus.REJECTED]: 'Arquivado',
};

/* ---------- Frequência ---------- */

export function attendanceRate(present: number, total: number): number | null {
  return total > 0 ? (present / total) * 100 : null;
}

/** Tinta da frequência/faltas, sempre pela regra dos 75%. */
export function attendanceTone(rate: number | null): 'blue' | 'red' | 'default' {
  if (rate === null) return 'default';
  return rate >= ATTENDANCE_MIN ? 'blue' : 'red';
}

/* ---------- Boletim ---------- */

/** Ordena períodos na ordem do ano letivo (1º–4º Bimestre, Recuperação, Final); desconhecidos por último. */
export function comparePeriods(a: string, b: string): number {
  const ia = PERIODS.indexOf(a);
  const ib = PERIODS.indexOf(b);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
}

export function average(values: number[]): number | null {
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
}
