import React from 'react';
import { useFrame, useCompositionConfig, Fill, CanvasElement, interpolate, OffthreadVideo, staticFile } from '@rendiv/core';

/**
 * Demonstrates OffthreadVideo — pixel-perfect video frame extraction.
 * In player/studio mode: uses a regular <video> element.
 * In rendering mode: extracts exact frames via FFmpeg on the server.
 */
export function OffthreadVideoDemo(): React.ReactElement {
  const frame = useFrame();
  const { fps } = useCompositionConfig();

  const labelOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <CanvasElement id="OffthreadVideoDemo">
    <Fill style={{ background: '#0d1117' }}>
      <OffthreadVideo
        src={staticFile('sample.mp4')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: labelOpacity,
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 32,
            fontFamily: 'system-ui, sans-serif',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '8px 24px',
            borderRadius: 8,
          }}
        >
          {'<OffthreadVideo>'} — frame {frame}
        </span>
      </div>
    </Fill>
    </CanvasElement>
  );
}
