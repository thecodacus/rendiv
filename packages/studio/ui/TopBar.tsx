import React, { useState, useCallback } from 'react';
import type { CompositionEntry } from 'rendiv';
import { topBarStyles, colors } from './styles';

interface TopBarProps {
  composition: CompositionEntry | null;
  entryPoint: string;
}

export const TopBar: React.FC<TopBarProps> = ({ composition, entryPoint }) => {
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
    </div>
  );
};
