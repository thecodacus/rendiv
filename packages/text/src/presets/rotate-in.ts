import type { TextAnimationConfig } from '../types';

export interface RotateInOptions {
  degrees?: number;
  durationInFrames?: number;
}

export function rotateIn({
  degrees = 90,
  durationInFrames = 15,
}: RotateInOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => ({
      opacity: progress,
      transform: `rotate(${(1 - progress) * degrees}deg)`,
      transformOrigin: 'center bottom',
    }),
  };
}
