import type { TransitionPresentation } from '../types';

export type FlipDirection = 'horizontal' | 'vertical';

export interface FlipOptions {
  direction?: FlipDirection;
  perspective?: number;
}

export function flip({ direction = 'horizontal', perspective = 1000 }: FlipOptions = {}): TransitionPresentation {
  return {
    style: (progress: number) => {
      const axis = direction === 'horizontal' ? 'Y' : 'X';

      // First half (0→0.5): exiting rotates away (0→90 degrees)
      // Second half (0.5→1): entering rotates in (90→0 degrees)
      const exitAngle = Math.min(progress * 2, 1) * 90;
      const enterAngle = Math.max(1 - (progress - 0.5) * 2, 0) * 90;

      return {
        entering: {
          transform: `perspective(${perspective}px) rotate${axis}(${enterAngle}deg)`,
          backfaceVisibility: 'hidden' as const,
          opacity: progress > 0.5 ? 1 : 0,
        },
        exiting: {
          transform: `perspective(${perspective}px) rotate${axis}(-${exitAngle}deg)`,
          backfaceVisibility: 'hidden' as const,
          opacity: progress <= 0.5 ? 1 : 0,
        },
      };
    },
  };
}
