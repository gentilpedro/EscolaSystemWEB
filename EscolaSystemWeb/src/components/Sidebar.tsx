import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [];

    if (!user) return baseItems;

    switch (user.role) {
      case UserRole.ADMIN:
        return [
          { label: 'Dashboard', href: '/admin', icon: <Home className="w-5 h-5" /> },
          { label: 'Escolas', href: '/admin/schools', icon: <Building2 className="w-5 h-5" /> },
          { label: 'Usuários', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
          { label: 'Configurações', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
        ];

      case UserRole.DIRECTOR:
        return [
          { label: 'Dashboard', href: '/director', icon: <Home className="w-5 h-5" /> },
          { label: 'Funcionários', href: '/director/staff', icon: <Users className="w-5 h-5" /> },
          { label: 'Turmas', href: '/director/classes', icon: <BookOpen className="w-5 h-5" /> },
          { label: 'Alunos', href: '/director/students', icon: <Users className="w-5 h-5" /> },
          { label: 'Relatórios', href: '/director/reports', icon: <BarChart3 className="w-5 h-5" /> },
          { label: 'Chamados', href: '/director/disciplinary', icon: <FileText className="w-5 h-5" /> },
        ];

      case UserRole.TEACHER:
        return [
          { label: 'Dashboard', href: '/teacher', icon: <Home className="w-5 h-5" /> },
          { label: 'Minhas Turmas', href: '/teacher/classes', icon: <BookOpen className="w-5 h-5" /> },
          { label: 'Chamada', href: '/teacher/attendance', icon: <Users className="w-5 h-5" /> },
          { label: 'Notas', href: '/teacher/grades', icon: <BarChart3 className="w-5 h-5" /> },
          { label: 'Chamados', href: '/teacher/disciplinary', icon: <FileText className="w-5 h-5" /> },
        ];

      case UserRole.ORIENTADOR:
        return [
          { label: 'Dashboard', href: '/orientador', icon: <Home className="w-5 h-5" /> },
          { label: 'Alunos', href: '/orientador/students', icon: <Users className="w-5 h-5" /> },
          { label: 'Faltas', href: '/orientador/attendance', icon: <Users className="w-5 h-5" /> },
          { label: 'Notas', href: '/orientador/grades', icon: <BarChart3 className="w-5 h-5" /> },
          { label: 'Chamados', href: '/orientador/disciplinary', icon: <FileText className="w-5 h-5" /> },
        ];

      case UserRole.PARENT:
        return [
          { label: 'Dashboard', href: '/parent', icon: <Home className="w-5 h-5" /> },
          { label: 'Chamados', href: '/parent/disciplinary', icon: <FileText className="w-5 h-5" /> },
        ];

      case UserRole.STUDENT:
        return [
          { label: 'Dashboard', href: '/student', icon: <Home className="w-5 h-5" /> },
          { label: 'Notas', href: '/student/grades', icon: <BarChart3 className="w-5 h-5" /> },
          { label: 'Faltas', href: '/student/attendance', icon: <Users className="w-5 h-5" /> },
          { label: 'Trabalhos', href: '/student/assignments', icon: <BookOpen className="w-5 h-5" /> },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white text-[#6f73d2] rounded-lg shadow-md"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#6f73d2] to-[#5a5db8] text-white transform transition-transform duration-300 z-30 lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">📚 Sistema Escolar</h1>
          <p className="text-[#d9f0ff] text-sm mt-1">{user?.role.toUpperCase()}</p>
        </div>

        <nav className="mt-8 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#4e519e] border-t border-[#7681b3]">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#83c9f4] flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
              ) : (
                <span className="text-sm font-bold text-[#4e519e]">{user?.name.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-[#a3d5ff] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
