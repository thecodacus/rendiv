import React, { useState, useCallback } from 'react';
import type { CompositionEntry } from 'rendiv';
import { topBarStyles, colors } from './styles';

interface TopBarProps {
  composition: CompositionEntry | null;
  entryPoint: string;
  onRender: () => void;
  queueCount: number;
  onToggleQueue: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ composition, entryPoint, onRender, queueCount, onToggleQueue }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCommand = useCallback(() => {
    if (!composition) return;
    const cmd = `rendiv render ${entryPoint} ${composition.id} out/${composition.id}.mp4`;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [composition, entryPoint]);

  return (
    <div style={topBarStyles.container}>
      <span style={topBarStyles.title}>Rendiv Studio</span>

      <span style={topBarStyles.compositionName}>
        {composition ? composition.id : 'No composition selected'}
      </span>

      <div style={topBarStyles.actions}>
        <button
          type="button"
          style={{
            ...topBarStyles.button,
            opacity: composition ? 1 : 0.5,
            cursor: composition ? 'pointer' : 'default',
          }}
          onClick={handleCopyCommand}
          disabled={!composition}
          onMouseEnter={(e) => {
            if (composition) {
              e.currentTarget.style.backgroundColor = colors.border;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.surfaceHover;
          }}
        >
          {copied ? 'Copied!' : 'Copy render cmd'}
        </button>

        <button
          type="button"
          style={{
            ...topBarStyles.renderButton,
            opacity: composition ? 1 : 0.5,
            cursor: composition ? 'pointer' : 'default',
          }}
          onClick={onRender}
          disabled={!composition}
          title="Add render job to queue"
        >
          Render
        </button>

        <button
          type="button"
          style={{
            ...topBarStyles.button,
            position: 'relative' as const,
          }}
          onClick={onToggleQueue}
          title="Toggle render queue panel"
        >
          Queue
          {queueCount > 0 && (
            <span style={badgeStyle}>{queueCount}</span>
          )}
        </button>
      </div>
    </div>
  );
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: -4,
  right: -4,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: colors.accent,
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
};
