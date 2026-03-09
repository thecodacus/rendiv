import type { TextAnimationConfig } from '../types';

export interface BlurInOptions {
  from?: number;
  durationInFrames?: number;
}

export function blurIn({
  from = 10,
  durationInFrames = 15,
}: BlurInOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => ({
      opacity: progress,
      filter: `blur(${(1 - progress) * from}px)`,
    }),
  };
}
