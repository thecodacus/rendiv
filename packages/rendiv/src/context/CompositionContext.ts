import { createContext } from 'react';

export interface CompositionConfig {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  defaultProps: Record<string, unknown>;
}

export const CompositionContext = createContext<CompositionConfig | null>(null);
