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
  /** When set, shows a "Back to projects" button. */
  workspaceDir?: string;
  onBackToWorkspace?: () => void;
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

const BackIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" fill="currentColor" />
  </svg>
);

export const TopBar: React.FC<TopBarProps> = ({ composition, entryPoint, onRender, queueCount, panelOpen, onTogglePanel, workspaceDir, onBackToWorkspace }) => {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {workspaceDir && onBackToWorkspace && (
          <button
            type="button"
            style={{
              ...topBarStyles.button,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
            }}
            onClick={onBackToWorkspace}
            title="Back to projects"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceHover; }}
          >
            <BackIcon />
            Projects
          </button>
        )}
        <img src={logoUrl} alt="Rendiv" width="120" height="28" />
      </div>

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
              e.currentTarget.style.backgroundColor = colors.surfaceHover;
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
            backgroundColor: panelOpen ? colors.accentBg : colors.surfaceHover,
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
