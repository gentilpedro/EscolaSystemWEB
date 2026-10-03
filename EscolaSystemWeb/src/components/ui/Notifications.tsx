import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Dialog } from './Dialog';
import { Button } from './Button';

/* ---------- Avisos (substituem alert()) ---------- */

type ToastTone = 'success' | 'error';
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/* ---------- Confirmação (substitui window.confirm) ---------- */

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  /** O que acontece de fato ao confirmar (ex.: o que some junto). */
  consequence?: React.ReactNode;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++;
      setToasts(prev => [...prev.slice(-2), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const toastApi = useMemo<ToastApi>(
    () => ({ success: m => push('success', m), error: m => push('error', m) }),
    [push],
  );

  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    options => new Promise<boolean>(resolve => setPending({ ...options, resolve })),
    [],
  );

  const settle = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <ToastContext.Provider value={toastApi}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        {pending && (
          <Dialog
            title={pending.title}
            description={pending.description}
            onClose={() => settle(false)}
            size="sm"
            footer={
              <>
                {/* Em ação destrutiva o foco começa em Cancelar: Enter nunca exclui por acidente */}
                <Button variant="secondary" onClick={() => settle(false)} data-autofocus={pending.tone !== 'primary' || undefined}>
                  Cancelar
                </Button>
                <Button
                  variant={pending.tone === 'primary' ? 'primary' : 'danger'}
                  onClick={() => settle(true)}
                  data-autofocus={pending.tone === 'primary' || undefined}
                >
                  {pending.confirmLabel ?? 'Confirmar'}
                </Button>
              </>
            }
          >
            {pending.consequence && <p className="mb-2 text-[0.9375rem] text-ink-2">{pending.consequence}</p>}
            <p className="text-[0.9375rem] text-ink-2">
              {pending.tone === 'primary' ? 'Confirme para continuar.' : 'Esta ação não pode ser desfeita.'}
            </p>
          </Dialog>
        )}

        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end"
        >
          {toasts.map(t => (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-surface px-4 py-3 text-[0.9375rem] shadow-dialog motion-safe:animate-toast-in',
                t.tone === 'error' ? 'border-red-ink/40' : 'border-blue-ink/35',
              )}
            >
              {t.tone === 'error' ? (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-ink" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-ink" aria-hidden="true" />
              )}
              <p className="flex-1 text-ink">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dispensar aviso"
                className="-my-2 -mr-2 inline-flex h-11 w-11 items-center justify-center rounded text-ink-3 hover:bg-sunken hover:text-ink sm:h-8 sm:w-8"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within NotificationsProvider');
  return ctx;
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within NotificationsProvider');
  return ctx;
}

/** Mensagem de erro vinda da API (Error.message) ou um texto padrão. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
