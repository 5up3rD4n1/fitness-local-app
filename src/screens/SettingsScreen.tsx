import React from 'react';
import { useApp } from '../contexts/AppContext';
import { IconButton, SectionHeading, SegmentedControl, ToggleSwitch } from '../components/ui';

const backIcon = (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
);

const REST_OPTIONS: { value: string; label: string }[] = [
  { value: '30', label: '30s' },
  { value: '60', label: '1min' },
  { value: '90', label: '1.5min' },
  { value: '120', label: '2min' },
];

const EXERCISE_OPTIONS: { value: string; label: string }[] = [
  { value: '20', label: '20s' },
  { value: '30', label: '30s' },
  { value: '45', label: '45s' },
  { value: '60', label: '1min' },
];

const SettingsScreen: React.FC = () => {
  const { navigateTo, settings, updateSettings, currentUser, logout } = useApp();

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="app-header">
        <IconButton label="Back to home" icon={backIcon} onClick={() => navigateTo('home')} />
        <h2 className="flex-1 text-center text-lg font-bold tracking-tight text-white">Settings</h2>
        {/* Spacer to balance header */}
        <div className="h-10 w-10" />
      </header>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Account */}
        <section>
          <SectionHeading>Cuenta</SectionHeading>
          <div className="space-y-3 px-4">
            <div className="card">
              <p className="text-micro uppercase tracking-[0.14em] text-text-tertiary">Usuario</p>
              <p className="mt-0.5 text-body font-medium text-white">
                {currentUser?.username ?? '—'}
              </p>
            </div>
            <button className="btn-ghost w-full" onClick={logout}>
              Cerrar sesión
            </button>
            <p className="px-1 text-micro leading-relaxed text-text-tertiary">
              Para cambiar de usuario, cierra sesión y elige otra cuenta.
            </p>
          </div>
        </section>

        {/* Timers */}
        <section>
          <SectionHeading>Timers</SectionHeading>
          <div className="px-4 space-y-3">
            {/* Default Rest Timer */}
            <div className="card space-y-3">
              <p className="text-body font-medium text-white">Default Rest Timer</p>
              <SegmentedControl
                options={REST_OPTIONS}
                value={String(settings.defaultRestTimer)}
                onChange={(v) => updateSettings({ defaultRestTimer: Number(v) })}
              />
            </div>

            {/* Default Exercise Timer */}
            <div className="card space-y-3">
              <p className="text-body font-medium text-white">Default Exercise Timer</p>
              <SegmentedControl
                options={EXERCISE_OPTIONS}
                value={String(settings.defaultExerciseTimer)}
                onChange={(v) => updateSettings({ defaultExerciseTimer: Number(v) })}
              />
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section>
          <SectionHeading>Feedback</SectionHeading>
          <div className="px-4 space-y-3">
            {/* Sound */}
            <div className="card flex items-center justify-between">
              <p className="text-body font-medium text-white">Sound</p>
              <ToggleSwitch
                checked={settings.soundEnabled}
                onChange={(checked) => updateSettings({ soundEnabled: checked })}
              />
            </div>

            {/* Vibration */}
            <div className="card flex items-center justify-between">
              <p className="text-body font-medium text-white">Vibration</p>
              <ToggleSwitch
                checked={settings.vibrationEnabled}
                onChange={(checked) => updateSettings({ vibrationEnabled: checked })}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsScreen;
