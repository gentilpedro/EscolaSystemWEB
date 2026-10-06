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
}

/** Filtros de GET /api/users; a API aplica todos dentro do escopo do perfil. */
export interface UserFilters {
  schoolId?: string;
  roleId?: number;
  /** Trecho do nome ou do e-mail */
  search?: string;
  isActive?: boolean;
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
