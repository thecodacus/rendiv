import type { TransitionPresentation } from '../types';

export type SlideDirection = 'from-left' | 'from-right' | 'from-top' | 'from-bottom';

export interface SlideOptions {
  direction?: SlideDirection;
}

export function slide({ direction = 'from-right' }: SlideOptions = {}): TransitionPresentation {
  return {
    style: (progress: number) => {
      const entering = (1 - progress) * 100;
      const exiting = progress * 100;

      let enterTransform: string;
      let exitTransform: string;

      switch (direction) {
        case 'from-left':
          enterTransform = `translateX(${-entering}%)`;
          exitTransform = `translateX(${exiting}%)`;
          break;
        case 'from-right':
          enterTransform = `translateX(${entering}%)`;
          exitTransform = `translateX(${-exiting}%)`;
          break;
        case 'from-top':
          enterTransform = `translateY(${-entering}%)`;
          exitTransform = `translateY(${exiting}%)`;
          break;
        case 'from-bottom':
          enterTransform = `translateY(${entering}%)`;
          exitTransform = `translateY(${-exiting}%)`;
          break;
      }

      return {
        entering: { transform: enterTransform },
        exiting: { transform: exitTransform },
      };
    },
  };
}
