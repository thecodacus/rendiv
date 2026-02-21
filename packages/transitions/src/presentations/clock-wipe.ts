import type { TransitionPresentation } from '../types';

export interface ClockWipeOptions {
  /** Number of polygon points to approximate the arc. Default: 64. */
  segments?: number;
}

export function clockWipe({ segments = 64 }: ClockWipeOptions = {}): TransitionPresentation {
  return {
    style: (progress: number) => {
      // Build a polygon that sweeps clockwise from 12 o'clock
      const angle = progress * 360;
      const points: string[] = ['50% 50%', '50% 0%'];

      for (let i = 0; i <= segments; i++) {
        const segAngle = (i / segments) * angle;
        if (segAngle > angle) break;

        const rad = ((segAngle - 90) * Math.PI) / 180;
        // Use 71% radius (half diagonal of 100x100 square ≈ 70.7%)
        const x = 50 + Math.cos(rad) * 71;
        const y = 50 + Math.sin(rad) * 71;
        points.push(`${x}% ${y}%`);
      }

      const clipPath = `polygon(${points.join(', ')})`;

      return {
        entering: { clipPath },
        exiting: {},
      };
    },
  };
}
