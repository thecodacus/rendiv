import React, {
  useContext,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  TimelineContext,
  SequenceContext,
  CompositionContext,
  RendivEnvironmentContext,
  holdRender,
  releaseRender,
} from '@rendiv/core';
import { RendivContextBridge } from './RendivContextBridge';

export interface ThreeCanvasProps {
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string;
  /** R3F camera configuration. */
  camera?: React.ComponentProps<typeof Canvas>['camera'];
  /** R3F WebGL renderer settings. */
  gl?: React.ComponentProps<typeof Canvas>['gl'];
}

/**
 * Internal component that triggers a single Three.js render on each rendiv
 * frame change. Only mounted in rendering mode (frameloop="never").
 */
function FrameAdvancer(): null {
  const { advance } = useThree();
  const timeline = useContext(TimelineContext);

  useEffect(() => {
    advance(performance.now());
  }, [timeline.frame, advance]);

  return null;
}

/**
 * Wraps React Three Fiber's <Canvas> with rendiv integration:
 * - Bridges rendiv contexts into R3F's separate reconciler
 * - Sets frameloop="never" during rendering for frame-accurate capture
 * - Manages holdRender/releaseRender for Canvas initialization
 */
export function ThreeCanvas({
  children,
  style,
  className,
  camera,
  gl,
}: ThreeCanvasProps): React.ReactElement {
  const timeline = useContext(TimelineContext);
  const sequence = useContext(SequenceContext);
  const composition = useContext(CompositionContext);
  const environment = useContext(RendivEnvironmentContext);

  const isRendering = environment.environment === 'rendering';
  const holdHandleRef = useRef<number | null>(null);

  // Hold render until Canvas is created
  useEffect(() => {
    const handle = holdRender('Initializing <ThreeCanvas>', {
      timeoutInMilliseconds: 30000,
    });
    holdHandleRef.current = handle;

    return () => {
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    };
  }, []);

  const handleCreated = useCallback(
    (state: { advance: (timestamp: number) => void }) => {
      if (isRendering) {
        // Initial render in manual mode
        state.advance(performance.now());
      }

      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    },
    [isRendering],
  );

  const width = composition?.width ?? 1920;
  const height = composition?.height ?? 1080;

  return (
    <Canvas
      frameloop={isRendering ? 'never' : 'always'}
      camera={camera}
      gl={gl}
      onCreated={handleCreated}
      style={{ width, height, ...style }}
      className={className}
    >
      <RendivContextBridge
        timeline={timeline}
        sequence={sequence}
        composition={composition}
        environment={environment}
      >
        {isRendering && <FrameAdvancer />}
        {children}
      </RendivContextBridge>
    </Canvas>
  );
}
