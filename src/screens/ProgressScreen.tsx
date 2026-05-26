import React, { useState } from 'react';
import { LocalStorageService } from '../utils/localStorage';
import { useApp } from '../contexts/AppContext';
import { SegmentedControl, ProgressBar, ProgressRing, AreaChart } from '../components/ui';

interface ChartData {
  label: string;
  value: number;
  date: Date;
}

const ProgressScreen: React.FC = () => {
  const { routines, allRoutines } = useApp();
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

        const workoutsOnDate = workoutHistory.filter((session) => {
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
        endDate.setDate(endDate.getDate() - i * 7);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);

        const workoutsInWeek = workoutHistory.filter((session) => {
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

        const workoutsInMonth = workoutHistory.filter((session) => {
          const sessionDate = new Date(session.date);
          return (
            sessionDate.getMonth() === date.getMonth() &&
            sessionDate.getFullYear() === date.getFullYear() &&
            session.completed
          );
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

  // Workout types: per-routine completed count, sorted descending
  const getWorkoutsByRoutine = () => {
    const routineStats = routines.map((routine) => {
      const count = workoutHistory.filter(
        (session) => session.routineId === routine.id && session.completed
      ).length;
      return { name: routine.name, count };
    });
    return routineStats.sort((a, b) => b.count - a.count);
  };

  const routineStats = getWorkoutsByRoutine();
  const maxRoutineCount = Math.max(...routineStats.map((r) => r.count), 1);

  // Weekly completion: workouts this week vs target (5 days)
  const getWeeklyWorkouts = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return workoutHistory.filter((s) => {
      const d = new Date(s.date);
      return d >= startOfWeek && s.completed;
    }).length;
  };

  const weeklyTarget = 5;
  const weeklyCount = getWeeklyWorkouts();
  const weeklyPct = Math.min(100, (weeklyCount / weeklyTarget) * 100);

  const avgDurMin = stats.averageDuration > 0 ? Math.floor(stats.averageDuration / (1000 * 60)) : 0;

  // Recent completed workouts (last 5)
  const fmtDur = (ms?: number) => {
    if (!ms) return '—';
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  };
  const dateLabel = (d: Date | string) => {
    const date = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dd = new Date(date);
    dd.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - dd.getTime()) / 86400000);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };
  const recentWorkouts = [...workoutHistory]
    .filter((s) => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const achievements = [
    {
      id: 'first-workout',
      label: 'Primer entreno',
      description: 'Completa tu primera sesión',
      unlocked: stats.totalWorkouts >= 1,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.8 5.7 21l2.3-7.2-6-4.4h7.6z" />
        </svg>
      ),
    },
    {
      id: '3-day-streak',
      label: 'Racha de 3 días',
      description: '3 días seguidos',
      unlocked: stats.currentStreak >= 3,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
        </svg>
      ),
    },
    {
      id: '10-workouts',
      label: '10 entrenos',
      description: 'Completa 10 sesiones',
      unlocked: stats.totalWorkouts >= 10,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2v4M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Z" />
        </svg>
      ),
    },
    {
      id: 'week-warrior',
      label: 'Guerrera semanal',
      description: 'Racha de 7 días',
      unlocked: stats.currentStreak >= 7,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="8" r="6" />
          <path d="M9 14l-1 8 4-2 4 2-1-8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-primary-bg">
      {/* Header */}
      <header className="app-header justify-center">
        <h2
          className="text-white"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem' }}
        >
          Progreso
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Hero stat card */}
        <section className="px-4 pt-4">
          <div
            className="hero flex items-center gap-5 p-5"
            style={{ borderRadius: 'var(--radius-card)' }}
          >
            {/* Progress ring: weekly completion */}
            <ProgressRing value={weeklyPct} size={96} strokeWidth={8}>
              <div className="flex flex-col items-center leading-none">
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {stats.currentStreak}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-lexend)',
                    fontWeight: 500,
                    fontSize: '0.625rem',
                    color: 'var(--color-text-secondary)',
                    marginTop: 2,
                  }}
                >
                  racha
                </span>
              </div>
            </ProgressRing>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: 'var(--font-lexend)',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Esta semana
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.375rem',
                  letterSpacing: '-0.01em',
                  color: 'var(--color-text-primary)',
                  margin: '2px 0 10px',
                }}
              >
                {weeklyCount} de {weeklyTarget} días
              </p>
              {/* Mini stats row */}
              <div className="flex gap-4">
                <div>
                  <span
                    className="block"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '1.125rem',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {stats.totalWorkouts}
                  </span>
                  <span
                    className="block"
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      fontWeight: 500,
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    total
                  </span>
                </div>
                <div>
                  <span
                    className="block text-white"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '1.125rem',
                    }}
                  >
                    {stats.maxStreak}
                  </span>
                  <span
                    className="block"
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      fontWeight: 500,
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    mejor racha
                  </span>
                </div>
                <div>
                  <span
                    className="block"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '1.125rem',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {avgDurMin}
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 500,
                      }}
                    >
                      m
                    </span>
                  </span>
                  <span
                    className="block"
                    style={{
                      fontFamily: 'var(--font-lexend)',
                      fontWeight: 500,
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    media
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workout Frequency */}
        <section className="px-4 pt-1">
          <div className="flex items-center justify-between mt-5 mb-3">
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
              }}
            >
              Frecuencia
            </h3>
            <SegmentedControl
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              options={[
                { value: 'week', label: 'Semana' },
                { value: 'month', label: 'Mes' },
                { value: 'year', label: 'Año' },
              ]}
            />
          </div>

          <div className="card">
            {chartData.every((d) => d.value === 0) ? (
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                <svg className="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V3.5C15 2.7 14.3 2 13.5 2H10.5C9.7 2 9 2.7 9 3.5V5.5L3 7V9H21ZM6 12V20C6 20.6 6.4 21 7 21H9V19H15V21H17C17.6 21 18 20.6 18 20V12L12 10L6 12Z" />
                </svg>
                <p>No hay datos de entreno para este período</p>
              </div>
            ) : (
              <AreaChart
                data={chartData.map((d) => d.value)}
                labels={chartData.map((d) => d.label)}
                height={150}
              />
            )}
          </div>
        </section>

        {/* Workout Types */}
        <section className="px-4">
          <p
            style={{
              fontFamily: 'var(--font-lexend)',
              fontWeight: 600,
              fontSize: '0.75rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              margin: '22px 4px 12px',
            }}
          >
            Tipos de entreno
          </p>
          <div className="card">
            {routineStats.some((r) => r.count > 0) ? (
              <div className="space-y-3">
                {routineStats.map((routine) => (
                  <div key={routine.name} className="flex items-center gap-3">
                    <div className="dot dot-accent flex-shrink-0" />
                    <span
                      className="flex-1 min-w-0 truncate"
                      style={{
                        fontFamily: 'var(--font-lexend)',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {routine.name}
                    </span>
                    <ProgressBar
                      className="w-24 flex-shrink-0"
                      value={(routine.count / maxRoutineCount) * 100}
                    />
                    <span
                      className="flex-shrink-0 text-right"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        width: '1.125rem',
                      }}
                    >
                      {routine.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
                <p>No hay datos disponibles</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent workouts */}
        <section className="px-4">
          <p
            style={{
              fontFamily: 'var(--font-lexend)',
              fontWeight: 600,
              fontSize: '0.75rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              margin: '22px 4px 12px',
            }}
          >
            Entrenos recientes
          </p>
          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.map((w) => {
                const routine = allRoutines.find((r) => r.id === w.routineId);
                return (
                  <div key={w.id} className="card flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="dot dot-accent flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-display truncate text-[0.875rem] font-semibold text-white">
                          {routine?.name || 'Entreno'}
                        </p>
                        <p className="text-micro text-text-secondary">{dateLabel(w.date)}</p>
                      </div>
                    </div>
                    <span className="font-display flex-shrink-0 text-[0.875rem] text-text-secondary">
                      {fmtDur(w.duration)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center text-text-secondary">
              <p>Aún no hay entrenos completados</p>
            </div>
          )}
        </section>

        {/* Achievements */}
        <section className="px-4">
          <p
            style={{
              fontFamily: 'var(--font-lexend)',
              fontWeight: 600,
              fontSize: '0.75rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              margin: '22px 4px 12px',
            }}
          >
            Logros
          </p>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="card"
                style={achievement.unlocked ? { borderColor: 'var(--color-accent)' } : undefined}
              >
                {/* Achievement glyph — accent only when unlocked */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--color-surface-raised)',
                    border: '1px solid var(--color-border-primary)',
                    color: achievement.unlocked
                      ? 'var(--color-accent)'
                      : 'var(--color-text-tertiary)',
                    marginBottom: 10,
                  }}
                >
                  {achievement.icon}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    color: achievement.unlocked
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-secondary)',
                  }}
                >
                  {achievement.label}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-lexend)',
                    fontWeight: 400,
                    fontSize: '0.6875rem',
                    lineHeight: 1.4,
                    color: 'var(--color-text-secondary)',
                    marginTop: 3,
                  }}
                >
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProgressScreen;
