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
  const playPendingRef = useRef(false);
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

    if (timeline.playing) {
      if (audio.paused) {
        // Audio not yet running — seek once, then call play().
        // While play() is pending, do NOT re-seek — each seek aborts
        // the pending play request in Chrome.
        if (!playPendingRef.current) {
          audio.currentTime = currentTime;
          playPendingRef.current = true;
          audio.play().then(() => {
            playPendingRef.current = false;
          }).catch(() => {
            playPendingRef.current = false;
          });
        }
      } else {
        // Playing normally — only correct large drift.
        // Relaxed threshold + cooldown avoids rapid seeks that cause pops.
        playPendingRef.current = false;
        const drift = Math.abs(audio.currentTime - currentTime);
        if (drift > 0.3) {
          const now = performance.now();
          if (now - lastSeekRef.current > 500) {
            audio.currentTime = currentTime;
            lastSeekRef.current = now;
          }
        }
      }
    } else {
      // Paused — stop playback and seek to correct position for scrubbing
      playPendingRef.current = false;
      if (!audio.paused) audio.pause();
      if (Math.abs(audio.currentTime - currentTime) > 0.01) {
        audio.currentTime = currentTime;
      }
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

  // Register audio source metadata for the renderer to collect.
  // Uses a content-based key and no cleanup so entries persist across
  // the entire rendering session (Audio may unmount between frames).
  const effectiveDuration = endAt !== undefined
    ? Math.min(sequence.durationInFrames, endAt - startFrom)
    : sequence.durationInFrames;

  useEffect(() => {
    if (muted || volume === 0) return;
    if (typeof window === 'undefined') return;
    const w = window as unknown as Record<string, unknown>;
    if (!w.__RENDIV_AUDIO_SOURCES__) {
      w.__RENDIV_AUDIO_SOURCES__ = new Map<string, unknown>();
    }
    const sources = w.__RENDIV_AUDIO_SOURCES__ as Map<string, unknown>;
    const key = `audio|${src}|${sequence.accumulatedOffset}|${effectiveDuration}|${startFrom}|${volume}|${effectiveRate}`;
    sources.set(key, {
      type: 'audio' as const,
      src,
      startAtFrame: sequence.accumulatedOffset,
      durationInFrames: effectiveDuration,
      startFrom,
      volume,
      playbackRate: effectiveRate,
    });
    // No cleanup — entries persist so the renderer can collect after all frames
  }, [src, sequence.accumulatedOffset, effectiveDuration, startFrom, volume, effectiveRate, muted]);

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
