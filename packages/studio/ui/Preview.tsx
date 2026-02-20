import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Player, type PlayerRef } from '@rendiv/player';
import type { CompositionEntry } from 'rendiv';
import { previewStyles, colors } from './styles';

interface PreviewProps {
  composition: CompositionEntry;
  inputProps: Record<string, unknown>;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onInputPropsChange: (props: Record<string, unknown>) => void;
}

const SPEED_STEPS = [0.25, 0.5, 1, 2, 4];

function formatTime(frame: number, fps: number): string {
  const totalSeconds = frame / fps;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export const Preview: React.FC<PreviewProps> = ({
  composition,
  inputProps,
  playbackRate,
  onPlaybackRateChange,
  onInputPropsChange,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [propsOpen, setPropsOpen] = useState(false);
  const [propsText, setPropsText] = useState('');
  const [propsError, setPropsError] = useState(false);

  const mergedProps = { ...composition.defaultProps, ...inputProps };

  // Sync props text when composition changes
  useEffect(() => {
    setPropsText(JSON.stringify(mergedProps, null, 2));
    setPropsError(false);
  }, [composition.id]);

  // Track frame updates
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame = (data: { frame: number }) => {
      setCurrentFrame(data.frame);
    };

    player.addEventListener('frameupdate', onFrame);
    return () => player.removeEventListener('frameupdate', onFrame);
  }, [composition.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const currentIdx = SPEED_STEPS.indexOf(playbackRate);
        if (currentIdx > 0) {
          onPlaybackRateChange(SPEED_STEPS[currentIdx - 1]);
        } else if (currentIdx === 0) {
          playerRef.current?.pause();
        }
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        playerRef.current?.pause();
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
    },
    [playbackRate, onPlaybackRateChange],
  );

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

  return (
    <div style={previewStyles.container} onKeyDown={handleKeyDown} tabIndex={0}>
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
      <div style={previewStyles.playerWrapper}>
        <Player
          key={composition.id}
          ref={playerRef}
          component={composition.component}
          durationInFrames={composition.durationInFrames}
          fps={composition.fps}
          compositionWidth={composition.width}
          compositionHeight={composition.height}
          inputProps={mergedProps}
          playbackRate={playbackRate}
          controls
          loop
          style={{ width: '100%', maxHeight: '100%' }}
        />
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
