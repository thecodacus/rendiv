import React, { type CSSProperties } from 'react';
import { useFrame, useCompositionConfig } from '@rendiv/core';
import type { Caption, HighlightedCaption } from './types';

export interface CaptionRendererProps {
  /** Array of captions (or highlighted captions) to display */
  captions: Caption[] | HighlightedCaption[];
  /** Style for the caption container */
  style?: CSSProperties;
  /** Style applied to the active caption text */
  activeStyle?: CSSProperties;
  /** Style for the currently highlighted word (when using HighlightedCaption) */
  highlightedWordStyle?: CSSProperties;
  /** Vertical alignment. Default: 'bottom' */
  align?: 'top' | 'center' | 'bottom';
  /** Padding from edge in pixels. Default: 40 */
  padding?: number;
}

function isHighlightedCaption(c: Caption): c is HighlightedCaption {
  return 'highlightedWordIndex' in c && typeof (c as HighlightedCaption).highlightedWordIndex === 'number';
}

const alignMap: Record<string, CSSProperties> = {
  top: { top: 0, justifyContent: 'flex-start' },
  center: { top: 0, bottom: 0, justifyContent: 'center' },
  bottom: { bottom: 0, justifyContent: 'flex-end' },
};

export function CaptionRenderer({
  captions,
  style,
  activeStyle,
  highlightedWordStyle,
  align = 'bottom',
  padding = 40,
}: CaptionRendererProps): React.ReactElement | null {
  const frame = useFrame();
  const { fps } = useCompositionConfig();

  const currentMs = (frame / fps) * 1000;

  // Find the active caption
  const active = captions.find(
    (c) => c.startMs <= currentMs && currentMs < c.endMs,
  );

  if (!active) return null;

  const containerStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding,
    pointerEvents: 'none',
    ...alignMap[align],
    ...style,
  };

  const textStyle: CSSProperties = {
    textAlign: 'center',
    ...activeStyle,
  };

  // If highlighted caption with words, render word-by-word with highlight
  if (isHighlightedCaption(active) && active.words && active.words.length > 0) {
    return (
      <div style={containerStyle}>
        <div style={textStyle}>
          {active.words.map((word, i) => (
            <span
              key={i}
              style={i === active.highlightedWordIndex ? highlightedWordStyle : undefined}
            >
              {i > 0 ? ' ' : ''}{word.text}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Plain caption — render full text
  return (
    <div style={containerStyle}>
      <div style={textStyle}>{active.text}</div>
    </div>
  );
}

CaptionRenderer.displayName = 'CaptionRenderer';
