import { createContext, useContext, useEffect } from 'react';

export interface UnsavedChangesApi {
  /** Mensagem do que seria perdido; null quando não há nada pendente. */
  pending: string | null;
  setPending: (message: string | null) => void;
  /** Pergunta antes de abandonar alterações. Resolve true se pode seguir. */
  confirmLeave: () => Promise<boolean>;
}

export const UnsavedChangesContext = createContext<UnsavedChangesApi | null>(null);

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
