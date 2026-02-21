import type { ShapeResult } from './types';

export interface ShapeRectOptions {
  width: number;
  height: number;
  /** Corner radius. Default: 0 */
  roundness?: number;
}

export function shapeRect({ width: w, height: h, roundness = 0 }: ShapeRectOptions): ShapeResult {
  if (w <= 0 || h <= 0) {
    throw new Error('shapeRect: width and height must be positive');
  }

  const r = Math.min(roundness, w / 2, h / 2);

  let d: string;
  if (r <= 0) {
    d = `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  } else {
    d = [
      `M ${r} 0`,
      `L ${w - r} 0`,
      `A ${r} ${r} 0 0 1 ${w} ${r}`,
      `L ${w} ${h - r}`,
      `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
      `L ${r} ${h}`,
      `A ${r} ${r} 0 0 1 0 ${h - r}`,
      `L 0 ${r}`,
      `A ${r} ${r} 0 0 1 ${r} 0`,
      'Z',
    ].join(' ');
  }

  return {
    d,
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
  };
}
