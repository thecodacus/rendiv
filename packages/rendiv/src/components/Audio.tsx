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
  const timeline = useContext(TimelineContext);
  const sequence = useContext(SequenceContext);
  const composition = useContext(CompositionContext);
  const { environment } = useContext(RendivEnvironmentContext);

  const isRendering = environment === 'rendering';
  const fps = composition?.fps ?? 30;

  const localFrame = timeline.frame - sequence.accumulatedOffset;
  const audioFrame = localFrame + startFrom;
  const currentTime = audioFrame / fps;

  // Sync audio playback in player/studio mode
  useEffect(() => {
    if (isRendering) return;

    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.muted = muted;
    audio.playbackRate = playbackRate;

    // Past the end — pause
    if (endAt !== undefined && audioFrame >= endAt) {
      audio.pause();
      return;
    }

    // Correct drift
    const drift = Math.abs(audio.currentTime - currentTime);
    if (drift > 0.1) {
      audio.currentTime = currentTime;
    }

    if (timeline.playing && audio.paused) {
      audio.play().catch(() => {
        // Autoplay may be blocked — ignore
      });
    } else if (!timeline.playing && !audio.paused) {
      audio.pause();
    }
  }, [localFrame, isRendering, currentTime, timeline.playing, volume, muted, playbackRate, endAt, audioFrame]);

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
