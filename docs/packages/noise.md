# @rendiv/noise

Simplex noise functions for organic, natural-looking animations. Pure utility — no React dependency.

## Installation

```bash
npm install @rendiv/noise
```

## Usage

```ts
import { noise2D, noise3D, seed } from '@rendiv/noise';

// Set a deterministic seed for reproducible results
seed(42);

// 2D noise: smooth random values from coordinates
const value = noise2D(x, y); // returns -1 to 1

// 3D noise: use frame as the third dimension for animation
const animated = noise3D(x * 0.1, y * 0.1, frame * 0.02);
```

## API

### `seed(value)`

Set the noise seed for reproducible output. Call before generating noise.

```ts
seed(12345);
```

### `noise2D(x, y)` / `simplex2D(x, y)`

2D simplex noise. Returns a value in the range `[-1, 1]`.

```ts
const n = noise2D(frame * 0.05, 0); // smooth 1D animation
```

### `noise3D(x, y, z)` / `simplex3D(x, y, z)`

3D simplex noise. Use the third axis for time-based animation.

```ts
// Animated noise field
const brightness = noise3D(col * 0.15, row * 0.15, frame * 0.025);
```

### `noise4D(x, y, z, w)` / `simplex4D(x, y, z, w)`

4D simplex noise for looping animations or higher-dimensional effects.

## Example: Noise Field

```tsx
import { useFrame, Fill } from '@rendiv/core';
import { noise3D } from '@rendiv/noise';

export const NoiseField = () => {
  const frame = useFrame();

  return (
    <Fill style={{ background: '#000', position: 'relative' }}>
      {Array.from({ length: 32 * 18 }, (_, i) => {
        const col = i % 32;
        const row = Math.floor(i / 32);
        const n = noise3D(col * 0.15, row * 0.15, frame * 0.025);
        return (
          <div key={i} style={{
            position: 'absolute',
            left: col * 60, top: row * 60,
            width: 59, height: 59,
            backgroundColor: `hsl(${200 + n * 60}, 70%, ${Math.max(0, n) * 50}%)`,
          }} />
        );
      })}
    </Fill>
  );
};
```
