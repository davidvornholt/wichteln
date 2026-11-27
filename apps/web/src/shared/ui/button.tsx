import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { type ButtonVariant, buttonClass } from './button-class';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant;
  readonly icon?: ReactNode;
};

export const Button = ({
  variant = 'primary',
  icon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) => (
  <button className={buttonClass(variant, className)} type={type} {...props}>
    {icon}
    {children}
  </button>
);
