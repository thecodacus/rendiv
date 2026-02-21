import React, { useContext, useEffect, useRef, type CSSProperties } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import {
  TimelineContext,
  SequenceContext,
  holdRender,
  releaseRender,
} from '@rendiv/core';

export interface LottieProps {
  /** Parsed Lottie JSON animation data. Memoize this value to avoid re-initialization. */
  animationData: object;
  /** Lottie renderer engine. Default: 'svg' (best feature coverage). */
  renderer?: 'svg' | 'canvas' | 'html';
  /** Whether to loop the animation when rendiv frames exceed the Lottie duration. */
  loop?: boolean;
  /** Playback direction. */
  direction?: 'forward' | 'backward';
  /** Speed multiplier mapping rendiv frames to Lottie frames. Default: 1. */
  playbackRate?: number;
  style?: CSSProperties;
  className?: string;
}

export function Lottie({
  animationData,
  renderer = 'svg',
  loop = false,
  direction = 'forward',
  playbackRate = 1,
  style,
  className,
}: LottieProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const holdHandleRef = useRef<number | null>(null);

  const timeline = useContext(TimelineContext);
  const sequence = useContext(SequenceContext);
  const localFrame = timeline.frame - sequence.accumulatedOffset;

  // Initialize lottie-web animation
  useEffect(() => {
    if (!containerRef.current) return;

    const handle = holdRender('Loading <Lottie> animation', {
      timeoutInMilliseconds: 30000,
    });
    holdHandleRef.current = handle;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer,
      autoplay: false,
      loop: false,
      animationData,
    });

    anim.setSubframe(false);

    anim.addEventListener('DOMLoaded', () => {
      // Apply initial frame twice to work around lottie-web rendering bug
      // where the first goToAndStop after load may not render correctly.
      anim.goToAndStop(0, true);
      anim.goToAndStop(0, true);

      animRef.current = anim;

      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    });

    return () => {
      anim.destroy();
      animRef.current = null;

      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    };
  }, [animationData, renderer]);

  // Seek to the correct frame on every rendiv frame change
  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;

    const totalFrames = anim.totalFrames;
    if (totalFrames <= 0) return;

    let targetFrame = localFrame * playbackRate;

    if (loop) {
      targetFrame = ((targetFrame % totalFrames) + totalFrames) % totalFrames;
    } else {
      targetFrame = Math.max(0, Math.min(targetFrame, totalFrames - 1));
    }

    if (direction === 'backward') {
      targetFrame = totalFrames - 1 - targetFrame;
    }

    anim.goToAndStop(targetFrame, true);
  }, [localFrame, playbackRate, loop, direction]);

  return <div ref={containerRef} style={style} className={className} />;
}
