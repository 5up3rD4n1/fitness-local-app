import React, { useState, useEffect, useRef } from 'react';

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
  showControls = true
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      <div className="relative">
        <div className="relative h-32 w-32">
          {/* Background circle */}
          <svg className="h-32 w-32 transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-border-primary"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={351.86}
              strokeDashoffset={351.86 - (progress / 100) * 351.86}
              className={`transition-all duration-1000 ${
                isCompleted ? 'text-accent' : 'text-text-secondary'
              }`}
              strokeLinecap="round"
            />
          </svg>
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${
              isCompleted ? 'text-accent' : 'text-white'
            }`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {showControls && (
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-primary-bg font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {isCompleted ? 'Restart' : 'Start'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              Pause
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl bg-secondary-bg px-4 py-2 text-white font-medium hover:bg-opacity-80 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            Reset
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="text-center">
          <p className="text-accent font-medium">Time's up!</p>
        </div>
      )}
    </div>
  );
};

export default Timer;