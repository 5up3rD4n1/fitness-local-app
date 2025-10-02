import React, { useState } from 'react';
import { LocalStorageService } from '../utils/localStorage';
import { useApp } from '../contexts/AppContext';

interface ChartData {
  label: string;
  value: number;
  date: Date;
}

const ProgressScreen: React.FC = () => {
  const { routines } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const stats = LocalStorageService.getStats();
  const workoutHistory = LocalStorageService.getWorkoutHistory();

  // Generate chart data based on selected period
  const generateChartData = (): ChartData[] => {
    const now = new Date();
    const data: ChartData[] = [];

    if (selectedPeriod === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const workoutsOnDate = workoutHistory.filter(session => {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === date.getTime() && session.completed;
        });

        data.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: workoutsOnDate.length,
          date,
        });
      }
    } else if (selectedPeriod === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        const workoutsInWeek = workoutHistory.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= startDate && sessionDate <= endDate && session.completed;
        });

        data.push({
          label: `Week ${4 - i}`,
          value: workoutsInWeek.length,
          date: endDate,
        });
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        date.setDate(1);

        const workoutsInMonth = workoutHistory.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate.getMonth() === date.getMonth() &&
                 sessionDate.getFullYear() === date.getFullYear() &&
                 session.completed;
        });

        data.push({
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          value: workoutsInMonth.length,
          date,
        });
      }
    }

    return data;
  };

  const chartData = generateChartData();
  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  // Calculate additional stats
  const getWorkoutsByRoutine = () => {
    const routineStats = routines.map(routine => {
      const count = workoutHistory.filter(session =>
        session.routineId === routine.id && session.completed
      ).length;
      return { name: routine.name, count };
    });

    return routineStats.sort((a, b) => b.count - a.count);
  };

  const routineStats = getWorkoutsByRoutine();

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'text-accent';
    if (streak >= 3) return 'text-yellow-500';
    return 'text-white';
  };

  const getRecentWorkouts = () => {
    return workoutHistory
      .filter(session => session.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const recentWorkouts = getRecentWorkouts();

  return (
    <div className="flex flex-col h-full bg-primary-bg">
      {/* Header */}
      <div className="flex items-center bg-primary-bg p-4 pb-2 justify-center border-b border-border-primary">
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          Progress
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Overview Stats */}
        <section className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <p className="text-text-secondary text-sm mb-1">Current Streak</p>
              <p className={`text-2xl font-bold ${getStreakColor(stats.currentStreak)}`}>
                {stats.currentStreak}
              </p>
              <p className="text-text-secondary text-xs">days</p>
            </div>

            <div className="card">
              <p className="text-text-secondary text-sm mb-1">Best Streak</p>
              <p className="text-2xl font-bold text-white">{stats.maxStreak}</p>
              <p className="text-text-secondary text-xs">days</p>
            </div>

            <div className="card">
              <p className="text-text-secondary text-sm mb-1">Total Workouts</p>
              <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
              <p className="text-text-secondary text-xs">completed</p>
            </div>

            <div className="card">
              <p className="text-text-secondary text-sm mb-1">Avg Duration</p>
              <p className="text-2xl font-bold text-white">
                {stats.averageDuration > 0 ? formatDuration(stats.averageDuration) : '0m'}
              </p>
              <p className="text-text-secondary text-xs">per workout</p>
            </div>
          </div>
        </section>

        {/* Workout Frequency Chart */}
        <section className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-bold">Workout Frequency</h3>
            <div className="flex gap-1 bg-secondary-bg rounded-lg p-1">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-accent text-primary-bg'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-end justify-between h-40 gap-2">
              {chartData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="flex-1 flex items-end w-full">
                    <div
                      className="w-full bg-accent rounded-t-sm transition-all duration-500"
                      style={{
                        height: `${(data.value / maxValue) * 100}%`,
                        minHeight: data.value > 0 ? '4px' : '0px',
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-text-secondary text-center">
                    {data.label}
                  </div>
                  <div className="text-xs text-white font-medium">
                    {data.value}
                  </div>
                </div>
              ))}
            </div>

            {chartData.every(d => d.value === 0) && (
              <div className="text-center text-text-secondary py-8">
                <svg className="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V3.5C15 2.7 14.3 2 13.5 2H10.5C9.7 2 9 2.7 9 3.5V5.5L3 7V9H21ZM6 12V20C6 20.6 6.4 21 7 21H9V19H15V21H17C17.6 21 18 20.6 18 20V12L12 10L6 12Z" />
                </svg>
                <p>No workout data for this period</p>
              </div>
            )}
          </div>
        </section>

        {/* Workout Types */}
        <section className="p-4">
          <h3 className="text-white text-lg font-bold mb-4">Workout Types</h3>
          <div className="card">
            {routineStats.length > 0 ? (
              <div className="space-y-3">
                {routineStats.map((routine) => (
                  <div key={routine.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-accent rounded-full" />
                      <span className="text-white font-medium">{routine.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-sm">{routine.count} times</span>
                      <div className="w-16 h-2 bg-border-primary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-500"
                          style={{
                            width: `${(routine.count / Math.max(...routineStats.map(r => r.count), 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-text-secondary py-4">
                <p>No workout data available</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Workouts */}
        <section className="p-4">
          <h3 className="text-white text-lg font-bold mb-4">Recent Workouts</h3>
          <div className="space-y-3">
            {recentWorkouts.length > 0 ? (
              recentWorkouts.map((workout) => {
                const routine = routines.find(r => r.id === workout.routineId);
                const workoutDate = new Date(workout.date);
                const today = new Date();
                const isToday = workoutDate.toDateString() === today.toDateString();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const isYesterday = workoutDate.toDateString() === yesterday.toDateString();

                let dateLabel = workoutDate.toLocaleDateString();
                if (isToday) dateLabel = 'Today';
                else if (isYesterday) dateLabel = 'Yesterday';

                return (
                  <div key={workout.id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-accent rounded-full" />
                        <div>
                          <p className="text-white font-medium">{routine?.name || 'Unknown Workout'}</p>
                          <p className="text-text-secondary text-sm">{dateLabel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm">
                          {workout.duration ? formatDuration(workout.duration) : 'N/A'}
                        </p>
                        <p className="text-text-secondary text-xs">duration</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card text-center">
                <svg className="h-12 w-12 text-text-secondary mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V3.5C15 2.7 14.3 2 13.5 2H10.5C9.7 2 9 2.7 9 3.5V5.5L3 7V9H21ZM6 12V20C6 20.6 6.4 21 7 21H9V19H15V21H17C17.6 21 18 20.6 18 20V12L12 10L6 12Z" />
                </svg>
                <p className="text-text-secondary">No recent workouts</p>
                <p className="text-text-secondary text-sm mt-1">Start your first workout to see progress here</p>
              </div>
            )}
          </div>
        </section>

        {/* Achievements */}
        <section className="p-4">
          <h3 className="text-white text-lg font-bold mb-4">Achievements</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={`card ${stats.totalWorkouts >= 1 ? 'border-accent' : 'border-border-primary'}`}>
              <div className="flex items-center gap-2 mb-2">
                <svg className={`h-5 w-5 ${stats.totalWorkouts >= 1 ? 'text-accent' : 'text-text-secondary'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V3.5C15 2.7 14.3 2 13.5 2H10.5C9.7 2 9 2.7 9 3.5V5.5L3 7V9H21Z" />
                </svg>
                <span className={`text-sm font-medium ${stats.totalWorkouts >= 1 ? 'text-accent' : 'text-text-secondary'}`}>
                  First Workout
                </span>
              </div>
              <p className={`text-xs ${stats.totalWorkouts >= 1 ? 'text-white' : 'text-text-secondary'}`}>
                Complete your first workout session
              </p>
            </div>

            <div className={`card ${stats.currentStreak >= 3 ? 'border-accent' : 'border-border-primary'}`}>
              <div className="flex items-center gap-2 mb-2">
                <svg className={`h-5 w-5 ${stats.currentStreak >= 3 ? 'text-accent' : 'text-text-secondary'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.5 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12.5 2z" />
                </svg>
                <span className={`text-sm font-medium ${stats.currentStreak >= 3 ? 'text-accent' : 'text-text-secondary'}`}>
                  3-Day Streak
                </span>
              </div>
              <p className={`text-xs ${stats.currentStreak >= 3 ? 'text-white' : 'text-text-secondary'}`}>
                Maintain a 3-day workout streak
              </p>
            </div>

            <div className={`card ${stats.totalWorkouts >= 10 ? 'border-accent' : 'border-border-primary'}`}>
              <div className="flex items-center gap-2 mb-2">
                <svg className={`h-5 w-5 ${stats.totalWorkouts >= 10 ? 'text-accent' : 'text-text-secondary'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className={`text-sm font-medium ${stats.totalWorkouts >= 10 ? 'text-accent' : 'text-text-secondary'}`}>
                  10 Workouts
                </span>
              </div>
              <p className={`text-xs ${stats.totalWorkouts >= 10 ? 'text-white' : 'text-text-secondary'}`}>
                Complete 10 total workouts
              </p>
            </div>

            <div className={`card ${stats.currentStreak >= 7 ? 'border-accent' : 'border-border-primary'}`}>
              <div className="flex items-center gap-2 mb-2">
                <svg className={`h-5 w-5 ${stats.currentStreak >= 7 ? 'text-accent' : 'text-text-secondary'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className={`text-sm font-medium ${stats.currentStreak >= 7 ? 'text-accent' : 'text-text-secondary'}`}>
                  Week Warrior
                </span>
              </div>
              <p className={`text-xs ${stats.currentStreak >= 7 ? 'text-white' : 'text-text-secondary'}`}>
                Maintain a 7-day workout streak
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProgressScreen;