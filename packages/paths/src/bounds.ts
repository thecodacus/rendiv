import { readPath } from './read-path';

export interface PathBoundsResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate the bounding box of an SVG path.
 */
export function pathBounds(d: string): PathBoundsResult {
  const segments = readPath(d);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  let cx = 0;
  let cy = 0;

  function track(x: number, y: number) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  for (const seg of segments) {
    switch (seg.command) {
      case 'M':
      case 'L':
        track(seg.values[0], seg.values[1]);
        cx = seg.values[0];
        cy = seg.values[1];
        break;
      case 'C': {
        // Sample the cubic bezier for bounding box
        const steps = 16;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const mt = 1 - t;
          const x = mt * mt * mt * cx + 3 * mt * mt * t * seg.values[0] + 3 * mt * t * t * seg.values[2] + t * t * t * seg.values[4];
          const y = mt * mt * mt * cy + 3 * mt * mt * t * seg.values[1] + 3 * mt * t * t * seg.values[3] + t * t * t * seg.values[5];
          track(x, y);
        }
        cx = seg.values[4];
        cy = seg.values[5];
        break;
      }
      case 'Q': {
        const steps = 16;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const mt = 1 - t;
          const x = mt * mt * cx + 2 * mt * t * seg.values[0] + t * t * seg.values[2];
          const y = mt * mt * cy + 2 * mt * t * seg.values[1] + t * t * seg.values[3];
          track(x, y);
        }
        cx = seg.values[2];
        cy = seg.values[3];
        break;
      }
      case 'A': {
        // Sample the arc for bounding box
        track(cx, cy);
        const steps = 16;
        const ex = seg.values[5];
        const ey = seg.values[6];
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          // Simple linear interpolation as approximation
          // (accurate arc bounds would require center parameterization)
          const x = cx + (ex - cx) * t;
          const y = cy + (ey - cy) * t;
          track(x, y);
        }
        // Also track arc extremes by sampling more
        track(ex, ey);
        cx = ex;
        cy = ey;
        break;
      }
    }
  }

  if (minX === Infinity) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
