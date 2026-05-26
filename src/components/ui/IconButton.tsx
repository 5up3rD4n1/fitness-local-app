import React from 'react';

interface IconButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  icon: React.ReactNode;
  /** required — used as aria-label (icon-only buttons need an accessible name) */
  label: string;
  variant?: 'round' | 'square';
  size?: 'sm' | 'md';
}

/** Icon-only button. `round` = filled stepper circle; `square` = transparent w/ hover surface. */
const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'square',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeCls = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const base =
    variant === 'round'
      ? 'round-stepper'
      : 'flex items-center justify-center rounded-xl text-white transition-colors hover:bg-secondary-bg disabled:opacity-40 disabled:pointer-events-none';
  return (
    <button aria-label={label} className={`${base} ${sizeCls} ${className}`} {...props}>
      {icon}
    </button>
  );
};

export default IconButton;
