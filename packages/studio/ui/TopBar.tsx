import React, { useState, useCallback, useRef } from 'react';
import type { CompositionEntry } from 'rendiv';
import { topBarStyles, colors } from './styles';

type RenderState = 'idle' | 'bundling' | 'rendering' | 'encoding' | 'done' | 'error';

interface TopBarProps {
  composition: CompositionEntry | null;
  entryPoint: string;
  inputProps: Record<string, unknown>;
}

export const TopBar: React.FC<TopBarProps> = ({ composition, entryPoint, inputProps }) => {
  const [copied, setCopied] = useState(false);
  const [renderState, setRenderState] = useState<RenderState>('idle');
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderFrameInfo, setRenderFrameInfo] = useState({ rendered: 0, total: 0 });
  const [renderError, setRenderError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleCopyCommand = useCallback(() => {
    if (!composition) return;
    const cmd = `rendiv render ${entryPoint} ${composition.id} out/${composition.id}.mp4`;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [composition, entryPoint]);

  const handleRender = useCallback(async () => {
    if (!composition) return;

    const isRendering = renderState === 'bundling' || renderState === 'rendering' || renderState === 'encoding';
    if (isRendering) {
      // Cancel
      abortRef.current?.abort();
      fetch('/__rendiv_api__/render/cancel', { method: 'POST' });
      setRenderState('idle');
      setRenderProgress(0);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setRenderState('bundling');
    setRenderProgress(0);
    setRenderError('');

    try {
      const res = await fetch('/__rendiv_api__/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositionId: composition.id,
          codec: 'mp4',
          outputPath: `out/${composition.id}.mp4`,
          inputProps: { ...composition.defaultProps, ...inputProps },
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setRenderState('error');
        setRenderError('Request failed');
        setTimeout(() => { setRenderState('idle'); setRenderProgress(0); }, 4000);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);

          switch (event.type) {
            case 'bundling':
              setRenderState('bundling');
              setRenderProgress(event.progress * 0.1); // bundling = 0-10%
              break;
            case 'metadata':
              setRenderProgress(0.1);
              break;
            case 'rendering':
              setRenderState('rendering');
              setRenderFrameInfo({ rendered: event.renderedFrames, total: event.totalFrames });
              setRenderProgress(0.1 + event.progress * 0.8); // rendering = 10-82%
              break;
            case 'encoding':
              setRenderState('encoding');
              setRenderProgress(0.9);
              break;
            case 'done':
              setRenderState('done');
              setRenderProgress(1);
              setTimeout(() => { setRenderState('idle'); setRenderProgress(0); }, 3000);
              break;
            case 'cancelled':
              setRenderState('idle');
              setRenderProgress(0);
              break;
            case 'error':
              setRenderState('error');
              setRenderError(event.message);
              setTimeout(() => { setRenderState('idle'); setRenderProgress(0); }, 4000);
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setRenderState('idle');
        setRenderProgress(0);
      } else {
        setRenderState('error');
        setRenderError((err as Error).message);
        setTimeout(() => { setRenderState('idle'); setRenderProgress(0); }, 4000);
      }
    } finally {
      abortRef.current = null;
    }
  }, [composition, entryPoint, inputProps, renderState]);

  const isRendering = renderState === 'bundling' || renderState === 'rendering' || renderState === 'encoding';

  function getRenderButtonLabel(): string {
    switch (renderState) {
      case 'bundling':
        return 'Bundling...';
      case 'rendering':
        return `${renderFrameInfo.rendered}/${renderFrameInfo.total}`;
      case 'encoding':
        return 'Encoding...';
      case 'done':
        return 'Done!';
      case 'error':
        return 'Failed';
      default:
        return 'Render';
    }
  }

  function getRenderButtonBg(): string {
    switch (renderState) {
      case 'done':
        return colors.badge; // green
      case 'error':
        return colors.error;
      default:
        return colors.accentMuted;
    }
  }

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
            backgroundColor: getRenderButtonBg(),
            opacity: composition ? 1 : 0.5,
            cursor: composition ? 'pointer' : 'default',
          }}
          onClick={handleRender}
          disabled={!composition || renderState === 'done'}
          title={isRendering ? 'Click to cancel' : renderState === 'error' ? renderError : 'Render composition to MP4'}
        >
          {getRenderButtonLabel()}
          {isRendering && (
            <div
              style={{
                ...topBarStyles.renderProgress,
                width: `${renderProgress * 100}%`,
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
};
