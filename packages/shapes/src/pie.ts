import type { ShapeResult } from './types';

export interface ShapePieOptions {
  radius: number;
  /** Start angle in degrees (0 = 12 o'clock, clockwise) */
  startAngle: number;
  /** End angle in degrees */
  endAngle: number;
  /** Whether to close the path back to center. Default: true */
  closePath?: boolean;
}

export function shapePie({
  radius,
  startAngle,
  endAngle,
  closePath = true,
}: ShapePieOptions): ShapeResult {
  if (radius <= 0) {
    throw new Error('shapePie: radius must be positive');
  }

  const cx = radius;
  const cy = radius;

  // Convert degrees to radians, offset so 0° = 12 o'clock
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  // Use large-arc flag when sweep > 180°
  let sweep = endAngle - startAngle;
  // Normalize to [0, 360)
  sweep = ((sweep % 360) + 360) % 360;
  const largeArc = sweep > 180 ? 1 : 0;

  const parts: string[] = [];

  if (closePath) {
    parts.push(`M ${cx} ${cy}`);
    parts.push(`L ${x1} ${y1}`);
  } else {
    parts.push(`M ${x1} ${y1}`);
  }

  parts.push(`A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`);

  if (closePath) {
    parts.push('Z');
  }

  const size = radius * 2;
  return {
    d: parts.join(' '),
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
  };
}
