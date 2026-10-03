import React, { useId } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/cn';

export const controlClasses =
  // 16px no celular (o iOS dá zoom em campos menores); 15px a partir do tablet
  'w-full min-h-11 rounded-md border border-control bg-surface px-3 text-base text-ink sm:text-[0.9375rem] ' +
  'placeholder:text-ink-3 transition-[border-color,box-shadow] duration-150 ' +
  'hover:border-ink-3 focus:border-lousa focus:outline-none focus:ring-2 focus:ring-lousa/25 ' +
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-3 ' +
  'aria-[invalid=true]:border-red-ink aria-[invalid=true]:ring-red-ink/20';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

const FieldShell: React.FC<FieldShellProps> = ({ id, label, hint, error, required, className, children }) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <label htmlFor={id} className="text-sm font-semibold text-ink">
      {label}
      {required && (
        <span className="ml-0.5 text-red-ink" aria-hidden="true">
          *
        </span>
      )}
    </label>
    {children}
    {hint && !error && (
      <p id={`${id}-hint`} className="text-[0.8125rem] text-ink-3">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} className="text-[0.8125rem] font-semibold text-red-ink">
        {error}
      </p>
    )}
  </div>
);

function describedBy(id: string, hint?: string, error?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type BaseProps = { label: string; hint?: string; error?: string; containerClassName?: string };

export const TextField: React.FC<BaseProps & React.InputHTMLAttributes<HTMLInputElement>> = ({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  ...rest
}) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(controlClasses, className)}
        {...rest}
      />
    </FieldShell>
  );
};

export const SelectField: React.FC<BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  children,
  ...rest
}) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <select
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(controlClasses, 'pr-8', className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
};

export const TextAreaField: React.FC<BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  ...rest
}) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        className={cn(controlClasses, 'min-h-28 resize-y py-2.5 leading-relaxed', className)}
        {...rest}
      />
    </FieldShell>
  );
};

export const CheckboxField: React.FC<{ label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>> = ({
  label,
  hint,
  id,
  className,
  ...rest
}) => {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        id={fieldId}
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-control accent-lousa"
        aria-describedby={hint ? `${fieldId}-hint` : undefined}
        {...rest}
      />
      <div>
        <label htmlFor={fieldId} className="text-[0.9375rem] font-semibold text-ink">
          {label}
        </label>
        {hint && (
          <p id={`${fieldId}-hint`} className="text-[0.8125rem] text-ink-3">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
};

/** Valor somente leitura com rótulo (substitui <label> sem controle). */
export const ReadOnlyField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)} role="group" aria-labelledby={id}>
      <span id={id} className="text-sm font-semibold text-ink-3">
        {label}
      </span>
      <div className="min-h-11 rounded-md border border-rule bg-sunken px-3 py-2.5 text-[0.9375rem] text-ink">{children}</div>
    </div>
  );
};

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ label, value, onChange, className, ...rest }) => {
  const id = useId();
  return (
    <div className={cn('relative min-w-0 flex-1 basis-64', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(controlClasses, 'pl-10')}
        {...rest}
      />
    </div>
  );
};

interface FilterSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** Select de filtro com rótulo visualmente oculto, para barras de filtro. */
export const FilterSelect: React.FC<FilterSelectProps> = ({ label, value, onChange, className, children, ...rest }) => {
  const id = useId();
  return (
    <div className={cn('min-w-0 basis-48 grow sm:grow-0', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)} className={cn(controlClasses, 'pr-8')} {...rest}>
        {children}
      </select>
    </div>
  );
};

/** Barra de filtros: quebra linha em telas estreitas. */
export const FilterBar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div role="search" className={cn('mb-6 flex flex-wrap items-center gap-3', className)}>
    {children}
  </div>
);
