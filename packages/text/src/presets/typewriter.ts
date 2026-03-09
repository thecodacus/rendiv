import type { TextAnimationConfig } from '../types';

export interface TypewriterOptions {
  durationInFrames?: number;
}

export function typewriter({
  durationInFrames = 3,
}: TypewriterOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress, index, total) => {
      const visible = progress >= 0.5;
      return {
        opacity: visible ? 1 : 0,
      };
    },
  };
}
