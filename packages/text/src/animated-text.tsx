import React, { useMemo } from 'react';
import { useFrame, interpolate } from '@rendiv/core';
import { splitText } from './split-text';
import type { AnimatedTextProps } from './types';

export type { AnimatedTextProps };

export function AnimatedText({
  text,
  splitBy = 'character',
  animation,
  stagger: staggerDelay = 3,
  style,
  className,
}: AnimatedTextProps): React.ReactElement {
  const frame = useFrame();
  const units = useMemo(() => splitText(text, splitBy), [text, splitBy]);

  return (
    <span style={{ ...style, display: 'inline' }} className={className}>
      {units.map((unit, i) => {
        const startFrame = i * staggerDelay;
        const localFrame = frame - startFrame;
        const progress = interpolate(
          localFrame,
          [0, animation.durationInFrames],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );

        const unitStyle = animation.style(progress, i, units.length);
        const displayText =
          animation.renderText
            ? animation.renderText(unit.text, progress, i)
            : unit.text;

        if (unit.isWhitespace) {
          return <span key={i}>{displayText}</span>;
        }

        return (
          <span key={i} style={{ display: 'inline-block', ...unitStyle }}>
            {displayText}
          </span>
        );
      })}
    </span>
  );
}

AnimatedText.displayName = 'AnimatedText';
