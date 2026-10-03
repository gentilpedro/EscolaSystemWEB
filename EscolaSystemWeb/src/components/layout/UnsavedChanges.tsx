import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useConfirm } from '../ui/Notifications';

interface UnsavedChangesApi {
  /** Mensagem do que seria perdido; null quando não há nada pendente. */
  pending: string | null;
  setPending: (message: string | null) => void;
  /** Pergunta antes de abandonar alterações. Resolve true se pode seguir. */
  confirmLeave: () => Promise<boolean>;
}

const UnsavedChangesContext = createContext<UnsavedChangesApi | null>(null);

/**
 * Guarda de alterações não salvas para a área logada. A página registra o que
 * está pendente; a navegação lateral e o fechamento da aba perguntam antes de descartar.
 */
export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<string | null>(null);
  const confirm = useConfirm();
  const pendingRef = useRef(pending);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [pending]);

  const confirmLeave = useCallback(async () => {
    if (!pendingRef.current) return true;
    const ok = await confirm({
      title: 'Sair sem salvar?',
      description: pendingRef.current,
      confirmLabel: 'Descartar e sair',
    });
    if (ok) setPending(null);
    return ok;
  }, [confirm]);

  const value = useMemo(() => ({ pending, setPending, confirmLeave }), [pending, confirmLeave]);
  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>;
};

export function useUnsavedChanges(): UnsavedChangesApi {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
  return ctx;
}

/** Registra a página como "com alterações" enquanto `dirty` for verdadeiro. */
export function useRegisterUnsaved(dirty: boolean, message: string) {
  const { setPending } = useUnsavedChanges();
  useEffect(() => {
    setPending(dirty ? message : null);
  }, [dirty, message, setPending]);
  useEffect(() => () => setPending(null), [setPending]);
}
