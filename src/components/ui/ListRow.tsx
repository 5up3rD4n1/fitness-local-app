import React from 'react';

interface ListRowProps {
  icon?: React.ReactNode;
  title: string;
  /** middot-separated meta, e.g. "3 sets · 8–12 reps · 60s rest" */
  meta?: string;
  /** right-aligned element (button, chevron, value) */
  action?: React.ReactNode;
  onClick?: () => void;
  completed?: boolean;
  className?: string;
}

/** Routine / exercise list row: icon-square + title + meta + trailing action. */
const ListRow: React.FC<ListRowProps> = ({
  icon,
  title,
  meta,
  action,
  onClick,
  completed = false,
  className = '',
}) => (
  <div
    className={`list-row ${completed ? 'completed' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    onClick={onClick}
  >
    {icon && <div className="icon-square">{icon}</div>}
    <div className="min-w-0 flex-1">
      <p className="text-body truncate font-medium text-white">{title}</p>
      {meta && <p className="text-caption truncate text-text-secondary">{meta}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default ListRow;
