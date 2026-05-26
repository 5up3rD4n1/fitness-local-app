import React from 'react';

type PillVariant = 'accent' | 'muted' | 'warning' | 'danger';

interface PillProps {
  label: string;
  variant?: PillVariant;
  className?: string;
}

const variantClass: Record<PillVariant, string> = {
  accent: 'pill-accent',
  muted: 'pill-muted',
  warning: 'pill-warning',
  danger: 'pill-danger',
};

/** Small status tag (e.g. "Warmup", "Scheduled", "Done"). */
const Pill: React.FC<PillProps> = ({ label, variant = 'muted', className = '' }) => (
  <span className={`pill ${variantClass[variant]} ${className}`}>{label}</span>
);

export default Pill;
