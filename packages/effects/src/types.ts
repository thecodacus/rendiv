import type { CSSProperties, ReactNode } from 'react';

/** A value that can be static or animated as a function of frame number */
export type AnimatableValue<T> = T | ((frame: number) => T);

export interface FilterConfig {
  /** Returns the CSS filter function string for a given frame */
  resolve: (frame: number) => string;
}

export interface EffectProps {
  filters: FilterConfig[];
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}
