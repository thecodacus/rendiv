import { pathLength } from './measure';

export interface StrokeRevealResult {
  strokeDasharray: string;
  strokeDashoffset: number;
}

/**
 * Returns stroke-dash CSS properties that create a "draw-on" line animation.
 *
 * At progress=0 the stroke is invisible, at progress=1 it's fully drawn.
 *
 * Usage:
 * ```tsx
 * const { strokeDasharray, strokeDashoffset } = strokeReveal(progress, d);
 * <path d={d} stroke="white" fill="none" style={{ strokeDasharray, strokeDashoffset }} />
 * ```
 */
export function strokeReveal(progress: number, d: string): StrokeRevealResult {
  const p = Math.max(0, Math.min(1, progress));
  const total = pathLength(d);

  return {
    strokeDasharray: `${total}`,
    strokeDashoffset: total * (1 - p),
  };
}
