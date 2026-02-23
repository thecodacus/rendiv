import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Player, type PlayerRef } from '@rendiv/player';
import type { CompositionEntry, TimelineEntry, TimelineOverride } from '@rendiv/core';
import { previewStyles, colors, fonts } from './styles';
import { usePreviewDrag, type HandleType, type VisibleEntry } from './use-preview-drag';

interface PreviewProps {
  composition: CompositionEntry;
  inputProps: Record<string, unknown>;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onInputPropsChange: (props: Record<string, unknown>) => void;
  onFrameUpdate?: (frame: number) => void;
  seekRef?: React.MutableRefObject<((frame: number) => void) | null>;
  overrides: Map<string, TimelineOverride>;
  onOverrideChange: (namePath: string, override: TimelineOverride) => void;
  onPositionReset: (namePath: string) => void;
  timelineEntries: TimelineEntry[];
}

const SPEED_STEPS = [0.25, 0.5, 1, 2, 4];

// Block colors — same palette as TimelineEditor
const BLOCK_COLORS = [
  '#1f6feb', '#238636', '#8957e5', '#da3633',
  '#d29922', '#1a7f37', '#6639ba', '#cf222e',
];

function formatTime(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

function getCursorForHandle(handle: HandleType): string {
  switch (handle) {
    case 'move': return 'move';
    case 'scale-tl': case 'scale-br': return 'nwse-resize';
    case 'scale-tr': case 'scale-bl': return 'nesw-resize';
    default: return 'default';
  }
}

export const Preview: React.FC<PreviewProps> = ({
  composition,
  inputProps,
  playbackRate,
  onPlaybackRateChange,
  onInputPropsChange,
  onFrameUpdate,
  seekRef,
  overrides,
  onOverrideChange,
  onPositionReset,
  timelineEntries,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const [propsText, setPropsText] = useState('');
  const [propsError, setPropsError] = useState(false);
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const [positionMode, setPositionMode] = useState(false);

  // Track player wrapper dimensions to fit the player within both axes
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWrapperSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Expose seekTo to parent via mutable ref
  useEffect(() => {
    if (seekRef) {
      seekRef.current = (frame: number) => playerRef.current?.seekTo(frame);
    }
    return () => {
      if (seekRef) seekRef.current = null;
    };
  }, [seekRef]);

  const mergedProps = { ...composition.defaultProps, ...inputProps };

  // Sync props editor when composition changes.
  useEffect(() => {
    setPropsText(JSON.stringify({ ...composition.defaultProps, ...inputProps }, null, 2));
    setPropsError(false);
  }, [composition.id]);

  // Track frame updates and play state
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame = (data: { frame: number }) => {
      setCurrentFrame(data.frame);
      onFrameUpdate?.(data.frame);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    return () => {
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
    };
  }, [composition.id]);

  // Compute player scale factor
  const playerWidth = wrapperSize.width > 0 && wrapperSize.height > 0
    ? Math.min(wrapperSize.width, wrapperSize.height * (composition.width / composition.height))
    : 0;
  const playerScale = playerWidth > 0 ? playerWidth / composition.width : 1;
  const playerHeight = playerWidth > 0 ? playerWidth / (composition.width / composition.height) : 0;

  // Position mode drag hook
  const {
    handleMouseDown,
    handleOverlayMouseMove,
    handleOverlayMouseLeave,
    hoveredNamePath,
    draggingNamePath,
    handleType,
    visibleEntries,
  } = usePreviewDrag({
    timelineEntries,
    overrides,
    currentFrame,
    compositionWidth: composition.width,
    compositionHeight: composition.height,
    playerScale,
    enabled: positionMode,
    onOverrideChange,
  });

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // P key toggles position mode
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setPositionMode((prev) => !prev);
        return;
      }

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (isPlaying) {
          playerRef.current?.pause();
        } else {
          playerRef.current?.play();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playerRef.current?.seekTo(Math.max(0, currentFrame - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        playerRef.current?.seekTo(Math.min(composition.durationInFrames - 1, currentFrame + 1));
      } else if (e.key === '0') {
        e.preventDefault();
        playerRef.current?.seekTo(0);
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const currentIdx = SPEED_STEPS.indexOf(playbackRate);
        if (currentIdx > 0) {
          onPlaybackRateChange(SPEED_STEPS[currentIdx - 1]);
        } else if (currentIdx === 0) {
          playerRef.current?.pause();
        }
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        const currentIdx = SPEED_STEPS.indexOf(playbackRate);
        if (currentIdx < SPEED_STEPS.length - 1) {
          onPlaybackRateChange(SPEED_STEPS[currentIdx + 1]);
          playerRef.current?.play();
        } else if (currentIdx === -1) {
          onPlaybackRateChange(1);
          playerRef.current?.play();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackRate, onPlaybackRateChange, isPlaying, currentFrame, composition.durationInFrames]);

  const handlePropsChange = useCallback(
    (text: string) => {
      setPropsText(text);
      try {
        const parsed = JSON.parse(text);
        setPropsError(false);
        onInputPropsChange(parsed);
      } catch {
        setPropsError(true);
      }
    },
    [onInputPropsChange],
  );

  const durationSeconds = (composition.durationInFrames / composition.fps).toFixed(1);

  // Build the overlay info label for dragging
  const activeEntry = visibleEntries.find(
    (ve) => ve.namePath === (draggingNamePath ?? hoveredNamePath),
  );
  const activeOverride = activeEntry ? overrides.get(activeEntry.namePath) : undefined;

  return (
    <div style={previewStyles.container}>
      {/* Metadata bar */}
      <div style={previewStyles.metadataBar}>
        <span>
          <span style={previewStyles.metadataLabel}>Size </span>
          <span style={previewStyles.metadataValue}>
            {composition.width}x{composition.height}
          </span>
        </span>
        <span>
          <span style={previewStyles.metadataLabel}>FPS </span>
          <span style={previewStyles.metadataValue}>{composition.fps}</span>
        </span>
        <span>
          <span style={previewStyles.metadataLabel}>Frames </span>
          <span style={previewStyles.metadataValue}>{composition.durationInFrames}</span>
        </span>
        <span>
          <span style={previewStyles.metadataLabel}>Duration </span>
          <span style={previewStyles.metadataValue}>{durationSeconds}s</span>
        </span>
        <span>
          <span style={previewStyles.metadataLabel}>Frame </span>
          <span style={previewStyles.metadataValue}>
            {currentFrame} / {composition.durationInFrames - 1}
          </span>
        </span>
        <span>
          <span style={previewStyles.metadataLabel}>Time </span>
          <span style={previewStyles.metadataValue}>
            {formatTime(currentFrame, composition.fps)}
          </span>
        </span>
        {playbackRate !== 1 && (
          <span style={previewStyles.speedIndicator}>{playbackRate}x</span>
        )}
      </div>

      {/* Player */}
      <div ref={wrapperRef} style={previewStyles.playerWrapper}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Player
            key={composition.id}
            ref={playerRef}
            component={composition.component}
            compositionId={composition.id}
            durationInFrames={composition.durationInFrames}
            fps={composition.fps}
            compositionWidth={composition.width}
            compositionHeight={composition.height}
            inputProps={mergedProps}
            playbackRate={playbackRate}
            loop
            style={{
              width: playerWidth > 0 ? playerWidth : '100%',
            }}
          />

          {/* Position mode overlay */}
          {positionMode && playerWidth > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: playerWidth,
                height: playerHeight,
                cursor: handleType ? getCursorForHandle(handleType) : 'default',
                zIndex: 10,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleOverlayMouseMove}
              onMouseLeave={handleOverlayMouseLeave}
            >
              {visibleEntries.map((ve, i) => {
                const bx = ve.x * playerScale;
                const by = ve.y * playerScale;
                const bw = ve.w * playerScale;
                const bh = ve.h * playerScale;
                const isHovered = ve.namePath === hoveredNamePath;
                const isDragging = ve.namePath === draggingNamePath;
                const isActive = isHovered || isDragging;
                const color = BLOCK_COLORS[ve.trackIndex % BLOCK_COLORS.length];
                const veOverride = overrides.get(ve.namePath);
                const hasPosition = veOverride && (
                  (veOverride.x !== undefined && veOverride.x !== 0) ||
                  (veOverride.y !== undefined && veOverride.y !== 0) ||
                  (veOverride.scaleX !== undefined && veOverride.scaleX !== 1) ||
                  (veOverride.scaleY !== undefined && veOverride.scaleY !== 1)
                );

                return (
                  <div key={ve.namePath}>
                    {/* Bounding box */}
                    <div
                      style={{
                        position: 'absolute',
                        left: bx,
                        top: by,
                        width: bw,
                        height: bh,
                        border: `${isActive ? 2 : 1}px solid ${color}`,
                        backgroundColor: isActive ? `${color}18` : 'transparent',
                        borderRadius: 2,
                        pointerEvents: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      {/* Name label + info */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          pointerEvents: 'none',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: '#fff',
                            backgroundColor: color,
                            padding: '1px 5px',
                            borderRadius: 3,
                            whiteSpace: 'nowrap',
                            opacity: isActive ? 1 : 0.7,
                          }}
                        >
                          {ve.name}
                          {isActive && veOverride && (
                            <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.8 }}>
                              {veOverride.x ?? 0}, {veOverride.y ?? 0}
                              {(veOverride.scaleX !== undefined && veOverride.scaleX !== 1) ||
                              (veOverride.scaleY !== undefined && veOverride.scaleY !== 1)
                                ? ` ${Math.round((veOverride.scaleX ?? 1) * 100)}%x${Math.round((veOverride.scaleY ?? 1) * 100)}%`
                                : ''}
                            </span>
                          )}
                        </span>
                        {isActive && hasPosition && (
                          <button
                            style={resetOverlayBtnStyle}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              onPositionReset(ve.namePath);
                            }}
                            title="Reset position & scale"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Corner handles (only on active entry) */}
                    {isActive && (
                      <>
                        <CornerHandle x={bx} y={by} color={color} />
                        <CornerHandle x={bx + bw} y={by} color={color} />
                        <CornerHandle x={bx} y={by + bh} color={color} />
                        <CornerHandle x={bx + bw} y={by + bh} color={color} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Playback controls */}
      <div style={controlsBarStyle}>
        <div style={controlsLeftStyle}>
          <button
            style={controlBtnStyle}
            onClick={() => playerRef.current?.seekTo(0)}
            title="Go to start (0)"
          >
            &#x23EE;
          </button>
          <button
            style={controlBtnStyle}
            onClick={() => playerRef.current?.seekTo(Math.max(0, currentFrame - 1))}
            title="Step back (\u2190)"
          >
            &#x23F4;
          </button>
          <button
            style={{ ...controlBtnStyle, fontSize: 16, width: 36, height: 28 }}
            onClick={() => (isPlaying ? playerRef.current?.pause() : playerRef.current?.play())}
            title="Play/Pause (Space)"
          >
            {isPlaying ? '\u23F8' : '\u25B6'}
          </button>
          <button
            style={controlBtnStyle}
            onClick={() => playerRef.current?.seekTo(Math.min(composition.durationInFrames - 1, currentFrame + 1))}
            title="Step forward (\u2192)"
          >
            &#x23F5;
          </button>
          <button
            style={controlBtnStyle}
            onClick={() => playerRef.current?.seekTo(composition.durationInFrames - 1)}
            title="Go to end"
          >
            &#x23ED;
          </button>
        </div>
        <div style={controlsRightStyle}>
          {/* Position mode toggle */}
          <button
            style={{
              ...positionBtnStyle,
              backgroundColor: positionMode ? colors.accentMuted : 'transparent',
              color: positionMode ? '#fff' : colors.textSecondary,
            }}
            onClick={() => setPositionMode((prev) => !prev)}
            title="Position mode (P)"
          >
            Position
          </button>
          <span style={frameCounterStyle}>
            {currentFrame} / {composition.durationInFrames - 1}
          </span>
          <span style={timeDisplayStyle}>
            {formatTime(currentFrame, composition.fps)}
          </span>
          <div style={speedGroupStyle}>
            {SPEED_STEPS.map((s) => (
              <button
                key={s}
                style={{
                  ...speedBtnStyle,
                  backgroundColor: playbackRate === s ? colors.accentMuted : 'transparent',
                  color: playbackRate === s ? '#fff' : colors.textSecondary,
                }}
                onClick={() => onPlaybackRateChange(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Props editor */}
      {Object.keys(composition.defaultProps).length > 0 && (
        <div style={previewStyles.propsContainer}>
          <div
            style={previewStyles.propsHeader}
            onClick={() => setPropsOpen(!propsOpen)}
          >
            <span>{propsOpen ? '\u25BC' : '\u25B6'} Input Props</span>
            {propsError && (
              <span style={{ color: colors.error, fontSize: 11 }}>Invalid JSON</span>
            )}
          </div>
          {propsOpen && (
            <textarea
              style={{
                ...previewStyles.propsTextarea,
                borderColor: propsError ? colors.error : undefined,
              }}
              value={propsText}
              onChange={(e) => handlePropsChange(e.target.value)}
              spellCheck={false}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Small square handle rendered at corners of the bounding box
const CornerHandle: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <div
    style={{
      position: 'absolute',
      left: x - 4,
      top: y - 4,
      width: 8,
      height: 8,
      backgroundColor: color,
      border: '1px solid #fff',
      borderRadius: 1,
      pointerEvents: 'none',
      boxSizing: 'border-box',
    }}
  />
);

// Inline styles for the playback controls bar

const controlsBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 12px',
  backgroundColor: colors.surface,
  borderRadius: 8,
};

const controlsLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const controlsRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const controlBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.textPrimary,
  cursor: 'pointer',
  fontSize: 14,
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  padding: 0,
};

const frameCounterStyle: React.CSSProperties = {
  fontSize: 12,
  fontFamily: fonts.mono,
  color: colors.textSecondary,
  fontVariantNumeric: 'tabular-nums',
};

const timeDisplayStyle: React.CSSProperties = {
  fontSize: 12,
  fontFamily: fonts.mono,
  color: colors.textPrimary,
  fontVariantNumeric: 'tabular-nums',
};

const speedGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
};

const speedBtnStyle: React.CSSProperties = {
  border: 'none',
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: fonts.mono,
  padding: '2px 6px',
  borderRadius: 4,
};

const positionBtnStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 500,
  fontFamily: fonts.sans,
  padding: '3px 8px',
  borderRadius: 4,
};

const resetOverlayBtnStyle: React.CSSProperties = {
  pointerEvents: 'auto',
  padding: '1px 5px',
  fontSize: 9,
  fontWeight: 500,
  color: colors.error,
  backgroundColor: 'rgba(248,81,73,0.15)',
  border: '1px solid rgba(248,81,73,0.3)',
  borderRadius: 3,
  cursor: 'pointer',
  fontFamily: fonts.sans,
  whiteSpace: 'nowrap',
};
