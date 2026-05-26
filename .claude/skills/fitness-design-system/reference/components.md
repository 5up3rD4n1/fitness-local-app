# Components: `@layer` classes + `src/components/ui/` primitives

> ⚠ **"Refined" update (supersedes Elevated):** every class is now **flat** — solid `secondary-bg`
>
> - 1px border, **no** gradient/glow/glass/shadow (shadows only on dialogs/sheets). `.card`
>   `.stat-tile` `.hero` `.tile` are plain surfaces; `.app-header`/`.nav` are solid; `.list` +
>   `.list-row` form a grouped hairline-divided list; `.icon-chip`/`.icon-square` are neutral box-less
>   holders (prefer no leading icon). `RoutineTile` is a flat list row (no icon prop); `AreaChart` uses
>   a flat fill + solid line; **`ProgressRing` no longer has a `glow` prop.** `.btn-primary` =
>   solid `accent-solid` fill. The table below still says "accent fill / gradient" in places — read it
>   as **solid** accent, never a gradient. Canonical look = the built `src/screens/*`; ignore the old
>   `docs/design-system/mockups/{home,workout,progress}.html` (rejected Elevated).

Authoritative CSS is in `src/styles/index.css`. This documents intent + the primitive contracts.

## `@layer components` classes

| Class                                            | Purpose / key properties                                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `.btn-primary`                                   | Accent fill, `primary-bg` text, `radius-control`, weight 700; `:hover` opacity .9, `:active` `accent-pressed`. The one prominent action.       |
| `.btn-secondary`                                 | `secondary-bg` fill, white text; hover → `surface-raised`. **Blends on a `secondary-bg` surface** — don't use it there.                        |
| `.btn-danger`                                    | `danger` fill; hover/active `danger-dim`. Destructive.                                                                                         |
| `.btn-ghost`                                     | Transparent + `border-primary`, `text-secondary`; hover white + `border-secondary`. Demoted / on-surface secondary action.                     |
| `.card`                                          | `secondary-bg`, `radius-control`, 1px `border-primary`, `p-4`. Generic content block.                                                          |
| `.stat-tile`                                     | Like card but flex-column gap for a label+value metric.                                                                                        |
| `.accordion-item(.active)`                       | Collapsed = `primary-bg`/`border-secondary`; active = `secondary-bg`/`border-accent`.                                                          |
| `.nav-item(.active)`                             | Bottom-tab item; active white, inactive `text-secondary`.                                                                                      |
| `.app-header`                                    | The repeated top bar: `primary-bg`, `space-between`, `min-h var(--layout-header-h)`, bottom border. Add `justify-center` for a centered title. |
| `.section-heading`                               | `text-h2` values + `px-4 pt-5 pb-3`. Use the `SectionHeading` primitive.                                                                       |
| `.list-row(.completed)`                          | Icon-square + title + meta + action row; `min-h var(--layout-list-row-h)`; `.completed` → `accent-tint`.                                       |
| `.icon-square`                                   | 48px rounded square, `border-primary` bg — the leading glyph in a list row.                                                                    |
| `.progress-track` / `.progress-fill(.warning)`   | 8px pill track + accent (or warning) fill with animated width.                                                                                 |
| `.segmented` / `.segment(.active)`               | Period/mode switch; active segment = accent fill.                                                                                              |
| `.pill` + `.pill-accent/-muted/-warning/-danger` | Small status tag.                                                                                                                              |
| `.dot` + `.dot-accent/-muted`                    | 6px indicator (calendar, legends).                                                                                                             |
| `.set-tile(.done)`                               | 64px set checkbox; `.done` = `accent-tint` bg + accent border/text (tint, NOT solid fill).                                                     |
| `.completion-banner`                             | `accent-tint` bg + accent border; "exercise complete" callout.                                                                                 |
| `.round-stepper`                                 | 40px circular `border-primary` button (± controls).                                                                                            |
| `.spinner`                                       | 4px ring, `border-primary` + accent top, spins.                                                                                                |

