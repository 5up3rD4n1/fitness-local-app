import React from 'react';
import { useApp } from '../contexts/AppContext';
import { LocalStorageService } from '../utils/localStorage';
import { IconButton, ProgressRing, RoutineTile } from '../components/ui';
import ActiveWorkoutBanner from '../components/ActiveWorkoutBanner';

const infoIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
  </svg>
);

const gearIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <circle cx="12" cy="12" r="3" />
    <path
      strokeLinecap="round"
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
    />
  </svg>
);

// Spanish day names for greeting
const WEEKDAY_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTH_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const HomeScreen: React.FC = () => {
  const { routines, viewWorkout, currentSession, exercises, navigateTo, currentProgram } = useApp();
  const stats = LocalStorageService.getStats();

  const formatDuration = (ms: number) => `${Math.floor(ms / (1000 * 60))} min`;

  const hasStartedWorkout = Boolean(
    currentSession && !currentSession.completed && currentSession.startedAt
  );

  // Active routine for banner (session belongs to a routine we know)
  const activeRoutineId = hasStartedWorkout ? currentSession!.routineId : null;

  // Determine today's hero routine: active session first, then routine matching today's weekday index, else first routine
  const todayDayIndex = new Date().getDay(); // 0=Sun
  const heroRoutine =
    routines.find((r) => r.id === activeRoutineId) ??
    routines.find((r) => r.day === todayDayIndex) ??
    routines[0] ??
    null;

  // Workout progress for hero ring
  const heroProgress = (() => {
    if (!heroRoutine || !currentSession || currentSession.routineId !== heroRoutine.id) return 0;
    const heroExercises = exercises.filter((e) => heroRoutine.exercises.includes(e.id));
    let total = 0;
    let done = 0;
    heroExercises.forEach((ex) => {
      total += ex.sets || 1;
      done += currentSession.setsProgress.filter(
        (p) => p.exerciseId === ex.id && p.completed
      ).length;
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  })();

  const heroExerciseCount = heroRoutine
    ? exercises.filter((e) => heroRoutine.exercises.includes(e.id)).length
    : 0;

  const isHeroActive = heroRoutine ? heroRoutine.id === activeRoutineId : false;

  // Date heading
  const now = new Date();
  const weekdayName = WEEKDAY_ES[now.getDay()];
  const dateStr = `${now.getDate()} de ${MONTH_ES[now.getMonth()]} · ${now.getFullYear()}`;

  return (
    <div className="flex min-h-full flex-col bg-primary-bg">
      {/* Glass header */}
      <header className="app-header">
        <div className="flex-1">
          <p
            className="font-display text-[22px] font-bold leading-tight tracking-tight text-white capitalize"
            style={{ letterSpacing: '-0.01em' }}
          >
            Hola · {weekdayName}
          </p>
          <p className="mt-0.5 text-caption text-text-secondary">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <IconButton label="Program info" icon={infoIcon} onClick={() => navigateTo('program')} />
          <IconButton label="Settings" icon={gearIcon} onClick={() => navigateTo('settings')} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        <div className="px-[18px] pt-2">
          {/* Program switcher */}
          {currentProgram && (
            <button
              onClick={() => navigateTo('programs')}
              className="mb-3 flex w-full items-center gap-3 rounded-[14px] border border-border-primary bg-secondary-bg px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-micro uppercase tracking-[0.14em] text-text-tertiary">
                  Programa
                </p>
                <p className="truncate font-display text-[14px] font-semibold text-white">
                  {currentProgram.name}
                </p>
              </div>
              <span className="font-display text-[12px] font-semibold text-accent">Cambiar</span>
              <svg
                className="h-4 w-4 shrink-0 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M9 6l6 6-6 6" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {/* Active workout banner — show only when heroRoutine does NOT match the active session */}
          {hasStartedWorkout && heroRoutine && activeRoutineId !== heroRoutine.id && (
            <div className="mb-3">
              <ActiveWorkoutBanner />
            </div>
          )}

          {/* HERO card */}
          {heroRoutine && (
            <div className="hero p-[22px] mb-2">
              {/* top row: text + ring */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p
                    className={`font-display text-[11px] font-semibold tracking-[0.18em] uppercase ${
                      isHeroActive ? 'text-accent' : 'text-text-tertiary'
                    }`}
                  >
                    {isHeroActive ? 'EN CURSO' : 'HOY'}
                  </p>
                  <h2
                    className="font-display text-[26px] font-bold leading-[1.05] mt-2"
                    style={{
                      letterSpacing: '-0.02em',
                      maxWidth: '230px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {heroRoutine.title}
                  </h2>
                  <p className="text-caption text-text-secondary mt-2">
                    {heroExerciseCount} ejercicios · ~60 min
                  </p>
                </div>
                {/* Progress ring */}
                <ProgressRing value={heroProgress} size={78} strokeWidth={7}>
                  <div className="flex flex-col items-center">
                    <span className="font-display text-[18px] font-bold text-white leading-none">
                      {heroProgress}%
                    </span>
                    <span className="text-[9px] font-medium text-text-secondary mt-0.5">listo</span>
                  </div>
                </ProgressRing>
              </div>
              {/* bottom row: CTA + focus */}
              <div className="flex items-end justify-between mt-5">
                <button
                  className="btn-primary inline-flex items-center gap-2"
                  onClick={() => viewWorkout(heroRoutine.id)}
                >
                  {isHeroActive ? 'Continuar' : 'Empezar'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                {heroRoutine.focus && (
                  <span className="text-caption text-text-secondary text-right max-w-[120px] leading-snug">
                    {heroRoutine.focus}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ROUTINES section */}
          <p className="mt-[26px] mb-3 px-1 text-micro uppercase tracking-[0.16em] text-text-tertiary">
            Tus rutinas
          </p>
          <div className="list">
            {routines.map((routine) => {
              const count = exercises.filter((e) => routine.exercises.includes(e.id)).length;
              const isActive =
                !!currentSession &&
                !currentSession.completed &&
                currentSession.routineId === routine.id;
              return (
                <RoutineTile
                  key={routine.id}
                  name={routine.name}
                  meta={`${count} ejercicios`}
                  badge={isActive ? 'En curso' : undefined}
                  onClick={() => viewWorkout(routine.id)}
                />
              );
            })}
          </div>

          {/* PROGRESS section */}
          <p className="mt-[26px] mb-3 px-1 text-micro uppercase tracking-[0.16em] text-text-tertiary">
            Tu progreso
          </p>
          <div className="mb-6 flex overflow-hidden rounded-[16px] border border-border-primary bg-secondary-bg">
            <div className="flex-1 border-r border-border-primary p-4 text-center">
              <div className="font-display text-[24px] font-bold tracking-tight text-accent">
                {stats.currentStreak}
              </div>
              <div className="mt-0.5 text-caption text-text-secondary">Racha</div>
            </div>
            <div className="flex-1 border-r border-border-primary p-4 text-center">
              <div className="font-display text-[24px] font-bold tracking-tight text-white">
                {stats.totalWorkouts}
              </div>
              <div className="mt-0.5 text-caption text-text-secondary">Entrenos</div>
            </div>
            <div className="flex-1 p-4 text-center">
              <div className="font-display text-[24px] font-bold tracking-tight text-white">
                {stats.averageDuration > 0 ? formatDuration(stats.averageDuration) : '0 min'}
              </div>
              <div className="mt-0.5 text-caption text-text-secondary">Media</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
