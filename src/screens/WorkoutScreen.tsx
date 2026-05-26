import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import SectionedExerciseList from '../components/SectionedExerciseList';
import RestTimerSheet from '../components/RestTimerSheet';
import WorkoutEmptyState from '../components/WorkoutEmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { Button, IconButton, ProgressBar, CompletionScreen } from '../components/ui';
import { ExerciseSection } from '../types';

const SECTION_LABEL: Record<ExerciseSection, string> = {
  activation: 'Activación',
  main: 'Bloque principal',
  cardio: 'Cardio',
  core: 'Core',
};

const WorkoutScreen: React.FC = () => {
  const {
    currentRoutine,
    currentSession,
    exercises,
    currentExerciseIndex,
    startWorkout,
    beginWorkoutTimer,
    completeWorkout,
    cancelWorkout,
    nextExercise,
    previousExercise,
    navigateTo,
  } = useApp();

  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTime, setRestTime] = useState(60); // Default 60 seconds
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completionData, setCompletionData] = useState<{
    routineName: string;
    duration: string;
    stats: { label: string; value: string }[];
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'start' | 'complete' | 'cancel' | null;
  }>({ isOpen: false, type: null });

  // Get current workout exercises
  const workoutExercises = currentRoutine
    ? exercises.filter((exercise) => currentRoutine.exercises.includes(exercise.id))
    : [];

  const currentExercise = workoutExercises[currentExerciseIndex];

  // Check if the current session belongs to the routine being viewed
  const isActiveRoutine =
    currentSession && !currentSession.completed && currentSession.routineId === currentRoutine?.id;

  // Parse rest time from exercise
  const parseRestTime = (restTimeStr: string): number => {
    if (!restTimeStr || restTimeStr.trim() === '') {
      return 60; // Default 1 minute
    }
    if (restTimeStr.includes('min')) {
      const minutes = parseInt(restTimeStr.replace(/\D/g, '')) || 1;
      return minutes * 60;
    }
    if (restTimeStr.includes('s')) {
      return parseInt(restTimeStr.replace(/\D/g, '')) || 30;
    }
    return 60; // Default
  };

  // Get display rest time
  const getDisplayRestTime = (exercise: typeof currentExercise): string => {
    if (!exercise) return '1min';
    if (!exercise.restTime || exercise.restTime.trim() === '') {
      return '1min';
    }
    return exercise.restTime;
  };

  // Calculate workout progress
  const getWorkoutProgress = () => {
    if (!currentSession || workoutExercises.length === 0) return 0;

    let totalSets = 0;
    let completedSets = 0;

    workoutExercises.forEach((exercise) => {
      totalSets += exercise.sets;
      const exerciseProgress = currentSession.setsProgress.filter(
        (progress) => progress.exerciseId === exercise.id && progress.completed
      );
      completedSets += exerciseProgress.length;
    });

    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  };

  const workoutProgress = getWorkoutProgress();
  const isWorkoutComplete = workoutProgress === 100;

  // Update elapsed timer every second
  useEffect(() => {
    if (!currentSession?.startedAt) return;

    const updateElapsed = () => {
      const diff = Date.now() - new Date(currentSession.startedAt!).getTime();
      setElapsedSeconds(Math.floor(diff / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  // Format workout duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Start rest timer after completing a set
  const startRestTimer = () => {
    if (currentExercise) {
      const time = parseRestTime(currentExercise.restTime);
      setRestTime(time);
      setShowRestTimer(true);
    }
  };

  const handleStartWorkout = () => {
    if (!currentRoutine) return;

    // Check if there's a different active workout with started timer
    if (
      currentSession &&
      !currentSession.completed &&
      currentSession.startedAt &&
      currentSession.routineId !== currentRoutine.id
    ) {
      setConfirmDialog({ isOpen: true, type: 'start' });
    } else if (currentSession && currentSession.routineId === currentRoutine.id) {
      // Same workout, just start the timer
      beginWorkoutTimer();
    } else {
      // No active session or completed, create new one and start timer
      startWorkout(currentRoutine.id);
      setTimeout(() => beginWorkoutTimer(), 50);
    }
  };

  const handleCompleteWorkout = () => {
    setConfirmDialog({ isOpen: true, type: 'complete' });
  };

  const handleCancelWorkout = () => {
    setConfirmDialog({ isOpen: true, type: 'cancel' });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.type || !currentRoutine) return;

    switch (confirmDialog.type) {
      case 'start':
        // Cancel old workout and start new one
        cancelWorkout();
        setTimeout(() => {
          startWorkout(currentRoutine.id);
          setTimeout(() => beginWorkoutTimer(), 50);
        }, 50);
        break;
      case 'complete': {
        // Capture a summary, then show the celebration. completeWorkout()
        // (which saves to history and navigates home) runs on "Back to Home".
        const completedSets = currentSession?.setsProgress.filter((p) => p.completed).length ?? 0;
        setCompletionData({
          routineName: currentRoutine.name,
          duration: formatDuration(elapsedSeconds),
          stats: [
            { label: 'Sets Done', value: String(completedSets) },
            { label: 'Exercises', value: String(workoutExercises.length) },
          ],
        });
        break;
      }
      case 'cancel':
        cancelWorkout();
        break;
    }

    setConfirmDialog({ isOpen: false, type: null });
  };

  const handleCancelAction = () => {
    setConfirmDialog({ isOpen: false, type: null });
  };

  // Celebration screen — shown after the user confirms "Finish".
  if (completionData) {
    return (
      <CompletionScreen
        routineName={completionData.routineName}
        duration={completionData.duration}
        stats={completionData.stats}
        onDone={() => completeWorkout()}
      />
    );
  }

  if (!currentRoutine) {
    return (
      <div className="flex h-full items-center justify-center bg-primary-bg">
        <WorkoutEmptyState />
      </div>
    );
  }

  // Subtitle: show elapsed time when active, otherwise show focus or "Ready to start"
  const headerSubtitle =
    isActiveRoutine && currentSession.startedAt
      ? `${formatDuration(elapsedSeconds)} transcurrido`
      : (currentRoutine.focus ?? 'Listo para empezar');

  // Section label for current exercise in ExerciseNavBar
  const currentSectionLabel = currentExercise ? SECTION_LABEL[currentExercise.section] : null;

  return (
    <div className="relative flex h-full flex-col bg-primary-bg">
      {/* Main Content - Scrollable */}
      <div className={`flex-1 overflow-y-auto ${showRestTimer ? 'pb-96' : 'pb-24'}`}>
        {/* Glass header */}
        <header className="app-header gap-3">
          <IconButton
            label="Back to home"
            onClick={() => navigateTo('home')}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" />
              </svg>
            }
          />
          <div className="flex-1 min-w-0">
            <h2
              className="font-display text-[16px] font-bold tracking-tight text-white truncate"
              style={{ letterSpacing: '-0.01em' }}
            >
              {currentRoutine.title}
            </h2>
            <p className="text-caption text-text-secondary mt-0.5">{headerSubtitle}</p>
          </div>
          {isActiveRoutine && currentSession.startedAt ? (
            <Button variant="secondary" size="sm" onClick={handleCancelWorkout}>
              Cancelar
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleStartWorkout}>
              Iniciar
            </Button>
          )}
        </header>

        {/* Exercise navigation strip */}
        {workoutExercises.length > 1 && (
          <div className="flex items-center gap-3 px-[18px] py-3">
            {/* Prev button */}
            <button
              onClick={previousExercise}
              disabled={currentExerciseIndex === 0}
              className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl border transition-colors ${
                currentExerciseIndex === 0
                  ? 'cursor-not-allowed border-border-primary bg-secondary-bg text-text-tertiary'
                  : 'border-border-primary bg-secondary-bg text-text-secondary hover:border-border-secondary hover:text-white'
              }`}
            >
              <svg
                className="h-[18px] w-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex-1 min-w-0 text-center space-y-1">
              <p className="font-display text-[11px] font-semibold tracking-[0.1em] text-text-tertiary uppercase">
                Ejercicio {currentExerciseIndex + 1} de {workoutExercises.length}
              </p>
              <p className="truncate text-body font-semibold text-white">{currentExercise?.name}</p>
              {currentSectionLabel && (
                <span className="pill pill-accent inline-block mt-1">{currentSectionLabel}</span>
              )}
            </div>

            {/* Next button */}
            <button
              onClick={nextExercise}
              disabled={currentExerciseIndex === workoutExercises.length - 1}
              className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl border transition-colors ${
                currentExerciseIndex === workoutExercises.length - 1
                  ? 'cursor-not-allowed border-border-primary bg-secondary-bg text-text-tertiary'
                  : 'border-border-primary bg-secondary-bg text-text-secondary hover:border-border-secondary hover:text-white'
              }`}
            >
              <svg
                className="h-[18px] w-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 6l6 6-6 6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Progress bar */}
        <div className="px-[20px] pb-1 pt-1.5">
          <div className="flex items-center justify-between mb-[7px]">
            <span className="text-caption text-text-secondary">Progreso</span>
            <span className="font-display text-[12px] font-semibold text-white">
              {Math.round(workoutProgress)}%
            </span>
          </div>
          <ProgressBar value={workoutProgress} />
        </div>

        {/* Sectioned Exercise List */}
        <div className="p-4">
          <SectionedExerciseList exercises={workoutExercises} routineId={currentRoutine.id} />
        </div>

        {/* Finish Workout panel — only for active routine */}
        {isActiveRoutine && (
          <div className="px-4 pb-4">
            <div className={`card text-center ${isWorkoutComplete ? 'border-accent' : ''}`}>
              {isWorkoutComplete ? (
                <>
                  <div className="completion-banner mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      <span className="font-display text-[16px] font-semibold text-white">
                        ¡Entrenamiento completo!
                      </span>
                    </div>
                  </div>
                  <p className="mb-4 text-caption text-text-secondary">
                    Excelente trabajo. Has completado todos los ejercicios.
                  </p>
                  <Button variant="primary" size="lg" fullWidth onClick={handleCompleteWorkout}>
                    Finalizar entrenamiento
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-4 text-caption text-text-secondary">
                    Completa todos los ejercicios para terminar
                  </p>
                  <Button variant="ghost" size="lg" fullWidth onClick={handleCompleteWorkout}>
                    Finalizar entrenamiento
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rest Timer Sheet */}
      <RestTimerSheet
        isOpen={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        defaultRestTime={restTime}
      />

      {/* Rest Timer action bar — solid surface, flat button */}
      {currentExercise && !showRestTimer && (
        <div className="safe-bottom absolute bottom-0 left-0 right-0 z-20 border-t border-border-primary bg-primary-bg px-[18px] pb-6 pt-[14px]">
          <button
            onClick={startRestTimer}
            className="flex w-full items-center justify-center gap-[9px] rounded-2xl border border-border-primary bg-surface-raised py-[15px] font-display text-[15px] font-semibold text-white transition-colors hover:border-border-secondary"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2 2M9 2h6" strokeLinecap="round" />
            </svg>
            Iniciar descanso · {getDisplayRestTime(currentExercise)}
          </button>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.type === 'start'
            ? 'Switch Workout?'
            : confirmDialog.type === 'complete'
              ? 'Finish Workout?'
              : 'Cancel Workout?'
        }
        message={
          confirmDialog.type === 'start'
            ? 'Starting a new workout will cancel your current workout. Progress will be lost.'
            : confirmDialog.type === 'complete'
              ? 'Are you sure you want to finish this workout? Your progress will be saved.'
              : 'Are you sure you want to cancel this workout? Your progress will be lost.'
        }
        confirmText={
          confirmDialog.type === 'start'
            ? 'Switch Workout'
            : confirmDialog.type === 'complete'
              ? 'Finish'
              : 'Yes, Cancel'
        }
        cancelText={confirmDialog.type === 'complete' ? 'Keep Going' : 'Go Back'}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </div>
  );
};

export default WorkoutScreen;
