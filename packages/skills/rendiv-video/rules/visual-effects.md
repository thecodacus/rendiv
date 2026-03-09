---
name: visual-effects
description: >
  Composable CSS filter effects and visual presets using @rendiv/effects —
  blur, glow, glitch, vignette, chromatic aberration, and more.
---

# Visual Effects

## @rendiv/effects

Apply animated CSS filters to any content. Filters are composable and
frame-driven via `useFrame()`.

```tsx
import { Effect, blur, brightness } from '@rendiv/effects';
import { interpolate, useFrame } from '@rendiv/core';

<Effect filters={[
  blur((frame) => interpolate(frame, [0, 30], [10, 0], { extrapolateRight: 'clamp' })),
  brightness(1.2),
]}>
  <MyContent />
</Effect>
```

## `<Effect>` Component

Wraps children in a `<div>` with a composed CSS `filter` string.

### Props

| Prop | Type | Description |
|---|---|---|
| `filters` | `FilterConfig[]` | Array of filter configs to compose |
| `style` | `CSSProperties` | Additional styles on the wrapper div |
| `className` | `string` | CSS class for the wrapper div |
| `children` | `ReactNode` | Content to apply filters to |

## Filter Factories

Each factory returns a `FilterConfig`. All accept either a static value or
a function `(frame: number) => value` for animation.

| Factory | CSS function | Value type |
|---|---|---|
| `blur(px)` | `blur(Npx)` | `number` — pixels |
| `brightness(n)` | `brightness(N)` | `number` — 1 = normal |
| `contrast(n)` | `contrast(N)` | `number` — 1 = normal |
| `saturate(n)` | `saturate(N)` | `number` — 1 = normal |
| `hueRotate(deg)` | `hue-rotate(Ndeg)` | `number` — degrees |
| `grayscale(n)` | `grayscale(N)` | `number` — 0-1 |
| `sepia(n)` | `sepia(N)` | `number` — 0-1 |
| `invert(n)` | `invert(N)` | `number` — 0-1 |
| `opacity(n)` | `opacity(N)` | `number` — 0-1 |
| `dropShadow(config)` | `drop-shadow(...)` | `{ x, y, blur, color }` — all animatable |

### Static vs animated values

```tsx
// Static: constant filter
blur(5)

// Animated: filter changes per frame
blur((frame) => interpolate(frame, [0, 60], [10, 0], { extrapolateRight: 'clamp' }))

// Animated drop shadow
dropShadow({
  x: 0,
  y: (frame) => interpolate(frame, [0, 30], [0, 10]),
  blur: 8,
  color: '#000000',
})
```

## Filter-Only Presets

These return `FilterConfig[]` and are used directly with `<Effect>`.

### `glowEffect(options?)`

Brightness boost + layered drop shadows for a glow look.

```tsx
import { Effect, glowEffect } from '@rendiv/effects';

<Effect filters={glowEffect({ color: '#f78166', intensity: 1.3, blur: 12 })}>
  <Text />
</Effect>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `color` | `string` | `'#ffffff'` | Glow color |
| `intensity` | `number` | `1.2` | Brightness multiplier |
| `blur` | `number` | `10` | Glow radius in pixels |

### `vintageEffect(options?)`

Sepia + desaturation + slight blur for a vintage film look.

```tsx
<Effect filters={vintageEffect({ intensity: 0.8 })}>
  <Scene />
</Effect>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `intensity` | `number` | `1` | Effect strength (0-1) |

### `nightVisionEffect(options?)`

Green tint + boosted brightness and contrast.

```tsx
<Effect filters={nightVisionEffect({ intensity: 1 })}>
  <Scene />
</Effect>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `intensity` | `number` | `1` | Effect strength |

## Component Presets

These need extra DOM elements (overlays, multiple layers) and export as
standalone components.

### `<VignetteEffect>`

Radial gradient overlay that darkens edges.

```tsx
import { VignetteEffect } from '@rendiv/effects';

<VignetteEffect intensity={0.7}>
  <Scene />
</VignetteEffect>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `intensity` | `number` | `0.6` | Darkness at edges (0-1) |
| `style` | `CSSProperties` | — | Wrapper styles |

### `<GlitchEffect>`

RGB channel splitting with clip-path slicing. Deterministic per frame (safe
for rendering).

```tsx
import { GlitchEffect } from '@rendiv/effects';

<GlitchEffect intensity={0.6} seed={42}>
  <Title />
</GlitchEffect>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `intensity` | `number` | `1` | Glitch strength |
| `seed` | `number` | `42` | Random seed for reproducible glitch pattern |
| `style` | `CSSProperties` | — | Wrapper styles |

**Note:** Renders children 3 times (base + 2 offset layers). Avoid using with
heavy or stateful children.

### `<ChromaEffect>`

Chromatic aberration — RGB channel separation with slight position offsets.

```tsx
import { ChromaEffect } from '@rendiv/effects';

<ChromaEffect shift={4}>
  <Logo />
</ChromaEffect>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `shift` | `number` | `3` | Pixel offset between channels |
| `style` | `CSSProperties` | — | Wrapper styles |

**Note:** Renders children 3 times (R, G, B layers).

## Composing Effects

Combine multiple approaches:

```tsx
import { Effect, blur, brightness, glowEffect, VignetteEffect } from '@rendiv/effects';

// Layer filter-only + component presets
<VignetteEffect intensity={0.5}>
  <Effect filters={[...glowEffect({ color: '#58a6ff' }), blur(0.5)]}>
    <MyScene />
  </Effect>
</VignetteEffect>
```

## Tips

- Filter-only presets compose with spread: `[...glowEffect(), blur(2)]`
- Animated values use `(frame) =>` callbacks — combine with `interpolate` or `spring`
- `<GlitchEffect>` and `<ChromaEffect>` render children multiple times (same pattern
  as `<MotionTrail>` from `@rendiv/motion-blur`)
- All effects are frame-driven and deterministic — safe for headless rendering
