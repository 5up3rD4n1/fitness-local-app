import React, { useState } from 'react';
import { Drawer } from 'vaul';
import Timer from './Timer';
import { Button, IconButton, SegmentedControl } from './ui';

interface RestTimerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRestTime: number;
}

const PRESET_OPTIONS = [
  { value: '30', label: '30s' },
  { value: '60', label: '1min' },
  { value: '90', label: '1.5min' },
  { value: '120', label: '2min' },
  { value: '300', label: '5min' },
];

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const CloseIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const MinusIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 13H5v-2h14v2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

/**
 * Vaul bottom-sheet rest timer.
 * Allows preset selection and ±10s fine-tuning; re-mounts Timer via timerKey
 * whenever the duration changes.
 */
const RestTimerSheet: React.FC<RestTimerSheetProps> = ({ isOpen, onClose, defaultRestTime }) => {
  const [restTime, setRestTime] = useState(defaultRestTime);
  const [timerKey, setTimerKey] = useState(0);

  const handlePresetChange = (value: string) => {
    setRestTime(Number(value));
    setTimerKey((k) => k + 1);
  };

  const handleDecrement = () => {
    setRestTime((t) => Math.max(10, t - 10));
    setTimerKey((k) => k + 1);
  };

  const handleIncrement = () => {
    setRestTime((t) => t + 10);
    setTimerKey((k) => k + 1);
  };

  // Find closest preset value for SegmentedControl — falls back to first preset
  const activePreset = PRESET_OPTIONS.find((o) => Number(o.value) === restTime)?.value ?? '';

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-scrim" />
        <Drawer.Content
          className="safe-bottom fixed bottom-0 inset-x-0 border-t border-border-primary focus:outline-none"
          style={{
            borderTopLeftRadius: 'var(--radius-sheet)',
            borderTopRightRadius: 'var(--radius-sheet)',
            zIndex: 'var(--z-rest-timer)',
            background: 'var(--color-surface-raised)',
            boxShadow: 'var(--shadow-sheet)',
          }}
        >
          {/* Drag handle */}
          <div className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-border-primary" />

          <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-h3 font-bold text-white">Descanso</h3>
              <IconButton icon={<CloseIcon />} label="Close rest timer" onClick={onClose} />
            </div>

            {/* Preset segmented control */}
            <SegmentedControl
              value={activePreset}
              onChange={handlePresetChange}
              options={PRESET_OPTIONS}
              className="mb-6"
            />

            {/* Fine-tune row — .round-stepper buttons */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={handleDecrement}
                aria-label="Decrease 10 seconds"
                className="round-stepper"
              >
                <MinusIcon />
              </button>
              <span className="font-display text-h1 font-bold text-white min-w-[5rem] text-center">
                {formatTime(restTime)}
              </span>
              <button
                onClick={handleIncrement}
                aria-label="Increase 10 seconds"
                className="round-stepper"
              >
                <PlusIcon />
              </button>
            </div>

            {/* Timer ring */}
            <div className="flex justify-center mb-6">
              <Timer
                key={timerKey}
                initialTime={restTime}
                autoStart
                onComplete={onClose}
                showControls={false}
              />
            </div>

            {/* Skip button */}
            <Button variant="primary" fullWidth onClick={onClose}>
              Saltar descanso
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default RestTimerSheet;
