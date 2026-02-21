import type { ShapeResult } from './types';

export interface ShapePolygonOptions {
  /** Circumscribed circle radius */
  radius: number;
  /** Number of sides (minimum 3) */
  sides: number;
}

export function shapePolygon({ radius, sides }: ShapePolygonOptions): ShapeResult {
  if (radius <= 0) {
    throw new Error('shapePolygon: radius must be positive');
  }
  if (sides < 3) {
    throw new Error('shapePolygon: sides must be at least 3');
  }

  const cx = radius;
  const cy = radius;
  const angleStep = (2 * Math.PI) / sides;
  // Start from top (-PI/2) so first vertex is at 12 o'clock
  const startAngle = -Math.PI / 2;

  const points: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    points.push([
      cx + radius * Math.cos(angle),
      cy + radius * Math.sin(angle),
    ]);
  }

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
    .join(' ') + ' Z';

  const size = radius * 2;
  return {
    d,
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
  };
}
