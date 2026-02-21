import type { ShapeResult } from './types';

export interface ShapeCircleOptions {
  radius: number;
}

export function shapeCircle({ radius }: ShapeCircleOptions): ShapeResult {
  if (radius <= 0) {
    throw new Error('shapeCircle: radius must be positive');
  }

  const d = diameter(radius);
  const size = radius * 2;

  return {
    d,
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
  };
}

function diameter(r: number): string {
  // Two semicircular arcs to form a full circle
  const cx = r;
  const cy = r;
  return [
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
    `A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
    'Z',
  ].join(' ');
}
