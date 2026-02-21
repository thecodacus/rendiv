import { spring, getSpringDuration, type SpringConfig } from '@rendiv/core';
import type { TransitionTiming } from '../types';

export interface SpringTimingOptions {
  fps: number;
  config?: Partial<SpringConfig>;
  durationInFrames?: number;
}

export function springTiming({ fps, config, durationInFrames }: SpringTimingOptions): TransitionTiming {
  const resolvedDuration = durationInFrames ?? Math.ceil(getSpringDuration({ fps, config }));

  return {
    durationInFrames: resolvedDuration,
    progress: (frame: number) => spring({ frame, fps, config }),
  };
}
