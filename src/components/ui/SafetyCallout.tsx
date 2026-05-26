import React from 'react';

interface SafetyCalloutProps {
  text: string;
  variant?: 'warning' | 'info';
  className?: string;
}

/**
 * Safety / info callout block for exercise safety notes and program principles.
 * warning (default): left border in --color-warning, ⚠ glyph.
 * info: left border in --color-border-secondary, ℹ glyph.
 */
const SafetyCallout: React.FC<SafetyCalloutProps> = ({
  text,
  variant = 'warning',
  className = '',
}) => {
  const isWarning = variant === 'warning';
  return (
    <div
      className={`bg-surface-raised rounded-xl p-3 border-l-4 ${className}`}
      style={{
        borderLeftColor: isWarning ? 'var(--color-warning)' : 'var(--color-border-secondary)',
      }}
    >
      <div className="flex gap-2">
        <span
          className={`flex-shrink-0 text-base leading-snug ${isWarning ? 'text-warning' : 'text-text-secondary'}`}
          aria-hidden="true"
        >
          {isWarning ? '⚠' : 'ℹ'}
        </span>
        <p className="text-caption text-text-secondary">{text}</p>
      </div>
    </div>
  );
};

export default SafetyCallout;
