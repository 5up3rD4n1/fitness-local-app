---
name: fitness-design-system
description: >
  The design-system authority for the fitness-local-app. Owns the complete @theme token taxonomy
  in src/styles/index.css (colors, typography scale, radius, shadow, easing, plus plain CSS vars
  for motion timing / z-index / layout), the @layer components + utilities CSS classes, and the
  reusable React primitives in src/components/ui/. Use this skill whenever the user wants to: add
  or change a design token; define, pick, or audit a color; change or check typography; add a
  radius / spacing / shadow value; create or restyle a UI primitive (Button, IconButton,
  ProgressRing, ProgressBar, StatTile, Pill, SegmentedControl, ListRow, SectionHeading,
  CompletionScreen); migrate an off-system hardcoded value (orange-500, text-[22px], #000000,
  bg-opacity-*) onto tokens; enforce accent discipline; or consult the visual rationale behind a
  decision. This skill owns tokens — fitness-ui-components defers here for them. Library
  integration + single-file/offline/safe-area rules: fitness-ui-components. Animation: fitness-motion.
  Haptics/sound: fitness-haptics-sound. The design rationale comes from a Mobbin teardown of 11 top
  fitness apps (docs/design-research/mobbin-fitness-ux-analysis.json) and a live visual style guide
  (docs/design-system/styleguide.html). Triggers: design system, design token, token, theme,
  @theme, color, hex, palette, accent, warning, danger, scrim, surface, typography, type scale,
  font size, font weight, letter spacing, leading, radius, shadow, elevation, z-index, spacing,
  Button, IconButton, ProgressRing, ProgressBar, StatTile, Pill, SegmentedControl, ListRow,
  SectionHeading, CompletionScreen, primitive, ui component, restyle, redesign, visual consistency,
  style guide, migrate, off-system, hardcoded color, dark theme.
---

# Fitness app design system

Single source of visual truth for the fitness-local-app. Born from a Mobbin teardown of 11 top
fitness apps (`docs/design-research/mobbin-fitness-ux-analysis.json`).

**Current visual language: "Refined"** — deep neutral slate + a single electric-blue accent, Space
Grotesk (display) + Lexend (body, offline via Fontsource). Hierarchy comes from **solid surface
elevation** (base → card → raised) + hairline borders + spacing + type — **NOT** gradients, glow, or
glass. There are **none** of those: no gradient fills, no accent glow/drop-shadow, no backdrop-blur,
no decorative accent icon-boxes. Shadows appear **only** on true overlays (dialogs, bottom sheets).
The **canonical references are the built app screens themselves** (every screen in `src/screens/`)
plus `docs/design-system/mockups/home-refined.html`. The older `{home,workout,progress}.html` mockups
are the **rejected** Elevated look — ignore them.

> Why: the gradient/glow/glass "Elevated" pass read as generic "AI slop". Premium here = restraint,
> precise spacing/type, and flat layered surfaces. When in doubt, remove an effect, don't add one.

## Ownership map (stay in your lane)

| Concern                                                                                            | Skill                            |
| -------------------------------------------------------------------------------------------------- | -------------------------------- |
| Tokens, type scale, `@layer` classes, `src/components/ui/*` primitives, accent discipline          | **fitness-design-system** (this) |
| Libraries (vaul/sonner/canvas-confetti/gesture/Radix), single-file build, offline fonts, safe-area | `fitness-ui-components`          |
| Animation & transitions (`motion`/Framer)                                                          | `fitness-motion`                 |
| Haptics & audio feedback                                                                           | `fitness-haptics-sound`          |

**Hard rule:** tokens live in the `@theme` block of `src/styles/index.css`. NEVER edit
`tailwind.config.js` (vestigial v3 file, ignored by Tailwind v4). NEVER reintroduce hardcoded
hex/arbitrary values when a token exists.

## The two rules that matter most

**1. Accent discipline.** `accent #5b8cff` (electric blue) is scarce. Use it ONLY for: the **primary
action** (one per screen), the **active nav tab / segment**, **completed** state (set tiles, exercise
check badge, progress fills, ring strokes), today's date, an "En curso" marker, and toggles that are
on. Everything else uses `text-secondary`, `text-tertiary`, borders, or `surface-raised`. If a screen
looks "all blue", you've overused it. There is **one** accent — do not reach for a second blue
(`accent-2` exists only as a faint chart/edge tint; prefer `accent`).

