import React from 'react';

interface RoutineTileProps {
  name: string;
  meta?: string;
  /** small status label, e.g. "En curso" — the one accent on the row */
  badge?: string;
  onClick?: () => void;
  className?: string;
}

/** Flat routine row (name + meta + chevron) for a grouped `.list`. No icon box, no gradient. */
const RoutineTile: React.FC<RoutineTileProps> = ({
  name,
  meta,
  badge,
  onClick,
  className = '',
}) => (
  <button type="button" onClick={onClick} className={`list-row w-full text-left ${className}`}>
    <div className="min-w-0 flex-1">
      <div className="font-display text-[15px] font-medium leading-snug text-white">{name}</div>
      {meta && <div className="text-caption mt-0.5 text-text-secondary">{meta}</div>}
    </div>
    {badge && (
      <span className="font-display text-[11px] font-semibold tracking-wide text-accent">
        {badge}
      </span>
    )}
    <svg
      className="shrink-0 text-text-tertiary"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" />
    </svg>
  </button>
);

export default RoutineTile;
