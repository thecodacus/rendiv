import type { TextAnimationConfig } from '../types';

export interface SlideRightOptions {
  distance?: number;
  durationInFrames?: number;
}

export function slideRight({
  distance = 20,
  durationInFrames = 15,
}: SlideRightOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => ({
      opacity: progress,
      transform: `translateX(${(progress - 1) * distance}px)`,
    }),
  };
}
