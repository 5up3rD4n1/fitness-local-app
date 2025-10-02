import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import ExerciseAccordion from '../components/ExerciseAccordion';
import Timer from '../components/Timer';

const WorkoutScreen: React.FC = () => {
  const {
    currentRoutine,
    currentSession,
    exercises,
    currentExerciseIndex,
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
  const [timerKey, setTimerKey] = useState(0); // Force timer restart

  // Get current workout exercises
  const workoutExercises = currentRoutine
    ? exercises.filter((exercise) => currentRoutine.exercises.includes(exercise.id))
    : [];

  const currentExercise = workoutExercises[currentExerciseIndex];

  // Parse rest time from exercise
  const parseRestTime = (restTimeStr: string): number => {
    if (restTimeStr.includes('min')) {
      const minutes = parseInt(restTimeStr.replace(/\D/g, '')) || 1;
      return minutes * 60;
    }
    if (restTimeStr.includes('s')) {
      return parseInt(restTimeStr.replace(/\D/g, '')) || 30;
    }
    return 60; // Default
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

  const handleCompleteWorkout = () => {
    if (window.confirm('Are you sure you want to complete this workout?')) {
      completeWorkout();
    }
  };

  const handleCancelWorkout = () => {
    if (window.confirm('Are you sure you want to cancel this workout? Your progress will be lost.')) {
      cancelWorkout();
    }
  };

  // Auto-redirect if no current session
  useEffect(() => {
    if (!currentSession) {
      navigateTo('home');
    }
  }, [currentSession, navigateTo]);

  if (!currentSession || !currentRoutine) {
    return (
      <div className="flex h-full items-center justify-center bg-primary-bg">
        <div className="text-center">
          <h2 className="text-white text-xl font-bold mb-2">No Active Workout</h2>
          <p className="text-text-secondary mb-4">Start a workout from the home screen</p>
          <button
            onClick={() => navigateTo('home')}
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-primary-bg">
      {/* Header */}
      <div className="flex items-center bg-primary-bg p-4 pb-2 justify-between border-b border-border-primary">
        <button
          onClick={handleCancelWorkout}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary-bg transition-colors"
        >
          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            {currentRoutine.name}
          </h2>
          <p className="text-text-secondary text-sm">
            {currentSession?.startedAt ? `${formatDuration(elapsedSeconds)} elapsed` : 'Ready to start'}
          </p>
        </div>
        {currentSession?.startedAt ? (
          <button
            onClick={handleCompleteWorkout}
            className="px-4 py-2 rounded-xl font-medium transition-colors bg-accent text-primary-bg hover:opacity-90"
          >
            Finish
          </button>
        ) : (
          <button
            onClick={beginWorkoutTimer}
            className="px-4 py-2 rounded-xl font-medium transition-colors bg-accent text-primary-bg hover:opacity-90"
          >
            Start
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 bg-primary-bg border-b border-border-primary">
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-secondary text-sm">Progress</span>
          <span className="text-accent font-medium">
            {Math.round(workoutProgress)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-border-primary overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${workoutProgress}%` }}
          />
        </div>
      </div>

      {/* Rest Timer Button - Top */}
      {currentExercise && !showRestTimer && (
        <div className="px-4 py-3 bg-primary-bg border-b border-border-primary">
          <button
            onClick={startRestTimer}
            className="w-full flex items-center justify-center gap-2 bg-accent text-primary-bg px-4 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15,1H9V3H15M11,14H13V8H11M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39Z" />
            </svg>
            Start Rest Timer ({currentExercise.restTime})
          </button>
        </div>
      )}

      {/* Rest Timer - Fixed below progress */}
      {showRestTimer && (
        <div className="px-4 py-3 bg-secondary-bg border-b border-border-primary">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Rest Timer</h3>
            <button
              onClick={() => setShowRestTimer(false)}
              className="text-text-secondary hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {/* Time Presets */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => {
                setRestTime(30);
                setTimerKey(prev => prev + 1);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                restTime === 30 ? 'bg-accent text-primary-bg' : 'bg-border-primary text-white hover:bg-border-secondary'
              }`}
            >
              30s
            </button>
            <button
              onClick={() => {
                setRestTime(60);
                setTimerKey(prev => prev + 1);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                restTime === 60 ? 'bg-accent text-primary-bg' : 'bg-border-primary text-white hover:bg-border-secondary'
              }`}
            >
              1min
            </button>
            <button
              onClick={() => {
                setRestTime(90);
                setTimerKey(prev => prev + 1);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                restTime === 90 ? 'bg-accent text-primary-bg' : 'bg-border-primary text-white hover:bg-border-secondary'
              }`}
            >
              1.5min
            </button>
            <button
              onClick={() => {
                setRestTime(120);
                setTimerKey(prev => prev + 1);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                restTime === 120 ? 'bg-accent text-primary-bg' : 'bg-border-primary text-white hover:bg-border-secondary'
              }`}
            >
              2min
            </button>
            <button
              onClick={() => {
                setRestTime(300);
                setTimerKey(prev => prev + 1);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                restTime === 300 ? 'bg-accent text-primary-bg' : 'bg-border-primary text-white hover:bg-border-secondary'
              }`}
            >
              5min
            </button>
          </div>

          {/* Time Adjust Controls */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <button
              onClick={() => {
                setRestTime(Math.max(10, restTime - 10));
                setTimerKey(prev => prev + 1);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-border-primary text-white hover:bg-border-secondary"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13H5v-2h14v2z" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <div className="text-3xl font-bold text-white">
                {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-text-secondary">Rest Time</div>
            </div>
            <button
              onClick={() => {
                setRestTime(restTime + 10);
                setTimerKey(prev => prev + 1);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-border-primary text-white hover:bg-border-secondary"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          </div>

          <Timer
            key={timerKey}
            initialTime={restTime}
            onComplete={() => setShowRestTimer(false)}
            autoStart={true}
            className="mb-3"
          />

          <button
            onClick={() => setShowRestTimer(false)}
            className="w-full btn-primary"
          >
            Skip Rest
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Current Exercise Navigation */}
        {workoutExercises.length > 1 && (
          <div className="flex items-center justify-between gap-2 p-3 bg-secondary-bg border-b border-border-primary">
            <button
              onClick={previousExercise}
              disabled={currentExerciseIndex === 0}
              className={`flex items-center gap-1 px-2 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${
                currentExerciseIndex === 0
                  ? 'bg-border-primary text-text-secondary cursor-not-allowed'
                  : 'bg-border-primary text-white hover:bg-border-secondary'
              }`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
              </svg>
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex-1 text-center min-w-0 px-2">
              <p className="text-text-secondary text-xs">
                Exercise {currentExerciseIndex + 1} of {workoutExercises.length}
              </p>
              <p className="text-white text-sm font-medium truncate">
                {currentExercise?.name}
              </p>
            </div>

            <button
              onClick={nextExercise}
              disabled={currentExerciseIndex === workoutExercises.length - 1}
              className={`flex items-center gap-1 px-2 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ${
                currentExerciseIndex === workoutExercises.length - 1
                  ? 'bg-border-primary text-text-secondary cursor-not-allowed'
                  : 'bg-border-primary text-white hover:bg-border-secondary'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
          </div>
        )}

        {/* Exercise Accordion */}
        <div className="p-4">
          <ExerciseAccordion exercises={workoutExercises} />
        </div>

        {/* Workout Complete Message */}
        {isWorkoutComplete && (
          <div className="p-4 border-t border-border-primary">
            <div className="rounded-xl bg-accent bg-opacity-20 border border-accent p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-accent mb-2">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                <span className="font-bold text-lg">Workout Complete!</span>
              </div>
              <p className="text-white mb-4">
                Great job! You've completed all exercises in this workout.
              </p>
              <button
                onClick={handleCompleteWorkout}
                className="btn-primary w-full"
              >
                Finish Workout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutScreen;