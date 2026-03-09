import type { TextAnimationConfig } from '../types';

export interface SlideDownOptions {
  distance?: number;
  durationInFrames?: number;
}

export function slideDown({
  distance = 20,
  durationInFrames = 15,
}: SlideDownOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => ({
      opacity: progress,
      transform: `translateY(${(progress - 1) * distance}px)`,
    }),
  };
}
