---
name: shapes-and-paths
description: >
  Generating SVG shapes and manipulating SVG paths — parsing, measuring, morphing,
  stroke reveal animations, and geometric transforms.
---

# Shapes and Paths

## @rendiv/shapes

Generates SVG path data for common shapes. Every function returns a `ShapeResult`:

```ts
interface ShapeResult {
  d: string;          // SVG path d attribute
  width: number;      // Natural width
  height: number;     // Natural height
  viewBox: string;    // "0 0 width height"
}
```

### Shape Functions

```ts
import {
  shapeCircle,
  shapeEllipse,
  shapeRect,
  shapeTriangle,
  shapePolygon,
  shapeStar,
  shapePie,
} from '@rendiv/shapes';
```

| Function | Parameters | Notes |
|---|---|---|
| `shapeCircle({ radius })` | `radius > 0` | Two semicircular arcs |
| `shapeEllipse({ rx, ry })` | `rx > 0, ry > 0` | Two semicircular arcs |
| `shapeRect({ width, height, roundness? })` | `width > 0, height > 0`, `roundness` default 0 | Roundness clamped to `min(roundness, width/2, height/2)` |
| `shapeTriangle({ length, direction? })` | `length > 0`, direction: `'up'`\|`'down'`\|`'left'`\|`'right'` (default `'up'`) | Equilateral |
| `shapePolygon({ radius, sides })` | `radius > 0, sides >= 3` | Regular, first vertex at 12 o'clock |
| `shapeStar({ innerRadius, outerRadius, points })` | Both radii > 0, `points >= 3` | Alternating vertices |
| `shapePie({ radius, startAngle, endAngle, closePath? })` | `radius > 0`, angles in degrees (0 = 12 o'clock, clockwise), `closePath` default `true` | Arc segment |

### Example: Animated shape

```tsx
import { shapeCircle } from '@rendiv/shapes';

const circle = shapeCircle({ radius: 50 });

<svg viewBox={circle.viewBox} width={circle.width} height={circle.height}>
  <path d={circle.d} fill="cyan" />
</svg>
```

## @rendiv/paths

Parses, measures, and transforms SVG path strings.

### Parsing

```ts
import { readPath, writePath } from '@rendiv/paths';

const segments = readPath('M 10 10 L 90 90 Z');
const d = writePath(segments);
```

`readPath` converts all commands to absolute coordinates. `writePath` serializes
back with values rounded to 3 decimal places.

### Measurement

```ts
import { pathLength, pointOnPath, tangentOnPath, slicePath } from '@rendiv/paths';
```

| Function | Returns | Description |
|---|---|---|
| `pathLength(d)` | `number` | Total path length |
| `pointOnPath(d, length)` | `{ x, y, angle }` | Point and tangent angle at a given length |
| `tangentOnPath(d, length)` | `{ x, y }` | Normalized tangent vector |
| `slicePath(d, start, end)` | `string` | Sub-path between two lengths |

### Animation

#### `strokeReveal(progress, d)`

Animates a "draw-on" line effect.

```ts
import { strokeReveal } from '@rendiv/paths';

const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
const reveal = strokeReveal(progress, pathD);

<path
  d={pathD}
  stroke="white"
  strokeWidth={3}
  fill="none"
  style={{
    strokeDasharray: reveal.strokeDasharray,
    strokeDashoffset: reveal.strokeDashoffset,
  }}
/>
```

- `progress = 0`: invisible
- `progress = 1`: fully drawn
- Clamped to [0, 1]

#### `morphPath(progress, from, to)`

Interpolates between two SVG paths.

```ts
import { morphPath } from '@rendiv/paths';

const morphed = morphPath(progress, circleD, starD);
<path d={morphed} fill="white" />
```

**Constraint**: Both paths MUST have the same number of segments with matching
command types. Throws otherwise.

### Transforms

```ts
import { resizePath, movePath, flipPath, pathBounds } from '@rendiv/paths';
```

| Function | Description |
|---|---|
| `resizePath(d, scaleX, scaleY?)` | Scale path. Uniform if `scaleY` omitted. |
| `movePath(d, dx, dy)` | Translate all points |
| `flipPath(d)` | Reverse path direction |
| `pathBounds(d)` | Bounding box: `{ x, y, width, height }` |

### Combined example: Morphing shapes

```tsx
import { shapeCircle, shapeStar } from '@rendiv/shapes';
import { morphPath } from '@rendiv/paths';

const circle = shapeCircle({ radius: 60 });
const star = shapeStar({ innerRadius: 30, outerRadius: 60, points: 5 });

const frame = useFrame();
const progress = interpolate(frame, [0, 45], [0, 1], {
  easing: Easing.easeInOut,
  extrapolateRight: 'clamp',
});

const d = morphPath(progress, circle.d, star.d);

<svg viewBox={circle.viewBox} width={200} height={200}>
  <path d={d} fill="gold" />
</svg>
```

Note: For `morphPath` to work, both shapes must produce compatible path segments.
Shapes from `@rendiv/shapes` with the same structural complexity (e.g., two
arc-based shapes) work well together.
