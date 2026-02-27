import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { TimelineContext } from '../context/TimelineContext';
import { SequenceContext } from '../context/SequenceContext';
import { CompositionContext } from '../context/CompositionContext';
import { RendivEnvironmentContext } from '../context/RendivEnvironmentContext';
import { holdRender, releaseRender } from '../delay-render';
import { computeLoopStartFrames } from '../compute-loop-offsets';
import { Video } from './Video';

export interface OffthreadVideoProps {
  src: string;
  /** Frame offset into the video to start from. Default: 0 */
  startFrom?: number;
  /** Frame at which to stop the video (relative to the video timeline). */
  endAt?: number;
  /** Volume from 0 to 1. Default: 1. Only applies in player/studio mode. */
  volume?: number;
  /** Playback speed multiplier. Default: 1 */
  playbackRate?: number;
  muted?: boolean;
  style?: CSSProperties;
  className?: string;
  /** Timeout for holdRender in milliseconds. Default: 30000 */
  holdRenderTimeout?: number;
  /** When true, render nothing when the video frame extraction fails (e.g. past end of video).
   *  When false (default), the last successfully extracted frame is kept visible. */
  showEmptyOnEnd?: boolean;
}

export function OffthreadVideo({
  src,
  startFrom = 0,
  endAt,
  volume = 1,
  playbackRate = 1,
  muted = false,
  style,
  className,
  holdRenderTimeout = 30000,
  showEmptyOnEnd = false,
}: OffthreadVideoProps): React.ReactElement | null {
  const timeline = useContext(TimelineContext);
  const sequence = useContext(SequenceContext);
  const composition = useContext(CompositionContext);
  const { environment } = useContext(RendivEnvironmentContext);

  const isRendering = environment === 'rendering';
  const fps = composition?.fps ?? 30;

  const localFrame = timeline.frame - sequence.accumulatedOffset;
  const videoFrame = localFrame + startFrom;
  const currentTime = videoFrame / fps;

  const effectiveRate = playbackRate * sequence.accumulatedPlaybackRate;
  const effectiveDuration = endAt !== undefined
    ? Math.min(sequence.durationInFrames, endAt - startFrom)
    : sequence.durationInFrames;

  // Register audio track metadata for the renderer to collect.
  // In rendering mode OffthreadVideo uses <img> (no <video> element),
  // so it must register audio separately — same pattern as Video/Audio.
  const compositionDuration = composition?.durationInFrames ?? Infinity;
  useEffect(() => {
    if (!isRendering) return;
    if (muted || volume === 0) return;
    if (typeof window === 'undefined') return;
    const w = window as unknown as Record<string, unknown>;
    if (!w.__RENDIV_AUDIO_SOURCES__) {
      w.__RENDIV_AUDIO_SOURCES__ = new Map<string, unknown>();
    }
    const sources = w.__RENDIV_AUDIO_SOURCES__ as Map<string, unknown>;
    const startFrames = computeLoopStartFrames(sequence.accumulatedOffset, sequence.loopStack, compositionDuration);
    for (const startFrame of startFrames) {
      const key = `video|${src}|${startFrame}|${effectiveDuration}|${startFrom}|${volume}|${effectiveRate}`;
      sources.set(key, {
        type: 'video' as const,
        src,
        startAtFrame: startFrame,
        durationInFrames: effectiveDuration,
        startFrom,
        volume,
        playbackRate: effectiveRate,
      });
    }
  }, [isRendering, src, sequence.accumulatedOffset, sequence.loopStack, compositionDuration, effectiveDuration, startFrom, volume, effectiveRate, muted]);

  if (!isRendering) {
    return (
      <Video
        src={src}
        startFrom={startFrom}
        endAt={endAt}
        volume={volume}
        playbackRate={playbackRate}
        muted={muted}
        style={style}
        className={className}
        holdRenderTimeout={holdRenderTimeout}
      />
    );
  }

  return (
    <OffthreadVideoRendering
      src={src}
      currentTime={currentTime}
      videoFrame={videoFrame}
      endAt={endAt}
      style={style}
      className={className}
      holdRenderTimeout={holdRenderTimeout}
      showEmptyOnEnd={showEmptyOnEnd}
    />
  );
}

OffthreadVideo.displayName = 'OffthreadVideo';

// --- Rendering mode: fetch frame via FFmpeg extraction endpoint ---

function OffthreadVideoRendering({
  src,
  currentTime,
  videoFrame,
  endAt,
  style,
  className,
  holdRenderTimeout,
  showEmptyOnEnd,
}: {
  src: string;
  currentTime: number;
  videoFrame: number;
  endAt?: number;
  style?: CSSProperties;
  className?: string;
  holdRenderTimeout: number;
  showEmptyOnEnd: boolean;
}): React.ReactElement | null {
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const holdHandleRef = useRef<number | null>(null);
  const prevObjectUrlRef = useRef<string | null>(null);

  // Past the end — render nothing
  if (endAt !== undefined && videoFrame >= endAt) {
    return null;
  }

  // Fetch the frame from the extraction endpoint
  useEffect(() => {
    const handle = holdRender(
      `Extracting <OffthreadVideo> frame at ${currentTime.toFixed(3)}s from "${src}"`,
      { timeoutInMilliseconds: holdRenderTimeout },
    );
    holdHandleRef.current = handle;

    const params = new URLSearchParams({
      src,
      time: String(currentTime),
    });
    const url = `${window.location.origin}/__offthread_video__?${params.toString()}`;

    let cancelled = false;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`OffthreadVideo: Failed to extract frame (HTTP ${res.status})`);
        }
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;

        // Empty or corrupt response (valid PNG is at least ~67 bytes).
        // Keep the previous frame visible unless showEmptyOnEnd is set.
        if (blob.size < 100) {
          if (showEmptyOnEnd) {
            if (prevObjectUrlRef.current) {
              URL.revokeObjectURL(prevObjectUrlRef.current);
              prevObjectUrlRef.current = null;
            }
            setFrameSrc(null);
          }
          if (holdHandleRef.current !== null) {
            releaseRender(holdHandleRef.current);
            holdHandleRef.current = null;
          }
          return;
        }

        // Revoke previous object URL to prevent memory leaks
        if (prevObjectUrlRef.current) {
          URL.revokeObjectURL(prevObjectUrlRef.current);
        }

        const objectUrl = URL.createObjectURL(blob);
        prevObjectUrlRef.current = objectUrl;
        setFrameSrc(objectUrl);
        // holdRender is released in onLoad/onError below
      })
      .catch(() => {
        // Frame extraction failed (e.g. past end of video).
        // Keep showing the last valid frame unless showEmptyOnEnd is set.
        if (showEmptyOnEnd) {
          if (prevObjectUrlRef.current) {
            URL.revokeObjectURL(prevObjectUrlRef.current);
            prevObjectUrlRef.current = null;
          }
          setFrameSrc(null);
        }
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
  }, [currentTime, src, holdRenderTimeout, showEmptyOnEnd]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (prevObjectUrlRef.current) {
        URL.revokeObjectURL(prevObjectUrlRef.current);
        prevObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleLoad = useCallback(() => {
    if (holdHandleRef.current !== null) {
      releaseRender(holdHandleRef.current);
      holdHandleRef.current = null;
    }
  }, []);

  const handleError = useCallback(() => {
    if (holdHandleRef.current !== null) {
      releaseRender(holdHandleRef.current);
      holdHandleRef.current = null;
    }
  }, []);

  if (!frameSrc) return null;

  return (
    <img
      src={frameSrc}
      style={style}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      alt=""
    />
  );
}
