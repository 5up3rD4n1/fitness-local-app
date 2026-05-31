import React from 'react';
import { Exercise } from '../types';
import VideoPreview from './VideoPreview';
import SetTracker from './SetTracker';
import { SafetyCallout, EquipmentTags } from './ui';

interface ExerciseDetailProps {
  exercise: Exercise;
  routineId?: string;
  /** Hide the per-exercise set grid (circuit members track completion via the round tracker). */
  showSetTracker?: boolean;
}

/**
 * Expanded detail content for an accordion item, in order:
 * (a) Video preview or "No video available" placeholder
 * (b) Equipment tags (omit if empty)
 * (c) "Cómo hacerlo" movement cues block (omit if empty)
 * (d) Safety callout (omit if empty)
 * (e) SetTracker
 *
 * The "Complete Exercise" button lives in ExerciseAccordionItem, not here.
 */
const ExerciseDetail: React.FC<ExerciseDetailProps> = ({
  exercise,
  routineId,
  showSetTracker = true,
}) => {
  return (
    <div className="space-y-4">
      {/* (a) Video */}
      {exercise.videoUrl ? (
        <div className="overflow-hidden rounded-2xl border border-border-primary">
          <VideoPreview videoUrl={exercise.videoUrl} title={exercise.name} />
        </div>
      ) : (
        <div
          className="mb-4 flex items-center justify-center rounded-2xl p-6"
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border-primary)',
          }}
        >
          <p className="text-caption text-text-secondary">No hay video disponible</p>
        </div>
      )}

      {/* (b) Equipment */}
      {exercise.equipment && exercise.equipment.trim() !== '' && (
        <div className="space-y-1">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
            Equipo
          </p>
          <EquipmentTags equipment={exercise.equipment} />
        </div>
      )}

      {/* (c) Cómo hacerlo */}
      {exercise.description && exercise.description.trim() !== '' && (
        <div
          className="rounded-[14px] p-3 space-y-1"
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border-primary)',
          }}
        >
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
            Cómo hacerlo
          </p>
          <p className="text-caption" style={{ color: '#c2cad8', lineHeight: '1.55' }}>
            {exercise.description}
          </p>
        </div>
      )}

      {/* (d) Safety notes */}
      {exercise.safetyNotes && exercise.safetyNotes.trim() !== '' && (
        <SafetyCallout text={exercise.safetyNotes} variant="warning" />
      )}

      {/* (e) Set tracker — omitted for circuit members (round tracker owns completion) */}
      {showSetTracker && <SetTracker exercise={exercise} routineId={routineId} />}
    </div>
  );
};

export default ExerciseDetail;
