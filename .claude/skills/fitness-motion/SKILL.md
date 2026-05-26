---
name: fitness-motion
description: >
  Add, fix, or polish animations and transitions in the fitness-local-app using `motion`
  (Framer Motion v12, imported from `motion/react`). Use this whenever the user wants the UI
  to feel smoother, more polished, more "native", less janky/abrupt, or "alive" — even if
  they never say the word "animation". Covers screen transitions in src/App.tsx, accordion
  expand/collapse in src/components/ExerciseAccordion.tsx, the rest-timer panel in
  src/screens/WorkoutScreen.tsx, animated stat counters on the Progress screen, and
  press/tap feedback, in this React 19 + Tailwind v4 single-file offline PWA. Triggers:
  animation, animate, transition, motion, framer-motion, AnimatePresence, screen transition,
  accordion animation, slide, fade, spring, animated counter, reduced motion, smooth, polish,
  feel native, less janky, micro-interaction.
---

# Animating the fitness app with `motion`

This is a tracker two people use mid-workout on a phone. Motion isn't decoration here — it
tells the user _what just happened_ (a set logged, a screen changed, the rest timer is
counting). That's why the rules below favor short, physical, interruptible motion over
flashy effects.

`motion` v12 is installed. Import from **`motion/react`** (not `framer-motion`):

```ts
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
```

## Constraints (do not violate)

- **Single-file build**: `motion` inlines fine via `vite-plugin-singlefile`. No runtime CDN — safe offline.
- **Mobile/iOS PWA**: keep durations short (0.2–0.35s) and prefer spring physics; heavy animation drains battery and stutters on iPhone.
- **Animate `transform` and `opacity`, not layout props** (`width`/`height`/`top`/`margin`) — the former are GPU-composited and hit 60fps; the latter trigger reflow and jank. The one sanctioned exception is the accordion `height: auto` below, which `motion` measures and handles.
- **Always honor reduced motion** — some people get motion sick, and iOS exposes the setting. Gate non-essential motion:
  ```tsx
  const reduce = useReducedMotion();
  // transition={reduce ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
  ```

## Known issue this fixes

`ExerciseAccordion.tsx` uses `animate-in slide-in-from-top-2 fade-in` — those are `tailwindcss-animate` classes that are **not installed** and silently no-op. Replace them with `motion`.

## Screen transitions (src/App.tsx)

Navigation is a `currentScreen` state machine, not a router. Wrap the switch output:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentScreen}
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
    className="h-full"
  >
    {renderScreen()}
  </motion.div>
</AnimatePresence>
```

Keep `Navigation` outside the `AnimatePresence` so the bar doesn't re-animate.

## Accordion height (src/components/ExerciseAccordion.tsx)

Replace `{isActive && <div className="... animate-in ...">}` with:

```tsx
<AnimatePresence initial={false}>
  {isActive && (
    <motion.div
      key="content"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      {/* exercise details */}
    </motion.div>
  )}
</AnimatePresence>
```

`overflow-hidden` is required for the height animation to clip cleanly.

## Animated counters (Progress screen stat cards)

```tsx
import { useSpring, useTransform, motion } from 'motion/react';
const v = useSpring(0, { stiffness: 120, damping: 20 });
useEffect(() => {
  v.set(target);
}, [target]);
const rounded = useTransform(v, (n) => Math.round(n));
// <motion.span>{rounded}</motion.span>
```

## Rest-timer panel

Prefer the `vaul` bottom sheet (see the `fitness-ui-components` skill) over a hand-animated panel. If staying with `motion`, slide from the bottom with `initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}`.

## After changes

Run `npm run build` and confirm `dist/index.html` is still a single self-contained file that opens offline.
