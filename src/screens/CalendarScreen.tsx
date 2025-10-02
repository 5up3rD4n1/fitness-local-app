import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LocalStorageService } from '../utils/localStorage';
import ConfirmDialog from '../components/ConfirmDialog';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasWorkout: boolean;
  workoutCompleted: boolean;
}

const CalendarScreen: React.FC = () => {
  const { routines, exercises, viewWorkout, startWorkout } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    workoutId: string | null;
  }>({ isOpen: false, workoutId: null });

  const workoutHistory = LocalStorageService.getWorkoutHistory();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Generate calendar days for the current month
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

      // Check if there's a completed workout on this date
      const workoutCompleted = workoutHistory.some(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime() && session.completed;
      });

      // Simple logic: assume workouts are scheduled for current month days
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

  // Get routine for a specific date (simple rotation based on day of week)
  const getRoutineForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    const routineIndex = dayOfWeek % routines.length;
    return routines[routineIndex];
  };

  const selectedRoutine = getRoutineForDate(selectedDate);
  const selectedExercises = selectedRoutine
    ? exercises.filter(exercise => selectedRoutine.exercises.includes(exercise.id))
    : [];

  // Get all completed workouts for the selected date
  const selectedDateWorkouts = workoutHistory.filter(session => {
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
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
      setRefreshKey(prev => prev + 1);
    }
    setDeleteConfirm({ isOpen: false, workoutId: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, workoutId: null });
  };

  return (
    <div className="flex flex-col h-full bg-primary-bg">
      {/* Header */}
      <div className="flex items-center bg-primary-bg p-4 pb-2 justify-center border-b border-border-primary">
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          Calendar
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Calendar Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary-bg transition-colors"
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 256 256">
                <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
              </svg>
            </button>

            <h3 className="text-white text-xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>

            <button
              onClick={() => navigateMonth('next')}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary-bg transition-colors"
            >
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 256 256">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="h-12 flex items-center justify-center">
                <span className="text-text-secondary text-sm font-bold">{day}</span>
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(day.date)}
                className={`h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-colors relative ${
                  !day.isCurrentMonth
                    ? 'text-border-primary hover:bg-secondary-bg'
                    : day.isSelected
                    ? 'bg-accent text-primary-bg'
                    : day.isToday
                    ? 'bg-secondary-bg text-white border-2 border-accent'
                    : 'text-white hover:bg-secondary-bg'
                }`}
              >
                <span>{day.date.getDate()}</span>

                {/* Workout indicators */}
                {day.isCurrentMonth && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {day.workoutCompleted && (
                      <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    )}
                    {day.hasWorkout && !day.workoutCompleted && (
                      <div className="w-1.5 h-1.5 bg-border-secondary rounded-full"></div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span className="text-text-secondary">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-border-secondary rounded-full"></div>
              <span className="text-text-secondary">Scheduled</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="p-4 border-t border-border-primary">
          <h3 className="text-white text-lg font-bold mb-2">
            {formatDate(selectedDate)}
          </h3>

          {selectedDateWorkouts.length > 0 ? (
            // Show all completed workouts for this date
            <div className="space-y-3">
              {selectedDateWorkouts.map((workout, index) => {
                const workoutRoutine = routines.find(r => r.id === workout.routineId);
                const workoutExercises = workoutRoutine
                  ? exercises.filter(exercise => workoutRoutine.exercises.includes(exercise.id))
                  : [];

                const startTime = workout.startedAt ? new Date(workout.startedAt) : null;
                const endTime = workout.completedAt ? new Date(workout.completedAt) : null;

                return (
                  <div key={index} className="card relative">
                    <button
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-secondary-bg hover:bg-border-secondary transition-colors"
                      title="Delete workout"
                    >
                      <svg className="h-4 w-4 text-text-secondary hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-2 mb-3">
                      <svg className="h-5 w-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      <span className="text-accent font-medium">Workout Completed</span>
                    </div>

                    <p className="text-white font-medium mb-2">{workoutRoutine?.name || 'Workout'}</p>

                    <div className="space-y-1 text-text-secondary text-sm mb-3">
                      {startTime && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Start:</span>
                          <span>{formatTime(startTime)}</span>
                        </div>
                      )}
                      {endTime && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">End:</span>
                          <span>{formatTime(endTime)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Duration:</span>
                        <span>{formatDuration(workout.duration || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Exercises:</span>
                        <span>{workoutExercises.length}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-text-secondary text-sm font-medium">Exercises completed:</h4>
                      {workoutExercises.map((exercise) => (
                        <div key={exercise.id} className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                          <span className="text-text-secondary text-sm">{exercise.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {canStartWorkout() && selectedRoutine && (
                <button
                  onClick={() => viewWorkout(selectedRoutine.id)}
                  className="w-full btn-primary"
                >
                  Start Another Workout
                </button>
              )}
            </div>
          ) : selectedRoutine ? (
            // Show scheduled workout
            <div className="card">
              <p className="text-white font-medium mb-2">{selectedRoutine.name}</p>

              <div className="flex items-center gap-4 text-text-secondary text-sm mb-3">
                <span>Exercises: {selectedExercises.length}</span>
                <span>Est. time: 45 min</span>
              </div>

              <div className="space-y-2 mb-4">
                <h4 className="text-text-secondary text-sm font-medium">Exercises:</h4>
                {selectedExercises.slice(0, 3).map((exercise) => (
                  <div key={exercise.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-border-secondary rounded-full"></div>
                    <span className="text-text-secondary text-sm">{exercise.name}</span>
                  </div>
                ))}
                {selectedExercises.length > 3 && (
                  <div className="text-text-secondary text-sm">
                    +{selectedExercises.length - 3} more exercises
                  </div>
                )}
              </div>

              {canStartWorkout() && (
                <button
                  onClick={() => viewWorkout(selectedRoutine.id)}
                  className="w-full btn-primary"
                >
                  Start Today's Workout
                </button>
              )}

              {!canStartWorkout() && selectedDate < new Date() && (
                <div className="text-center text-text-secondary text-sm">
                  This workout is in the past
                </div>
              )}

              {!canStartWorkout() && selectedDate > new Date() && (
                <div className="text-center text-text-secondary text-sm">
                  Workout scheduled for this date
                </div>
              )}
            </div>
          ) : (
            // No workout scheduled
            <div className="card text-center">
              <svg className="h-12 w-12 text-text-secondary mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V3.5C15 2.7 14.3 2 13.5 2H10.5C9.7 2 9 2.7 9 3.5V5.5L3 7V9H21ZM6 12V20C6 20.6 6.4 21 7 21H9V19H15V21H17C17.6 21 18 20.6 18 20V12L12 10L6 12Z" />
              </svg>
              <p className="text-text-secondary">No workout scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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