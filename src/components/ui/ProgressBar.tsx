import React from 'react';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  showLabel?: boolean;
  color?: 'accent' | 'warning';
  className?: string;
}

/** Horizontal progress bar built on .progress-track / .progress-fill. */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  showLabel = false,
  color = 'accent',
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="progress-track flex-1">
        <div
          className={`progress-fill ${color === 'warning' ? 'warning' : ''}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={`text-caption font-medium ${color === 'warning' ? 'text-warning' : 'text-accent'}`}
        >
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
