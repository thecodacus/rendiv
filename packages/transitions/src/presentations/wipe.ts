import type { TransitionPresentation } from '../types';

export type WipeDirection = 'from-left' | 'from-right' | 'from-top' | 'from-bottom';

export interface WipeOptions {
  direction?: WipeDirection;
}

export function wipe({ direction = 'from-left' }: WipeOptions = {}): TransitionPresentation {
  return {
    style: (progress: number) => {
      let clipPath: string;

      switch (direction) {
        case 'from-left':
          clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
          break;
        case 'from-right':
          clipPath = `inset(0 0 0 ${(1 - progress) * 100}%)`;
          break;
        case 'from-top':
          clipPath = `inset(0 0 ${(1 - progress) * 100}% 0)`;
          break;
        case 'from-bottom':
          clipPath = `inset(${(1 - progress) * 100}% 0 0 0)`;
          break;
      }

      return {
        entering: { clipPath },
        exiting: {},
      };
    },
  };
}
