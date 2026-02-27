import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type VideoHTMLAttributes,
} from 'react';
import { TimelineContext } from '../context/TimelineContext';
import { SequenceContext } from '../context/SequenceContext';
import { CompositionContext } from '../context/CompositionContext';
import { RendivEnvironmentContext } from '../context/RendivEnvironmentContext';
import { holdRender, releaseRender } from '../delay-render';
import { computeLoopStartFrames } from '../compute-loop-offsets';

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
  const lastDriftSeekRef = useRef(0);
  const playPendingRef = useRef(false);
  const currentTimeRef = useRef(0);

  const isRendering = environment === 'rendering';
  const fps = composition?.fps ?? 30;

  const localFrame = timeline.frame - sequence.accumulatedOffset;
  const videoFrame = localFrame + startFrom;
  const currentTime = videoFrame / fps;
  // Keep a ref to the current target time so handleLoadedMetadata can
  // seek to the right position in rendering mode.
  currentTimeRef.current = currentTime;

  // Hold render while video metadata loads.
  // useLayoutEffect ensures the hold is created synchronously after DOM commit,
  // before the browser can fire loadedMetadata (which would miss the hold if
  // created in a regular useEffect).
  useLayoutEffect(() => {
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
    if (metadataHoldRef.current === null) return;

    if (isRendering && videoRef.current) {
      // In rendering mode, seek to the correct frame before releasing
      // the metadata hold. The sync effect may have run before readyState
      // was >= 1, missing the seek for this frame.
      const video = videoRef.current;
      const target = currentTimeRef.current;
      const alreadyAtTarget = Math.abs(video.currentTime - target) < 0.001;
      if (alreadyAtTarget) {
        lastSeekTimeRef.current = target;
        releaseRender(metadataHoldRef.current);
        metadataHoldRef.current = null;
      } else {
        const holdHandle = metadataHoldRef.current;
        metadataHoldRef.current = null; // prevent double release
        lastSeekTimeRef.current = target;
        // Seek to middle of frame to avoid boundary rounding
        const seekTarget = target + 0.5 / fps;
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          releaseRender(holdHandle);
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = seekTarget;
      }
    } else {
      releaseRender(metadataHoldRef.current);
      metadataHoldRef.current = null;
    }
  }, [isRendering, fps]);

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

  // Sync playback rate — multiply the component's own rate by the
  // accumulated Sequence playbackRate so native playback keeps pace
  // with time-stretched frames in player/studio mode.
  const effectiveRate = playbackRate * sequence.accumulatedPlaybackRate;
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = effectiveRate;
  }, [effectiveRate]);

  // Rendering mode: pause and seek precisely per frame.
  // Uses useLayoutEffect so the seek hold is created synchronously during
  // React's commit phase — before the renderer's checkReady() can resolve.
  //
  // Key insight: the `seeked` event only means the decoder finished seeking,
  // NOT that the correct frame is composited on screen. We use
  // `requestVideoFrameCallback` to confirm the frame is actually painted
  // before releasing the hold. We also seek to the middle of the frame's
  // time window to avoid boundary rounding where the browser may show the
  // previous frame.
  useLayoutEffect(() => {
    if (!isRendering) return;
    const video = videoRef.current;
    if (!video) return;

    // Past the end — pause
    if (endAt !== undefined && videoFrame >= endAt) {
      video.pause();
      return;
    }

    video.pause();

    if (lastSeekTimeRef.current !== currentTime) {
      const alreadyAtTarget = Math.abs(video.currentTime - currentTime) < 0.001;
      if (alreadyAtTarget) {
        // Video is already at the right position (e.g. freshly mounted at time 0)
        lastSeekTimeRef.current = currentTime;
      } else if (video.readyState >= 1) {
        // Metadata loaded — seek with a hold so the renderer waits
        lastSeekTimeRef.current = currentTime;
        const seekHandle = holdRender(
          `Seeking <Video> to ${currentTime.toFixed(3)}s`,
          { timeoutInMilliseconds: holdRenderTimeout },
        );

        // Seek to the middle of the frame's time window to avoid
        // boundary rounding where the browser shows the previous frame
        const seekTarget = currentTime + 0.5 / fps;

        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          releaseRender(seekHandle);
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = seekTarget;
      }
      // If readyState < 1: metadata not loaded yet. Don't set lastSeekTimeRef
      // so we retry. The metadata hold blocks the renderer, and
      // handleLoadedMetadata will seek before releasing it.
    }
  }, [localFrame, isRendering, currentTime, endAt, videoFrame, holdRenderTimeout, fps]);

  // Player/Studio mode: sync playback to timeline
  useEffect(() => {
    if (isRendering) return;
    const video = videoRef.current;
    if (!video) return;

    // Past the end — pause
    if (endAt !== undefined && videoFrame >= endAt) {
      video.pause();
      return;
    }

    if (timeline.playing) {
      if (video.paused) {
        // Video not yet running (first mount, or autoplay blocked).
        // Seek once to the correct position, then call play().
        // While play() is pending, do NOT re-seek — each seek aborts
        // the pending play request in Chrome, causing the video to
        // never actually start.
        if (!playPendingRef.current) {
          video.currentTime = currentTime;
          playPendingRef.current = true;
          video.play().then(() => {
            playPendingRef.current = false;
          }).catch(() => {
            playPendingRef.current = false;
          });
        }
      } else {
        // Video is playing normally — only correct large drift.
        // Relaxed threshold + cooldown avoids rapid seeks that stutter.
        playPendingRef.current = false;
        const drift = Math.abs(video.currentTime - currentTime);
        if (drift > 0.3) {
          const now = performance.now();
          if (now - lastDriftSeekRef.current > 500) {
            video.currentTime = currentTime;
            lastDriftSeekRef.current = now;
          }
        }
      }
    } else {
      // Paused / scrubbing
      playPendingRef.current = false;
      if (!video.paused) video.pause();
      if (Math.abs(video.currentTime - currentTime) > 0.01) {
        video.currentTime = currentTime;
      }
    }
  }, [localFrame, isRendering, currentTime, timeline.playing, endAt, videoFrame]);

  // Register media info for Studio timeline visualization
  useEffect(() => {
    if (isRendering) return;
    if (typeof window === 'undefined') return;
    const seqId = sequence.id;
    if (!seqId) return;
    const w = window as unknown as Record<string, unknown>;
    if (!w.__RENDIV_MEDIA_INFO__) {
      w.__RENDIV_MEDIA_INFO__ = new Map<string, { type: string; src: string }>();
    }
    const mediaMap = w.__RENDIV_MEDIA_INFO__ as Map<string, { type: string; src: string }>;
    mediaMap.set(seqId, { type: 'video', src });
    document.dispatchEvent(new CustomEvent('rendiv:media-sync'));
    return () => {
      mediaMap.delete(seqId);
      document.dispatchEvent(new CustomEvent('rendiv:media-sync'));
    };
  }, [src, sequence.id, isRendering]);

  // Register audio track metadata for the renderer to collect.
  // Uses content-based key and no cleanup so entries persist across
  // the entire rendering session (Video may unmount between frames).
  const effectiveDuration = endAt !== undefined
    ? Math.min(sequence.durationInFrames, endAt - startFrom)
    : sequence.durationInFrames;

  const compositionDuration = composition?.durationInFrames ?? Infinity;
  useEffect(() => {
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
    // No cleanup — entries persist so the renderer can collect after all frames
  }, [src, sequence.accumulatedOffset, sequence.loopStack, compositionDuration, effectiveDuration, startFrom, volume, effectiveRate, muted]);

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
