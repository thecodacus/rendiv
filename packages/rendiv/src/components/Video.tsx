import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  type CSSProperties,
  type VideoHTMLAttributes,
} from 'react';
import { TimelineContext } from '../context/TimelineContext';
import { SequenceContext } from '../context/SequenceContext';
import { CompositionContext } from '../context/CompositionContext';
import { RendivEnvironmentContext } from '../context/RendivEnvironmentContext';
import { holdRender, releaseRender } from '../delay-render';

export interface VideoProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'autoPlay'> {
  src: string;
  /** Frame offset into the video to start from. Default: 0 */
  startFrom?: number;
  /** Frame at which to stop the video (relative to the video timeline). */
  endAt?: number;
  /** Volume from 0 to 1. Default: 1 */
  volume?: number;
  /** Playback speed multiplier. Default: 1 */
  playbackRate?: number;
  muted?: boolean;
  style?: CSSProperties;
  className?: string;
  /** Timeout for holdRender in milliseconds. Default: 30000 */
  holdRenderTimeout?: number;
}

export function Video({
  src,
  startFrom = 0,
  endAt,
  volume = 1,
  playbackRate = 1,
  muted = false,
  style,
  className,
  holdRenderTimeout = 30000,
  ...restProps
}: VideoProps): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeline = useContext(TimelineContext);
  const sequence = useContext(SequenceContext);
  const composition = useContext(CompositionContext);
  const { environment } = useContext(RendivEnvironmentContext);
  const metadataHoldRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number | null>(null);

  const isRendering = environment === 'rendering';
  const fps = composition?.fps ?? 30;

  const localFrame = timeline.frame - sequence.accumulatedOffset;
  const videoFrame = localFrame + startFrom;
  const currentTime = videoFrame / fps;

  // Hold render while video metadata loads
  useEffect(() => {
    const handle = holdRender(
      `Loading <Video> metadata for src="${src}"`,
      { timeoutInMilliseconds: holdRenderTimeout },
    );
    metadataHoldRef.current = handle;

    return () => {
      if (metadataHoldRef.current !== null) {
        releaseRender(metadataHoldRef.current);
        metadataHoldRef.current = null;
      }
    };
  }, [src, holdRenderTimeout]);

  const handleLoadedMetadata = useCallback(() => {
    if (metadataHoldRef.current !== null) {
      releaseRender(metadataHoldRef.current);
      metadataHoldRef.current = null;
    }
  }, []);

  const handleError = useCallback(() => {
    if (metadataHoldRef.current !== null) {
      releaseRender(metadataHoldRef.current);
      metadataHoldRef.current = null;
    }
  }, []);

  // Sync volume and muted
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
  }, [volume, muted]);

  // Sync playback rate
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  // Sync currentTime to frame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Past the end — pause
    if (endAt !== undefined && videoFrame >= endAt) {
      video.pause();
      return;
    }

    if (isRendering) {
      // Rendering mode: pause and seek precisely per frame
      video.pause();

      if (lastSeekTimeRef.current !== currentTime) {
        lastSeekTimeRef.current = currentTime;

        const seekHandle = holdRender(
          `Seeking <Video> to ${currentTime.toFixed(3)}s`,
          { timeoutInMilliseconds: holdRenderTimeout },
        );

        const onSeeked = () => {
          releaseRender(seekHandle);
          video.removeEventListener('seeked', onSeeked);
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = currentTime;
      }
    } else {
      // Player/Studio mode: let video play naturally, correct drift
      const drift = Math.abs(video.currentTime - currentTime);
      if (drift > 0.1) {
        video.currentTime = currentTime;
      }

      if (timeline.playing && video.paused) {
        video.play().catch(() => {
          // Autoplay may be blocked — ignore
        });
      } else if (!timeline.playing && !video.paused) {
        video.pause();
      }
    }
  }, [localFrame, isRendering, currentTime, timeline.playing, endAt, videoFrame, holdRenderTimeout]);

  return (
    <video
      ref={videoRef}
      src={src}
      preload="auto"
      playsInline
      style={style}
      className={className}
      onLoadedMetadata={handleLoadedMetadata}
      onError={handleError}
      {...restProps}
    />
  );
}

Video.displayName = 'Video';
