import React from 'react';

interface ProgressRingProps {
  /** 0–100 */
  value: number;
  /** diameter in px */
  size?: number;
  strokeWidth?: number;
  /** any CSS color (var() supported) */
  trackColor?: string;
  /** any CSS color (var() supported) */
  fillColor?: string;
  /** centered content (time, number, label) */
  children?: React.ReactNode;
  animate?: boolean;
  className?: string;
}

/**
 * Generalized circular progress ring. Extracted from Timer.tsx's SVG so the same
 * primitive powers the rest timer and aggregate stats (streak, weekly goal).
 * Geometry matches the original Timer: r = size/2 − strokeWidth.
 */
const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 128,
  strokeWidth = 8,
  trackColor = 'var(--color-border-primary)',
  fillColor = 'var(--color-accent)',
  children,
  animate = true,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          style={{ stroke: trackColor }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{ stroke: fillColor }}
          className={animate ? 'transition-[stroke-dashoffset] duration-1000 ease-out' : ''}
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
};

export default ProgressRing;
