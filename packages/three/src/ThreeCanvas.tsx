import React, {
  useContext,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from 'react';
import { Canvas } from '@react-three/fiber';
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

interface R3FState {
  advance: (timestamp: number) => void;
}

/**
 * Wraps React Three Fiber's <Canvas> with rendiv integration:
 * - Bridges rendiv contexts into R3F's separate reconciler
 * - Sets frameloop="never" during rendering for frame-accurate capture
 * - Manages holdRender/releaseRender for Canvas initialization
 * - Preserves WebGL drawing buffer so Playwright screenshots capture the canvas
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
  const r3fStateRef = useRef<R3FState | null>(null);

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
    (state: R3FState) => {
      r3fStateRef.current = state;

      if (isRendering) {
        state.advance(performance.now());
      }

      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    },
    [isRendering],
  );

  // In rendering mode, advance the Three.js scene on each frame change.
  // This runs in the main React tree (not R3F's reconciler) so it fires
  // reliably. holdRender prevents the screenshot until advance() completes.
  const frameHoldRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRendering || !r3fStateRef.current) return;

    const handle = holdRender('ThreeCanvas: advancing frame');
    frameHoldRef.current = handle;

    // requestAnimationFrame lets R3F's reconciler flush the context update
    // (synced via useLayoutEffect inside Canvas) before we render the scene.
    requestAnimationFrame(() => {
      r3fStateRef.current?.advance(performance.now());

      if (frameHoldRef.current !== null) {
        releaseRender(frameHoldRef.current);
        frameHoldRef.current = null;
      }
    });

    return () => {
      if (frameHoldRef.current !== null) {
        releaseRender(frameHoldRef.current);
        frameHoldRef.current = null;
      }
    };
  }, [timeline.frame, isRendering]);

  const width = composition?.width ?? 1920;
  const height = composition?.height ?? 1080;

  // In rendering mode, preserve the WebGL drawing buffer so headless
  // Chromium screenshots capture the canvas content instead of a blank rect.
  const glConfig = isRendering
    ? { preserveDrawingBuffer: true, ...gl }
    : gl;

  return (
    <Canvas
      frameloop={isRendering ? 'never' : 'always'}
      camera={camera}
      gl={glConfig}
      resize={{ offsetSize: true }}
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
        {children}
      </RendivContextBridge>
    </Canvas>
  );
}
