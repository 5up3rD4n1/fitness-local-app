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
      (progress) => progress.exerciseId === exercise.id && progress.setNumber === setNumber && progress.completed
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
      } else if (!currentSession || currentSession.completed || currentSession.routineId !== routineId) {
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

  const completedSets = Array.from({ length: effectiveSets }, (_, i) => i + 1)
    .filter(setNumber => getSetProgress(setNumber)).length;

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">{exercise.name}</h3>
          {exercise.sets > 0 ? (
            <span className="text-text-secondary text-sm">
              {completedSets}/{exercise.sets} sets
            </span>
          ) : (
            <span className="text-text-secondary text-sm">
              {completedSets > 0 ? 'Complete' : 'Mark as done'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-text-secondary text-sm">
          <span>{exercise.reps} reps</span>
          <span>{exercise.restTime || '1min'} rest</span>
        </div>
      </div>

      {exercise.sets === 0 ? (
        <button
          onClick={() => handleSetToggle(1)}
          className={`
            w-full flex items-center justify-center gap-2 h-16 rounded-xl border-2 font-bold transition-all
            ${
              getSetProgress(1)
                ? 'border-accent bg-accent text-primary-bg'
                : 'border-border-primary bg-primary-bg text-white hover:border-border-secondary'
            }
          `}
        >
          {getSetProgress(1) && (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
          <span>{getSetProgress(1) ? 'Completed' : 'Mark Complete'}</span>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: exercise.sets }, (_, index) => {
            const setNumber = index + 1;
            const isCompleted = getSetProgress(setNumber);

            return (
              <button
                key={setNumber}
                onClick={() => handleSetToggle(setNumber)}
                className={`
                  relative flex h-16 w-full items-center justify-center rounded-xl border-2 font-bold text-lg transition-all
                  ${
                    isCompleted
                      ? 'border-accent bg-accent text-primary-bg'
                      : 'border-border-primary bg-primary-bg text-white hover:border-border-secondary'
                  }
                `}
              >
                {isCompleted && (
                  <svg
                    className="absolute top-1 right-1 h-4 w-4 text-primary-bg"
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

      {completedSets > 0 && exercise.sets > 0 && (
        <div className="mt-4 rounded-xl bg-secondary-bg p-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Progress</span>
            <span className="text-accent font-medium">
              {Math.round((completedSets / exercise.sets) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-border-primary overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${(completedSets / exercise.sets) * 100}%` }}
            />
          </div>
        </div>
      )}

      {completedSets === effectiveSets && exercise.sets > 0 && (
        <div className="mt-4 rounded-xl bg-accent bg-opacity-20 border border-accent p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-white">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <span className="font-medium">Exercise Complete!</span>
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