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

/** Períodos de nota aceitos pela API (GradePeriods): ano letivo em trimestres. */
export const PERIODS = ['1º Trimestre', '2º Trimestre', '3º Trimestre', 'Recuperação', 'Final'];

/** Períodos antigos (bimestres): notas gravadas antes da troca continuam aparecendo, depois dos atuais. */
const LEGACY_PERIODS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export type Trimester = 1 | 2 | 3;

/** Datas de cada trimestre no ano letivo (fevereiro–dezembro), no formato MM-DD. */
export const TRIMESTER_DATES: Record<Trimester, { from: string; to: string }> = {
  1: { from: '02-01', to: '04-30' },
  2: { from: '05-01', to: '08-31' },
  3: { from: '09-01', to: '12-31' },
};

export const trimesterPeriod = (t: Trimester) => `${t}º Trimestre`;

export function trimesterRange(t: Trimester, year: number) {
  return { from: `${year}-${TRIMESTER_DATES[t].from}`, to: `${year}-${TRIMESTER_DATES[t].to}` };
}

/** Trimestre em que uma data (YYYY-MM-DD) cai; janeiro conta como 1º. */
export function trimesterOf(iso: string): Trimester {
  const month = Number(iso.slice(5, 7));
  return month <= 4 ? 1 : month <= 8 ? 2 : 3;
}

/** Trimestres que se cruzam com o intervalo (datas YYYY-MM-DD, `from` <= `to`). */
export function trimestersInRange(from: string, to: string): Trimester[] {
  const out: Trimester[] = [];
  for (const t of [1, 2, 3] as Trimester[]) {
    for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
      const r = trimesterRange(t, y);
      if (r.from <= to && r.to >= from) {
        out.push(t);
        break;
      }
    }
  }
  return out;
}

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

/** Ordena períodos na ordem do ano letivo (trimestres, Recuperação, Final, depois bimestres antigos). */
export function comparePeriods(a: string, b: string): number {
  const order = [...PERIODS, ...LEGACY_PERIODS];
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
}

export function average(values: number[]): number | null {
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
}
