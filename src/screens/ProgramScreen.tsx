import React from 'react';
import { useApp } from '../contexts/AppContext';
import { IconButton, SectionHeading, SafetyCallout, EquipmentTags } from '../components/ui';

const backIcon = (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
);

const ProgramScreen: React.FC = () => {
  const { currentProgram, navigateTo } = useApp();

  return (
    <div className="flex min-h-full flex-col">
      <header className="app-header">
        <IconButton label="Volver" icon={backIcon} onClick={() => navigateTo('programs')} />
        <h2 className="flex-1 text-center text-lg font-bold tracking-tight text-white">
          Información del programa
        </h2>
        <div className="h-10 w-10" />
      </header>

      {!currentProgram ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-caption text-text-secondary">Selecciona un programa primero.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-8">
          <section>
            <SectionHeading>Acerca de</SectionHeading>
            <div className="px-4">
              <div className="card space-y-2">
                <p className="font-display text-h3 font-bold text-white">{currentProgram.name}</p>
                <p className="text-body text-text-secondary">{currentProgram.description}</p>
              </div>
            </div>
          </section>

          <section>
            <SectionHeading>Principios de seguridad</SectionHeading>
            <div className="space-y-3 px-4">
              {currentProgram.safetyPrinciples.map((principle, i) => (
                <SafetyCallout key={i} variant="info" text={principle} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading>Equipamiento</SectionHeading>
            <div className="px-4">
              <EquipmentTags equipment={currentProgram.recommendedEquipment.join(', ')} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ProgramScreen;
