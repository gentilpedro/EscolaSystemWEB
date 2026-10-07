// Types for Sistema Escolar

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  avatar?: string;
  cpf?: string;
  phone?: string;
}

// Objeto constante em vez de enum (o tsconfig usa erasableSyntaxOnly); mesmos valores.
export const UserRole = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  TEACHER: 'teacher',
  ORIENTADOR: 'orientador',
  PARENT: 'parent',
  STUDENT: 'student',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface School {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  /** Pessoas com conta ativa na escola; a API manda só no detalhe e só para o admin */
  activeUsers?: number;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  schoolName?: string;
  isActive: boolean;
  createdAt: string;
  cpf?: string | null;
  phone?: string | null;
  /** Aluno da conta (perfil Aluno) */
  studentId?: string | null;
  /** Turmas vinculadas (professor e orientador) */
  classIds?: string[] | null;
  /** Alunos vinculados (responsável) */
  studentIds?: string[] | null;
  /** Escolas com vínculo ativo (professor, orientador e responsável podem estar em várias) */
  schools?: { id: string; name: string }[] | null;
  /** Até quando a conta fica bloqueada por senha errada; null quando não está bloqueada */
  lockedUntil?: string | null;
  /** Último login ou renovação de sessão (só para o admin); null quando nunca entrou */
  lastAccessAt?: string | null;
}

/** Filtros de GET /api/users; a API aplica todos dentro do escopo do perfil. */
export interface UserFilters {
  schoolId?: string;
  roleId?: number;
  /** Trecho do nome ou do e-mail */
  search?: string;
  isActive?: boolean;
  /** true: só quem está bloqueado agora por senha errada */
  locked?: boolean;
}

export interface ClassItem {
  id: string;
  name: string;
  year: number;
  schoolId: string;
  schoolName: string;
  isActive: boolean;
  createdAt: string;
}

export interface StudentItem {
  id: string;
  name: string;
  email: string;
  registration: string;
  birthDate: string;
  classId: string;
  className: string;
  isActive: boolean;
  createdAt: string;
}

export interface DisciplinaryCall {
  id: string;
  studentId: string;
  studentName: string;
  description: string;
  status: number;
  statusName: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
}

export interface GradeItem {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  subject: string;
  value: number;
  period: string;
  createdAt: string;
}

export interface AttendanceItem {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  isPresent: boolean;
  notes?: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PendingWorkItem {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  dueDate: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
  /** Liga os registros (um por aluno) do mesmo trabalho lançado para a turma */
  assignmentId: string;
}

export const ROLES: { id: number; name: string; label: string }[] = [
  { id: 1, name: 'Admin', label: 'Administrador' },
  { id: 2, name: 'Director', label: 'Diretor' },
  { id: 3, name: 'Teacher', label: 'Professor' },
  { id: 4, name: 'Student', label: 'Aluno' },
  { id: 5, name: 'Parent', label: 'Responsável' },
  { id: 6, name: 'Orientador', label: 'Orientador' },
];

/** Ids de perfil da API (Roles), para filtros e cadastro. */
export const RoleId = {
  ADMIN: 1,
  DIRECTOR: 2,
  TEACHER: 3,
  STUDENT: 4,
  PARENT: 5,
  ORIENTADOR: 6,
} as const;

/** GET /api/dashboard/stats: totais já restritos ao que o usuário logado pode ver. */
export interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalStaff: number;
  pendingDisciplinaryCalls: number;
  pendingWorks: number;
  averageGrade: number | null;
  attendanceRate: number | null;
}

/** GET /api/reports/classes: indicadores de uma turma. */
export interface ClassReport {
  classId: string;
  className: string;
  year: number;
  studentCount: number;
  averageGrade: number | null;
  attendanceRate: number | null;
  disciplinaryCalls: number;
  pendingDisciplinaryCalls: number;
}

