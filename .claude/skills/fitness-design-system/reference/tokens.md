# Tokens

> ⚠ **Current language is "Refined" (flat surfaces, NO gradients/glow/glass).** The authoritative
> values live in `src/styles/index.css` (`@theme` + `:root`) — trust that file over the tables below,
> several of which predate the slate+blue swap and the flat refactor. The accurate copy-paste `@theme`
> is at the bottom of this file. Gradient/glow/glass tokens have been **removed**; do not reintroduce
> them. See `SKILL.md` → "Refined language" + "The two rules that matter most".

Source of truth: the `@theme` block + the plain `:root` block in `src/styles/index.css`.

## Color — surfaces (darkest → raised)

| Token                    | Value     | Utility             | When to use                                                                      |
| ------------------------ | --------- | ------------------- | -------------------------------------------------------------------------------- |
| `--color-primary-bg`     | `#122118` | `bg-primary-bg`     | App background; deepest surface; set-tile / button-text on accent                |
| `--color-secondary-bg`   | `#1b3124` | `bg-secondary-bg`   | Cards, panels, raised rows, dialogs                                              |
| `--color-surface-raised` | `#1f3929` | `bg-surface-raised` | 3rd tier: a block sitting **on** a secondary-bg surface (tips card, inner panel) |

## Color — borders

| Token                      | Value     | When to use                                       |
| -------------------------- | --------- | ------------------------------------------------- |
| `--color-border-primary`   | `#264532` | Default borders, inert fills, progress-bar tracks |
| `--color-border-secondary` | `#366348` | Hover borders, "scheduled" dot                    |

## Color — accent (scarce: action / active / done)

| Token                    | Value     | When to use                                                     |
| ------------------------ | --------- | --------------------------------------------------------------- |
| `--color-accent`         | `#38e07b` | Primary action, active nav, completed state, single hero metric |
| `--color-accent-dim`     | `#28b060` | Accent hover on a surface                                       |
| `--color-accent-pressed` | `#20924e` | Accent `:active`                                                |
| `--color-accent-tint`    | `#184028` | Completed set/row background (solid ≈16% accent, OLED-reliable) |

## Color — text

| Token                    | Value     | When to use                                       |
| ------------------------ | --------- | ------------------------------------------------- |
| (white)                  | `#ffffff` | Primary text (use Tailwind `text-white`)          |
| `--color-text-secondary` | `#96c5a9` | Secondary / meta text                             |
| `--color-text-tertiary`  | `#5d7a67` | Disabled, not-started, out-of-month calendar days |

## Color — semantic & brand

| Token                | Value              | When to use                                         |
| -------------------- | ------------------ | --------------------------------------------------- |
| `--color-danger`     | `#e0544a`          | Destructive (cancel/delete), errors                 |
| `--color-danger-dim` | `#b8392f`          | Danger hover/active                                 |
| `--color-warning`    | `#f5a623`          | Warmup, mid streak (3–6 days), caution              |
| `--color-youtube`    | `#ff0000`          | YouTube brand mark ONLY (kept separate from danger) |
| `--color-scrim`      | `rgba(0,0,0,0.75)` | Dialog / overlay scrim (`bg-scrim`)                 |

## Typography

Each `--text-*` bundles size + line-height + weight + letter-spacing via Tailwind v4 nested props,
so one class (e.g. `text-h2`) sets all four.

| Token            | Size | Leading | Weight | Tracking | When to use                             |
| ---------------- | ---- | ------- | ------ | -------- | --------------------------------------- |
| `text-display`   | 36px | 1.1     | 900    | -0.025em | Biggest hero (rare)                     |
| `text-h1`        | 28px | 1.2     | 700    | -0.02em  | Screen hero heading                     |
| `text-h2`        | 22px | 1.25    | 700    | -0.015em | Section heading (`.section-heading`)    |
| `text-h3`        | 18px | 1.3     | 700    | —        | Card / subsection title                 |
| `text-body`      | 16px | 1.5     | 500    | —        | List items, body copy                   |
| `text-caption`   | 14px | 1.4     | 400    | —        | Meta, secondary labels                  |
| `text-micro`     | 12px | 1.3     | 500    | +0.015em | Nav labels, counts, micro-labels        |
| `text-metric`    | 48px | 1.0     | 900    | -0.04em  | Big metric (timer, completion duration) |
| `text-metric-sm` | 32px | 1.0     | 900    | -0.03em  | Secondary big metric (Home streak)      |

