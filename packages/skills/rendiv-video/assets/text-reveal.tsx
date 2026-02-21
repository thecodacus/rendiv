import React from 'react';
import { useFrame, useCompositionConfig, interpolate, Easing } from '@rendiv/core';

const TEXT = 'Build videos with code.';
const CHARS_PER_SECOND = 18;

export const TextReveal: React.FC = () => {
  const frame = useFrame();
  const { fps, width, height } = useCompositionConfig();

  const framesPerChar = fps / CHARS_PER_SECOND;
  const totalChars = TEXT.length;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#0c0c1d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {TEXT.split('').map((char, i) => {
          const charStartFrame = i * framesPerChar;

          const opacity = interpolate(
            frame,
            [charStartFrame, charStartFrame + 6],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );

          const translateY = interpolate(
            frame,
            [charStartFrame, charStartFrame + 8],
            [20, 0],
            {
              easing: Easing.out(Easing.ease),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            },
          );

          // Cursor blink after all characters are revealed
          const allRevealed = frame > (totalChars - 1) * framesPerChar + 10;
          const showCursor =
            i === totalChars - 1 && allRevealed
              ? Math.floor(frame / (fps / 2)) % 2 === 0
              : false;

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontSize: 72,
                fontWeight: 700,
                color: '#f1f5f9',
                opacity,
                transform: `translateY(${translateY}px)`,
                whiteSpace: 'pre',
                borderRight: showCursor ? '3px solid #6bd4ff' : 'none',
                paddingRight: showCursor ? 4 : 0,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
};
