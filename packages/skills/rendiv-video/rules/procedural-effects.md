---
name: procedural-effects
description: >
  Procedural animation with simplex noise (2D/3D/4D) and cinematic motion blur
  using MotionTrail and ShutterBlur components.
---

# Procedural Effects

## @rendiv/noise

Simplex noise for organic, non-repetitive motion.

```ts
import { seed, noise2D, noise3D, noise4D } from '@rendiv/noise';
```

### API

| Function | Returns | Description |
|---|---|---|
| `seed(value)` | `void` | Seeds the permutation table (call before noise functions for reproducible results) |
| `noise2D(x, y)` | `number` in [-1, 1] | 2D simplex noise |
| `noise3D(x, y, z)` | `number` in [-1, 1] | 3D simplex noise |
| `noise4D(x, y, z, w)` | `number` in [-1, 1] | 4D simplex noise |

Default seed (0) is applied at import time.

### Common patterns

#### Organic drift

```tsx
import { noise2D, seed } from '@rendiv/noise';

seed(42);

const frame = useFrame();
const driftX = noise2D(0, frame * 0.02) * 60;   // ±60px horizontal drift
const driftY = noise2D(100, frame * 0.02) * 40;  // ±40px vertical drift

<div style={{ transform: `translate(${driftX}px, ${driftY}px)` }}>
  <Logo />
</div>
```

Use different first arguments (0, 100) to get independent noise channels.

#### Noise grid

```tsx
import { noise3D, seed } from '@rendiv/noise';

seed(7);

{grid.map((_, i) => {
  const col = i % cols;
  const row = Math.floor(i / cols);
  const n = noise3D(col * 0.15, row * 0.15, frame * 0.025);
  const brightness = interpolate(n, [-1, 1], [0.2, 1]);

  return (
    <div
      key={i}
      style={{
        opacity: brightness,
        width: cellSize,
        height: cellSize,
        backgroundColor: 'white',
      }}
    />
  );
})}
```

#### Frequency and amplitude

- **Frequency** = how fast the noise changes. Multiply the input: `frame * 0.01` (slow)
  vs `frame * 0.1` (fast).
- **Amplitude** = how far the output moves. Multiply the result: `noise2D(...) * 100`.

## @rendiv/motion-blur

Simulates motion blur by compositing multiple copies of children at slightly
different frames.

### `<MotionTrail>`

Renders layered copies at progressively earlier frames.

```tsx
import { MotionTrail } from '@rendiv/motion-blur';

<MotionTrail layers={8} offset={1} fadeRate={0.55}>
  <MovingObject />
</MotionTrail>
```

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `layers` | `number` | `5` | Number of trail copies |
| `offset` | `number` | `1` | Frame offset between each layer |
| `fadeRate` | `number` | `0.6` | Opacity multiplier per layer (layer `i` has opacity `fadeRate^i`) |

#### How it works

- Renders `layers` copies of children
- Each layer overrides `TimelineContext.frame` to `currentFrame - (layerIndex * offset)`
- Oldest copy (most faded) is at the bottom, newest (full opacity) on top
- All layers are absolutely positioned within a relative container

### `<ShutterBlur>`

Simulates cinematic motion blur by averaging sub-frame samples.

```tsx
import { ShutterBlur } from '@rendiv/motion-blur';

<ShutterBlur angle={180} layers={10}>
  <SpinningWheel />
</ShutterBlur>
```

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `angle` | `number` | `180` | Shutter angle in degrees (0–360). 180 = half-frame exposure |
| `layers` | `number` | `10` | Number of sub-frame samples |

#### How it works

- Each layer has opacity `1 / layers`
- Samples are distributed evenly from `frame - shutterFraction` to `frame`
  where `shutterFraction = angle / 360`
- A 180° shutter angle (cinema standard) samples the previous half-frame
- Higher `layers` = smoother blur but more rendering work

### When to use which

| Component | Best for |
|---|---|
| `MotionTrail` | Stylistic afterimage trails, speed lines, ghosting effects |
| `ShutterBlur` | Realistic cinematic motion blur on fast-moving objects |
