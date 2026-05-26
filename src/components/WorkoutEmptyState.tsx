import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui';

interface WorkoutEmptyStateProps {
  /** Optional override; falls back to navigateTo('home') from useApp. */
  onGoHome?: () => void;
}

/**
 * Centered empty state shown when no workout is active or available.
 */
const WorkoutEmptyState: React.FC<WorkoutEmptyStateProps> = ({ onGoHome }) => {
  const { navigateTo } = useApp();

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      navigateTo('home');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-8 text-center">
      {/* Empty-state glyph — neutral, not accent */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border-primary bg-surface-raised text-text-tertiary">
        <svg width="28" height="28" viewBox="0 0 256 256" fill="currentColor">
          <path d="M248,120h-8V88a16,16,0,0,0-16-16H208V64a16,16,0,0,0-16-16H168a16,16,0,0,0-16,16v56H104V64A16,16,0,0,0,88,48H64A16,16,0,0,0,48,64v8H32A16,16,0,0,0,16,88v32H8a8,8,0,0,0,0,16h8v32a16,16,0,0,0,16,16H48v8a16,16,0,0,0,16,16H88a16,16,0,0,0,16-16V136h48v56a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16v-8h16a16,16,0,0,0,16-16V136h8a8,8,0,0,0,0-16Z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-h3 font-bold text-white">Sin entrenamiento activo</h2>
        <p className="text-caption text-text-secondary">
          Inicia un entrenamiento desde la pantalla de inicio
        </p>
      </div>
      <Button variant="primary" onClick={handleGoHome}>
        Ir al inicio
      </Button>
    </div>
  );
};

export default WorkoutEmptyState;
