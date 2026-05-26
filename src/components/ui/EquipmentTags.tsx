import React from 'react';
import Pill from './Pill';

interface EquipmentTagsProps {
  equipment: string;
  className?: string;
}

/**
 * Splits an equipment string on commas, " o ", or " + " and renders each part
 * as a muted Pill in a flex-wrap row.
 */
const EquipmentTags: React.FC<EquipmentTagsProps> = ({ equipment, className = '' }) => {
  const parts = equipment
    .split(/,| o | \+ /)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {parts.map((part) => (
        <Pill key={part} variant="muted" label={part} />
      ))}
    </div>
  );
};

export default EquipmentTags;
