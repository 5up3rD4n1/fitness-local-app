import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  // eslint-disable-next-line no-unused-vars
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Accessible toggle switch.
 * Track: pill shape (w-11 h-6), accent fill when checked.
 * Thumb: circle (h-5 w-5) that translates right when checked.
 */
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      {/* Track */}
      <span
        className="relative inline-flex w-11 h-6 items-center rounded-full transition-colors"
        style={{
          backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-border-primary)',
          transitionDuration: 'var(--duration-base)',
          transitionTimingFunction: 'var(--ease-out)',
        }}
      >
        {/* Thumb */}
        <span
          className="absolute h-5 w-5 rounded-full bg-white shadow-sm"
          style={{
            transform: checked ? 'translateX(1.25rem)' : 'translateX(0.125rem)',
            transitionProperty: 'transform',
            transitionDuration: 'var(--duration-base)',
            transitionTimingFunction: 'var(--ease-out)',
          }}
        />
      </span>
      {label && <span className="text-caption text-text-secondary">{label}</span>}
    </button>
  );
};

export default ToggleSwitch;
