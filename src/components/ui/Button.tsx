import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-4 py-3 text-base',
};

/** Typed wrapper over the .btn-* design-system classes. */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  ...props
}) => (
  <button
    className={`inline-flex items-center justify-center gap-2 ${variantClass[variant]} ${sizeClass[size]} ${
      fullWidth ? 'w-full' : ''
    } ${disabled || loading ? 'pointer-events-none opacity-50' : ''} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <span className="spinner h-4 w-4" aria-hidden="true" /> : icon}
    {children}
  </button>
);

export default Button;
