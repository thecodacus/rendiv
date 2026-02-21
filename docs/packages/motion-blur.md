# @rendiv/motion-blur

Motion blur effects for Rendiv compositions. Two components: `<MotionTrail>` for discrete trails and `<ShutterBlur>` for camera-style blur.

## Installation

```bash
npm install @rendiv/motion-blur @rendiv/core react react-dom
```

## MotionTrail

Renders multiple copies of children at staggered frame offsets with decaying opacity, creating a trailing motion effect.

```tsx
import { MotionTrail } from '@rendiv/motion-blur';

<MotionTrail layers={6} offset={2} fadeRate={0.5}>
  <MovingCircle />
</MotionTrail>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `layers` | `number` | `5` | Number of trail copies |
| `offset` | `number` | `1` | Frame offset between each layer |
| `fadeRate` | `number` | `0.6` | Opacity decay per layer (0-1). Each layer's opacity = `fadeRate^i` |

### How it works

Each layer wraps children in a `TimelineContext.Provider` override with `frame - (i * offset)`, creating copies at past frame positions. Combined with decaying opacity, this produces a motion trail effect.

## ShutterBlur

Simulates camera motion blur by distributing sub-frame samples across the shutter open period.

```tsx
import { ShutterBlur } from '@rendiv/motion-blur';

<ShutterBlur angle={180} layers={10}>
  <SpinningShape />
</ShutterBlur>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `angle` | `number` | `180` | Shutter angle in degrees (0-360). Higher = more blur |
| `layers` | `number` | `10` | Number of sub-frame samples |

### How it works

A shutter angle of 180 means the shutter is open for half the frame duration. The component distributes `layers` samples from `frame - shutterFraction` to `frame`, each rendered at `opacity: 1/layers`. When composited, these samples blend into a smooth blur.
