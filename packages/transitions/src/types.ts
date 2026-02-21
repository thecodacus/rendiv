import type { CSSProperties } from 'react';

export interface TransitionStyles {
  entering: CSSProperties;
  exiting: CSSProperties;
}

export interface TransitionPresentation {
  style: (progress: number) => TransitionStyles;
}

export interface TransitionTiming {
  durationInFrames: number;
  progress: (frame: number) => number;
}
