import React from 'react';
import { useFrame, useCompositionConfig, Fill, interpolate, spring } from '@rendiv/core';

export const MyVideo: React.FC = () => {
  const frame = useFrame();
  const { fps, durationInFrames } = useCompositionConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = spring({ frame, fps, config: { damping: 12 } });
  const progress = frame / durationInFrames;

  return (
    <Fill
      style={{
        background: `linear-gradient(135deg, #0f0f0f ${(1 - progress) * 100}%, #1a1a2e 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1
        style={{
          color: 'white',
          fontSize: 80,
          fontFamily: 'system-ui, sans-serif',
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        Hello, Rendiv!
      </h1>
    </Fill>
  );
};
