import { useState, useEffect, useRef, useCallback } from 'react';

export interface UsePlayerOptions {
  fps: number;
  durationInFrames: number;
  loop: boolean;
  playbackRate: number;
  autoPlay: boolean;
}

export interface UsePlayerReturn {
  frame: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (frame: number) => void;
}

export function usePlayer(options: UsePlayerOptions): UsePlayerReturn {
  const { fps, durationInFrames, loop, playbackRate, autoPlay } = options;

  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);
  const frameRef = useRef(0);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);

  const seekTo = useCallback(
    (f: number) => {
      const clamped = Math.max(0, Math.min(f, durationInFrames - 1));
      frameRef.current = clamped;
      setFrame(clamped);
    },
    [durationInFrames]
  );

  useEffect(() => {
    if (!playing) {
      lastTimeRef.current = null;
      accumulatorRef.current = 0;
      return;
    }

    let rafId: number;
    const msPerFrame = 1000 / (fps * playbackRate);

    const tick = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      accumulatorRef.current += delta;

      let newFrame = frameRef.current;
      let advanced = false;

      while (accumulatorRef.current >= msPerFrame) {
        accumulatorRef.current -= msPerFrame;
        newFrame += 1;
        advanced = true;

        if (newFrame >= durationInFrames) {
          if (loop) {
            newFrame = 0;
          } else {
            newFrame = durationInFrames - 1;
            setPlaying(false);
            break;
          }
        }
      }

      if (advanced) {
        frameRef.current = newFrame;
        setFrame(newFrame);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, fps, playbackRate, loop, durationInFrames]);

  return { frame, playing, play, pause, toggle, seekTo };
}
