import type { CSSProperties } from 'react';

export type SplitMode = 'character' | 'word' | 'line';

export type TextAnimationFunction = (
  progress: number,
  index: number,
  total: number,
) => CSSProperties;

export interface TextAnimationConfig {
  /** Duration in frames for each unit's animation */
  durationInFrames: number;
  /** Maps progress (0-1) to CSS styles for each unit */
  style: TextAnimationFunction;
  /** Optional: override the displayed text per unit (used by scramble preset) */
  renderText?: (original: string, progress: number, index: number) => string;
}

export interface AnimatedTextProps {
  text: string;
  splitBy?: SplitMode;
  animation: TextAnimationConfig;
  /** Delay in frames between each unit starting its animation */
  stagger?: number;
  style?: CSSProperties;
  className?: string;
}

export interface SplitUnit {
  text: string;
  index: number;
  isWhitespace: boolean;
}
