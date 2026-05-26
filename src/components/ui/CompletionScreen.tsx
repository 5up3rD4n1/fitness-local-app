import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import Button from './Button';
import StatTile from './StatTile';

interface CompletionStat {
  label: string;
  value: string;
}

interface CompletionScreenProps {
  routineName: string;
  /** pre-formatted, e.g. "42:07" */
  duration: string;
  stats: CompletionStat[];
  onDone: () => void;
  className?: string;
}

/**
 * Post-workout celebration. Rendered conditionally inside WorkoutScreen on
 * completion (not a separate Screen in the state machine). Fires confetti once.
 */
const CompletionScreen: React.FC<CompletionScreenProps> = ({
  routineName,
  duration,
  stats,
  onDone,
  className = '',
}) => {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.4 },
      colors: ['#5b8cff', '#3d66c8', '#ffffff'],
    });
  }, []);

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-6 px-6 text-center ${className}`}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-tint)]">
        <svg
          className="h-10 w-10 text-[var(--color-accent)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="completion-banner w-full max-w-xs">
        <p className="text-caption uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
          Workout complete
        </p>
        <h1 className="font-display text-h1 mt-1 text-white">{routineName}</h1>
        <p
          className="font-display mt-2 text-[var(--color-accent)]"
          style={{
            fontSize: 'var(--text-metric)',
            lineHeight: 'var(--text-metric--line-height)',
            fontWeight: 'var(--text-metric--font-weight)',
            letterSpacing: 'var(--text-metric--letter-spacing)',
          }}
        >
          {duration}
        </p>
      </div>

      {stats.length > 0 && (
        <div className="grid w-full max-w-xs grid-cols-2 gap-3">
          {stats.map((s) => (
            <StatTile key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      )}

      <Button variant="primary" size="lg" fullWidth className="max-w-xs" onClick={onDone}>
        Back to Home
      </Button>
    </div>
  );
};

export default CompletionScreen;
