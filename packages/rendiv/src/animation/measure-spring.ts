import { spring, type SpringConfig } from './spring';

export interface GetSpringDurationOptions {
  fps: number;
  config?: SpringConfig;
  from?: number;
  to?: number;
  threshold?: number;
}

export function getSpringDuration(options: GetSpringDurationOptions): number {
  const {
    fps,
    config,
    from = 0,
    to = 1,
    threshold = 0.005,
  } = options;

  const maxFrames = fps * 60; // 60 seconds max

  for (let frame = 0; frame < maxFrames; frame++) {
    const value = spring({
      frame,
      fps,
      config,
      from,
      to,
      durationRestThreshold: threshold,
    });

    if (Math.abs(value - to) < threshold) {
      return frame;
    }
  }

  return maxFrames;
}
