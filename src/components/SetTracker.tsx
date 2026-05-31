import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Exercise } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface SetTrackerProps {
  exercise: Exercise;
  routineId?: string;
  className?: string;
}

const SetTracker: React.FC<SetTrackerProps> = ({ exercise, routineId, className = '' }) => {
  const { currentSession, startWorkout, completeSet, uncompleteSet, cancelWorkout } = useApp();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    setNumber: number | null;
  }>({ isOpen: false, setNumber: null });

  // For exercises with 0 sets, treat them as having 1 set for tracking
  const effectiveSets = exercise.sets === 0 ? 1 : exercise.sets;

  const getSetProgress = (setNumber: number) => {
    if (!currentSession) return false;
    return currentSession.setsProgress.some(
      (progress) =>
        progress.exerciseId === exercise.id &&
        progress.setNumber === setNumber &&
        progress.completed
    );
  };

  const handleSetToggle = (setNumber: number) => {
    const isCompleted = getSetProgress(setNumber);
    if (isCompleted) {
      uncompleteSet(exercise.id, setNumber);
    } else {
      // Check if there's a different active workout with a started timer
      if (
        currentSession &&
        !currentSession.completed &&
        currentSession.startedAt &&
        routineId &&
        currentSession.routineId !== routineId
      ) {
        setConfirmDialog({ isOpen: true, setNumber });
      } else if (
        !currentSession ||
        currentSession.completed ||
        currentSession.routineId !== routineId
      ) {
        // No session or completed session, create one for this routine
        if (routineId) {
          startWorkout(routineId);
          setTimeout(() => completeSet(exercise.id, setNumber), 50);
        }
      } else {
        // Session exists for current routine
        completeSet(exercise.id, setNumber);
      }
    }
  };

  const handleConfirmSwitch = () => {
    if (confirmDialog.setNumber !== null && routineId) {
      cancelWorkout();
      setTimeout(() => {
        startWorkout(routineId);
        setTimeout(() => completeSet(exercise.id, confirmDialog.setNumber!), 50);
      }, 50);
    }
    setConfirmDialog({ isOpen: false, setNumber: null });
  };

  const handleCancelSwitch = () => {
    setConfirmDialog({ isOpen: false, setNumber: null });
  };

  const completedSets = Array.from({ length: effectiveSets }, (_, i) => i + 1).filter((setNumber) =>
    getSetProgress(setNumber)
  ).length;

  return (
    <div className={`${className}`}>
      {/* Section label + count */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
          Series{exercise.sets > 0 ? ` · ${completedSets} / ${exercise.sets}` : ''}
        </p>
        <div className="flex items-center gap-3 text-caption text-text-secondary">
          <span>
            {exercise.durationSeconds ? `${exercise.durationSeconds} s` : `${exercise.reps} reps`}
          </span>
          {exercise.intensity && <span>{exercise.intensity}</span>}
          <span>{exercise.restTime || '1min'} descanso</span>
        </div>
      </div>

      {exercise.sets === 0 ? (
        <button
          onClick={() => handleSetToggle(1)}
          className={`set-tile w-full gap-2 ${getSetProgress(1) ? 'done' : ''}`}
        >
          {getSetProgress(1) && (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
          <span>{getSetProgress(1) ? 'Completado' : 'Marcar como hecho'}</span>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-[9px] mb-[14px]">
          {Array.from({ length: exercise.sets }, (_, index) => {
            const setNumber = index + 1;
            const isCompleted = getSetProgress(setNumber);

            return (
              <button
                key={setNumber}
                onClick={() => handleSetToggle(setNumber)}
                className={`set-tile w-full ${isCompleted ? 'done' : ''}`}
              >
                {isCompleted && (
                  <svg
                    className="absolute top-1 right-1 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
                <span>{setNumber}</span>
              </button>
            );
          })}
        </div>
      )}

      {completedSets === effectiveSets && exercise.sets > 0 && (
        <div className="completion-banner mt-2">
          <div className="flex items-center justify-center gap-2 text-white">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <span className="font-display font-semibold">¡Ejercicio completado!</span>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
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

export default SetTracker;
