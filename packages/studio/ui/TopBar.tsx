import React, { useState, useCallback } from 'react';
import type { CompositionEntry } from '@rendiv/core';
import { topBarStyles, colors } from './styles';
// @ts-ignore — Vite asset import, no types needed
import logoUrl from './logo.svg';

interface TopBarProps {
  composition: CompositionEntry | null;
  entryPoint: string;
  onRender: () => void;
  queueCount: number;
  panelOpen: boolean;
  onTogglePanel: () => void;
}

const RenderIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2L13 8L4 14V2Z" fill="currentColor" />
  </svg>
);

const PanelIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="2" width="4" height="12" rx="1" fill={open ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="2" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const TopBar: React.FC<TopBarProps> = ({ composition, entryPoint, onRender, queueCount, panelOpen, onTogglePanel }) => {
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
      <img src={logoUrl} alt="Rendiv" width="120" height="28" />

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
            color: panelOpen ? colors.accent : colors.textPrimary,
            borderColor: panelOpen ? colors.accent : colors.border,
          }}
          onClick={onTogglePanel}
          title="Toggle side panel"
        >
          <PanelIcon open={panelOpen} />
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