/** GET /api/admin/stats */
/** Sessão aberta da própria conta (GET /api/auth/sessions) */
export interface SessionItem {
  id: string;
  /** Navegador e sistema resumidos, como "Chrome no Windows" */
  device: string;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

/** Linha do registro de atividades (GET /api/audit) */
export interface AuditLogItem {
  id: string;
  createdAt: string;
  actorId?: string | null;
  actorName: string;
  /** Código estável da ação, como "school.deactivated" (rótulos em lib/audit) */
  action: string;
  targetType: 'School' | 'User';
  targetId: string;
  targetName: string;
  /** O que mudou, já em texto; nunca senha nem CPF */
  details?: string | null;
}

/* ---------- Tickets da escola para a administração ---------- */

export const TicketType = {
  BUG: 1,
  IMPROVEMENT: 2,
  QUESTION: 3,
  OTHER: 4,
} as const;

export type TicketType = (typeof TicketType)[keyof typeof TicketType];

export const TicketStatus = {
  OPEN: 1,
  IN_PROGRESS: 2,
  RESOLVED: 3,
  CLOSED: 4,
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export interface TicketListItem {
  id: string;
  title: string;
  type: TicketType;
  typeName: string;
  status: TicketStatus;
  statusName: string;
  schoolId: string;
  schoolName: string;
  openedByName: string;
  createdAt: string;
  lastActivityAt: string;
  messageCount: number;
}

export interface TicketMessage {
  id: string;
  authorName: string;
  /** Resposta da administração do sistema (as demais são da direção) */
  fromAdministration: boolean;
  body: string;
  createdAt: string;
}

export interface TicketDetail extends Omit<TicketListItem, 'messageCount'> {
  description: string;
  messages: TicketMessage[];
}

/** Tickets abertos ou em andamento, por tipo e por situação */
export interface TicketSummary {
  bugs: number;
  improvements: number;
  questions: number;
  others: number;
  open: number;
  inProgress: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  type?: TicketType;
  schoolId?: string;
}

export interface AdminStats {
  totalSchools: number;
  activeSchools: number;
  totalUsers: number;
  totalClasses: number;
  totalStudents: number;
  /** Administradores e diretores bloqueados agora por senha errada */
  lockedAccounts: number;
}

/* ---------- Contratos de escrita e de autenticação (OpenAPI da API: /openapi/v1.json) ---------- */

/** UserDto: usuário logado, como vem de /auth/login e /auth/me (perfil com a grafia da API). */
export interface ApiSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string | null;
  schoolName?: string | null;
  studentId?: string | null;
  phone?: string | null;
  createdAt: string;
}

/** Resposta de login e renovação: os tokens vão em cookies httpOnly, o corpo só traz a validade e o usuário. */
export interface AuthResponse {
  expiresAt: string;
  user: ApiSessionUser;
}

export interface SchoolPayload {
  name: string;
  address: string;
  phone: string;
  email: string;
  /** Só na edição */
  isActive?: boolean;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  roleId: number;
  schoolId: string | null;
  studentId?: string | null;
  cpf?: string | null;
  phone?: string | null;
}

/** Cpf nulo mantém o atual; phone é sempre gravado como enviado. */
export interface UpdateUserPayload {
  name: string;
  email: string;
  roleId: number;
  schoolId: string | null;
  isActive: boolean;
  cpf?: string | null;
  phone?: string | null;
  studentId?: string | null;
}

export interface ClassPayload {
  name: string;
  year: number;
  schoolId?: string;
  /** Só na edição */
  isActive?: boolean;
}

export interface StudentPayload {
  name: string;
  email: string;
  registration: string;
  birthDate: string;
  classId: string;
  /** Só na edição */
  isActive?: boolean;
}

export interface CreateGradePayload {
  studentId: string;
  classId: string;
  subject: string;
  value: number;
  period: string;
}

export interface UpdateGradePayload {
  subject: string;
  value: number;
  period: string;
}

export interface CreateAttendancePayload {
  studentId: string;
  classId: string;
  date: string;
  isPresent: boolean;
  notes: string | null;
}

export interface UpdateAttendancePayload {
  isPresent: boolean;
  notes: string | null;
}

export interface CreatePendingWorkPayload {
  studentId: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
}

/** Trabalho da turma: título, descrição e prazo, iguais para todos os alunos */
export interface AssignmentPayload {
  title: string;
  description: string;
  dueDate: string;
}

export interface ClassAssignment {
  assignmentId: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  dueDate: string;
  studentCount: number;
  deliveredCount: number;
}

export interface CreateDisciplinaryCallPayload {
  studentId: string;
  description: string;
}
