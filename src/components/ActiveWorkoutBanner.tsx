import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui';

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Shows a card with the active routine name, "In Progress" pill, elapsed time,
 * and a Continue button. Renders null when there is no active (non-completed,
 * timer-started) session.
 */
const ActiveWorkoutBanner: React.FC = () => {
  const { currentSession, allRoutines, navigateTo } = useApp();
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!currentSession || currentSession.completed || !currentSession.startedAt) {
      setElapsed(0);
      return;
    }

    const startedAt =
      typeof currentSession.startedAt === 'string'
        ? new Date(currentSession.startedAt).getTime()
        : new Date(currentSession.startedAt).getTime();

    const tick = () => setElapsed(Date.now() - startedAt);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentSession]);

  if (!currentSession || currentSession.completed || !currentSession.startedAt) {
    return null;
  }

  const routine = allRoutines.find((r) => r.id === currentSession.routineId);

  return (
    <div
      className="card flex items-center justify-between gap-3"
      style={{ borderColor: 'var(--color-accent)' }}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="pill pill-accent">EN CURSO</span>
          <span className="font-display text-[14px] font-semibold text-white truncate">
            {routine?.title ?? routine?.name ?? 'Workout'}
          </span>
        </div>
        <p className="text-micro text-text-secondary">{formatElapsed(elapsed)} transcurrido</p>
      </div>
      <Button variant="primary" size="sm" onClick={() => navigateTo('workout')}>
        Continuar
      </Button>
    </div>
  );
};

export default ActiveWorkoutBanner;
