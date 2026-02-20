import React, { useContext, useEffect, useRef, useState, type CSSProperties } from 'react';
import { TimelineContext } from '../context/TimelineContext';
import { SequenceContext } from '../context/SequenceContext';
import { CompositionContext } from '../context/CompositionContext';
import { holdRender, releaseRender } from '../delay-render';

interface DecodedFrame {
  image: ImageBitmap;
  /** Duration in milliseconds */
  duration: number;
}

export interface AnimatedImageProps {
  src: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
  className?: string;
  /** Timeout for holdRender in milliseconds. Default: 30000 */
  holdRenderTimeout?: number;
}

export function AnimatedImage({
  src,
  width,
  height,
  style,
  className,
  holdRenderTimeout = 30000,
}: AnimatedImageProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeline = useContext(TimelineContext);
  const sequence = useContext(SequenceContext);
  const composition = useContext(CompositionContext);
  const framesRef = useRef<DecodedFrame[]>([]);
  const holdHandleRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fps = composition?.fps ?? 30;
  const localFrame = timeline.frame - sequence.accumulatedOffset;

  // Load and decode all frames
  useEffect(() => {
    const handle = holdRender(
      `Loading <AnimatedImage> frames from "${src}"`,
      { timeoutInMilliseconds: holdRenderTimeout },
    );
    holdHandleRef.current = handle;

    let cancelled = false;

    async function decodeFrames() {
      try {
        const response = await fetch(src);
        const blob = await response.blob();

        if (typeof ImageDecoder !== 'undefined') {
          // Use ImageDecoder API for precise frame extraction (Chromium)
          const decoder = new ImageDecoder({
            data: await blob.arrayBuffer(),
            type: blob.type,
          });

          await decoder.tracks.ready;
          const track = decoder.tracks.selectedTrack;
          if (!track) throw new Error('No image track found');

          const frameCount = track.frameCount;
          const frames: DecodedFrame[] = [];

          for (let i = 0; i < frameCount; i++) {
            const result = await decoder.decode({ frameIndex: i });
            const bitmap = await createImageBitmap(result.image);
            // duration is in microseconds, convert to milliseconds
            const durationMs = (result.image.duration ?? 100000) / 1000;
            frames.push({ image: bitmap, duration: durationMs });
            result.image.close();
          }

          decoder.close();

          if (!cancelled) {
            framesRef.current = frames;
            setLoaded(true);
          }
        } else {
          // Fallback: render as a single static frame
          const bitmap = await createImageBitmap(blob);
          if (!cancelled) {
            framesRef.current = [{ image: bitmap, duration: Infinity }];
            setLoaded(true);
          }
        }
      } catch (err) {
        console.error('AnimatedImage: failed to decode frames', err);
      } finally {
        if (holdHandleRef.current !== null) {
          releaseRender(holdHandleRef.current);
          holdHandleRef.current = null;
        }
      }
    }

    decodeFrames();

    return () => {
      cancelled = true;
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    };
  }, [src, holdRenderTimeout]);

  // Map Rendiv frame to animation frame and draw on canvas
  useEffect(() => {
    if (!loaded || framesRef.current.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frames = framesRef.current;

    // Calculate which animation frame corresponds to this Rendiv frame
    const timeInMs = (localFrame / fps) * 1000;

    // Compute total animation duration
    let totalDuration = 0;
    for (const f of frames) {
      totalDuration += f.duration;
    }

    if (totalDuration <= 0) return;

    // Loop the animation by wrapping time
    const wrappedTime = ((timeInMs % totalDuration) + totalDuration) % totalDuration;

    // Find the frame at this time
    let accumulatedTime = 0;
    let animFrameIndex = 0;

    for (let i = 0; i < frames.length; i++) {
      accumulatedTime += frames[i].duration;
      if (wrappedTime < accumulatedTime) {
        animFrameIndex = i;
        break;
      }
    }

    const frame = frames[animFrameIndex];
    if (frame) {
      canvas.width = width ?? frame.image.width;
      canvas.height = height ?? frame.image.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frame.image, 0, 0, canvas.width, canvas.height);
    }
  }, [localFrame, fps, loaded, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={style}
      className={className}
    />
  );
}

AnimatedImage.displayName = 'AnimatedImage';
