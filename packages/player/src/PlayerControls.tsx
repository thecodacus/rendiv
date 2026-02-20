import React, { useCallback, type CSSProperties } from 'react';
import type { UsePlayerReturn } from './use-player';

interface PlayerControlsProps {
  player: UsePlayerReturn;
  durationInFrames: number;
  fps: number;
}

const controlsStyle: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 13,
  userSelect: 'none',
};

const buttonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 16,
  padding: '2px 6px',
  lineHeight: 1,
};

const scrubberStyle: CSSProperties = {
  flex: 1,
  height: 4,
  cursor: 'pointer',
  accentColor: '#fff',
};

function formatTime(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  player,
  durationInFrames,
  fps,
}) => {
  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      player.seekTo(Number(e.target.value));
    },
    [player]
  );

  return (
    <div style={controlsStyle}>
      <button
        type="button"
        style={buttonStyle}
        onClick={player.toggle}
        aria-label={player.playing ? 'Pause' : 'Play'}
      >
        {player.playing ? '\u23F8' : '\u25B6'}
      </button>
      <input
        type="range"
        min={0}
        max={durationInFrames - 1}
        value={player.frame}
        onChange={handleScrub}
        style={scrubberStyle}
      />
      <span style={{ minWidth: 100, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {formatTime(player.frame, fps)} / {formatTime(durationInFrames - 1, fps)}
      </span>
    </div>
  );
};

PlayerControls.displayName = 'PlayerControls';
