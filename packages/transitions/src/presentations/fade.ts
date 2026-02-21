import type { TransitionPresentation } from '../types';

export function fade(): TransitionPresentation {
  return {
    style: (progress: number) => ({
      entering: { opacity: progress },
      exiting: { opacity: 1 - progress },
    }),
  };
}