**2. Surfaces, not effects.** Separate things with **elevation** (`primary-bg` → `secondary-bg` →
`surface-raised`) and **1px hairline borders**, never gradients/glow/glass. Text is **white /
`text-secondary` / `text-tertiary`** — never colored except the scarce accent above. Icons are
**purposeful** (back, chevron, nav, play, info/gear, status) — never a decorative glyph in an
accent-tinted box.

## Refined language — tokens, classes, primitives (current)

- **Palette (solid surface ladder):** `primary-bg #0b0d11` (base) / `secondary-bg #14161b` (cards,
  lists) / `surface-raised #1c1f26` (raised/pressed/sheets); borders `border-primary #23272f` /
  `border-secondary #2f343f`; accent `#5b8cff` + `accent-solid #3b6ef5` (filled-button bg, white
  text) + `accent-tint #1a2335` (completed-set bg); text `#f3f5f8` / `text-secondary #99a0ab` /
  `text-tertiary #5b616c`. Semantic danger/warning unchanged.
- **Fonts (offline, no CDN):** `--font-display: 'Space Grotesk Variable'` (utility `font-display` —
  titles, metrics, ring numbers, buttons), `--font-lexend: 'Lexend Variable'` (body). Imported in
  `src/main.tsx`; Google Fonts `<link>` removed from `index.html`.
- **NO depth tokens.** Gradient/glow/glass tokens were **removed** — do not reintroduce
  `--gradient-*`, `--glow-*`, `--glass-*`, `shadow-card/elevated/glow/fab`. Only `--shadow-dialog`
  and `--shadow-sheet` remain (overlays only). `--radius-card: 1rem`.
- **Classes (all flat):** `.app-aurora` = solid bg; `.app-header` = solid + bottom hairline;
  `.card` / `.stat-tile` / `.hero` / `.tile` = solid `secondary-bg` + 1px border, **no shadow**;
  `.list` (grouped container) + `.list-row` (hairline dividers); `.btn-primary` = solid
  `accent-solid` fill, white text; `.segment.active` / `.nav-item.active` = solid accent;
  `.progress-fill` = solid accent; `.set-tile.done` = `accent-tint` + accent border/text;
  `.section-heading` = small uppercase tertiary label; `.pill-accent` = transparent + accent text.
  `.icon-square` / `.icon-chip` are now neutral, box-less holders — prefer no leading icon at all.
- **Primitives (`src/components/ui/`):** `RoutineTile` is a flat list row (name + meta + chevron, no
  icon); `AreaChart` uses a flat low-opacity accent fill + solid line (no gradient/glow); `ProgressRing`
  has **no** `glow` prop (removed). Plus Button, StatTile, Pill, SegmentedControl, ToggleSwitch, etc.
- **Perf/offline:** no `backdrop-filter`, no large gradients — cheap to paint. All offline-safe (only
  YouTube thumbnails hit the network).

## Token quick reference

Full table + copy-paste block: `reference/tokens.md`. The essentials:

| Group                        | Tokens (utility examples)                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Surfaces                     | `primary-bg` `secondary-bg` `surface-raised` (`bg-*`)                                              |
| Borders                      | `border-primary` `border-secondary`                                                                |
| Accent                       | `accent` · `accent-dim` (hover) · `accent-pressed` · `accent-tint` (done bg)                       |
| Text                         | white · `text-secondary` · `text-tertiary` (disabled/not-started)                                  |
| Semantic                     | `danger` (+`danger-dim`) · `warning` (warmup/mid-streak) · `youtube` (brand) · `scrim`             |
| Type                         | `text-display h1 h2 h3 body caption micro metric metric-sm` (size+leading+weight+tracking bundled) |
| Fonts                        | `font-lexend` (headings) · `font-noto` (body)                                                      |
| Radius                       | `var(--radius-control)` 12px · `var(--radius-sheet)` 16px · `var(--radius-pill)`                   |
| Shadow                       | `shadow-dialog` `shadow-sheet` `shadow-fab`                                                        |
| Easing                       | `ease-out` `ease-spring`                                                                           |
| Plain vars (use via `var()`) | `--duration-fast/base/slow`, `--z-nav/rest-timer/sheet/dialog/toast`, `--layout-*`                 |

