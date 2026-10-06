import { createContext, useContext } from 'react';
import type React from 'react';

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  /** O que acontece de fato ao confirmar (ex.: o que some junto). */
  consequence?: React.ReactNode;
  /** A ação pode ser desfeita depois (desativar, desvincular): não avisa que é definitiva. */
  reversible?: boolean;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

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
