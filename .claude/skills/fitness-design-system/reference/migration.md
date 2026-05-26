# Migration: off-system → tokens

The initial migration is done (all rows below applied). Use this as the reference whenever new
off-system values creep in.

## Audit command

```bash
grep -rnE "orange-[0-9]|yellow-[0-9]|red-[0-9]|#000000|text-\[#|text-\[[0-9]|bg-opacity|tracking-\[-0\.015em\]" src/
```

Expect zero hits. Intentional one-offs are allowed but must be obvious (e.g. a video play overlay
`bg-black/40` in `VideoPreview` — a transient media scrim, not a surface).

## Mapping applied

| Was                                                                      | Now                                                             |
| ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `bg-orange-500` (Timer pause)                                            | `Button variant="secondary"`                                    |
| `text-red-600` (VideoPreview play + logo)                                | `text-youtube`                                                  |
| `bg-black bg-opacity-70` (VideoPreview close)                            | `bg-scrim`                                                      |
| `bg-black bg-opacity-40/60` (video overlay)                              | `bg-black/40` / `bg-black/60` (intentional media scrim)         |
| `text-yellow-500` (Progress streak 3–6d)                                 | `text-warning`                                                  |
| `text-[#122118]` (Workout finish + FAB text)                             | handled by `.btn-primary` (`color: var(--color-primary-bg)`)    |
| `text-[22px] … tracking-[-0.015em]` (5 section headers)                  | `SectionHeading` / `.section-heading`                           |
| `text-[32px]` (Home streak)                                              | `text-metric-sm`                                                |
| `tracking-[-0.015em]` (screen titles)                                    | `tracking-tight` (Tailwind) or `text-h2/.section-heading`       |
| `tracking-[0.015em]` (nav label)                                         | `text-micro` (bundles +0.015em)                                 |
| `border-accent bg-accent text-primary-bg` (set tile done)                | `.set-tile.done` (tint, not solid)                              |
| `bg-accent bg-opacity-20 border border-accent` (completion)              | `.completion-banner`                                            |
| `bg-black/75` (dialog scrim)                                             | `bg-scrim`                                                      |
| `shadow-xl` (dialog)                                                     | `shadow-dialog`                                                 |
| `text-border-primary` (out-of-month calendar days)                       | `text-text-tertiary`                                            |
| inline `h-2 … bg-border-primary` + `bg-accent` fill (every progress bar) | `.progress-track`/`.progress-fill` or `ProgressBar`             |
| inline `animate-spin … border-t-accent` spinner                          | `.spinner`                                                      |
| `w-10 h-10 rounded-full bg-border-primary` (± steppers)                  | `.round-stepper` / `IconButton variant="round"`                 |
| `#000000` literal (`.btn-primary` text)                                  | `var(--color-primary-bg)`                                       |
| `transition: colors 0.2s` (invalid CSS in `.btn-secondary`, `.nav-item`) | explicit `transition: <prop> var(--duration-*) var(--ease-out)` |

## Known pre-existing issues (out of scope, flag if touched)

- `public/sw.js` / `public/register-sw.js` trip ESLint `no-undef` (`self`/`caches`/`fetch`/
  `window`/`navigator`/`console`) because the flat config defines browser globals only for
  `src/**`. Pre-dates the design system; not fixed here.
- `Routine` has no `category` field — HomeScreen previously rendered `routine.category` (always
  `undefined`); the meta now shows `{n} exercises` instead.
- The Home header settings gear has no handler yet (wire a settings dialog via
  `fitness-ui-components` + `fitness-haptics-sound`).
