import React from 'react';

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  /** Tailwind text-color class for the value, e.g. 'text-accent' | 'text-warning'. */
  valueClassName?: string;
  className?: string;
}

/** Compact metric card for stat grids (Home, Progress, completion summary). */
const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  unit,
  valueClassName = 'text-white',
  className = '',
}) => (
  <div className={`stat-tile ${className}`}>
    <span className="text-caption text-text-secondary">{label}</span>
    <span className={`text-h1 ${valueClassName}`}>
      {value}
      {unit && <span className="text-caption ml-1 font-medium text-text-secondary">{unit}</span>}
    </span>
  </div>
);

export default StatTile;
