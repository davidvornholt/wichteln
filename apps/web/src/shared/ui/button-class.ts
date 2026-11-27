import { classNames } from './class-names';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-bold transition-[transform,background-color,color,box-shadow] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45';

const variants: Record<ButtonVariant, string> = {
  primary:
    'h-14 bg-ink px-7 text-[1.0625rem] text-card shadow-[inset_0_-4px_0_var(--color-accent)] hover:bg-wrap',
  secondary:
    'h-12 border-2 border-ink px-5 text-base text-ink hover:bg-ink hover:text-card',
  quiet:
    'h-11 px-2 text-base text-ink underline decoration-2 decoration-line underline-offset-[6px] hover:decoration-ink',
};

// The classes of a button, for links that look like one.
export const buttonClass = (variant: ButtonVariant, className?: string) =>
  classNames(base, variants[variant], className);
