import React, { useState } from 'react';
import { Exercise } from '../types';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui';
import ConfirmDialog from './ConfirmDialog';
import ExerciseDetail from './ExerciseDetail';

interface ExerciseAccordionItemProps {
  exercise: Exercise;
  /** Flat position in the full exercises array (not section-relative). */
  flatIndex: number;
  isActive: boolean;
  routineId?: string;
  // eslint-disable-next-line no-unused-vars
  onToggle: (flatIndex: number) => void;
}

const CheckIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

const ChevronIcon = ({ rotated }: { rotated: boolean }) => (
  <svg
    className={`h-5 w-5 text-text-secondary transition-transform ${rotated ? 'rotate-180' : ''}`}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </svg>
);

const ExerciseAccordionItem: React.FC<ExerciseAccordionItemProps> = ({
  exercise,
  flatIndex,
  isActive,
  routineId,
  onToggle,
}) => {
  const { currentSession, startWorkout, completeSet, cancelWorkout } = useApp();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    exercise: Exercise | null;
  }>({ isOpen: false, exercise: null });

  // ---- Progress helpers (mirrored from ExerciseAccordion) ----
  const getExerciseProgress = (ex: Exercise) => {
    if (!currentSession) return { completed: 0, total: ex.sets };
    const effectiveSets = ex.sets === 0 ? 1 : ex.sets;
    const completed = currentSession.setsProgress.filter(
      (p) => p.exerciseId === ex.id && p.completed
    ).length;
    return { completed, total: effectiveSets };
  };

  const isExerciseComplete = (ex: Exercise) => {
    const progress = getExerciseProgress(ex);
    return progress.completed === progress.total;
  };

  // ---- Complete-exercise logic (mirrored from ExerciseAccordion) ----
  const completeSetsForExercise = (ex: Exercise) => {
    const effectiveSets = ex.sets === 0 ? 1 : ex.sets;
    for (let i = 1; i <= effectiveSets; i++) {
      const isCompleted = currentSession?.setsProgress.some(
        (p) => p.exerciseId === ex.id && p.setNumber === i && p.completed
      );
      if (!isCompleted) {
        completeSet(ex.id, i);
      }
    }
  };

  const completeExercise = (ex: Exercise) => {
    if (
      currentSession &&
      !currentSession.completed &&
      currentSession.startedAt &&
      routineId &&
      currentSession.routineId !== routineId
    ) {
      setConfirmDialog({ isOpen: true, exercise: ex });
      return;
    }

    if (!currentSession || currentSession.completed || currentSession.routineId !== routineId) {
      if (routineId) {
        startWorkout(routineId);
        setTimeout(() => {
          completeSetsForExercise(ex);
        }, 50);
      }
      return;
    }

    completeSetsForExercise(ex);
  };

  const handleConfirmSwitch = () => {
    if (confirmDialog.exercise && routineId) {
      cancelWorkout();
      setTimeout(() => {
        startWorkout(routineId);
        setTimeout(() => {
          completeSetsForExercise(confirmDialog.exercise!);
        }, 50);
      }, 50);
    }
    setConfirmDialog({ isOpen: false, exercise: null });
  };

  const handleCancelSwitch = () => {
    setConfirmDialog({ isOpen: false, exercise: null });
  };

  const progress = getExerciseProgress(exercise);
  const isComplete = isExerciseComplete(exercise);

  return (
    <div className={`accordion-item ${isActive ? 'active' : ''}`}>
      {/* ---- Collapsed header ---- */}
      <button
        onClick={() => onToggle(flatIndex)}
        className="w-full flex items-center justify-between p-0"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {/* Step number, or accent check when complete (completion = the one emphasis) */}
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border font-display text-[13px] font-semibold"
            style={
              isComplete
                ? {
                    background: 'var(--color-accent-tint)',
                    borderColor: 'var(--color-accent)',
                    color: 'var(--color-accent)',
                  }
                : {
                    background: 'var(--color-surface-raised)',
                    borderColor: 'var(--color-border-primary)',
                    color: 'var(--color-text-secondary)',
                  }
            }
          >
            {isComplete ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            ) : (
              <span>{flatIndex + 1}</span>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-left font-medium text-white">{exercise.name}</h3>
            <p className="truncate text-caption text-text-secondary">
              {[
                exercise.sets > 0 ? `${exercise.sets} series` : null,
                `${exercise.reps} reps`,
                `${exercise.restTime || '1min'} descanso`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {/* Collapsed mini progress + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isActive && progress.total > 0 && (
            <div
              className="h-[5px] w-[34px] overflow-hidden rounded-full"
              style={{ background: '#1a2230' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(progress.completed / progress.total) * 100}%`,
                  background: 'var(--color-accent)',
                }}
              />
            </div>
          )}
          <ChevronIcon rotated={isActive} />
        </div>
      </button>

      {/* ---- Expanded content ---- */}
      {isActive && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <ExerciseDetail exercise={exercise} routineId={routineId} />

          {!isComplete && exercise.sets > 0 && (
            <Button
              variant="primary"
              fullWidth
              className="mt-3"
              onClick={() => completeExercise(exercise)}
              icon={<CheckIcon />}
            >
              Completar ejercicio
            </Button>
          )}
        </div>
      )}

      {/* Switch workout confirm dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Switch Workout?"
        message="Starting a new workout will cancel your current workout. Progress will be lost."
        confirmText="Switch Workout"
        cancelText="Go Back"
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
    </div>
  );
};

export default ExerciseAccordionItem;
