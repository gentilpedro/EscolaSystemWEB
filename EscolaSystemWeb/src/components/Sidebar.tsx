import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { cn } from '../lib/cn';
import { SESSION_ROLE_LABEL } from '../lib/school';
import { NAV_ITEMS } from './layout/navigation';
import { Wordmark } from './layout/BrandMark';
import { UnsavedChangesProvider } from './layout/UnsavedChanges';
import { useUnsavedChanges } from './layout/useUnsavedChanges';

/**
 * Estrutura autenticada. A navegação é a lousa: painel verde-lousa fixo à esquerda
 * em telas largas; no celular vira barra superior + gaveta.
 */
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <UnsavedChangesProvider>
    <Shell>{children}</Shell>
  </UnsavedChangesProvider>
);

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Gaveta aberta = o resto da página fica inerte (foco preso na navegação)
  useEffect(() => {
    const targets = [headerRef.current, mainRef.current];
    targets.forEach(el => (open ? el?.setAttribute('inert', '') : el?.removeAttribute('inert')));
    return () => targets.forEach(el => el?.removeAttribute('inert'));
  }, [open]);

  const closeDrawer = () => {
    setOpen(false);
    menuButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="min-h-dvh lg:flex">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold focus:text-ink focus:shadow-dialog"
      >
        Pular para o conteúdo
      </a>

      {/* Barra superior (celular/tablet) */}
      <header ref={headerRef} className="on-lousa sticky top-0 z-30 flex h-14 items-center justify-between bg-lousa-deep px-3 text-chalk lg:hidden print:hidden">
        <Wordmark onLousa className="pl-1" />
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="navegacao-principal"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-chalk hover:bg-white/10"
        >
          {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </header>

      <Sidebar ref={drawerRef} open={open} onNavigate={() => setOpen(false)} onClose={closeDrawer} />

      {open && (
        <div className="fixed inset-0 z-30 bg-ink/45 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <main ref={mainRef} id="conteudo" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 print:max-w-none print:p-0">{children}</div>
      </main>
    </div>
  );
};

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
  onClose: () => void;
}

export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(({ open, onNavigate, onClose }, ref) => {
  const { user, logout } = useAuth();
  const items = user ? NAV_ITEMS[user.role] ?? [] : [];
  const { pending, confirmLeave } = useUnsavedChanges();
  const navigate = useNavigate();

  // Com alterações não salvas, perguntar antes de trocar de página
  const guardedNavigate = (e: React.MouseEvent, to: string) => {
    if (!pending) {
      onNavigate();
      return;
    }
    e.preventDefault();
    confirmLeave().then(ok => {
      if (ok) {
        onNavigate();
        navigate(to);
      }
    });
  };

  return (
    <aside
      ref={ref}
      id="navegacao-principal"
      aria-label="Navegação principal"
      className={cn(
        'on-lousa fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-lousa-deep text-chalk print:hidden',
        'transition-[transform,visibility] duration-200 ease-out',
        'lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-64 lg:max-w-none lg:translate-x-0 lg:visible lg:shrink-0',
        open ? 'translate-x-0 visible' : '-translate-x-full invisible',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-lousa-line pl-5 pr-3">
        <Wordmark onLousa />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-chalk hover:bg-white/10 lg:hidden"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {user && (
        <p className="px-5 pb-1 pt-5 text-[0.8125rem] font-semibold text-chalk-2">{SESSION_ROLE_LABEL[user.role] ?? user.role}</p>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {items.map(item => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                end={item.end}
                onClick={e => guardedNavigate(e, item.href)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-md px-3 text-[0.9375rem] transition-colors duration-150',
                    isActive ? 'bg-chalk font-bold text-lousa-deep' : 'text-chalk/90 hover:bg-white/10 hover:text-chalk',
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {user && (
        <div className="border-t border-lousa-line p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-chalk font-bold text-lousa-deep">
              {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-semibold text-chalk">{user.name}</p>
              <p className="truncate text-[0.8125rem] text-chalk-2">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!(await confirmLeave())) return;
              onNavigate();
              await logout();
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-lousa-line text-[0.9375rem] font-semibold text-chalk transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </aside>
  );
});
Sidebar.displayName = 'Sidebar';
