import React, { useState } from 'react';
import { Exercise, RoutineBlock } from '../types';
import { useApp } from '../contexts/AppContext';
import ConfirmDialog from './ConfirmDialog';
import ExerciseDetail from './ExerciseDetail';

type CircuitBlockData = Extract<RoutineBlock, { kind: 'circuit' }>;

interface CircuitBlockProps {
  block: CircuitBlockData;
  members: Exercise[];
  routineId?: string;
  className?: string;
}

const LoopIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M17 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 22l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M9 2h6" strokeLinecap="round" />
  </svg>
);

const ChevronIcon = ({ rotated }: { rotated: boolean }) => (
  <svg
    className={`h-5 w-5 text-text-secondary transition-transform ${rotated ? 'rotate-180' : ''}`}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </svg>
);

/** Meta line for a circuit member: duration or reps, intensity, break. */
const memberMeta = (ex: Exercise): string =>
  [
    ex.durationSeconds ? `${ex.durationSeconds} s` : ex.reps ? `${ex.reps} reps` : null,
    ex.intensity || null,
    ex.restTime ? `${ex.restTime} descanso` : null,
  ]
    .filter(Boolean)
    .join(' · ');

/**
 * A "Circuit Set" block: a labeled group of exercises performed for N rounds with a rest
 * between rounds. Round R maps to setNumber R on every member, so it reuses the existing
 * (exerciseId, setNumber) session-progress model — no new schema.
 */
const CircuitBlock: React.FC<CircuitBlockProps> = ({
  block,
  members,
  routineId,
  className = '',
}) => {
  const { currentSession, startWorkout, completeSet, uncompleteSet, cancelWorkout } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmRound, setConfirmRound] = useState<number | null>(null);

  const isRoundDone = (round: number): boolean =>
    members.length > 0 &&
    members.every((m) =>
      currentSession?.setsProgress.some(
        (p) => p.exerciseId === m.id && p.setNumber === round && p.completed
      )
    );

  const completedRounds = Array.from({ length: block.rounds }, (_, i) => i + 1).filter(
    isRoundDone
  ).length;

  const applyRound = (round: number, done: boolean) => {
    members.forEach((m) => (done ? completeSet(m.id, round) : uncompleteSet(m.id, round)));
  };

  const toggleRound = (round: number) => {
    if (isRoundDone(round)) {
      applyRound(round, false);
      return;
    }
    // A different active workout is running → confirm switch (mirror SetTracker).
    if (
      currentSession &&
      !currentSession.completed &&
      currentSession.startedAt &&
      routineId &&
      currentSession.routineId !== routineId
    ) {
      setConfirmRound(round);
      return;
    }
    // No session, or it belongs to another routine → start one for this routine, then mark.
    if (!currentSession || currentSession.completed || currentSession.routineId !== routineId) {
      if (routineId) {
        startWorkout(routineId);
        setTimeout(() => applyRound(round, true), 50);
      }
      return;
    }
    applyRound(round, true);
  };

  const handleConfirmSwitch = () => {
    if (confirmRound !== null && routineId) {
      const round = confirmRound;
      cancelWorkout();
      setTimeout(() => {
        startWorkout(routineId);
        setTimeout(() => applyRound(round, true), 50);
      }, 50);
    }
    setConfirmRound(null);
  };

  return (
    <div className={`card ${className}`} style={{ borderColor: 'var(--color-border-secondary)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
            Circuito
          </p>
          <h3 className="font-display mt-0.5 text-[16px] font-semibold leading-snug text-white">
            {block.label}
          </h3>
        </div>
        <div className="flex flex-none items-center gap-3 text-text-secondary">
          <span className="flex items-center gap-1.5 text-caption font-medium text-accent">
            <LoopIcon />
            {block.rounds}
          </span>
          <span className="flex items-center gap-1.5 text-caption">
            <ClockIcon />
            {block.restBetweenRounds}
          </span>
        </div>
      </div>

      {/* Members */}
      <div className="mt-3 overflow-hidden rounded-[12px] border border-border-primary">
        {members.map((ex, i) => {
          const open = expandedId === ex.id;
          return (
            <div key={ex.id} className={i > 0 ? 'border-t border-border-primary' : ''}>
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : ex.id)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-border-primary bg-surface-raised font-display text-[12px] font-semibold text-text-secondary">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[14px] font-medium text-white">
                    {ex.name}
                  </span>
                  <span className="mt-0.5 block truncate text-caption text-text-secondary">
                    {memberMeta(ex)}
                  </span>
                </span>
                <ChevronIcon rotated={open} />
              </button>
              {open && (
                <div className="px-3 pb-3">
                  <ExerciseDetail exercise={ex} routineId={routineId} showSetTracker={false} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Round tracker */}
      <div className="mt-4">
        <p className="font-display mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
          Rondas · {completedRounds} / {block.rounds}
        </p>
        <div className="grid grid-cols-4 gap-[9px]">
          {Array.from({ length: block.rounds }, (_, index) => {
            const round = index + 1;
            const done = isRoundDone(round);
            return (
              <button
                key={round}
                onClick={() => toggleRound(round)}
                className={`set-tile w-full ${done ? 'done' : ''}`}
              >
                {done && (
                  <svg
                    className="absolute right-1 top-1 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
                <span>{round}</span>
              </button>
            );
          })}
        </div>
        {completedRounds === block.rounds && (
          <div className="completion-banner mt-3">
            <div className="flex items-center justify-center gap-2 text-white">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span className="font-display font-semibold">¡Circuito completado!</span>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmRound !== null}
        title="Switch Workout?"
        message="Starting a new workout will cancel your current workout. Progress will be lost."
        confirmText="Switch Workout"
        cancelText="Go Back"
        onConfirm={handleConfirmSwitch}
        onCancel={() => setConfirmRound(null)}
      />
    </div>
  );
};

export default CircuitBlock;
