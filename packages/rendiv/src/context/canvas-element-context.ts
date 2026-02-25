import { createContext } from 'react';

export interface CanvasElementContextValue {
  /** The composition ID whose overrides should apply to children. */
  id: string;
  /** True when this CanvasElement is nested inside another CanvasElement. */
  nested: boolean;
  /** The accumulatedOffset at the CanvasElement boundary (parent's offset). */
  scopeOffset: number;
}

// When non-null, Sequence uses this as the composition prefix for
// namePath building instead of CompositionContext.id.
// The `nested` flag lets Sequence tag timeline entries so the Tracks
// view can hide child composition internals.
export const CanvasElementContext = createContext<CanvasElementContextValue | null>(null);
