import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button, IconButton } from './Button';

interface DialogProps {
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Impede fechar por Esc/clique fora enquanto algo é salvo. */
  busy?: boolean;
}

const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/**
 * Diálogo modal sobre o <dialog> nativo: foco preso, Esc fecha, foco volta
 * ao elemento que abriu. Montado = aberto.
 */
export const Dialog: React.FC<DialogProps> = ({ title, description, onClose, children, footer, size = 'md', busy }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    busyRef.current = busy;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    const handleCancel = (e: Event) => {
      e.preventDefault();
      if (!busyRef.current) onCloseRef.current();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      if (dialog.open) dialog.close();
      opener?.focus?.();
    };
  }, []);

  const handleBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current && !busy) onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onMouseDown={handleBackdrop}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-lg border border-rule bg-surface p-0 text-ink shadow-dialog',
        'motion-safe:animate-dialog-in open:flex open:flex-col',
        widths[size],
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-bold text-ink">
            {title}
          </h2>
          {description && (
            <div id={descId} className="mt-0.5 text-[0.9375rem] text-ink-3">
              {description}
            </div>
          )}
        </div>
        <IconButton label="Fechar" icon={<X className="h-5 w-5" />} onClick={onClose} disabled={busy} className="-mr-2 -mt-1" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-rule bg-paper px-5 py-3.5 sm:flex-row sm:justify-end">{footer}</div>
      )}
    </dialog>
  );
};

/**
 * Diálogo com formulário: o rodapé fica fora do <form>, ligado pelo atributo form,
 * então o envio por Enter e o botão Salvar continuam funcionando.
 * Se algo foi digitado, fechar (Esc, fundo, X ou Cancelar) pede confirmação antes de descartar.
 */
export const FormDialog: React.FC<
  Omit<DialogProps, 'footer'> & {
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    savingLabel?: string;
    saving?: boolean;
    submitVariant?: 'primary' | 'danger';
    submitDisabled?: boolean;
    cancelLabel?: string;
  }
> = ({ onSubmit, submitLabel, savingLabel = 'Salvando…', saving, submitVariant = 'primary', submitDisabled, cancelLabel = 'Cancelar', children, onClose, ...dialog }) => {
  const formId = useId();
  const [dirty, setDirty] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const requestClose = () => {
    if (saving) return;
    if (dirty && !confirmingDiscard) {
      setConfirmingDiscard(true);
      return;
    }
    onClose();
  };

  return (
    <Dialog
      {...dialog}
      onClose={requestClose}
      busy={saving}
      footer={
        confirmingDiscard ? (
          <div role="alert" className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.9375rem] font-semibold text-ink">Descartar o que foi preenchido?</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="secondary" onClick={() => setConfirmingDiscard(false)} autoFocus>
                Continuar editando
              </Button>
              <Button variant="danger-quiet" onClick={onClose}>
                Descartar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={requestClose} disabled={saving}>
              {cancelLabel}
            </Button>
            <Button type="submit" form={formId} variant={submitVariant} disabled={submitDisabled} loading={saving} loadingLabel={savingLabel}>
              {submitLabel}
            </Button>
          </>
        )
      }
    >
      <form
        id={formId}
        onSubmit={onSubmit}
        onInput={() => setDirty(true)}
        onChange={() => setDirty(true)}
        className="space-y-4"
      >
        {children}
      </form>
    </Dialog>
  );
};
