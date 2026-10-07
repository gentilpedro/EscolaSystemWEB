import {
  LayoutDashboard,
  School,
  Users,
  Settings,
  Briefcase,
  BookOpen,
  GraduationCap,
  BarChart3,
  ClipboardList,
  ClipboardCheck,
  PenSquare,
  CalendarCheck,
  ListTodo,
  History,
  LifeBuoy,
} from 'lucide-react';
import type React from 'react';
import { UserRole } from '../../types';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Rota raiz do perfil: só fica ativa na correspondência exata. */
  end?: boolean;
}

// Mesmas rotas de antes; só rótulos e ícones foram revistos.
export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  [UserRole.ADMIN]: [
    { label: 'Painel', href: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Escolas', href: '/admin/schools', icon: School },
    { label: 'Usuários', href: '/admin/users', icon: Users },
    { label: 'Tickets', href: '/admin/tickets', icon: LifeBuoy },
    { label: 'Atividades', href: '/admin/activity', icon: History },
    { label: 'Configurações', href: '/admin/settings', icon: Settings },
  ],
  [UserRole.DIRECTOR]: [
    { label: 'Painel', href: '/director', icon: LayoutDashboard, end: true },
    { label: 'Funcionários', href: '/director/staff', icon: Briefcase },
    { label: 'Turmas', href: '/director/classes', icon: BookOpen },
    { label: 'Alunos', href: '/director/students', icon: GraduationCap },
    { label: 'Relatórios', href: '/director/reports', icon: BarChart3 },
    { label: 'Chamados', href: '/director/disciplinary', icon: ClipboardList },
    { label: 'Suporte', href: '/director/support', icon: LifeBuoy },
  ],
  [UserRole.TEACHER]: [
    { label: 'Painel', href: '/teacher', icon: LayoutDashboard, end: true },
    { label: 'Minhas turmas', href: '/teacher/classes', icon: BookOpen },
    { label: 'Chamada', href: '/teacher/attendance', icon: ClipboardCheck },
    { label: 'Notas', href: '/teacher/grades', icon: PenSquare },
    { label: 'Trabalhos', href: '/teacher/assignments', icon: ListTodo },
    { label: 'Relatórios', href: '/teacher/reports', icon: BarChart3 },
    { label: 'Chamados', href: '/teacher/disciplinary', icon: ClipboardList },
  ],
  [UserRole.ORIENTADOR]: [
    { label: 'Painel', href: '/orientador', icon: LayoutDashboard, end: true },
    { label: 'Alunos', href: '/orientador/students', icon: GraduationCap },
    { label: 'Faltas', href: '/orientador/attendance', icon: CalendarCheck },
    { label: 'Notas', href: '/orientador/grades', icon: PenSquare },
    { label: 'Chamados', href: '/orientador/disciplinary', icon: ClipboardList },
  ],
  [UserRole.PARENT]: [
    { label: 'Painel', href: '/parent', icon: LayoutDashboard, end: true },
    { label: 'Chamados', href: '/parent/disciplinary', icon: ClipboardList },
  ],
  [UserRole.STUDENT]: [
    { label: 'Painel', href: '/student', icon: LayoutDashboard, end: true },
    { label: 'Notas', href: '/student/grades', icon: PenSquare },
    { label: 'Frequência', href: '/student/attendance', icon: CalendarCheck },
    { label: 'Trabalhos', href: '/student/assignments', icon: ListTodo },
  ],
};
