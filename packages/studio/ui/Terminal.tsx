import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { colors, fonts } from './styles';

export interface TerminalProps {
  open: boolean;
}

type TerminalStatus = 'idle' | 'starting' | 'running' | 'exited' | 'error';

export const Terminal: React.FC<TerminalProps> = ({ open }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [status, setStatus] = useState<TerminalStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const attachedRef = useRef(false);

  // Create xterm instance once on mount
  useEffect(() => {
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 11,
      fontFamily: fonts.mono,
      theme: {
        background: colors.bg,
        foreground: colors.textPrimary,
        cursor: colors.accent,
        cursorAccent: colors.bg,
        selectionBackground: 'rgba(88, 166, 255, 0.3)',
        black: '#484f58',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Forward user keystrokes to server
    term.onData((data) => {
      const hot = (import.meta as any).hot;
      hot?.send('rendiv:terminal-input', { data });
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    return () => {
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      attachedRef.current = false;
    };
  }, []);

  // Listen for server events (once, independent of open state)
  useEffect(() => {
    const hot = (import.meta as any).hot;
    if (!hot) return;

    const onOutput = (data: { data: string }) => {
      xtermRef.current?.write(data.data);
    };
    const onStarted = () => {
      setStatus('running');
      setErrorMessage(null);
    };
    const onExited = () => {
      setStatus('exited');
    };
    const onError = (data: { message: string }) => {
      setStatus('error');
      setErrorMessage(data.message);
    };
    const onStatusResponse = (data: { running: boolean }) => {
      if (data.running) setStatus('running');
    };

    hot.on('rendiv:terminal-output', onOutput);
    hot.on('rendiv:terminal-started', onStarted);
    hot.on('rendiv:terminal-exited', onExited);
    hot.on('rendiv:terminal-error', onError);
    hot.on('rendiv:terminal-status-response', onStatusResponse);

    // Check if terminal is already running (re-attach after page refresh)
    hot.send('rendiv:terminal-status', {});

    return () => {
      hot.off?.('rendiv:terminal-output', onOutput);
      hot.off?.('rendiv:terminal-started', onStarted);
      hot.off?.('rendiv:terminal-exited', onExited);
      hot.off?.('rendiv:terminal-error', onError);
      hot.off?.('rendiv:terminal-status-response', onStatusResponse);
    };
  }, []);

  // Attach/detach xterm to DOM when panel opens/closes
  useEffect(() => {
    if (!open || !containerRef.current || !xtermRef.current) return;

    if (!attachedRef.current) {
      xtermRef.current.open(containerRef.current);
      attachedRef.current = true;
    }

    // Fit after a frame to ensure container has layout dimensions
    requestAnimationFrame(() => {
      fitAddonRef.current?.fit();
    });
  }, [open]);

  // Resize terminal when container size changes
  useEffect(() => {
    if (!open || !containerRef.current) return;

    const observer = new ResizeObserver(() => {
      const term = xtermRef.current;
      const fitAddon = fitAddonRef.current;
      if (!term || !fitAddon) return;

      fitAddon.fit();
      const hot = (import.meta as any).hot;
      hot?.send('rendiv:terminal-resize', { cols: term.cols, rows: term.rows });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [open]);

  const handleStart = useCallback(() => {
    setStatus('starting');
    const term = xtermRef.current;
    const hot = (import.meta as any).hot;
    hot?.send('rendiv:terminal-start', {
      cols: term?.cols ?? 80,
      rows: term?.rows ?? 24,
    });
  }, []);

  const handleRestart = useCallback(() => {
    const hot = (import.meta as any).hot;
    hot?.send('rendiv:terminal-stop', {});
    xtermRef.current?.clear();
    setTimeout(() => {
      setStatus('starting');
      const term = xtermRef.current;
      hot?.send('rendiv:terminal-start', {
        cols: term?.cols ?? 80,
        rows: term?.rows ?? 24,
      });
    }, 300);
  }, []);

  const showOverlay = status === 'idle' || status === 'error' || status === 'exited';

  return (
    <div style={panelStyle}>
      {/* Actions bar — only when there's something to act on */}
      {(status === 'running' || status === 'exited') && (
        <div style={actionsBarStyle}>
          <button style={actionBtnStyle} onClick={handleRestart}>Restart</button>
        </div>
      )}

      <div style={terminalBodyStyle}>
        {showOverlay && (
          <div style={overlayStyle}>
            {status === 'error' && errorMessage && (
              <div style={{ color: colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' as const }}>
                {errorMessage}
              </div>
            )}
            {status === 'exited' && (
              <div style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
                Claude Code has exited
              </div>
            )}
            <button style={startBtnStyle} onClick={status === 'exited' ? handleRestart : handleStart}>
              {status === 'exited' ? 'Restart Claude Code' : status === 'error' ? 'Retry' : 'Launch Claude Code'}
            </button>
          </div>
        )}
        <div ref={containerRef} style={xtermContainerStyle} />
      </div>
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
};

const actionsBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '4px 8px',
  borderBottom: `1px solid ${colors.border}`,
  flexShrink: 0,
};

const terminalBodyStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  backgroundColor: colors.bg,
  overflow: 'hidden',
};

const xtermContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  padding: '4px 0 4px 4px',
};

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  backgroundColor: colors.bg,
};

const startBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  backgroundColor: colors.accentMuted,
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: fonts.sans,
};

const actionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  cursor: 'pointer',
  fontSize: 10,
  padding: '2px 8px',
  borderRadius: 4,
  fontFamily: fonts.sans,
};

