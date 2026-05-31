import React, { useState, useEffect } from 'react';
import { Exercise, ExerciseSection, Routine } from '../types';
import { useApp } from '../contexts/AppContext';
import { SectionHeading, Pill } from './ui';
import ExerciseAccordionItem from './ExerciseAccordionItem';
import CircuitBlock from './CircuitBlock';

interface RoutineBlocksProps {
  routine: Routine;
  /** Active program's exercises (flat). */
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

/**
 * Walks a routine's `blocks` in order. Consecutive `single` blocks are grouped under a
 * section heading (same look as the old SectionedExerciseList); a `circuit` block renders
 * as a CircuitBlock card. Expansion stays synced to currentExerciseIndex.
 */
const RoutineBlocks: React.FC<RoutineBlocksProps> = ({
  routine,
  exercises,
  routineId,
  className = '',
}) => {
  const { currentExerciseIndex, selectExercise } = useApp();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(currentExerciseIndex);

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

  if (routine.exercises.length === 0) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <p className="text-text-secondary">No exercises available</p>
      </div>
    );
  }

  const exById = new Map(exercises.map((e) => [e.id, e]));
  const flatIndexById = new Map(routine.exercises.map((id, i) => [id, i]));

  // Fallback for a routine persisted before `blocks` existed (stale localStorage):
  // treat every exercise as its own single block.
  const blocks =
    routine.blocks && routine.blocks.length > 0
      ? routine.blocks
      : routine.exercises.map((id) => ({ kind: 'single' as const, exerciseId: id }));

  const nodes: React.ReactNode[] = [];
  let sectionRun: { section: ExerciseSection; items: Exercise[] } | null = null;

  const flushRun = () => {
    if (!sectionRun) return;
    const run = sectionRun;
    nodes.push(
      <div key={`sec-${run.items[0].id}`}>
        <SectionHeading
          uppercase
          className="px-0 pb-2 pt-4"
          trailing={<Pill variant="muted" label={String(run.items.length)} />}
        >
          {SECTION_LABEL[run.section]}
        </SectionHeading>
        <div className="space-y-3">
          {run.items.map((ex) => {
            const flatIndex = flatIndexById.get(ex.id) ?? 0;
            return (
              <ExerciseAccordionItem
                key={ex.id}
                exercise={ex}
                flatIndex={flatIndex}
                isActive={flatIndex === expandedIndex}
                routineId={routineId}
                onToggle={handleToggle}
              />
            );
          })}
        </div>
      </div>
    );
    sectionRun = null;
  };

  for (const block of blocks) {
    if (block.kind === 'single') {
      const ex = exById.get(block.exerciseId);
      if (!ex) continue;
      if (sectionRun && sectionRun.section === ex.section) {
        sectionRun.items.push(ex);
      } else {
        flushRun();
        sectionRun = { section: ex.section, items: [ex] };
      }
    } else {
      flushRun();
      const members = block.exerciseIds
        .map((id) => exById.get(id))
        .filter((e): e is Exercise => Boolean(e));
      nodes.push(
        <CircuitBlock
          key={block.id}
          block={block}
          members={members}
          routineId={routineId}
          className="mt-4"
        />
      );
    }
  }
  flushRun();

  return <div className={`space-y-1 ${className}`}>{nodes}</div>;
};

export default RoutineBlocks;
