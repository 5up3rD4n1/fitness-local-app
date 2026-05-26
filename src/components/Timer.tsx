import React, { useState, useEffect, useRef } from 'react';
import { ProgressRing, Button } from './ui';

interface TimerProps {
  initialTime: number; // in seconds
  onComplete?: () => void;
  autoStart?: boolean;
  className?: string;
  showControls?: boolean; // Whether to show pause/reset buttons
}

const Timer: React.FC<TimerProps> = ({
  initialTime,
  onComplete,
  autoStart = false,
  className = '',
  showControls = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update timeLeft when initialTime changes
  useEffect(() => {
    setTimeLeft(initialTime);
    setIsCompleted(false);
  }, [initialTime]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, onComplete]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (isCompleted) {
      setTimeLeft(initialTime);
      setIsCompleted(false);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
    setIsCompleted(false);
  };

  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <ProgressRing value={progress} size={128} strokeWidth={8}>
        <span
          className={`font-display text-2xl font-bold ${isCompleted ? 'text-white' : 'text-white'}`}
        >
          {formatTime(timeLeft)}
        </span>
      </ProgressRing>

      {showControls && (
        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              variant="primary"
              onClick={handleStart}
              icon={
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              }
            >
              {isCompleted ? 'Reiniciar' : 'Iniciar'}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handlePause}
              icon={
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              }
            >
              Pausar
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={handleReset}
            icon={
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
            }
          >
            Reiniciar
          </Button>
        </div>
      )}

      {isCompleted && (
        <div className="text-center">
          <p className="font-display font-semibold text-accent">¡Tiempo!</p>
        </div>
      )}
    </div>
  );
};

export default Timer;
