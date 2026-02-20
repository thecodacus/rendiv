import React, { useState, useCallback } from 'react';
import type { CompositionEntry } from 'rendiv';
import { topBarStyles, colors } from './styles';

interface TopBarProps {
  composition: CompositionEntry | null;
  entryPoint: string;
  onRender: () => void;
  queueCount: number;
  queueOpen: boolean;
  onToggleQueue: () => void;
}

// Inline SVG icons
const RendivLogo: React.FC = () => (
  <svg width="120" height="28" viewBox="0 0 240 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="8" width="26" height="20" rx="3" stroke={colors.accent} strokeWidth="2" opacity="0.35" />
    <rect x="12" y="14" width="26" height="20" rx="3" stroke={colors.accent} strokeWidth="2" />
    <clipPath id="rv-frame">
      <rect x="12" y="14" width="26" height="20" rx="3" />
    </clipPath>
    <g clipPath="url(#rv-frame)">
      <polygon points="12,34 30,14 38,14 38,34" fill={colors.accent} opacity="0.25" />
    </g>
    <path d="M22 20L30 24L22 28Z" fill={colors.accent} />
    <text x="52" y="33" fontFamily="system-ui, -apple-system, sans-serif" fontSize="26" fontWeight="700" fill={colors.textPrimary} letterSpacing="-0.5">
      rendiv
    </text>
  </svg>
);

const RenderIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2L13 8L4 14V2Z" fill="currentColor" />
  </svg>
);

const QueueIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="2" width="4" height="12" rx="1" fill={open ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="2" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const TopBar: React.FC<TopBarProps> = ({ composition, entryPoint, onRender, queueCount, queueOpen, onToggleQueue }) => {
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
      <RendivLogo />

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
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: composition ? 1 : 0.5,
            cursor: composition ? 'pointer' : 'default',
          }}
          onClick={onRender}
          disabled={!composition}
          title="Add render job to queue"
        >
          <RenderIcon />
          Render
        </button>

        <button
          type="button"
          style={{
            ...topBarStyles.button,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            position: 'relative' as const,
            color: queueOpen ? colors.accent : colors.textPrimary,
            borderColor: queueOpen ? colors.accent : colors.border,
          }}
          onClick={onToggleQueue}
          title="Toggle render queue panel"
        >
          <QueueIcon open={queueOpen} />
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
