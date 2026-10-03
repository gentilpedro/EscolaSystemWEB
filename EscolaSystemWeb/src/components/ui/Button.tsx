import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-quiet' | 'chalk';
export type ButtonSize = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap select-none ' +
  'transition-[background-color,color,border-color,box-shadow] duration-150 ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-lousa text-white hover:bg-lousa-hover active:bg-lousa-deep shadow-raise',
  secondary: 'bg-surface text-ink border border-control hover:bg-sunken active:bg-rule',
  ghost: 'text-ink-2 hover:bg-sunken hover:text-ink active:bg-rule',
  danger: 'bg-red-ink text-white hover:bg-red-ink-hover active:bg-red-ink-active shadow-raise',
  'danger-quiet': 'text-red-ink border border-transparent hover:bg-red-tint hover:border-red-ink/30',
  // Ação sobre a lousa (giz): só em superfícies verde-lousa
  chalk: 'bg-chalk text-lousa-deep hover:bg-white active:bg-chalk-2',
};

const sizes: Record<ButtonSize, string> = {
  // No celular todo alvo tem 44px; o tamanho compacto só vale a partir do tablet
  sm: 'min-h-11 px-3 text-sm sm:min-h-9',
  md: 'min-h-11 px-4 text-[0.9375rem]',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  loadingLabel,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={buttonClasses(variant, size, className)}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
    <span>{loading && loadingLabel ? loadingLabel : children}</span>
  </button>
);

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

export const ButtonLink: React.FC<ButtonLinkProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}) => (
  <Link className={buttonClasses(variant, size, typeof className === 'string' ? className : undefined)} {...rest}>
    {icon}
    <span>{children}</span>
  </Link>
);

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Nome acessível obrigatório: o botão só tem ícone. */
  label: string;
  icon: React.ReactNode;
  tone?: 'neutral' | 'danger';
}

const iconTones = {
  neutral: 'text-ink-2 hover:bg-sunken hover:text-ink',
  danger: 'text-red-ink hover:bg-red-tint',
};

export const IconButton: React.FC<IconButtonProps> = ({ label, icon, tone = 'neutral', className, type = 'button', ...rest }) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={cn(
      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-colors duration-150 sm:h-10 sm:w-10',
      'disabled:cursor-not-allowed disabled:opacity-50',
      iconTones[tone],
      className,
    )}
    {...rest}
  >
    {icon}
  </button>
);
