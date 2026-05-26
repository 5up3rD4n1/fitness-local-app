---
name: fitness-haptics-sound
description: >
  Wire haptic vibration and audio feedback in the fitness-local-app, gated on the existing
  `settings.vibrationEnabled` / `settings.soundEnabled` (both defined but currently never
  read — dead code). Use whenever the user wants the app to buzz, beep, chime, vibrate, give
  a "ding" when the timer ends, confirm a set with feedback, or feel more tactile/responsive
  on the phone — even if they don't name a specific API. Covers the rest/exercise Timer
  (src/components/Timer.tsx) onComplete, set completion in src/components/SetTracker.tsx,
  workout completion in src/screens/WorkoutScreen.tsx, a settings toggle UI, guarded
  navigator.vibrate, and a dependency-free Web Audio beep. Triggers: haptic, haptics, vibrate,
  vibration, buzz, sound, audio, beep, chime, ding, alarm, timer done, timer finished, set
  complete feedback, tactile, navigator.vibrate, AudioContext, soundEnabled, vibrationEnabled.
---

# Haptics + sound feedback

`settings.soundEnabled` and `settings.vibrationEnabled` exist in `UserSettings`
(default `true`) but **no component reads them**. Wire feedback through these flags via
`useApp()` (or pass them as props to keep `Timer` self-contained).

## Critical platform caveat

The deploy target is **iOS Safari** (iPhone "Add to Home Screen"). iOS Safari does **not**
support the Vibration API — `navigator.vibrate` is a no-op there. So:

- **Vibration** works on Android / Chrome / desktop only. Implement it (guarded), but don't rely on it for the iPhone experience.
- **Sound is the reliable cross-platform cue on iPhone.** Make sound the primary feedback.

## Dependency-free helper — create `src/utils/feedback.ts`

```ts
let ctx: AudioContext | null = null;

// iOS requires the AudioContext be created/resumed inside a user gesture
// (e.g. the "Start workout" / "Start timer" tap). Call primeAudio() there once.
export function primeAudio() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
}

export function beep(enabled: boolean, freq = 880, ms = 160) {
  if (!enabled || !ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + ms / 1000);
}

export function buzz(enabled: boolean, pattern: number | number[] = 100) {
  if (!enabled || !('vibrate' in navigator)) return; // no-op on iOS
  navigator.vibrate(pattern);
}
```

## Hook points

- **`primeAudio()`** — call once on the first user gesture that starts activity:
  `beginWorkoutTimer` / the Timer Start button. Without this, iOS produces no sound.
- **Timer `onComplete`** (`src/components/Timer.tsx`): `beep(soundEnabled, 880, 220); buzz(vibrationEnabled, [120, 60, 120]);`
- **Set complete** (`src/components/SetTracker.tsx`, `handleSetToggle` complete branch):
  short `beep(soundEnabled, 660, 90); buzz(vibrationEnabled, 50);`
- **Workout complete** (`src/screens/WorkoutScreen.tsx`, `COMPLETE_WORKOUT` path):
  celebratory `beep(soundEnabled, 1040, 300); buzz(vibrationEnabled, [100,50,100,50,300]);`
  (pair with confetti — see `fitness-ui-components`).

## Settings UI

There is no UI to toggle these flags and the gear button in `HomeScreen.tsx` is inert. Add a
settings dialog (reuse `@radix-ui/react-dialog` via `ConfirmDialog` patterns) with two toggles
calling `updateSettings({ soundEnabled })` / `updateSettings({ vibrationEnabled })`.

## After changes

`npm run build`; confirm sound fires on a real iPhone after the first tap (gesture-gated).
