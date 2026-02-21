import type { ShapeResult } from './types';

export interface ShapeStarOptions {
  /** Radius of the inner vertices */
  innerRadius: number;
  /** Radius of the outer vertices */
  outerRadius: number;
  /** Number of points */
  points: number;
}

export function shapeStar({ innerRadius, outerRadius, points }: ShapeStarOptions): ShapeResult {
  if (innerRadius <= 0 || outerRadius <= 0) {
    throw new Error('shapeStar: innerRadius and outerRadius must be positive');
  }
  if (points < 3) {
    throw new Error('shapeStar: points must be at least 3');
  }

  const cx = outerRadius;
  const cy = outerRadius;
  const totalVertices = points * 2;
  const angleStep = (2 * Math.PI) / totalVertices;
  const startAngle = -Math.PI / 2;

  const vertices: [number, number][] = [];
  for (let i = 0; i < totalVertices; i++) {
    const angle = startAngle + i * angleStep;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push([
      cx + r * Math.cos(angle),
      cy + r * Math.sin(angle),
    ]);
  }

  const d = vertices
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
    .join(' ') + ' Z';

  const size = outerRadius * 2;
  return {
    d,
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
  };
}
