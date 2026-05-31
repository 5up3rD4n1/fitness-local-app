# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Offline-first React fitness tracker that compiles to a **single HTML file** and persists everything to `localStorage`. No backend, no auth, no network dependency after first load (except YouTube embeds and Google Fonts). Deployed to GitHub Pages and installable as a PWA (iOS home-screen target).

## Tech Stack

- **React 19** + **TypeScript**, **Vite 7**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- `vite-plugin-singlefile` for single-HTML output
- `@radix-ui/react-dialog` (confirm dialogs), `uuid`
- `react-router-dom` is installed **but not used for routing** — see Navigation below

## Commands

```bash
npm run dev            # Vite dev server
npm run build          # Single-file build to dist/
npm run preview        # Serve the production build
npm run lint           # ESLint (flat config, eslint.config.mjs)
npm run format         # Prettier write
npm run check-format   # Prettier check
npm run convert-data   # Regenerate src/data/workoutData.json from the CSV
```

There is **no test runner** configured. Ignore any references to `npm test` — no Vitest/Jest/`test` script exists. Don't invent test commands.

## Architecture

### State: one reducer, one context

All app state lives in a single `useReducer` inside `src/contexts/AppContext.tsx`, exposed via the `useApp()` hook. There is no Redux/Zustand and no per-screen state store.

- The reducer is **not pure**: most cases call `LocalStorageService` to persist as a side effect (e.g. `START_WORKOUT` → `saveCurrentSession`, `COMPLETE_WORKOUT` → `addWorkoutSession`). A separate `useEffect` persists `currentRoutine`/`currentExerciseIndex` to app state. When adding actions, follow this pattern: mutate state **and** write through `LocalStorageService` in the same case.
- On mount, the provider rehydrates `currentSession`, `workoutHistory`, `settings`, and app state from localStorage (behind a 100ms fake loading delay → `LoadingScreen`).

### Navigation: state machine, not a router

`currentScreen` (`'login' | 'home' | 'workout' | 'calendar' | 'progress' | 'programs' | 'program' | 'settings'`) lives in the reducer. `App.tsx` switches on it; `navigateTo(screen)` dispatches `NAVIGATE`. Do not add `react-router` routes — match the existing switch-based pattern.

- **Auth gate:** `App.tsx` renders `LoginScreen` whenever `currentUser` is null (regardless of `currentScreen`); the tab bar + app screens mount only once logged in.
- **Tab bar** (`HIDE_TABBAR` in `App.tsx`) is hidden on `workout`, `programs`, `program`, `settings`.
- After login you land on `programs` (the picker) if there's no active program, else `home`.

### Accounts: local multi-user (NOT real security)

Multiple local accounts live in `localStorage`. `LoginScreen` registers/selects a user; passwords are **salted + SHA-256 hashed via Web Crypto** (offline) — a casual gate only, since localStorage is readable. `crypto`/`TextEncoder`/`Uint8Array` are whitelisted in `eslint.config.mjs` globals. `currentUser` + `activeProgramId` live in the reducer; `login`/`register`/`logout`/`listUsers`/`setActiveProgram` come from `useApp()`. "Switch user" = logout, then pick another account on the login screen.

### Data model: Program → Routine → Exercise (read-only)

Workout content is **static**, loaded from `src/data/workoutData.json` (imported directly), shaped `{ programs: Program[] }`. Users run programs/routines; they cannot create/edit content.

- A **`Program`** bundles its own `routines`, `exercises`, and meta (`id`, `name`, `description`, `safetyPrinciples[]`, `recommendedEquipment[]`). The active program is per-user (`activeProgramId`); `useApp()` exposes the active program's `routines`/`exercises`, plus `programs` (all) and `allRoutines` (flat, for resolving history across programs).
- **IDs are program-prefixed** and globally unique: routine `<programId>-day-<n>`, exercise `<programId>-d<n>-<slug>`. `Routine`/`Exercise`/`WorkoutSession` all carry `programId`.
- A **`Routine` is an ordered `blocks: RoutineBlock[]`** — `{ kind:'single', exerciseId }` or `{ kind:'circuit', id, label, rounds, restBetweenRounds, exerciseIds[] }`. `Routine.exercises: string[]` is kept as a **derived flat projection** of blocks (in order, circuits expanded) so all non-WorkoutScreen consumers (Home counts, Calendar, Progress, `getWorkoutProgress`) keep working unchanged. `WorkoutScreen` renders blocks via `RoutineBlocks` (singles → `ExerciseAccordionItem` grouped by section; circuits → `CircuitBlock`).
- A **circuit** runs its members for N rounds; **members carry `sets = rounds`**, so "round R" == `setNumber R` on every member. The `CircuitBlock` round tracker reuses the existing `(exerciseId, setNumber)` progress model — no new schema. (`RoutineBlocks` falls back to all-single blocks if a stale persisted routine lacks `blocks`.)
- `Exercise.reps`/`restTime` are **strings** (`"8-12"`, `"60s"`); `sets` is a number. Optional `durationSeconds?` (time-based moves) and `intensity?` (display-only, e.g. `"30% 1RM"`) — shown in the meta line; duration feeds the `Timer`.
- Progress is **not** on exercises. `WorkoutSession.setsProgress[]` records completion keyed by `(exerciseId, setNumber)`.
- Types are the source of truth: `src/types/index.ts`.

