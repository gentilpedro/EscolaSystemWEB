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
}

export interface Class {
  id: string;
  name: string;
  schoolId: string;
  year: number;
  teacherId: string;
  students: Student[];
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  cpf: string;
  dateOfBirth: string;
  parentId: string;
  schoolId: string;
  classId: string;
  avatar?: string;
  createdAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  grade: number;
  period: string;
  recordedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  present: boolean;
  justification?: string;
  recordedAt: string;
}

export interface DisciplinaryReport {
  id: string;
  studentId: string;
  teacherId: string;
  schoolId: string;
  title: string;
  description: string;
  status: 'open' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  sentToParentsAt?: string;
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

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const ROLES: { id: number; name: string; label: string }[] = [
  { id: 1, name: 'Admin', label: 'Administrador' },
  { id: 2, name: 'Director', label: 'Diretor' },
  { id: 3, name: 'Teacher', label: 'Professor' },
  { id: 4, name: 'Student', label: 'Aluno' },
  { id: 5, name: 'Parent', label: 'Responsável' },
  { id: 6, name: 'Orientador', label: 'Orientador' },
];
