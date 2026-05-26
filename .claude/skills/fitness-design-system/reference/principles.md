# Principles

Reverse-engineered from a Mobbin teardown of 11 top fitness apps (Fitbod, WHOOP, Nike Training
Club, Peloton, Gentler Streak, Apple Fitness, Strava, Centr, Ladder, Hevy, Tonal). Full analysis:
`docs/design-research/mobbin-fitness-ux-analysis.json`. Each principle names the token/class/primitive
that encodes it here.

1. **Dark + ONE electric accent.** Near-black surfaces, a single saturated accent. The app's
   `primary-bg #122118` + `accent #38e07b` is the same DNA as Apple Fitness / WHOOP / Ladder.
   → `--color-primary-bg`, `--color-accent`. Don't add a second bright hue for decoration.

2. **Color = meaning, never decoration.** Each color signals state: accent = action/done, warning
   = warmup/caution, danger = destructive, tint = completed. → `--color-warning`, `--color-danger`,
   `--color-accent-tint`, `.set-tile.done`, `.list-row.completed`.

3. **Accent discipline (the cardinal rule).** Reserve accent for: primary action, active nav,
   completed state, progress fill, one hero metric. Everything else = `text-secondary` /
   `text-tertiary` / borders / `surface-raised`. → `.btn-primary`, `.nav-item.active`,
   `.progress-fill`, `.set-tile.done`.

4. **Oversized type for metrics.** Big numbers read at arm's length mid-set and feel like
   achievement. → `text-metric` (timer, completion), `text-metric-sm` (streak).

5. **One unmistakable primary action per screen.** A single filled accent pill; demote the rest to
   `ghost`/`secondary`. → `Button variant="primary"` + the others.

6. **Completion dopamine.** Finishing a set/exercise/workout gets immediate reward. → `.set-tile.done`
   (row → `accent-tint` + check), `CompletionScreen` (confetti + summary). Wire haptics via
   `fitness-haptics-sound`, motion via `fitness-motion`.

7. **Middot metadata row.** Prescriptions as one scannable line: `3 sets · 8–12 reps · 60s rest`.
   → `ListRow.meta`, the `ExerciseAccordion` meta line. Maps 1:1 to `Exercise.sets/reps/restTime`.

8. **Rest timer as a focused moment.** Big countdown + quick presets + adjust. → `ProgressRing`
   inside `Timer`, `SegmentedControl` presets, `round-stepper` ±. (Future: promote to a `vaul`
   sheet — see `fitness-ui-components`.)

9. **Glanceable progress.** Rings + bars + stat grids. → `ProgressRing`, `ProgressBar`,
   `StatTile`. Give each metric its own color rather than making everything accent.

10. **Generous, ergonomic, consistent.** ≥44px tap targets, big consistent radii, iOS safe-area,
    a persistent 3–5 item tab bar (active in accent), hidden during a workout. → `--radius-control`,
    `.safe-bottom`, `.nav-item`, `IconButton` (≥40px), the layout tokens.

## Tone

Mostly hard/athletic (dark, confident type). Borrow Gentler Streak's warmth only in microcopy —
empty states and the completion screen are the place for an encouraging line, not the whole UI.