### Persistence

All localStorage access goes through `src/utils/localStorage.ts` (`LocalStorageService`). Never touch `localStorage` from components. Keys: global `fitness_app_users` / `fitness_app_current_user`; **per-user** data under `fitness_app_u_<userId>_<suffix>` (`workout_history`, `current_session`, `user_settings`, `state`, `active_program`). `getStats()` operates on the current user's history. `checkAndMigrateSchema()` wipes all `fitness_app_*` (clean slate) on a `CURRENT_SCHEMA_VERSION` bump.

### Data pipeline

`npm run convert-data` runs `scripts/convertCSVtoJSON.ts` (via `tsx`): it scans **`docs/programs/*/`** (one folder per program) → writes `src/data/workoutData.json` as `{ programs: [...] }`.

Each program folder contains:

- `program.json` — `{ id, name, description, safetyPrinciples[], recommendedEquipment[] }`
- `routines/*.csv` — one CSV per day; day number from the filename (`... DIA 1 ...` / `DAY 1`). Columns: `name, sets, reps, rest, equipment, description, safety, intensity?`. Section headers (`WARM-UP`/`MAIN`/`CORE`/`CARDIO`/`CONDITIONING`, Spanish equivalents) are col0-only rows. **Circuits:** a `CIRCUIT,rounds=3,rest=90s,label=...` row opens a circuit; `ENDCIRCUIT` (or next section/CIRCUIT/EOF) closes it; member rows in between share the circuit and get `sets=rounds`. A reps cell like `40s`/`30''` → `durationSeconds`.
- `videos.json` — `{ "<localExerciseId>": "<youtubeUrl>" }`, keyed by the **unprefixed** local id (`d<day>-<slug>`); the converter maps it onto the prefixed id. Use **embeddable** videos — verify with oEmbed (`/oembed?url=...` → 200 = embeddable, 404 = removed/embedding-disabled). Top-level `/embed/<id>` always shows "Error 153" (no-referrer artifact) — not a valid test.

**To add a program:** create `docs/programs/<new-id>/` with those three pieces, then `npm run convert-data`. No code changes needed — it appears in the picker automatically.

### Key components

- `Timer.tsx` — self-contained countdown with circular SVG progress and an `onComplete` callback; reused for rest and exercise timers. Default durations come from `settings`.
- `VideoPreview.tsx` — parses a YouTube ID from the exercise URL, shows the thumbnail, and lazy-mounts the iframe only on click.
- `RoutineBlocks.tsx` — walks `routine.blocks`: section-grouped `ExerciseAccordionItem`s for singles, `CircuitBlock` cards for circuits. `CircuitBlock.tsx` — the "Circuit Set" card (label + rounds badge + rest + member list + a round tracker that marks `setNumber=round` across all members).

## Build & Deploy

- `vite.config.ts` sets `base: '/fitness-local-app/'` and inlines all assets, **except** `sw.js`, `register-sw.js`, and `manifest.json`, which stay external in `public/` for the PWA to work.
- CI: `.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on push to `main`.
- **Service-worker caveat**: `register-sw.js` registers `/sw.js` and `sw.js` caches `/` and `/index.html` using **root-absolute paths**, which don't account for the `/fitness-local-app/` Pages subpath. Treat SW caching as approximate; verify on the deployed URL after any path/base change.
- Fonts are **offline via Fontsource** (`@fontsource-variable/space-grotesk` + `lexend`, imported in `src/main.tsx`) — no Google Fonts CDN. `font-display` (Space Grotesk) = titles/metrics/buttons; `font-lexend` = body.

## Conventions

- **Lint**: unused vars/args are allowed only when prefixed with `_` (`argsIgnorePattern: '^_'`) — this is why context method signatures use names like `_routineId`. `@typescript-eslint/no-explicit-any` is a warning; avoid `any`.
- `*.config.*`, `scripts/`, and `dist/` are excluded from linting.
- **Design system** — current visual language is **"Refined"**: flat solid surfaces at distinct elevation levels, hairline borders, NO gradients/glow/glass, color used only for emphasis, text white/secondary/tertiary, purposeful icons (no decorative icon-boxes). Tailwind v4 CSS-first tokens live in the `@theme` block of `src/styles/index.css`. `tailwind.config.js` is **vestigial and ignored**; edit `index.css`. Shared classes (`.card`, `.btn-primary`, `.list`/`.list-row`, `.accordion-item`, `.nav-item`, `.segment`) live under `@layer components`. Authority + rules: the `fitness-design-system` skill.
  - Surfaces: `primary-bg` `#0b0d11` → `secondary-bg` `#14161b` → `surface-raised` `#1c1f26`
  - Borders: `border-primary` `#23272f`, `border-secondary` `#2f343f`
  - Accent (emphasis only): `accent` `#5b8cff`, `accent-solid` `#3b6ef5` (button fill)
  - Text: white / `text-secondary` `#99a0ab` / `text-tertiary` `#5b616c`
- Mobile-first; `index.html` fixes the iOS viewport (`position: fixed`, `viewport-fit=cover`) and the app owns its own scroll container.

## Docs

- `docs/spec.md` — original specification
- `docs/designs/*.html` — static HTML mockups for each screen
- `DEPLOYMENT.md`, `GITHUB-PAGES-SETUP.md`, `README-IPHONE.md` — hosting / iOS install guides
