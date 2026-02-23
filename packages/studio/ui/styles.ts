import type { CSSProperties } from 'react';

// ── Color palette (Desaturated dark theme with cyan accents) ─────────
export const colors = {
  bg: '#0e0e12',
  surface: '#161619',
  surfaceHover: '#1e1e22',
  border: 'rgba(255,255,255,0.06)',
  borderSubtle: 'rgba(255,255,255,0.03)',
  borderStrong: 'rgba(0,212,255,0.20)',
  textPrimary: '#e0e0e0',
  textSecondary: '#6b6b78',
  textMuted: '#3e3e48',
  accent: '#00d4ff',
  accentMuted: '#0088cc',
  accentBg: 'rgba(0,212,255,0.12)',
  accentBgSubtle: 'rgba(0,212,255,0.07)',
  badge: '#28c840',
  badgeStill: '#8957e5',
  error: '#f85149',
  warning: '#d4a017',
};

export const fonts = {
  sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", "SF Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace',
};

// ── Reusable component styles ───────────────────────────────────────────

/** Standard tab toggle (Sidebar, TimelineEditor, StudioApp) */
export const tabToggleStyles = {
  container: {
    display: 'flex',
    gap: 2,
    padding: 2,
    backgroundColor: colors.bg,
    borderRadius: 6,
  } as CSSProperties,
  button: (active: boolean): CSSProperties => ({
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 500,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: active ? colors.accentBg : 'transparent',
    color: active ? colors.textPrimary : colors.textSecondary,
    fontFamily: fonts.sans,
  }),
};

/** Standard button variants */
export const buttonStyles: Record<string, CSSProperties> = {
  primary: {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #0088cc 0%, #00b8d9 100%)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: fonts.sans,
    boxShadow: '0 0 12px rgba(0,212,255,0.20)',
  },
  secondary: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceHover,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  ghost: {
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 500,
    color: colors.textSecondary,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  danger: {
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 500,
    color: colors.error,
    backgroundColor: 'rgba(248,81,73,0.08)',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
};

/** Context menu / dropdown (glassmorphism) */
export const contextMenuStyles: Record<string, CSSProperties> = {
  container: {
    position: 'fixed',
    zIndex: 100,
    backgroundColor: 'rgba(20, 20, 24, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)' as unknown as string,
    border: 'none',
    borderRadius: 10,
    padding: '4px 0',
    minWidth: 140,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  item: {
    padding: '6px 12px',
    fontSize: 12,
    color: colors.textPrimary,
    cursor: 'pointer',
  },
  itemDanger: {
    padding: '6px 12px',
    fontSize: 12,
    color: colors.error,
    cursor: 'pointer',
  },
};

/** Standard input field */
export const inputStyles: Record<string, CSSProperties> = {
  text: {
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: fonts.mono,
    backgroundColor: colors.bg,
    color: colors.textPrimary,
    border: 'none',
    borderRadius: 6,
    outline: 'none',
  },
};

/** Panel / card */
export const panelStyles: Record<string, CSSProperties> = {
  glass: {
    backgroundColor: 'rgba(20, 20, 24, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)' as unknown as string,
  },
  card: {
    background: 'linear-gradient(170deg, #161619 0%, #111114 100%)',
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
  },
};

/** Section label (monospace, uppercase, letter-spaced) */
export const sectionLabelStyle: CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: 10,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: colors.textSecondary,
  opacity: 0.6,
};

// ── Layout styles ───────────────────────────────────────────────────────

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
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    ...buttonStyles.secondary,
  },
  renderButton: {
    ...buttonStyles.primary,
  },
};

export const sidebarStyles: Record<string, CSSProperties> = {
  container: {
    width: 280,
    minWidth: 280,
    height: '100%',
    backgroundColor: colors.surface,
    overflowY: 'auto',
    flexShrink: 0,
  },
  header: {
    padding: '12px 16px',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
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
    backgroundColor: colors.accentBgSubtle,
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

// Global scrollbar CSS + Google Fonts — injected once via <style> in StudioApp
export const scrollbarCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.08) transparent;
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
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.14);
}
::-webkit-scrollbar-corner {
  background: transparent;
}

/* Sidebar item hover (CSS-based to survive React re-renders) */
[data-sidebar-item]:hover {
  background-color: ${colors.surfaceHover};
}
[data-sidebar-item][data-selected="true"]:hover {
  background-color: ${colors.accentBgSubtle};
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
    borderRadius: 10,
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
    borderRadius: 10,
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
    boxShadow: '0 0 8px rgba(0,212,255,0.2)',
  },
};
