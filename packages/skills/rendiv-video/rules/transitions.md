---
name: transitions
description: >
  Scene transitions using TransitionSeries with timing functions (linear, spring)
  and visual presentations (fade, slide, wipe, flip, clockWipe).
---

# Transitions

The `@rendiv/transitions` package provides overlapping scene transitions via
`TransitionSeries` — a variant of `<Series>` that supports transition elements
between sequences.

```
npm install @rendiv/transitions
```

## `TransitionSeries`

A compound component with three parts:

```tsx
import {
  TransitionSeries,
  linearTiming,
  fade,
} from '@rendiv/transitions';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 15 })}
    presentation={fade()}
  />

  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

### How it works

A `<TransitionSeries.Transition>` causes the previous and next sequences to
overlap by `timing.durationInFrames`. During the overlap:

- The exiting sequence receives CSS from `presentation.style(progress).exiting`
- The entering sequence receives CSS from `presentation.style(progress).entering`
- `progress` goes from 0 (transition start) to 1 (transition end)

## Timing Functions

### `linearTiming`

Linear progression from 0 to 1.

```ts
import { linearTiming } from '@rendiv/transitions';

linearTiming({ durationInFrames: 20 })
```

### `springTiming`

Physics-based spring progression.

```ts
import { springTiming } from '@rendiv/transitions';

springTiming({
  fps: 30,                              // required
  config: { damping: 12, stiffness: 100 }, // optional SpringConfig
  durationInFrames: 25,                  // optional, auto-calculated if omitted
})
```

If `durationInFrames` is omitted, it is calculated via `getSpringDuration()`.

## Presentations

### `fade()`

Cross-fade between scenes.

```ts
import { fade } from '@rendiv/transitions';
// entering: { opacity: progress }
// exiting:  { opacity: 1 - progress }
```

### `slide({ direction? })`

Slide the entering scene in from an edge.

```ts
import { slide } from '@rendiv/transitions';

slide({ direction: 'from-left' })
// Directions: 'from-left' | 'from-right' | 'from-top' | 'from-bottom'
// Default: 'from-right'
```

Uses `translateX` / `translateY` percentage transforms.

### `wipe({ direction? })`

Wipe-reveal the entering scene using CSS `clip-path: inset()`.

```ts
import { wipe } from '@rendiv/transitions';

wipe({ direction: 'from-left' })
// Directions: 'from-left' | 'from-right' | 'from-top' | 'from-bottom'
// Default: 'from-left'
```

### `flip({ direction?, perspective? })`

3D flip transition.

```ts
import { flip } from '@rendiv/transitions';

flip({ direction: 'horizontal', perspective: 1000 })
// Directions: 'horizontal' | 'vertical'. Default: 'horizontal'
// perspective default: 1000
```

First half: exiting scene rotates 0° → 90°. Second half: entering scene rotates
90° → 0°.

### `clockWipe({ segments? })`

Clockwise radial wipe starting from 12 o'clock.

```ts
import { clockWipe } from '@rendiv/transitions';

clockWipe({ segments: 64 })
// segments default: 64 (polygon resolution)
```

Uses `clip-path: polygon()` to sweep a wedge clockwise.

## Full Example

```tsx
import {
  TransitionSeries,
  springTiming,
  slide,
  fade,
  wipe,
} from '@rendiv/transitions';

const { fps } = useCompositionConfig();

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <IntroScene />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    timing={springTiming({ fps, config: { damping: 15 } })}
    presentation={slide({ direction: 'from-right' })}
  />

  <TransitionSeries.Sequence durationInFrames={120}>
    <MainScene />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: 20 })}
    presentation={fade()}
  />

  <TransitionSeries.Sequence durationInFrames={60}>
    <OutroScene />
  </TransitionSeries.Sequence>
</TransitionSeries>
```
