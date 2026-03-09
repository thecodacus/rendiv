import type { TextAnimationConfig } from '../types';

export interface ScaleInOptions {
  from?: number;
  durationInFrames?: number;
}

export function scaleIn({
  from = 0.5,
  durationInFrames = 15,
}: ScaleInOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => ({
      opacity: progress,
      transform: `scale(${from + (1 - from) * progress})`,
    }),
  };
}
