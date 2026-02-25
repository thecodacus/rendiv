import { createContext } from 'react';

// When non-null, Sequence uses this as the composition prefix for
// namePath building instead of CompositionContext.id.
export const CanvasElementContext = createContext<string | null>(null);
