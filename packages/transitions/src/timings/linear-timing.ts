import type { TransitionTiming } from '../types';

export interface LinearTimingOptions {
  durationInFrames: number;
}

export function linearTiming({ durationInFrames }: LinearTimingOptions): TransitionTiming {
  return {
    durationInFrames,
    progress: (frame: number) => Math.min(Math.max(frame / durationInFrames, 0), 1),
  };
}
