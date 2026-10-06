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