`@layer utilities`: `.safe-bottom` (`padding-bottom: env(safe-area-inset-bottom)`), custom scrollbar.

### Surface/contrast cheat-sheet

- Button on `primary-bg` → `btn-secondary` reads fine.
- Button on `secondary-bg` (card, dialog, nav strip) → use `btn-ghost` (outline) or a `border-primary` fill; `btn-secondary` disappears.
- A block on a `secondary-bg` surface → `bg-surface-raised` to separate it (e.g. accordion tips).

## Primitives (`src/components/ui/`)

Pure, state-agnostic, no new deps. Barrel: `import { … } from '../components/ui'`. Domain components
(`Timer`, `ExerciseAccordion`, `SetTracker`, `Navigation`, `VideoPreview`, `ConfirmDialog`,
`LoadingScreen`) stay in `src/components/` and consume these.

```ts
// Button
{ variant?: 'primary'|'secondary'|'danger'|'ghost'; size?: 'sm'|'md'|'lg';
  fullWidth?: boolean; loading?: boolean; icon?: ReactNode } & button attrs
// IconButton  (label REQUIRED → aria-label)
{ icon: ReactNode; label: string; variant?: 'round'|'square'; size?: 'sm'|'md' } & button attrs
// ProgressRing  (generalized Timer SVG: r = size/2 − strokeWidth)
{ value: number; size?=128; strokeWidth?=8; trackColor?; fillColor?; children?; animate?=true }
// ProgressBar
{ value: number; showLabel?: boolean; color?: 'accent'|'warning' }
// StatTile
{ label: string; value: string|number; unit?: string; valueClassName?: string }
// SegmentedControl<T extends string>
{ options: {value:T,label:string}[]; value: T; onChange: (v:T)=>void }
// Pill
{ label: string; variant?: 'accent'|'muted'|'warning'|'danger' }
// ListRow
{ icon?; title: string; meta?: string; action?; onClick?; completed?: boolean }
// SectionHeading
{ children; uppercase?: boolean }
// CompletionScreen  (fires canvas-confetti on mount)
{ routineName: string; duration: string; stats: {label,value}[]; onDone: ()=>void }
```

### Where each primitive replaced inline code (adoption map)

| Primitive          | Adopted in                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `Button`           | Timer controls, ConfirmDialog, HomeScreen, WorkoutScreen, CalendarScreen, ExerciseAccordion      |
| `IconButton`       | WorkoutScreen back, CalendarScreen month nav, rest-timer ± / close                               |
| `ProgressRing`     | `Timer` (countdown ring)                                                                         |
| `ProgressBar`      | SetTracker, WorkoutScreen progress, ExerciseAccordion collapsed bar, ProgressScreen routine bars |
| `StatTile`         | HomeScreen + ProgressScreen stat grids                                                           |
| `SegmentedControl` | ProgressScreen period switch, WorkoutScreen rest presets                                         |
| `ListRow`          | HomeScreen routine list                                                                          |
| `SectionHeading`   | HomeScreen section titles                                                                        |
| `CompletionScreen` | WorkoutScreen finish flow (shown before `completeWorkout()` saves + navigates home)              |

### Notes / gotchas

- `Button`/`IconButton` extend `React.ComponentPropsWithoutRef<'button'>` — NOT
  `ButtonHTMLAttributes<HTMLButtonElement>` (the ESLint `no-undef` rule has no DOM globals and
  flags the bare `HTMLButtonElement` type name).
- `ProgressRing` sets stroke via `style={{ stroke }}` (CSS property) so `var()` colors resolve —
  SVG presentation attributes don't resolve `var()`.
- `CompletionScreen` is NOT a `Screen` in the state machine; `WorkoutScreen` renders it conditionally
  and only calls `completeWorkout()` from its `onDone`.
