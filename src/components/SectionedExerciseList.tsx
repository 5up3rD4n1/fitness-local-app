import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseSection } from '../types';
import { useApp } from '../contexts/AppContext';
import { SectionHeading, Pill } from './ui';
import ExerciseAccordionItem from './ExerciseAccordionItem';

interface SectionedExerciseListProps {
  exercises: Exercise[];
  routineId?: string;
  className?: string;
}

const SECTION_LABEL: Record<ExerciseSection, string> = {
  activation: 'Activación',
  main: 'Bloque principal',
  cardio: 'Cardio',
  core: 'Core',
};

interface ExerciseGroup {
  section: ExerciseSection;
  items: Array<{ exercise: Exercise; flatIndex: number }>;
}

/**
 * Groups exercises by section into consecutive runs (no reordering),
 * renders a SectionHeading + count pill for each group, and delegates each
 * exercise row to ExerciseAccordionItem.
 *
 * expandedIndex is synced to currentExerciseIndex (same pattern as ExerciseAccordion).
 */
const SectionedExerciseList: React.FC<SectionedExerciseListProps> = ({
  exercises,
  routineId,
  className = '',
}) => {
  const { currentExerciseIndex, selectExercise } = useApp();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(currentExerciseIndex);

  // Sync expanded state when currentExerciseIndex changes externally (navigation arrows, etc.)
  useEffect(() => {
    setExpandedIndex(currentExerciseIndex);
  }, [currentExerciseIndex]);

  const handleToggle = (flatIndex: number) => {
    if (flatIndex === expandedIndex) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(flatIndex);
      selectExercise(flatIndex);
    }
  };

  // Build consecutive groups in array order — do NOT sort/reorder exercises
  const groups: ExerciseGroup[] = exercises.reduce<ExerciseGroup[]>((acc, exercise, i) => {
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.section === exercise.section) {
      lastGroup.items.push({ exercise, flatIndex: i });
    } else {
      acc.push({ section: exercise.section, items: [{ exercise, flatIndex: i }] });
    }
    return acc;
  }, []);

  if (exercises.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-text-secondary">No exercises available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {groups.map((group) => (
        <div key={`${group.section}-${group.items[0].flatIndex}`}>
          <SectionHeading
            uppercase
            className="px-0 pt-4 pb-2"
            trailing={<Pill variant="muted" label={String(group.items.length)} />}
          >
            {SECTION_LABEL[group.section]}
          </SectionHeading>

          <div className="space-y-3">
            {group.items.map(({ exercise, flatIndex }) => (
              <ExerciseAccordionItem
                key={exercise.id}
                exercise={exercise}
                flatIndex={flatIndex}
                isActive={flatIndex === expandedIndex}
                routineId={routineId}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SectionedExerciseList;