Tailwind v4 note: `--color-*`, `--text-*` (+ nested `--text-{n}--line-height/-font-weight/-letter-spacing`),
`--font-*`, `--shadow-*`, `--ease-*` generate utilities. `--radius-*` use custom names (no collision
with Tailwind defaults) — consume via `var()` in `@layer components`. Durations/z-index/layout are
plain `:root` vars (no utility), consumed via `var()`.

## CSS classes (`@layer components`)

Full CSS + when-to-use: `reference/components.md`. Inventory: `.btn-primary` `.btn-secondary`
`.btn-danger` `.btn-ghost` · `.card` `.stat-tile` · `.accordion-item(.active)` · `.nav-item(.active)`
· `.app-header` · `.section-heading` · `.list-row(.completed)` `.icon-square` · `.progress-track`
`.progress-fill(.warning)` · `.segmented` `.segment(.active)` · `.pill(-accent/-muted/-warning/-danger)`
· `.dot(-accent/-muted)` · `.set-tile(.done)` · `.completion-banner` · `.round-stepper` · `.spinner`.
Utilities: `.safe-bottom`.

> Button-on-surface gotcha: `.btn-secondary` is `secondary-bg`, so it disappears on a `secondary-bg`
> card/dialog/nav-strip. On those surfaces use `.btn-ghost` (outline) or a `border-primary` fill.

## Primitives (`src/components/ui/`)

Props + which usages they replace: `reference/components.md`. Pure display, no app-state, no new
npm deps. Import via the barrel: `import { Button, StatTile } from '../components/ui'`.

- `Button` — variant `primary|secondary|danger|ghost`, size `sm|md|lg`, `fullWidth`, `loading`, `icon`.
- `IconButton` — icon-only; **`label` required** (aria). variant `round|square`.
- `ProgressRing` — generalized from Timer's SVG (`r = size/2 − strokeWidth`); `value`, `size`, children.
- `ProgressBar` — `value`, `showLabel`, `color`. `StatTile` — `label`, `value`, `unit`, `valueClassName`.
- `SegmentedControl<T>` — `options`, `value`, `onChange`. `Pill` — `label`, `variant`.
- `ListRow` — `icon`, `title`, `meta` (middot row), `action`, `completed`. `SectionHeading` — `uppercase?`.
- `CompletionScreen` — `routineName`, `duration`, `stats`, `onDone`; fires `canvas-confetti`.

## How to add or change a token

1. Edit the `@theme` block (or the plain `:root` block) in `src/styles/index.css`.
2. Document it in `reference/tokens.md` (name, value, when-to-use).
3. Mirror the value in the `:root` block of `docs/design-system/styleguide.html` (drift guard).
4. `npm run build` and confirm the single-file `dist/index.html` builds; spot-check the utility
   exists if you added a `--color-*` / `--text-*` (used utilities are tree-shaken, so use it once).

## How to migrate an off-system value

Map it to a token (table in `reference/migration.md`), then audit:

```bash
grep -rnE "orange-[0-9]|yellow-[0-9]|red-[0-9]|#000000|text-\[#|text-\[[0-9]|bg-opacity|tracking-\[-0\.015em\]" src/
```

Expect zero hits (intentional one-offs like a video overlay `bg-black/40` are fine — document them).

## Reference files

- `reference/principles.md` — the 10 reverse-engineered principles, each tied to the token/class that encodes it.
- `reference/tokens.md` — every token: value + when-to-use + the copy-paste `@theme` block.
- `reference/components.md` — full `@layer` CSS and every primitive's prop contract + replaced usages.
- `reference/migration.md` — off-system → token table + the audit command.

## After changes

`npm run lint`, `npm run check-format`, `npm run build`. Open `dist/index.html` with no network
(single-file offline check) and open `docs/design-system/styleguide.html` to eyeball the system.
