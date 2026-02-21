---
name: animation
description: >
  Frame-driven animation in rendiv using interpolate, spring, easing curves,
  color blending, and spring duration measurement.
---

# Animation

All animation in rendiv is derived from the current frame number. There are no
imperative keyframes or timeline state machines.

## `interpolate`

Maps a numeric input through a piecewise-linear (or eased) function.

```ts
import { interpolate } from '@rendiv/core';

interpolate(
  input: number,
  inputRange: readonly number[],    // e.g. [0, 30]
  outputRange: readonly number[],   // e.g. [0, 1]
  options?: {
    easing?: (t: number) => number;
    extrapolateLeft?: 'extend' | 'clamp' | 'identity';   // default: 'extend'
    extrapolateRight?: 'extend' | 'clamp' | 'identity';  // default: 'extend'
  }
): number
```

### Constraints

- `inputRange` and `outputRange` MUST have equal length, with at least 2 elements.
- `inputRange` MUST be monotonically non-decreasing.
- Multi-segment interpolation is supported (3+ points).

### Extrapolation modes

| Mode | Behavior when input is outside range |
|---|---|
| `'extend'` | Continues the slope of the nearest segment (default) |
| `'clamp'` | Clamps to the nearest output boundary |
| `'identity'` | Returns the raw input value |

### Examples

```tsx
const frame = useFrame();

// Fade in over 30 frames, stay at full opacity after
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

// Slide from offscreen left to center, then offscreen right
const translateX = interpolate(frame, [0, 30, 60], [-100, 0, 100]);

// Scale down then up (multi-segment)
const scale = interpolate(frame, [0, 15, 30], [1, 0.8, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

## `spring`

Physics-based spring animation using a damped harmonic oscillator.

```ts
import { spring } from '@rendiv/core';

spring({
  frame: number,           // current frame (required)
  fps: number,             // frames per second (required)
  config?: {
    damping?: number,      // default: 10
    mass?: number,         // default: 1
    stiffness?: number,    // default: 100
    clampOvershoot?: boolean, // default: false
  },
  from?: number,           // start value (default: 0)
  to?: number,             // target value (default: 1)
  durationInFrames?: number,
  durationRestThreshold?: number, // default: 0.005
}): number
```

### Usage

```tsx
const frame = useFrame();
const { fps } = useCompositionConfig();

// Basic entrance spring (0 → 1)
const scale = spring({ frame, fps });

// Custom physics
const bounce = spring({
  frame,
  fps,
  config: { damping: 8, stiffness: 200, mass: 0.6 },
});

// Clamp overshoot for smooth scaling
const size = spring({
  frame,
  fps,
  from: 0,
  to: 100,
  config: { damping: 12, stiffness: 150, clampOvershoot: true },
});
```

### Stagger pattern

Delay springs by subtracting from the frame to create staggered entrances:

```tsx
{items.map((item, i) => {
  const delay = i * 3;
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 150, mass: 0.8 },
  });
  return <div key={i} style={{ opacity: s, transform: `scale(${s})` }}>{item}</div>;
})}
```

If `frame < 0` (before the delay), `spring` returns `from`.

## `Easing`

Easing functions for use with `interpolate`:

```ts
import { Easing } from '@rendiv/core';
```

| Function | Description |
|---|---|
| `Easing.linear` | Identity `t => t` |
| `Easing.ease` | CSS `ease` curve |
| `Easing.easeIn` | Accelerate from zero velocity |
| `Easing.easeOut` | Decelerate to zero velocity |
| `Easing.easeInOut` | Accelerate then decelerate |
| `Easing.bezier(x1, y1, x2, y2)` | Custom cubic bezier |
| `Easing.bounce` | Bounce effect |
| `Easing.elastic(bounciness?)` | Elastic overshoot (default bounciness: 1) |
| `Easing.in(fn)` | Apply easing as-is |
| `Easing.out(fn)` | Reverse an easing curve |
| `Easing.inOut(fn)` | Mirror an easing for in-out |

```tsx
const opacity = interpolate(frame, [0, 30], [0, 1], {
  easing: Easing.easeInOut,
  extrapolateRight: 'clamp',
});

const bounce = interpolate(frame, [0, 45], [0, 1], {
  easing: Easing.out(Easing.bounce),
  extrapolateRight: 'clamp',
});
```

## `getSpringDuration`

Calculates how many frames a spring takes to settle.

```ts
import { getSpringDuration } from '@rendiv/core';

const duration = getSpringDuration({
  fps: 30,
  config: { damping: 10, stiffness: 100 },
  threshold: 0.005, // default
});
// Returns a frame number (e.g., 47)
```

Useful for sizing `<Sequence>` or `<Series.Sequence>` durations to match spring animations.

## `blendColors`

Interpolates between CSS colors in RGBA space.

```ts
import { blendColors } from '@rendiv/core';

blendColors(
  value: number,
  inputRange: readonly number[],
  outputRange: readonly string[],   // CSS color strings
  options?: InterpolateOptions
): string  // returns 'rgb(r, g, b)' or 'rgba(r, g, b, a)'
```

### Supported color formats

- Hex: `#fff`, `#ffffff`, `#ffffffaa`
- Functions: `rgb(r, g, b)`, `rgba(r, g, b, a)`
- Named: `black`, `white`, `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`,
  `orange`, `purple`, `pink`, `gray`, `grey`, `transparent`

### Example

```tsx
const frame = useFrame();
const bgColor = blendColors(frame, [0, 60, 120], ['#1a1a2e', '#16213e', '#0f3460']);
return <div style={{ backgroundColor: bgColor, width: '100%', height: '100%' }} />;
```

Same constraints as `interpolate` for input/output ranges.
