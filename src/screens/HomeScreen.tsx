import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LocalStorageService } from '../utils/localStorage';

const HomeScreen: React.FC = () => {
  const { routines, startWorkout, currentSession, exercises, navigateTo } = useApp();
  const [currentDate] = useState(new Date());

  const stats = LocalStorageService.getStats();

  // Get today's routine (simple rotation based on day of week)
  const getDayOfWeekRoutine = () => {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const routineIndex = dayOfWeek % routines.length;
    return routines[routineIndex];
  };

  const todaysRoutine = getDayOfWeekRoutine();

  // Get upcoming sessions (next 2-3 days)
  const getUpcomingSessions = () => {
    const upcoming = [];
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + i);
      const dayOfWeek = futureDate.getDay();
      const routineIndex = dayOfWeek % routines.length;
      const routine = routines[routineIndex];

      upcoming.push({
        date: futureDate,
        routine,
        time: '9:00 AM', // Default time
      });
    }
    return upcoming;
  };

  const upcomingSessions = getUpcomingSessions();

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    return `${minutes} min`;
  };

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return `${days[date.getDay()]}, ${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="flex flex-col min-h-full bg-primary-bg">
      {/* Header */}
      <div className="flex items-center bg-primary-bg p-4 pb-2 justify-between">
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pl-12">
          Home
        </h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 256 256">
              <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Current Workout - if active */}
        {currentSession && (
          <section>
            <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Active Workout
            </h2>
            <div className="px-4 pb-4">
              <div className="rounded-xl bg-accent bg-opacity-20 border border-accent p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-accent font-bold text-lg">
                      {routines.find(r => r.id === currentSession.routineId)?.name}
                    </p>
                    <p className="text-text-secondary text-sm">Workout in progress</p>
                  </div>
                  <button
                    onClick={() => navigateTo('workout')}
                    className="px-4 py-2 rounded-xl bg-accent text-primary-bg font-medium hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* All Workouts */}
        <section>
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
            All Workouts
          </h2>
          {routines.map((routine) => {
            const exerciseCount = exercises.filter(e => routine.exercises.includes(e.id)).length;
            return (
              <div key={routine.id} className="flex items-center gap-4 bg-primary-bg px-4 min-h-[72px] py-2 border-b border-border-primary hover:bg-secondary-bg transition-colors">
                <div className="text-white flex items-center justify-center rounded-lg bg-border-primary shrink-0 size-12">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M248,120h-8V88a16,16,0,0,0-16-16H208V64a16,16,0,0,0-16-16H168a16,16,0,0,0-16,16v56H104V64A16,16,0,0,0,88,48H64A16,16,0,0,0,48,64v8H32A16,16,0,0,0,16,88v32H8a8,8,0,0,0,0,16h8v32a16,16,0,0,0,16,16H48v8a16,16,0,0,0,16,16H88a16,16,0,0,0,16-16V136h48v56a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16v-8h16a16,16,0,0,0,16-16V136h8a8,8,0,0,0,0-16ZM32,168V88H48v80Zm56,24H64V64H88V192Zm104,0H168V64h24V175.82c0,.06,0,.12,0,.18s0,.12,0,.18V192Zm32-24H208V88h16Z" />
                  </svg>
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <p className="text-white text-base font-medium leading-normal truncate">
                    {routine.name}
                  </p>
                  <p className="text-text-secondary text-sm font-normal leading-normal">
                    {routine.category} · {exerciseCount} exercises
                  </p>
                </div>
                <button
                  onClick={() => startWorkout(routine.id)}
                  className="px-4 py-2 rounded-xl bg-border-primary text-white text-sm font-medium hover:bg-border-secondary transition-colors shrink-0"
                >
                  Start
                </button>
              </div>
            );
          })}
        </section>

        {/* Progress Tracker */}
        <section>
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
            Progress Tracker
          </h2>
          <div className="flex flex-wrap gap-4 px-4 py-6">
            <div className="flex min-w-72 flex-1 flex-col gap-2">
              <p className="text-white text-base font-medium leading-normal">Workout Streak</p>
              <p className="text-white tracking-light text-[32px] font-bold leading-tight truncate">
                {stats.currentStreak} days
              </p>
              <div className="flex gap-1">
                <p className="text-text-secondary text-base font-normal leading-normal">
                  Total Workouts: {stats.totalWorkouts}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="card">
                  <p className="text-text-secondary text-sm">Best Streak</p>
                  <p className="text-white text-xl font-bold">{stats.maxStreak} days</p>
                </div>
                <div className="card">
                  <p className="text-text-secondary text-sm">Avg Duration</p>
                  <p className="text-white text-xl font-bold">
                    {stats.averageDuration > 0 ? formatDuration(stats.averageDuration) : '0 min'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomeScreen;