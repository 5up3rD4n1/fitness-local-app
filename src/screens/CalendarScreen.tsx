import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LocalStorageService } from '../utils/localStorage';
import ConfirmDialog from '../components/ConfirmDialog';
import { Button, IconButton } from '../components/ui';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasWorkout: boolean;
  workoutCompleted: boolean;
}

const CalendarScreen: React.FC = () => {
  const { routines, exercises, viewWorkout, allRoutines } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    workoutId: string | null;
  }>({ isOpen: false, workoutId: null });

  // refreshKey is used as a dependency trigger to re-read localStorage after delete
  const workoutHistory = React.useMemo(
    () => LocalStorageService.getWorkoutHistory(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey]
  );

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Generate calendar days for the current month (7 cols × 6 rows = 42 cells)
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isSelected = date.getTime() === selected.getTime();

      // Accent dot: completed workout on this day
      const workoutCompleted = workoutHistory.some((session) => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime() && session.completed;
      });

      // Muted dot: scheduled (current-month) day without a completed workout
      const hasWorkout = isCurrentMonth;

      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        hasWorkout,
        workoutCompleted,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Routine for a date — simple rotation by day-of-week index
  const getRoutineForDate = (date: Date) => {
    if (!routines.length) return null;
    const dayOfWeek = date.getDay();
    return routines[dayOfWeek % routines.length] ?? null;
  };

  const selectedRoutine = getRoutineForDate(selectedDate);
  const selectedExercises = selectedRoutine
    ? exercises.filter((exercise) => selectedRoutine.exercises.includes(exercise.id))
    : [];

  // All completed workouts for the selected date
  const selectedDateWorkouts = workoutHistory.filter((session) => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === selected.getTime() && session.completed;
  });

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    if (minutes === 0) return `${seconds}s`;
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const canStartWorkout = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() === today.getTime();
  };

  const handleDeleteWorkout = (workoutId: string) => {
    setDeleteConfirm({ isOpen: true, workoutId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.workoutId) {
      LocalStorageService.deleteWorkoutSession(deleteConfirm.workoutId);
      setRefreshKey((prev) => prev + 1);
    }
    setDeleteConfirm({ isOpen: false, workoutId: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, workoutId: null });
  };

  return (
    <div className="flex flex-col h-full bg-primary-bg">
      {/* Header */}
      <header className="app-header justify-center">
        <h2
          className="text-white"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem' }}
        >
          Calendar
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Month navigation + grid */}
        <div className="px-4 pt-4 pb-2">
          {/* Month nav row */}
          <div className="mb-4 flex items-center justify-between">
            <IconButton
              label="Previous month"
              onClick={() => navigateMonth('prev')}
              icon={
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
                </svg>
              }
            />

            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.125rem',
                color: 'var(--color-text-primary)',
              }}
            >
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>

            <IconButton
              label="Next month"
              onClick={() => navigateMonth('next')}
              icon={
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
                </svg>
              }
            />
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="h-9 flex items-center justify-center">
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* 42 day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((day, index) => {
              let cellStyle: React.CSSProperties = {};
              let numColor = 'var(--color-text-primary)';

              if (!day.isCurrentMonth) {
                numColor = 'var(--color-text-tertiary)';
              } else if (day.isSelected) {
                cellStyle = {
                  background: 'var(--color-accent)',
                  borderRadius: 10,
                };
                numColor = '#08101f';
              } else if (day.isToday) {
                cellStyle = {
                  borderRadius: 10,
                  border: '1px solid var(--color-accent)',
                };
              }

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day.date)}
                  className="relative flex h-11 items-center justify-center transition-colors hover:bg-secondary-bg"
                  style={{ borderRadius: 10, ...cellStyle }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: day.isToday || day.isSelected ? 700 : 500,
                      fontSize: '0.875rem',
                      color: numColor,
                    }}
                  >
                    {day.date.getDate()}
                  </span>

                  {/* Dot indicators — only for current-month cells */}
                  {day.isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
                      {day.workoutCompleted && <div className="dot dot-accent" />}
                      {day.hasWorkout && !day.workoutCompleted && <div className="dot dot-muted" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 mb-1">
            <div className="flex items-center gap-2">
              <div className="dot dot-accent" />
              <span
                style={{
                  fontFamily: 'var(--font-lexend)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="dot dot-muted" />
              <span
                style={{
                  fontFamily: 'var(--font-lexend)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Scheduled
              </span>
            </div>
          </div>
        </div>

        {/* Selected date detail panel */}
        <div
          className="px-4 pb-6 pt-4"
          style={{ borderTop: '1px solid var(--color-border-primary)' }}
        >
          <h3
            className="mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.0625rem',
              color: 'var(--color-text-primary)',
            }}
          >
            {formatDate(selectedDate)}
          </h3>

          {selectedDateWorkouts.length > 0 ? (
            // Completed workout cards
            <div className="space-y-3">
              {selectedDateWorkouts.map((workout, index) => {
                const workoutRoutine = allRoutines.find((r) => r.id === workout.routineId);
                const workoutExercises = workoutRoutine
                  ? exercises.filter((exercise) => workoutRoutine.exercises.includes(exercise.id))
                  : [];

                const startTime = workout.startedAt ? new Date(workout.startedAt) : null;
                const endTime = workout.completedAt ? new Date(workout.completedAt) : null;

                return (
                  <div key={index} className="card relative">
                    {/* Delete button */}
                    <div className="absolute right-3 top-3">
                      <IconButton
                        label="Delete workout"
                        size="sm"
                        onClick={() => handleDeleteWorkout(workout.id)}
                        icon={
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        }
                      />
                    </div>

                    {/* Completed badge row */}
                    <div className="mb-3 flex items-center gap-2 text-accent">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                        }}
                      >
                        Workout completado
                      </span>
                    </div>

                    <p
                      className="pr-10 mb-2"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {workoutRoutine?.name || 'Workout'}
                    </p>

                    <div className="space-y-1 mb-3">
                      {startTime && (
                        <div
                          className="flex items-center gap-2"
                          style={{
                            fontFamily: 'var(--font-lexend)',
                            fontSize: '0.8125rem',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>Start:</span>
                          <span>{formatTime(startTime)}</span>
                        </div>
                      )}
                      {endTime && (
                        <div
                          className="flex items-center gap-2"
                          style={{
                            fontFamily: 'var(--font-lexend)',
                            fontSize: '0.8125rem',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>End:</span>
                          <span>{formatTime(endTime)}</span>
                        </div>
                      )}
                      <div
                        className="flex items-center gap-2"
                        style={{
                          fontFamily: 'var(--font-lexend)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>Duration:</span>
                        <span>{formatDuration(workout.duration || 0)}</span>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        style={{
                          fontFamily: 'var(--font-lexend)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>Exercises:</span>
                        <span>{workoutExercises.length}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4
                        style={{
                          fontFamily: 'var(--font-lexend)',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Exercises completed:
                      </h4>
                      {workoutExercises.map((exercise) => (
                        <div key={exercise.id} className="flex items-center gap-2">
                          <div className="dot dot-accent flex-shrink-0" />
                          <span
                            style={{
                              fontFamily: 'var(--font-lexend)',
                              fontSize: '0.8125rem',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {exercise.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {canStartWorkout() && selectedRoutine && (
                <Button variant="primary" fullWidth onClick={() => viewWorkout(selectedRoutine.id)}>
                  Start Another Workout
                </Button>
              )}
            </div>
          ) : selectedRoutine ? (
            // Scheduled workout card
            <div className="card">
              <p
                className="mb-1"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--color-text-primary)',
                }}
              >
                {selectedRoutine.name}
              </p>

              {selectedRoutine.focus && (
                <p
                  className="mb-3"
                  style={{
                    fontFamily: 'var(--font-lexend)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {selectedRoutine.focus}
                </p>
              )}

              <div
                className="flex items-center gap-4 mb-3"
                style={{
                  fontFamily: 'var(--font-lexend)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span>Exercises: {selectedExercises.length}</span>
              </div>

              <div className="space-y-2 mb-4">
                <h4
                  style={{
                    fontFamily: 'var(--font-lexend)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Exercises:
                </h4>
                {selectedExercises.slice(0, 3).map((exercise) => (
                  <div key={exercise.id} className="flex items-center gap-2">
                    <div className="dot dot-muted flex-shrink-0" />
                    <span
                      style={{
                        fontFamily: 'var(--font-lexend)',
                        fontSize: '0.875rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {exercise.name}
                    </span>
                  </div>
                ))}
                {selectedExercises.length > 3 && (
                  <p
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    +{selectedExercises.length - 3} more exercises
                  </p>
                )}
              </div>

              {canStartWorkout() ? (
                <Button variant="primary" fullWidth onClick={() => viewWorkout(selectedRoutine.id)}>
                  Start Today&apos;s Workout
                </Button>
              ) : selectedDate < new Date() ? (
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'var(--font-lexend)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  This workout is in the past
                </p>
              ) : (
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'var(--font-lexend)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Workout scheduled for this date
                </p>
              )}
            </div>
          ) : (
            // Rest day / no routine
            <div className="card text-center">
              <svg
                className="h-12 w-12 mx-auto mb-2"
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V3.5C15 2.7 14.3 2 13.5 2H10.5C9.7 2 9 2.7 9 3.5V5.5L3 7V9H21ZM6 12V20C6 20.6 6.4 21 7 21H9V19H15V21H17C17.6 21 18 20.6 18 20V12L12 10L6 12Z" />
              </svg>
              <p style={{ color: 'var(--color-text-secondary)' }}>No workout scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Workout?"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default CalendarScreen;
