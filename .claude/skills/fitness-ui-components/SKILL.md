---
name: fitness-ui-components
description: >
  Integrate libraries and interaction patterns in the fitness-local-app and keep every component
  obeying the single-file + offline PWA rules. Use this whenever the user adds or "levels up" an
  interaction that needs a library — a bottom sheet / drawer (vaul), a toast or notification
  (sonner), a confetti celebration (canvas-confetti), a swipe or drag gesture (@use-gesture/react),
  a modal (Radix dialog) — or an empty/loading/skeleton state, a settings panel, offline font
  inlining (Fontsource), iOS safe-area handling, or "make this screen work offline". Design tokens,
  the @theme block, typography, colors, the @layer component classes, and the src/components/ui
  primitives (Button, ProgressRing, StatTile, SegmentedControl, ListRow, Pill, ProgressBar,
  IconButton, SectionHeading, CompletionScreen) are owned by the fitness-design-system skill —
  defer there for those. Animation: fitness-motion. Haptics/sound: fitness-haptics-sound.
  Triggers: component, build UI, restyle, bottom sheet, drawer, vaul, toast, notification, sonner,
  confetti, celebrate, swipe, drag, gesture, carousel, modal, dialog, settings screen, empty state,
  loading state, skeleton, safe area, offline, fontsource, single-file, PWA, layout.
---

# Fitness app UI kit

Installed and ready: `vaul`, `sonner`, `canvas-confetti` (+types), `@use-gesture/react`,
`@fontsource-variable/lexend`, `@fontsource-variable/noto-sans`. `@radix-ui/react-dialog`
already present. `react-router-dom` was removed — do not reintroduce it.

## Why the constraints below are non-negotiable

This app ships as one HTML file the owners save to their iPhone home screen and open at the
gym — often on flaky or no signal. Anything that reaches the network at runtime (a CDN font,
an external script) works on your dev machine and then silently fails on their phone mid-set.
So "inline everything, assume offline" isn't a style preference; it's the product.

## Hard constraints (read first)

- **Single-file build** (`vite-plugin-singlefile`, `assetsInlineLimit: 100000000`): every asset must inline into one `dist/index.html`. **No runtime CDN / network calls** — they break offline.
- **Offline-first PWA**, localStorage only, no backend, no auth.
- **Mobile-first iOS Safari PWA**: honor `env(safe-area-inset-*)`; touch targets ≥ 44px; viewport is no-zoom + `viewport-fit=cover` (set in `index.html`).
- **Navigation is a `currentScreen` state machine** via `useApp().navigateTo(screen)` in `src/App.tsx`. Add screens to the `Screen` union + the switch, not a router.

## Design tokens & primitives → owned by the `fitness-design-system` skill

The `@theme` block in `src/styles/index.css` (colors, typography, radius, shadow, easing), the
`@layer components` classes (`.btn-*`, `.card`, `.stat-tile`, `.set-tile`, `.progress-*`,
`.segment`, `.pill`, `.list-row`, `.section-heading`, …), and the React primitives in
`src/components/ui/` (`Button`, `ProgressRing`, `StatTile`, `SegmentedControl`, `ListRow`, `Pill`,
`ProgressBar`, `IconButton`, `SectionHeading`, `CompletionScreen`) are **owned by
`fitness-design-system`**. Read that skill for any color / typography / spacing / radius work or
to add a token or primitive. Two rules still apply when you touch styling here: edit
`src/styles/index.css` (never the vestigial `tailwind.config.js`), and compose the existing
primitives / `@layer` classes instead of bespoke inline styles.

## Offline fonts (do this once)

Kill the render-blocking Google Fonts `<link>` in `index.html`. Import Fontsource in
`src/main.tsx` so Vite inlines the woff2:

```ts
import '@fontsource-variable/lexend';
import '@fontsource-variable/noto-sans';
```

Then delete the three Google Fonts `<link>`/`<preconnect>` tags from `index.html`.

## Library cheatsheet

### vaul — bottom sheets (rest timer, settings)

```tsx
import { Drawer } from 'vaul';
<Drawer.Root open={open} onOpenChange={setOpen}>
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 bg-black/60" />
    <Drawer.Content
      className="fixed bottom-0 inset-x-0 rounded-t-2xl bg-secondary-bg
      border-t border-border-secondary p-4 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border-secondary" />
      {/* content */}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>;
```

Use for the rest timer (replaces the absolute-positioned panel in `WorkoutScreen.tsx`) and the settings sheet. Drag-to-dismiss + safe-area handled for you.

### sonner — toasts

Mount once in `src/App.tsx` (portals out of the tree):

```tsx
import { Toaster, toast } from 'sonner';
<Toaster position="top-center" theme="dark" richColors />;
// toast.success('Set complete'); toast('Workout saved');
```

### canvas-confetti — workout completion

```tsx
import confetti from 'canvas-confetti';
confetti({
  particleCount: 120,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#38e07b', '#96c5a9', '#ffffff'],
});
```

Fire in the `COMPLETE_WORKOUT` path. Pure canvas, offline-safe.

### @use-gesture/react — swipe between exercises

```tsx
import { useDrag } from '@use-gesture/react';
const bind = useDrag(({ last, movement: [dx, dy] }) => {
  if (!last) return;
  if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) {
    dx < 0 ? nextExercise() : previousExercise();
  }
});
// spread {...bind()} on the exercise content wrapper
```

The `dx > 2*dy` guard prevents fighting vertical scroll / accordion taps.

### Radix dialog — confirmations + settings

`ConfirmDialog.tsx` already wraps `@radix-ui/react-dialog`. Reuse it; wire the inert gear
button in `HomeScreen.tsx` to open a settings dialog (see `fitness-haptics-sound`).

## Accessibility

Use the `IconButton` primitive (from `fitness-design-system`) for icon-only buttons — its `label`
prop is required and renders as `aria-label`. The workout header back button, calendar month nav,
and rest-timer steppers already use it; keep new icon-only controls on the same primitive.

## Animations

For motion/transitions use the **`fitness-motion`** skill (`motion` v12). For sensory feedback
use **`fitness-haptics-sound`**.

## After changes

Run `npm run build` and open `dist/index.html` with no network to confirm it still works
fully offline as a single file.