Fonts: `--font-lexend` (`font-lexend`, headings/default) · `--font-noto` (`font-noto`, optional body).

## Radius (custom names — consume via `var()`)

| Token              | Value          | When                                                      |
| ------------------ | -------------- | --------------------------------------------------------- |
| `--radius-control` | 0.75rem (12px) | Buttons, cards, set tiles, accordion (= old `rounded-xl`) |
| `--radius-sheet`   | 1rem (16px)    | Bottom sheets, large modals                               |
| `--radius-pill`    | 9999px         | Pills, dots, round steppers, progress tracks              |

In JSX you may also use Tailwind's `rounded-xl` (matches 12px); inside `@layer components` use
`var(--radius-control)`.

## Shadow / easing (utilities)

`shadow-dialog` `0 16px 48px rgba(0,0,0,.6)` · `shadow-sheet` `0 -4px 24px rgba(0,0,0,.4)` ·
`shadow-fab` `0 4px 16px rgba(0,0,0,.4)`. · `ease-out` `cubic-bezier(0,0,.2,1)` · `ease-spring`
`cubic-bezier(.34,1.56,.64,1)`.

## Plain `:root` vars (no utility — use `var()`)

- Motion timing (fitness-motion consumes these): `--duration-fast .15s` `--duration-base .22s` `--duration-slow .35s`.
- Stacking: `--z-nav 10` `--z-rest-timer 20` `--z-sheet 30` `--z-dialog 50` `--z-toast 60`.
- Layout: `--layout-header-h 3.5rem` `--layout-tabbar-h 4rem` `--layout-list-row-h 4.5rem`
  `--layout-content-max 30rem` `--layout-rest-panel-max-h 60vh`.

## Copy-paste `@theme` (current — Refined)

> If this drifts from `src/styles/index.css`, the CSS file wins — update this doc.

```css
@theme {
  /* surfaces (solid ladder; elevation by lightness) */
  --color-primary-bg: #0b0d11;
  --color-secondary-bg: #14161b;
  --color-surface-raised: #1c1f26;
  /* borders */
  --color-border-primary: #23272f;
  --color-border-secondary: #2f343f;
  /* accent (emphasis ONLY) */
  --color-accent: #5b8cff;
  --color-accent-2: #8fb3ff; /* faint chart/edge tint only */
  --color-accent-solid: #3b6ef5; /* filled-button bg, white text */
  --color-accent-tint: #1a2335; /* completed-set bg */
  /* text (neutral hierarchy only) */
  --color-text-primary: #f3f5f8;
  --color-text-secondary: #99a0ab;
  --color-text-tertiary: #5b616c;
  /* semantic / brand */
  --color-danger: #e0544a;
  --color-danger-dim: #b8392f;
  --color-warning: #f5a623;
  --color-youtube: #ff0000;
  --color-scrim: rgba(0, 0, 0, 0.6);
  /* fonts (offline via Fontsource) */
  --font-display: 'Space Grotesk Variable', sans-serif;
  --font-lexend: 'Lexend Variable', sans-serif;
  --font-noto: 'Noto Sans Variable', sans-serif;
  /* type: each --text-* pairs --line-height / --font-weight / --letter-spacing */
  --text-display: 2rem;
  --text-h1: 1.625rem;
  --text-h2: 1.3125rem;
  --text-h3: 1.0625rem;
  --text-body: 0.9375rem;
  --text-caption: 0.8125rem;
  --text-micro: 0.6875rem;
  --text-metric: 2.5rem;
  --text-metric-sm: 1.75rem;
  /* shadow (overlays ONLY — flat surfaces get none) */
  --shadow-dialog: 0 16px 40px -16px rgba(0, 0, 0, 0.7);
  --shadow-sheet: 0 -8px 32px -12px rgba(0, 0, 0, 0.55);
  /* easing */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  /* radius (custom names) */
  --radius-control: 0.75rem;
  --radius-card: 1rem;
  --radius-sheet: 1.25rem;
  --radius-pill: 9999px;
}
:root {
  --duration-fast: 0.15s;
  --duration-base: 0.2s;
  --duration-slow: 0.3s;
  --z-nav: 10;
  --z-rest-timer: 20;
  --z-sheet: 30;
  --z-dialog: 50;
  --z-toast: 60;
  --layout-header-h: 3.5rem;
  --layout-tabbar-h: 4.75rem;
  --layout-list-row-h: 4rem;
  --layout-content-max: 30rem;
  --layout-rest-panel-max-h: 60vh;
}
```
