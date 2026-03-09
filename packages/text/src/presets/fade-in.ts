import type { TextAnimationConfig } from '../types';

export interface FadeInOptions {
  durationInFrames?: number;
}

export function fadeIn({
  durationInFrames = 15,
}: FadeInOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => ({
      opacity: progress,
    }),
  };
}
