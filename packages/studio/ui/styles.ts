import type { CSSProperties } from 'react';

// Color palette (GitHub dark theme inspired)
export const colors = {
  bg: '#0d1117',
  surface: '#161b22',
  surfaceHover: '#1c2128',
  border: '#30363d',
  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  accent: '#58a6ff',
  accentMuted: '#1f6feb',
  badge: '#238636',
  badgeStill: '#8957e5',
  error: '#f85149',
};

export const fonts = {
  sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"SF Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace',
};

export const layoutStyles: Record<string, CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: colors.bg,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  timeline: {
    flexShrink: 0,
    minHeight: 120,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  timelineResizeHandle: {
    height: 4,
    cursor: 'row-resize',
    backgroundColor: colors.border,
    flexShrink: 0,
  },
};

export const topBarStyles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    padding: '0 16px',
    backgroundColor: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  compositionName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceHover,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  renderButton: {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: colors.accentMuted,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: fonts.sans,
    position: 'relative' as const,
    overflow: 'hidden',
    minWidth: 90,
  },
  renderProgress: {
    position: 'absolute' as const,
    left: 0,
    bottom: 0,
    height: 3,
    backgroundColor: colors.accent,
    transition: 'width 0.2s ease',
  },
};

export const sidebarStyles: Record<string, CSSProperties> = {
  container: {
    width: 280,
    minWidth: 280,
    height: '100%',
    backgroundColor: colors.surface,
    borderRight: `1px solid ${colors.border}`,
    overflowY: 'auto',
    flexShrink: 0,
  },
  header: {
    padding: '12px 16px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: colors.textSecondary,
  },
  folderHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px 8px 28px',
    cursor: 'pointer',
    fontSize: 13,
    color: colors.textPrimary,
    userSelect: 'none' as const,
    borderLeft: '2px solid transparent',
  },
  itemSelected: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px 8px 28px',
    cursor: 'pointer',
    fontSize: 13,
    color: colors.accent,
    userSelect: 'none' as const,
    backgroundColor: 'rgba(88, 166, 255, 0.08)',
    borderLeft: `2px solid ${colors.accent}`,
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 5px',
    borderRadius: 10,
    color: '#fff',
  },
  duration: {
    marginLeft: 'auto',
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontVariantNumeric: 'tabular-nums',
  },
};

// Global scrollbar CSS — injected once via <style> in StudioApp
export const scrollbarCSS = `
/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: ${colors.border} transparent;
}

/* WebKit (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: ${colors.border};
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: ${colors.textSecondary};
}
::-webkit-scrollbar-corner {
  background: transparent;
}
`;

export const previewStyles: Record<string, CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 16,
    gap: 12,
  },
  metadataBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '8px 12px',
    backgroundColor: colors.surface,
    borderRadius: 8,
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontVariantNumeric: 'tabular-nums',
  },
  metadataLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  metadataValue: {
    color: colors.textPrimary,
    fontWeight: 500,
  },
  playerWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  propsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  propsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  propsTextarea: {
    width: '100%',
    minHeight: 80,
    maxHeight: 200,
    padding: '8px 12px',
    backgroundColor: colors.bg,
    color: colors.textPrimary,
    border: 'none',
    borderTop: `1px solid ${colors.border}`,
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 1.5,
    resize: 'vertical' as const,
    outline: 'none',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  speedIndicator: {
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: colors.accentMuted,
    color: '#fff',
    borderRadius: 4,
    fontFamily: fonts.mono,
  },
};
