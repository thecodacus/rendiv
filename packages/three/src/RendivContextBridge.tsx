import React from 'react';
import {
  TimelineContext,
  type TimelineContextValue,
  SequenceContext,
  type SequenceContextValue,
  CompositionContext,
  type CompositionConfig,
  RendivEnvironmentContext,
  type RendivEnvironmentContextValue,
} from '@rendiv/core';

export interface RendivContextBridgeProps {
  timeline: TimelineContextValue;
  sequence: SequenceContextValue;
  composition: CompositionConfig | null;
  environment: RendivEnvironmentContextValue;
  children: React.ReactNode;
}

/**
 * Re-provides rendiv contexts inside React Three Fiber's Canvas.
 *
 * R3F's <Canvas> creates a separate React reconciler, which means contexts
 * from the parent tree are not available inside the Canvas. This bridge
 * component re-provides all rendiv contexts so hooks like useFrame() and
 * useCompositionConfig() work correctly inside the Three.js scene graph.
 */
export function RendivContextBridge({
  timeline,
  sequence,
  composition,
  environment,
  children,
}: RendivContextBridgeProps): React.ReactElement {
  return (
    <RendivEnvironmentContext.Provider value={environment}>
      <CompositionContext.Provider value={composition}>
        <TimelineContext.Provider value={timeline}>
          <SequenceContext.Provider value={sequence}>
            {children}
          </SequenceContext.Provider>
        </TimelineContext.Provider>
      </CompositionContext.Provider>
    </RendivEnvironmentContext.Provider>
  );
}
