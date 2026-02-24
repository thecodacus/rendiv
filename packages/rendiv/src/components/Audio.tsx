import React, { useContext, useEffect, useRef } from 'react';
import { TimelineContext } from '../context/TimelineContext';
import { SequenceContext } from '../context/SequenceContext';
import { CompositionContext } from '../context/CompositionContext';
import { RendivEnvironmentContext } from '../context/RendivEnvironmentContext';

export interface AudioProps {
  src: string;
  /** Frame offset into the audio to start from. Default: 0 */
  startFrom?: number;
  /** Frame at which to stop the audio (relative to the audio timeline). */
  endAt?: number;
  /** Volume from 0 to 1. Default: 1 */
  volume?: number;
  /** Playback speed multiplier. Default: 1 */
  playbackRate?: number;
  muted?: boolean;
}

export function Audio({
  src,
  startFrom = 0,
  endAt,
  volume = 1,
  playbackRate = 1,
  muted = false,
}: AudioProps): React.ReactElement | null {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSeekRef = useRef(0);
  const timeline = useContext(TimelineContext);
  const sequence = useContext(SequenceContext);
  const composition = useContext(CompositionContext);
  const { environment } = useContext(RendivEnvironmentContext);

  const isRendering = environment === 'rendering';
  const fps = composition?.fps ?? 30;

  const localFrame = timeline.frame - sequence.accumulatedOffset;
  const audioFrame = localFrame + startFrom;
  const currentTime = audioFrame / fps;

  // Sync volume and muted
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // Sync playback rate — multiply the component's own rate by the
  // accumulated Sequence playbackRate so native playback keeps pace
  // with time-stretched frames in player/studio mode.
  const effectiveRate = playbackRate * sequence.accumulatedPlaybackRate;
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = effectiveRate;
  }, [effectiveRate]);

  // Sync currentTime and play/pause state
  useEffect(() => {
    if (isRendering) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Past the end — pause
    if (endAt !== undefined && audioFrame >= endAt) {
      audio.pause();
      return;
    }

    // Correct drift — use a relaxed threshold (0.3s) and a 500ms cooldown
    // after each seek to avoid rapid repeated seeks that cause audio pops.
    const drift = Math.abs(audio.currentTime - currentTime);
    if (drift > 0.3) {
      const now = performance.now();
      if (now - lastSeekRef.current > 500) {
        audio.currentTime = currentTime;
        lastSeekRef.current = now;
      }
    }

    if (timeline.playing && audio.paused) {
      audio.play().catch(() => {
        // Autoplay may be blocked — ignore
      });
    } else if (!timeline.playing && !audio.paused) {
      audio.pause();
    }
  }, [localFrame, isRendering, currentTime, timeline.playing, endAt, audioFrame]);

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
    mediaMap.set(seqId, { type: 'audio', src });
    document.dispatchEvent(new CustomEvent('rendiv:media-sync'));
    return () => {
      mediaMap.delete(seqId);
      document.dispatchEvent(new CustomEvent('rendiv:media-sync'));
    };
  }, [src, sequence.id, isRendering]);

  // In rendering mode, audio is not captured via screenshots
  if (isRendering) return null;

  return (
    <audio
      ref={audioRef}
      src={src}
      preload="auto"
    />
  );
}

Audio.displayName = 'Audio';
