import React from 'react';
import { useApp } from '../contexts/AppContext';
import { IconButton } from '../components/ui';

const backIcon = (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
);

const ProgramsScreen: React.FC = () => {
  const { programs, currentProgram, activeProgramId, setActiveProgram, navigateTo } = useApp();

  return (
    <div className="flex min-h-full flex-col">
      <header className="app-header">
        {currentProgram ? (
          <IconButton label="Volver" icon={backIcon} onClick={() => navigateTo('home')} />
        ) : (
          <div className="h-10 w-10" />
        )}
        <h2 className="flex-1 text-center text-lg font-bold tracking-tight text-white">
          Programas
        </h2>
        <div className="h-10 w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2">
        <p className="mb-3 px-1 text-caption text-text-secondary">
          Elige un programa para ver sus rutinas.
        </p>

        <div className="space-y-3">
          {programs.map((program) => {
            const isActive = program.id === activeProgramId;
            const totalExercises = program.exercises.length;
            return (
              <div
                key={program.id}
                className="card"
                style={isActive ? { borderColor: 'var(--color-accent)' } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-h3 font-semibold text-white">
                      {program.name}
                    </h3>
                    <p className="mt-1 text-caption text-text-secondary">
                      {program.routines.length} rutinas · {totalExercises} ejercicios
                    </p>
                  </div>
                  {isActive && (
                    <span className="font-display text-[11px] font-semibold tracking-wide text-accent">
                      Activo
                    </span>
                  )}
                </div>

                <p className="mt-3 line-clamp-3 text-caption leading-relaxed text-text-secondary">
                  {program.description}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    className="btn-primary flex-1"
                    onClick={() => setActiveProgram(program.id)}
                  >
                    {isActive ? 'Continuar' : 'Seleccionar'}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setActiveProgram(program.id);
                      navigateTo('program');
                    }}
                  >
                    Detalles
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgramsScreen;
