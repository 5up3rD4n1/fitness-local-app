import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Exercise } from '../types';
import SetTracker from './SetTracker';
import VideoPreview from './VideoPreview';
import ConfirmDialog from './ConfirmDialog';

interface ExerciseAccordionProps {
  exercises: Exercise[];
  routineId?: string;
  className?: string;
}

const ExerciseAccordion: React.FC<ExerciseAccordionProps> = ({ exercises, routineId, className = '' }) => {
  const { currentSession, currentExerciseIndex, selectExercise, startWorkout, completeSet, cancelWorkout } = useApp();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(currentExerciseIndex);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    exercise: Exercise | null;
  }>({ isOpen: false, exercise: null });

  // Sync expanded state with currentExerciseIndex changes (from navigation)
  useEffect(() => {
    setExpandedIndex(currentExerciseIndex);
  }, [currentExerciseIndex]);

  const getExerciseProgress = (exercise: Exercise) => {
    if (!currentSession) return { completed: 0, total: exercise.sets };

    // For exercises with 0 sets, treat them as having 1 set for tracking
    const effectiveSets = exercise.sets === 0 ? 1 : exercise.sets;

    const completed = currentSession.setsProgress.filter(
      (progress) => progress.exerciseId === exercise.id && progress.completed
    ).length;

    return { completed, total: effectiveSets };
  };

  const isExerciseComplete = (exercise: Exercise) => {
    const progress = getExerciseProgress(exercise);
    return progress.completed === progress.total;
  };

  const toggleExercise = (index: number) => {
    if (index === expandedIndex) {
      // Collapse if clicking the expanded exercise
      setExpandedIndex(null);
    } else {
      // Expand and select the new exercise
      setExpandedIndex(index);
      selectExercise(index);
    }
  };

  const completeExercise = (exercise: Exercise) => {
    // Check if there's a different active workout with a started timer
    if (
      currentSession &&
      !currentSession.completed &&
      currentSession.startedAt &&
      routineId &&
      currentSession.routineId !== routineId
    ) {
      setConfirmDialog({ isOpen: true, exercise });
      return;
    }

    // If no session or wrong session, create one
    if (!currentSession || currentSession.completed || currentSession.routineId !== routineId) {
      if (routineId) {
        startWorkout(routineId);
        setTimeout(() => {
          completeSetsForExercise(exercise);
        }, 50);
      }
      return;
    }

    completeSetsForExercise(exercise);
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

  const completeSetsForExercise = (exercise: Exercise) => {
    // For exercises with 0 sets, treat them as having 1 set
    const effectiveSets = exercise.sets === 0 ? 1 : exercise.sets;

    // Complete all remaining sets
    for (let i = 1; i <= effectiveSets; i++) {
      const isCompleted = currentSession?.setsProgress.some(
        (p) => p.exerciseId === exercise.id && p.setNumber === i && p.completed
      );
      if (!isCompleted) {
        completeSet(exercise.id, i);
      }
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {exercises.map((exercise, index) => {
        const isActive = index === expandedIndex;
        const progress = getExerciseProgress(exercise);
        const isComplete = isExerciseComplete(exercise);

        return (
          <div
            key={exercise.id}
            className={`accordion-item ${isActive ? 'active' : ''}`}
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleExercise(index)}
              className="w-full flex items-center justify-between p-0"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-bg text-sm font-bold">
                  {isComplete ? (
                    <svg className="h-5 w-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <span className="text-text-secondary">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium text-left ${isComplete ? 'text-accent' : 'text-white'}`}>
                    {exercise.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    {exercise.sets > 0 && <span>{exercise.sets} sets</span>}
                    <span>{exercise.reps} reps</span>
                    <span>{exercise.restTime || '1min'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Progress indicator for collapsed state */}
                {!isActive && progress.total > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">
                      {progress.completed}/{progress.total}
                    </span>
                    <div className="h-2 w-8 rounded-full bg-border-primary overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Chevron icon */}
                <svg
                  className={`h-5 w-5 text-text-secondary transition-transform ${
                    isActive ? 'rotate-180' : ''
                  }`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </div>
            </button>

            {/* Accordion Content */}
            {isActive && (
              <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                {/* Video Preview */}
                {exercise.videoUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-text-secondary mb-2">
                      Exercise Demo
                    </h4>
                    <VideoPreview
                      videoUrl={exercise.videoUrl}
                      title={exercise.name}
                      className="max-w-md mx-auto"
                    />
                  </div>
                )}

                {/* Set Tracker */}
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-2">
                    Track Your Sets
                  </h4>
                  <SetTracker exercise={exercise} routineId={routineId} />

                  {/* Complete Exercise Button - only show for exercises with sets */}
                  {!isComplete && exercise.sets > 0 && (
                    <button
                      onClick={() => completeExercise(exercise)}
                      className="w-full mt-3 btn-primary flex items-center justify-center gap-2"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      Complete Exercise
                    </button>
                  )}
                </div>

                {/* Exercise Notes */}
                <div className="rounded-xl bg-secondary-bg p-3">
                  <h4 className="text-sm font-medium text-text-secondary mb-2">
                    Tips
                  </h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Focus on proper form over speed</li>
                    <li>• Breathe consistently throughout the movement</li>
                    <li>• Rest {exercise.restTime || '1min'} between sets</li>
                    {(exercise.restTime || '1min').includes('min') && (
                      <li>• Use the timer to track your rest periods</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {exercises.length === 0 && (
        <div className="text-center py-8">
          <div className="text-text-secondary">
            <svg className="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V3.5C15 2.7 14.3 2 13.5 2H10.5C9.7 2 9 2.7 9 3.5V5.5L3 7V9H21ZM6 12V20C6 20.6 6.4 21 7 21H9V19H15V21H17C17.6 21 18 20.6 18 20V12L12 10L6 12Z" />
            </svg>
            <p>No exercises available</p>
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

export default ExerciseAccordion;