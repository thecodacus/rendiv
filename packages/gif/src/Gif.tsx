import React, { useContext, useEffect, useRef, useState, type CSSProperties } from 'react';
import { TimelineContext, SequenceContext, CompositionContext, holdRender, releaseRender } from '@rendiv/core';
import { getOrLoadGif } from './preload-gif';
import type { ParsedGif, ParsedGifFrame } from './types';

export interface GifProps {
  /** URL or path to the GIF file */
  src: string;
  /** Display width in pixels. Defaults to the GIF's native width. */
  width?: number;
  /** Display height in pixels. Defaults to the GIF's native height. */
  height?: number;
  /** How the GIF fits within the given dimensions */
  fit?: 'fill' | 'contain' | 'cover';
  /** Playback speed multiplier. Default: 1 */
  playbackRate?: number;
  /** Whether the animation loops. Default: true */
  loop?: boolean;
  style?: CSSProperties;
  className?: string;
  /** Timeout for holdRender in milliseconds. Default: 30000 */
  holdRenderTimeout?: number;
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  compositeCtx: CanvasRenderingContext2D,
  frame: ParsedGifFrame,
  gifWidth: number,
  gifHeight: number,
  previousFrame: ParsedGifFrame | null,
): void {
  // Handle disposal of the previous frame
  if (previousFrame) {
    switch (previousFrame.disposalType) {
      case 2:
        // Restore to background (clear the area)
        compositeCtx.clearRect(
          previousFrame.dims.left,
          previousFrame.dims.top,
          previousFrame.dims.width,
          previousFrame.dims.height,
        );
        break;
      case 3:
        // Restore to previous — not commonly supported, treat as keep
        break;
      // 0 and 1: no disposal needed
    }
  }

  // Draw the current frame patch onto the compositing canvas
  const imageData = new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height);
  compositeCtx.putImageData(imageData, frame.dims.left, frame.dims.top);

  // Copy the compositing canvas to the visible canvas
  ctx.clearRect(0, 0, gifWidth, gifHeight);
  ctx.drawImage(compositeCtx.canvas, 0, 0);
}

export function Gif({
  src,
  width,
  height,
  fit = 'fill',
  playbackRate = 1,
  loop = true,
  style,
  className,
  holdRenderTimeout = 30000,
}: GifProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timeline = useContext(TimelineContext);
  const sequence = useContext(SequenceContext);
  const composition = useContext(CompositionContext);
  const gifRef = useRef<ParsedGif | null>(null);
  const holdHandleRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const lastFrameIndexRef = useRef(-1);

  const fps = composition?.fps ?? 30;
  const localFrame = timeline.frame - sequence.accumulatedOffset;

  // Load and parse the GIF
  useEffect(() => {
    const handle = holdRender(
      `Loading <Gif> from "${src}"`,
      { timeoutInMilliseconds: holdRenderTimeout },
    );
    holdHandleRef.current = handle;

    let cancelled = false;

    getOrLoadGif(src)
      .then((gif) => {
        if (!cancelled) {
          gifRef.current = gif;

          // Create the offscreen compositing canvas
          const composite = document.createElement('canvas');
          composite.width = gif.width;
          composite.height = gif.height;
          compositeCanvasRef.current = composite;

          setLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Gif: failed to load', err);
      })
      .finally(() => {
        if (holdHandleRef.current !== null) {
          releaseRender(holdHandleRef.current);
          holdHandleRef.current = null;
        }
      });

    return () => {
      cancelled = true;
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    };
  }, [src, holdRenderTimeout]);

  // Render the correct GIF frame onto the canvas
  useEffect(() => {
    if (!loaded || !gifRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const compositeCanvas = compositeCanvasRef.current;
    if (!compositeCanvas) return;
    const compositeCtx = compositeCanvas.getContext('2d');
    if (!compositeCtx) return;

    const gif = gifRef.current;
    const { frames, totalDurationMs } = gif;

    if (frames.length === 0 || totalDurationMs <= 0) return;

    // Calculate playback position in ms
    let timeMs = (localFrame / fps) * 1000;
    if (playbackRate !== 1) {
      timeMs *= playbackRate;
    }

    if (loop) {
      timeMs = ((timeMs % totalDurationMs) + totalDurationMs) % totalDurationMs;
    } else {
      timeMs = Math.min(timeMs, totalDurationMs - 1);
    }

    // Find the frame at this time
    let accumulated = 0;
    let frameIndex = 0;
    for (let i = 0; i < frames.length; i++) {
      accumulated += frames[i].delay;
      if (timeMs < accumulated) {
        frameIndex = i;
        break;
      }
      if (i === frames.length - 1) {
        frameIndex = i;
      }
    }

    // Only re-render if the frame index changed
    if (frameIndex === lastFrameIndexRef.current) return;

    // If we jumped backwards, we need to re-composite from the start
    if (frameIndex < lastFrameIndexRef.current) {
      compositeCtx.clearRect(0, 0, gif.width, gif.height);
      for (let i = 0; i <= frameIndex; i++) {
        const prev = i > 0 ? frames[i - 1] : null;
        renderFrame(ctx, compositeCtx, frames[i], gif.width, gif.height, prev);
      }
    } else {
      // Render forward from last rendered frame
      const start = lastFrameIndexRef.current < 0 ? 0 : lastFrameIndexRef.current + 1;
      for (let i = start; i <= frameIndex; i++) {
        const prev = i > 0 ? frames[i - 1] : null;
        renderFrame(ctx, compositeCtx, frames[i], gif.width, gif.height, prev);
      }
    }

    lastFrameIndexRef.current = frameIndex;
  }, [localFrame, fps, loaded, playbackRate, loop]);

  const gif = gifRef.current;
  const displayWidth = width ?? gif?.width ?? 0;
  const displayHeight = height ?? gif?.height ?? 0;

  const fitStyle: CSSProperties = {};
  if (fit === 'contain' || fit === 'cover') {
    fitStyle.objectFit = fit;
  }

  return (
    <canvas
      ref={canvasRef}
      width={gif?.width ?? displayWidth}
      height={gif?.height ?? displayHeight}
      style={{
        width: displayWidth || undefined,
        height: displayHeight || undefined,
        ...fitStyle,
        ...style,
      }}
      className={className}
    />
  );
}

Gif.displayName = 'Gif';
