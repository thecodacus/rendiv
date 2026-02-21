# @rendiv/shapes

SVG shape generators. Each function returns a `ShapeResult` with `{ d, width, height, viewBox }` — an SVG path string ready to use in `<path>` elements.

## Installation

```bash
npm install @rendiv/shapes
```

## Usage

```tsx
import { shapeStar } from '@rendiv/shapes';

const star = shapeStar({ innerRadius: 50, outerRadius: 120, points: 5 });

<svg width={star.width} height={star.height} viewBox={star.viewBox}>
  <path d={star.d} fill="#6bd4ff" />
</svg>
```

## API

### `shapeCircle({ radius })`

Circle via two semicircular arcs.

### `shapeEllipse({ rx, ry })`

Ellipse with independent x/y radii.

### `shapeRect({ width, height, roundness? })`

Rectangle with optional rounded corners.

### `shapeTriangle({ length, direction? })`

Equilateral triangle. `direction` rotates the orientation.

### `shapePolygon({ radius, sides })`

Regular N-sided polygon (equidistant points on a circle).

```ts
const hexagon = shapePolygon({ radius: 100, sides: 6 });
```

### `shapeStar({ innerRadius, outerRadius, points })`

Star with alternating inner/outer vertices.

```ts
const star = shapeStar({ innerRadius: 40, outerRadius: 100, points: 5 });
```

### `shapePie({ radius, startAngle, endAngle, closePath? })`

Arc sector. Angles in degrees, 0 = 12 o'clock.

```ts
const pie = shapePie({ radius: 100, startAngle: 0, endAngle: 270 });
```

## ShapeResult

All generators return:

```ts
interface ShapeResult {
  d: string;        // SVG path data string
  width: number;    // Bounding box width
  height: number;   // Bounding box height
  viewBox: string;  // SVG viewBox attribute value
}
```
