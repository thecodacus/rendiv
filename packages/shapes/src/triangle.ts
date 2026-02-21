import type { ShapeResult } from './types';

export type TriangleDirection = 'up' | 'down' | 'left' | 'right';

export interface ShapeTriangleOptions {
  /** Side length of the equilateral triangle */
  length: number;
  /** Which direction the triangle points. Default: 'up' */
  direction?: TriangleDirection;
}

export function shapeTriangle({ length, direction = 'up' }: ShapeTriangleOptions): ShapeResult {
  if (length <= 0) {
    throw new Error('shapeTriangle: length must be positive');
  }

  // Equilateral triangle geometry
  const h = (length * Math.sqrt(3)) / 2;

  let points: [number, number][];

  switch (direction) {
    case 'up':
      points = [
        [length / 2, 0],
        [length, h],
        [0, h],
      ];
      return result(points, length, h);
    case 'down':
      points = [
        [0, 0],
        [length, 0],
        [length / 2, h],
      ];
      return result(points, length, h);
    case 'right':
      points = [
        [0, 0],
        [h, length / 2],
        [0, length],
      ];
      return result(points, h, length);
    case 'left':
      points = [
        [h, 0],
        [h, length],
        [0, length / 2],
      ];
      return result(points, h, length);
  }
}

function result(points: [number, number][], w: number, h: number): ShapeResult {
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
    .join(' ') + ' Z';

  return {
    d,
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
  };
}
