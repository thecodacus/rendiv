# Animation

## interpolate

Maps a frame value from one range to another. The core building block for all animation.

```ts
import { interpolate } from '@rendiv/core';

const opacity = interpolate(frame, [0, 30], [0, 1]);
const x = interpolate(frame, [0, 60], [-100, 500]);
```

### Extrapolation

By default, values extend beyond the input range. Clamp to stop at boundaries:

```ts
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

### Multiple segments

```ts
const scale = interpolate(frame, [0, 30, 60], [0, 1.2, 1]);
// 0→30: scale from 0 to 1.2
// 30→60: scale from 1.2 to 1
```

## spring

Physics-based spring animation. Returns a value that springs from 0 to 1.

```ts
import { spring } from '@rendiv/core';

const value = spring({
  frame,
  fps: 30,
  config: {
    damping: 12,     // Resistance (higher = less bouncy)
    stiffness: 100,  // Spring tension
    mass: 1,         // Object weight
  },
});
```

### Delayed springs

```ts
const value = spring({ frame: frame - 15, fps }); // starts at frame 15
```

### Measuring duration

```ts
import { getSpringDuration } from '@rendiv/core';

const frames = getSpringDuration({ fps: 30, config: { damping: 12 } });
```

## Easing

Built-in easing functions to use with `interpolate`:

```ts
import { Easing, interpolate } from '@rendiv/core';

const eased = Easing.easeInOut(progress);
```

Available functions:
- `Easing.linear`
- `Easing.ease`
- `Easing.easeIn`, `Easing.easeOut`, `Easing.easeInOut`
- `Easing.bezier(x1, y1, x2, y2)` — custom cubic bezier
- `Easing.bounce`
- `Easing.elastic`

## blendColors

Smoothly interpolate between CSS colors:

```ts
import { blendColors } from '@rendiv/core';

const color = blendColors(frame, [0, 60], ['#ff0000', '#0000ff']);
// Returns interpolated hex color
```

Supports hex colors (`#rgb`, `#rrggbb`), `rgb()`, and `rgba()`.
