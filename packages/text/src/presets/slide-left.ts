import type { TextAnimationConfig } from '../types';

export interface SlideLeftOptions {
  distance?: number;
  durationInFrames?: number;
}

export function slideLeft({
  distance = 20,
  durationInFrames = 15,
}: SlideLeftOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => ({
      opacity: progress,
      transform: `translateX(${(1 - progress) * distance}px)`,
    }),
  };
}
