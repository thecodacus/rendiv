# @rendiv/paths

SVG path manipulation and animation utilities. Parse, measure, transform, and animate SVG path strings.

## Installation

```bash
npm install @rendiv/paths
```

## Parsing

### `readPath(d)`

Parse an SVG path string into an array of `PathSegment` objects.

```ts
import { readPath, writePath } from '@rendiv/paths';

const segments = readPath('M 0 0 L 100 100 Z');
const d = writePath(segments); // serialize back
```

### `writePath(segments)`

Serialize a `PathSegment[]` back into a path string.

## Measurement

### `pathLength(d)`

Calculate the total length of a path.

```ts
const length = pathLength('M 0 0 L 100 0'); // 100
```

### `pointOnPath(progress, d)`

Get the `{ x, y }` coordinates at a position along the path (0 to 1).

```ts
const { x, y } = pointOnPath(0.5, starPath);
```

### `tangentOnPath(progress, d)`

Get the tangent angle (in radians) at a position along the path.

### `pathBounds(d)`

Get the bounding box of a path.

```ts
const { x, y, width, height } = pathBounds(path);
```

## Animation

### `strokeReveal(progress, d)`

Animate a path being drawn on. Returns `strokeDasharray` and `strokeDashoffset` values.

```tsx
import { strokeReveal } from '@rendiv/paths';

const progress = interpolate(frame, [0, 60], [0, 1]);
const { strokeDasharray, strokeDashoffset } = strokeReveal(progress, starPath);

<path d={starPath} stroke="#fff" fill="none"
  style={{ strokeDasharray, strokeDashoffset }} />
```

### `morphPath(progress, fromPath, toPath)`

Interpolate between two path strings. Both paths must have the same number and types of segments.

```ts
const morphed = morphPath(0.5, hexagonPath, starPath);
```

## Transforms

### `resizePath(d, newWidth, newHeight)`

Scale a path to fit new dimensions.

### `movePath(d, dx, dy)`

Translate a path by an offset.

### `flipPath(d, axis)`

Mirror a path horizontally (`'x'`) or vertically (`'y'`).

### `slicePath(from, to, d)`

Extract a sub-section of a path (0 to 1 range).
