import type { TextAnimationConfig } from '../types';

export interface SlideUpOptions {
  distance?: number;
  durationInFrames?: number;
}

export function slideUp({
  distance = 20,
  durationInFrames = 15,
}: SlideUpOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => ({
      opacity: progress,
      transform: `translateY(${(1 - progress) * distance}px)`,
    }),
  };
}
