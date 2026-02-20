import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
  type CSSProperties,
  type ComponentType,
} from 'react';
import {
  TimelineContext,
  CompositionContext,
  RendivEnvironmentContext,
  type CompositionConfig,
} from 'rendiv';
import { usePlayer } from './use-player';
import { PlayerEmitter, type PlayerEventMap } from './PlayerEmitter';
import { PlayerControls } from './PlayerControls';
import { ErrorBoundary } from './ErrorBoundary';

interface ErrorFallbackProps {
  error: Error;
}

export interface PlayerProps {
  component: ComponentType<Record<string, unknown>>;
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  style?: CSSProperties;
  controls?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  initiallyMuted?: boolean;
  inputProps?: Record<string, unknown>;
  playbackRate?: number;
  errorFallback?: ComponentType<ErrorFallbackProps>;
}

type Listener<T> = (data: T) => void;

export interface PlayerRef {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (frame: number) => void;
  getCurrentFrame: () => number;
  isPlaying: () => boolean;
  getContainerNode: () => HTMLDivElement | null;
  mute: () => void;
  unmute: () => void;
  setVolume: (v: number) => void;
  addEventListener: <K extends keyof PlayerEventMap>(
    event: K,
    callback: Listener<PlayerEventMap[K]>
  ) => void;
  removeEventListener: <K extends keyof PlayerEventMap>(
    event: K,
    callback: Listener<PlayerEventMap[K]>
  ) => void;
}

export const Player = forwardRef<PlayerRef, PlayerProps>((props, ref) => {
  const {
    component: Component,
    durationInFrames,
    fps,
    compositionWidth,
    compositionHeight,
    controls = false,
    loop = false,
    autoPlay = false,
    playbackRate = 1,
    inputProps = {},
    style,
    errorFallback,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const emitter = useMemo(() => new PlayerEmitter(), []);
  const [containerWidth, setContainerWidth] = useState(compositionWidth);

  const player = usePlayer({
    fps,
    durationInFrames,
    loop,
    playbackRate,
    autoPlay,
  });

  // Track container width for scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Emit events
  useEffect(() => {
    emitter.emit('frameupdate', { frame: player.frame });
  }, [player.frame, emitter]);

  useEffect(() => {
    if (player.playing) {
      emitter.emit('play');
    } else {
      emitter.emit('pause');
    }
  }, [player.playing, emitter]);

  const frameRef = useRef(player.frame);
  frameRef.current = player.frame;

  const playingRef = useRef(player.playing);
  playingRef.current = player.playing;

  useImperativeHandle(ref, () => ({
    play: player.play,
    pause: player.pause,
    toggle: player.toggle,
    seekTo: player.seekTo,
    getCurrentFrame: () => frameRef.current,
    isPlaying: () => playingRef.current,
    getContainerNode: () => containerRef.current,
    mute: () => {},
    unmute: () => {},
    setVolume: () => {},
    addEventListener: emitter.addEventListener.bind(emitter),
    removeEventListener: emitter.removeEventListener.bind(emitter),
  }));

  const videoConfig = useMemo<CompositionConfig>(
    () => ({
      id: 'player',
      width: compositionWidth,
      height: compositionHeight,
      fps,
      durationInFrames,
      defaultProps: inputProps,
    }),
    [compositionWidth, compositionHeight, fps, durationInFrames, inputProps]
  );

  const timelineValue = useMemo(
    () => ({
      frame: player.frame,
      playing: player.playing,
      playingRef: { current: player.playing },
    }),
    [player.frame, player.playing]
  );

  const environmentValue = useMemo(
    () => ({ environment: 'player' as const }),
    []
  );

  const scale = containerWidth / compositionWidth;
  const scaledHeight = compositionHeight * scale;

  // Keyboard controls
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        player.toggle();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        player.seekTo(player.frame - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        player.seekTo(player.frame + 1);
      } else if (e.key === '0') {
        e.preventDefault();
        player.seekTo(0);
      }
    },
    [player]
  );

  const compositionContent = (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...inputProps} />
    </ErrorBoundary>
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: scaledHeight,
        backgroundColor: '#000',
        ...style,
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          width: compositionWidth,
          height: compositionHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          overflow: 'hidden',
        }}
      >
        <RendivEnvironmentContext.Provider value={environmentValue}>
          <CompositionContext.Provider value={videoConfig}>
            <TimelineContext.Provider value={timelineValue}>
              {compositionContent}
            </TimelineContext.Provider>
          </CompositionContext.Provider>
        </RendivEnvironmentContext.Provider>
      </div>
      {controls && (
        <PlayerControls
          player={player}
          durationInFrames={durationInFrames}
          fps={fps}
        />
      )}
    </div>
  );
});

Player.displayName = 'Player';
