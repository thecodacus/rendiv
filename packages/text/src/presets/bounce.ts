import { spring } from '@rendiv/core';
import type { TextAnimationConfig } from '../types';

export interface BounceOptions {
  durationInFrames?: number;
  fps?: number;
}

export function bounce({
  durationInFrames = 20,
  fps = 30,
}: BounceOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => {
      const springFrame = progress * durationInFrames;
      const scale = spring({
        frame: springFrame,
        fps,
        config: { damping: 8, stiffness: 200, mass: 0.6 },
        from: 0,
        to: 1,
      });
      return {
        opacity: Math.min(progress * 3, 1),
        transform: `scale(${scale})`,
      };
    },
  };
}
