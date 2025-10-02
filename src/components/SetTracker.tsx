import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Exercise } from '../types';

interface SetTrackerProps {
  exercise: Exercise;
  className?: string;
}

const SetTracker: React.FC<SetTrackerProps> = ({ exercise, className = '' }) => {
  const { currentSession, completeSet, uncompleteSet } = useApp();

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
      completeSet(exercise.id, setNumber);
    }
  };

  const completedSets = Array.from({ length: exercise.sets }, (_, i) => i + 1)
    .filter(setNumber => getSetProgress(setNumber)).length;

  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">{exercise.name}</h3>
          <span className="text-text-secondary text-sm">
            {completedSets}/{exercise.sets} sets
          </span>
        </div>
        <div className="flex items-center gap-4 text-text-secondary text-sm">
          <span>{exercise.reps} reps</span>
          <span>{exercise.restTime} rest</span>
        </div>
      </div>

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

      {completedSets > 0 && (
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

      {completedSets === exercise.sets && (
        <div className="mt-4 rounded-xl bg-accent bg-opacity-20 border border-accent p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-accent">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <span className="font-medium">Exercise Complete!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetTracker;